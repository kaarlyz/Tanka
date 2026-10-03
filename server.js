const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

// Load .env
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  }
}

const PORT = parseInt(process.env.PORT || "3001", 10);
const ROUTER_URL = process.env.ROUTER_URL || "http://127.0.0.1:20128/v1";
const ROUTER_KEY = process.env.ROUTER_KEY || "";

// Initialize SQLite database
const dbPath = path.join(__dirname, "tanka.sqlite");
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    difficulty TEXT DEFAULT 'new',
    review_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    doc_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    model TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    questions TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mistake_notebook (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    doc_title TEXT,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    user_answer_index INTEGER NOT NULL,
    formula TEXT,
    steps TEXT,
    explanation TEXT,
    pitfall TEXT,
    resolved INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS formula_cheatsheets (
    doc_id TEXT PRIMARY KEY,
    formulas TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

console.log("[tanka-server] Database initialized at:", dbPath);

// Helper for JSON response
function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(data));
}

// Helper to parse JSON body
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

// Helper to call 9router
async function callRouter(messages, model = "ag/gemini-3.8-flash-low", temperature = 0.3) {
  const url = `${ROUTER_URL}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ROUTER_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`9Router error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// Helper to query 9router web search (/v1/search)
async function search9Router(query) {
  try {
    const res = await fetch(`${ROUTER_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ROUTER_KEY}`,
      },
      body: JSON.stringify({ query, max_results: 4 }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map((r, i) => `${i + 1}. [${r.title}](${r.url}): ${r.snippet}`).join("\n\n");
      }
    }
  } catch (err) {
    // Search fallback to LLM knowledge
  }
  return "";
}

// Robust check for genuine mathematical / calculation content (avoiding false positives on dates, slide numbers, dashes)
function detectRealMath(content) {
  if (!content) return false;
  const cleaned = content
    .replace(/Slide\s*\d+/gi, "")
    .replace(/\b\d{4}\s*[-–]\s*\d{4}\b/g, "")
    .replace(/\b(bab|ch|chapter|page|halaman|vol|no)\.?\s*\d+/gi, "");

  if (/[√∑∫≤≥±≠πθλαβγΔ∂∞≈≡]/.test(cleaned)) return true;
  if (/\\(frac|sqrt|lim|int|sum|prod|alpha|beta|theta|pi|partial|infty|approx|times|div)\b/.test(cleaned)) return true;

  const hasAlgebraicKeywords = /(rumus|persamaan|kalkulasi|perhitungan|fungsi kuadrat|trigonometri|aljabar|matematika|derivatif|integral|vektor)/i.test(cleaned);
  const hasAlgebraicPattern = /\b[a-zA-Z]\s*=\s*[\d\w\(\)\+\-\*\/\^]+/i.test(cleaned);
  return hasAlgebraicKeywords && hasAlgebraicPattern;
}

// Detect concise academic topic title based on content
async function detectDocumentTitle(content, fallback = "Dokumen Materi") {
  try {
    const prompt = `Tentukan topik pembelajaran atau judul materi yang paling akurat, jelas, dan ringkas (3 sampai 6 kata) berdasarkan isi materi berikut. DILARANG menggunakan tanda kutip, kata pengantar, kurung, atau emotikon. HANYA tuliskan judul singkatnya saja dalam bahasa Indonesia.\n\nIsi materi:\n"""\n${content.slice(0, 3500)}\n"""`;
    const reply = await callRouter([
      { role: "system", content: "Anda adalah asisten kurikulum akademik. Tugas Anda memberikan judul topik materi yang akurat, baku, dan singkat (3-6 kata) berdasarkan isi materi teks." },
      { role: "user", content: prompt }
    ], "ag/gemini-3.8-flash-low", 0.1);
    const clean = reply.replace(/["'\n\r*#]/g, "").trim();
    if (clean && clean.length > 3 && clean.length < 65) {
      return clean;
    }
  } catch (err) {
    console.error("Auto title detection failed:", err.message);
  }
  return fallback;
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  try {
    // 1. GET /api/models - list 9router models
    if (req.method === "GET" && pathname === "/api/models") {
      try {
        const resp = await fetch(`${ROUTER_URL}/models`, {
          headers: { Authorization: `Bearer ${ROUTER_KEY}` },
        });
        const data = await resp.json();
        return sendJSON(res, { models: data.data || [] });
      } catch (e) {
        return sendJSON(res, { error: e.message }, 500);
      }
    }

    // 2. GET /api/documents - list all documents
    if (req.method === "GET" && pathname === "/api/documents") {
      const stmt = db.prepare("SELECT id, title, length(content) as content_length, created_at, (SELECT COUNT(*) FROM flashcards WHERE doc_id = documents.id) as flashcard_count FROM documents ORDER BY created_at DESC");
      const docs = stmt.all();
      return sendJSON(res, { documents: docs });
    }

    // 2.b POST /api/documents/upload - handle single or multiple PDF, PPTX, DOCX, and image uploads
    if (req.method === "POST" && pathname === "/api/documents/upload") {
      const body = await getBody(req);
      const incomingFiles = body.files && Array.isArray(body.files) && body.files.length > 0
        ? body.files
        : (body.fileName && body.fileData ? [{ fileName: body.fileName, fileData: body.fileData }] : []);

      if (incomingFiles.length === 0) {
        return sendJSON(res, { error: "Setidaknya satu berkas wajib diunggah" }, 400);
      }

      const scratchDir = "/home/vallencia/.hermes/cache/scratch";
      if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
      const { execFileSync } = require("node:child_process");
      const scriptPath = path.join(__dirname, "extract_text.py");

      const extractedParts = [];
      const fileNames = [];

      for (const f of incomingFiles) {
        if (!f.fileName || !f.fileData) continue;
        const ext = path.extname(f.fileName).toLowerCase() || ".txt";
        const tmpFilePath = path.join(scratchDir, `upload_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`);
        try {
          fs.writeFileSync(tmpFilePath, Buffer.from(f.fileData, "base64"));
          const text = execFileSync(scriptPath, [tmpFilePath], {
            encoding: "utf8",
            maxBuffer: 25 * 1024 * 1024
          }).trim();
          if (text) {
            extractedParts.push({ name: f.fileName, text });
            fileNames.push(path.basename(f.fileName, ext).replace(/[_-]/g, " ").trim());
          }
        } catch (err) {
          console.error(`Gagal ekstrak ${f.fileName}:`, err.message);
        } finally {
          if (fs.existsSync(tmpFilePath)) {
            try { fs.unlinkSync(tmpFilePath); } catch {}
          }
        }
      }

      if (extractedParts.length === 0) {
        return sendJSON(res, { error: "Seluruh berkas yang diunggah tidak memiliki teks yang terbaca" }, 400);
      }

      let mergedText = "";
      if (extractedParts.length === 1) {
        mergedText = extractedParts[0].text;
      } else {
        mergedText = extractedParts.map((p, i) => `=== Berkas ${i + 1}: ${p.name} ===\n\n${p.text}`).join("\n\n---\n\n");
      }

      const rawTitle = fileNames.join(" & ") || "Modul Materi";
      const cleanTitle = await detectDocumentTitle(mergedText, rawTitle);
      const id = "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const createdAt = Date.now();
      const insert = db.prepare("INSERT INTO documents (id, title, content, created_at) VALUES (?, ?, ?, ?)");
      insert.run(id, cleanTitle, mergedText, createdAt);

      return sendJSON(res, {
        success: true,
        id,
        title: cleanTitle,
        content: mergedText,
        fileCount: extractedParts.length,
        wordCount: mergedText.split(/\s+/).length,
        created_at: createdAt
      });
    }

    // 2.c POST /api/documents/:id/enrich - enrich document content with comprehensive web knowledge / additional references
    if (req.method === "POST" && pathname.match(/^\/api\/documents\/([^/]+)\/enrich$/)) {
      const docId = pathname.split("/")[3];
      const { focusTopic, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (!doc) return sendJSON(res, { error: "Dokumen tidak ditemukan" }, 404);

      let webFindings = await search9Router(`${doc.title} ${focusTopic || ""}`.trim());
      let webContext = "";
      if (webFindings) {
        webContext = `\nHASIL PENCARIAN REFERENSI INTERNET TERBARU (9Router Web Search):\n${webFindings}\n\n`;
      }

      const prompt = `Anda adalah asisten riset dan pengayaan materi pembelajaran komprehensif.
Topik Utama Dokumen: "${doc.title}"
Instruksi Pengayaan: "${focusTopic || "Lengkapi konsep-konsep kunci yang belum mendalam, berikan contoh dunia nyata, dan prediksi poin ujian penting."}"
${webContext}
Isi Dokumen Sumber Saat Ini:
"""
${doc.content.slice(0, 15000)}
"""

Tugas Anda: Susun modul "Pengayaan Materi & Referensi Tambahan" untuk menyempurnakan dokumen di atas agar pembelajar mendapatkan pemahaman yang 100% tuntas dan siap menghadapi ujian.
Struktur modul suplemen:
1. **Latar Belakang Konsep & Penerapan Nyata**: Mengapa materi ini penting dan bagaimana analogi konkretnya di kehidupan nyata.
2. **Poin-Poin Kunci yang Perlu Diperdalam**: Konsep, klasifikasi, atau aturan yang belum dibahas mendalam di berkas asli.
3. **2 Contoh Soal Terapan & Pembahasan**: Soal kontekstual yang menguji pemahaman esensial.
4. **Glosarium Istilah Tambahan**: 3-5 istilah teknis yang sering keluar di literatur atau ujian.

Tulis dalam Bahasa Indonesia yang lugas, padat, dan terstruktur rapi dengan Markdown. Dilarang mengulang teks yang sudah jelas di atas, fokus HANYA pada materi tambahan bernilai tinggi.`;

      const enrichmentText = await callRouter([
        { role: "system", content: "Anda adalah pakar riset kurikulum yang menyusun suplemen materi ajar komprehensif." },
        { role: "user", content: prompt }
      ], model, 0.3);

      const updatedContent = doc.content + "\n\n\n# PENGAYAAN MATERI & REFERENSI TAMBAHAN (AI SEARCH)\n\n" + enrichmentText.trim();
      db.prepare("UPDATE documents SET content = ? WHERE id = ?").run(updatedContent, docId);

      return sendJSON(res, {
        success: true,
        docId,
        addedLength: enrichmentText.length,
        totalLength: updatedContent.length,
        content: updatedContent
      });
    }

    // 2.d POST /api/documents/:id/detect-title - auto-detect title from content
    const detectTitleMatch = pathname.match(/^\/api\/documents\/([^/]+)\/detect-title$/);
    if (req.method === "POST" && detectTitleMatch) {
      const docId = detectTitleMatch[1];
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (!doc) return sendJSON(res, { error: "Dokumen tidak ditemukan" }, 404);

      const newTitle = await detectDocumentTitle(doc.content, doc.title);
      db.prepare("UPDATE documents SET title = ? WHERE id = ?").run(newTitle, docId);
      return sendJSON(res, { success: true, title: newTitle });
    }

    // 3. POST /api/documents - create document
    if (req.method === "POST" && pathname === "/api/documents") {
      const { title, content } = await getBody(req);
      if (!title || !content) {
        return sendJSON(res, { error: "Title and content required" }, 400);
      }
      let finalTitle = title.trim();
      if (!finalTitle || finalTitle.toLowerCase() === "materi baru" || finalTitle.toLowerCase() === "catatan baru") {
        finalTitle = await detectDocumentTitle(content, "Materi Pembelajaran");
      }
      const id = "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const createdAt = Date.now();
      const insert = db.prepare("INSERT INTO documents (id, title, content, created_at) VALUES (?, ?, ?, ?)");
      insert.run(id, finalTitle, content.trim(), createdAt);
      return sendJSON(res, { success: true, id, title: finalTitle, created_at: createdAt });
    }

    // 4. GET /api/documents/:id - get single document with flashcards
    const docMatch = pathname.match(/^\/api\/documents\/([^/]+)$/);
    if (docMatch) {
      const docId = docMatch[1];
      if (req.method === "GET") {
        const docStmt = db.prepare("SELECT * FROM documents WHERE id = ?");
        const doc = docStmt.get(docId);
        if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

        const cardStmt = db.prepare("SELECT * FROM flashcards WHERE doc_id = ? ORDER BY created_at ASC");
        const cards = cardStmt.all(docId);

        return sendJSON(res, { document: doc, flashcards: cards });
      }

      if (req.method === "DELETE") {
        db.prepare("DELETE FROM flashcards WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM chat_messages WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM documents WHERE id = ?").run(docId);
        return sendJSON(res, { success: true });
      }
    }

    // 5. POST /api/ai/generate-flashcards - generate comprehensive atomic flashcards covering all key concepts
    if (req.method === "POST" && pathname === "/api/ai/generate-flashcards") {
      const { docId, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

      const prompt = `Anda adalah spesialis metode Active Recall & Spaced Repetition (standar SuperMemo / Anki).
Lakukan AUDIT MENYELURUH terhadap seluruh isi dokumen materi di bawah ini.
Identifikasi SELURUH konsep inti, kaidah operasional, rumus & variabel, aturan baku, perbedaan konsep yang sering tertukar, dan contoh aplikasi cepat.
Jangan batasi jumlah kartu secara artifisial — buat kartu sebanyak yang dibutuhkan agar MENCENGKERAM SELURUH KONSEP POKOK dokumen (biasanya antara 8 hingga 20+ kartu tergantung kekayaan materi), tanpa kartu pengisi.

ATURAN STRUKTUR KARTU (INTUISI & ACTIVE RECALL KUAT):
1. Sisi Depan (Front) - Stimulus Terarah (3-10 kata):
   - DILARANG KERAS membuat kartu depan hanya 1 kata ambigu (seperti "Matriks" atau "Inflasi" saja).
   - Selalu berikan konteks yang jelas:
     * Definisi/Konsep: "Konsep dasar matriks & analogi praktisnya" atau "Prinsip estetika Art Nouveau"
     * Aturan/Kaidah: "Syarat mutlak agar penjumlahan dua matriks sah dilakukan"
     * Kasus/Aplikasi Kilat: "Jika matriks punya 3 baris dan 5 kolom, bagaimana notasi ordonya?"
     * Pembeda/Jebakan: "Mengapa perkalian matriks A x B tidak selalu sama dengan B x A?"
   - DILARANG membuat soal cerita panjang atau paragraf soal di sisi depan.
2. Sisi Belakang (Back) - Kaidah Intuitif & Terapan (1-3 kalimat):
   - Jangan sekadar definisi kamus kaku. Berikan intuisi "mengapa/bagaimana" yang langsung klik di kepala siswa.
   - Jika ada rumus matematika/persamaan, WAJIB gunakan sintaks LaTeX KaTeX yang dibungkus tanda dollar ($...$).

Format output WAJIB HANYA berupa array JSON murni tanpa markdown codeblock formatting atau teks pengantar:
[
  {"front": "Stimulus Terarah & Konteks Jelas", "back": "Penjelasan intuitif, kaidah inti, atau bentuk rumus kunci"}
]

Materi:
"""
${doc.content.slice(0, 25000)}
"""`;

      const aiResponse = await callRouter([
        { role: "system", content: "You are an educational AI that extracts high-yield atomic flashcards in strict JSON." },
        { role: "user", content: prompt }
      ], model);

      // Clean JSON string if enclosed in markdown blocks
      let cleanJson = aiResponse.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
      }

      let parsedCards = [];
      try {
        parsedCards = JSON.parse(cleanJson);
      } catch (parseErr) {
        const jsonMatch = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          try {
            parsedCards = JSON.parse(jsonMatch[0]);
          } catch {
            console.error("JSON parse failed, raw response:", aiResponse);
            return sendJSON(res, { error: "AI produced invalid JSON", raw: aiResponse }, 500);
          }
        } else {
          console.error("JSON parse failed, raw response:", aiResponse);
          return sendJSON(res, { error: "AI produced invalid JSON", raw: aiResponse }, 500);
        }
      }

      // Replace existing cards with fresh comprehensive audit
      db.prepare("DELETE FROM flashcards WHERE doc_id = ?").run(docId);

      const insertCard = db.prepare("INSERT INTO flashcards (id, doc_id, front, back, created_at) VALUES (?, ?, ?, ?, ?)");
      const savedCards = [];
      for (const card of parsedCards) {
        if (card.front && card.back) {
          const cardId = "card_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
          const createdAt = Date.now();
          insertCard.run(cardId, docId, card.front, card.back, createdAt);
          savedCards.push({ id: cardId, doc_id: docId, front: card.front, back: card.back, difficulty: "new" });
        }
      }

      return sendJSON(res, { success: true, count: savedCards.length, flashcards: savedCards });
    }

    // 6. POST /api/ai/generate-summary - generate comprehensive high-retention notes with style selection
    if (req.method === "POST" && pathname === "/api/ai/generate-summary") {
      const { docId, model = "ag/gemini-3.8-flash-low", style = "intuitive" } = await getBody(req);
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

      const isMathDomain = detectRealMath(doc.content);

      let styleGuidance = "";
      if (style === "memorization") {
        styleGuidance = `GAYA PENULISAN: POIN HAFALAN & INTISARI UJIAN CEPAT
- Fokus pada materi yang wajib dihafal: istilah kunci, nama tokoh/proses, bagan klasifikasi, poin perbandingan yang sering mengecoh.
- Gunakan ringkasan poin-poin padat, tabel perbandingan, dan mnemonik agar mudah diingat dalam waktu singkat.`;
      } else if (style === "academic") {
        styleGuidance = `GAYA PENULISAN: STRUKTUR FORMAL AKADEMIK LENGKAP
- Susun secara komprehensif, presisi tinggi, dan metodologis.
- Bedah latar belakang teoritis, relasi sebab-akibat, dan analisis kritis mendalam tanpa kehilangan keterbacaan.`;
      } else {
        styleGuidance = `GAYA PENULISAN: BAHASA SEDERHANA & INTUITIF (TUTOR SEBAYA / NON-TEORITIS)
- HINDARI bahasa diktat kaku yang menjemukan. Jelaskan seperti seorang mentor senior yang cerdas dan asyik.
- Mulai dari masalah nyata: "Kenapa konsep ini diciptakan? Di mana kita menjumpainya dalam kehidupan nyata?"
- Gunakan analogi konkret yang langsung memicu 'Aha! moment' (misal: matriks sebagai tabel stok toko/grid piksel, inflasi sebagai air yang terlalu banyak di adonan).
- Pertahankan substansi 100% lengkap dan akurat, hanya ubah cara penyampaiannya agar hidup dan mudah dicerna.`;
      }

      const mathSectionBlock = isMathDomain
        ? `3. **Rumus, Persamaan, & Aturan Pokok**:
   - Tuliskan rumus matematika/fisika yang benar-benar ada dalam materi menggunakan KaTeX LaTeX ($...$ inline atau $$...$$ blok).
   - Wajib sertakan cara membaca rumus dengan bahasa manusia biasa dan contoh angka kecil sederhana agar pembaca langsung paham cara memakainya.`
        : `3. **Kaidah Pokok, Karakteristik Utama, & Klasifikasi**:
   - DILARANG KERAS MENGARANG RUMUS/PERSAMAAN MATEMATIKA PALSU (PSEUDO-MATH) seperti membuat $V = f(X, Y)$ atau persamaan fungsi simbolik buatan untuk materi seni, sejarah, kriya, atau ilmu sosial.
   - Sajikan prinsip inti, kaidah perancangan, matriks perbandingan gaya/era, atau taksonomi klasifikasi murni konseptual tanpa rumus buatan sama sekali.`;

      const prompt = `Anda adalah pakar sintesis materi edukasi yang mampu mengubah materi rumit/kering menjadi modul belajar yang sangat hidup, aplikatif, dan mudah dipahami.
Lakukan AUDIT LENGKAP terhadap seluruh isi dokumen dan susun Catatan Inti & Peta Konsep Komprehensif yang MENCAKUP SELURUH materi tanpa ada bagian penting yang terlewat.

${styleGuidance}

PRINSIP WAJIB:
- Jangan biarkan materi terasa seperti kamus hafalan mati. Hubungkan teori dengan tujuan praktisnya.

STRUKTUR SISTEMATIS CATATAN:
1. **Peta Konsep & Kerangka Besar**:
   - Diagram hierarki topik (ASCII tree) yang memperlihatkan alur logika dari dasar ke lanjutan.
   - 2 kalimat pembuka: Masalah nyata apa yang dijawab oleh materi ini.
2. **Bedah Konsep Kunci & Analogi Nyata**:
   - Setiap istilah/konsep tidak hanya didefinisikan secara formal, tapi WAJIB dilengkapi minimal 1 analogi konkret atau contoh kasus nyata.
${mathSectionBlock}
4. **Pola Kritis & Analisis Jebakan (Common Pitfalls)**:
   - Miskonsepsi yang paling sering membuat siswa salah kaprah saat ujian/praktek, lengkap dengan trik membedakannya.
5. **Checklist Pemahaman Mandiri**:
   - 3-4 pertanyaan refleksi aplikatif untuk menguji apakah pembaca benar-benar paham secara fungsional.

Format dengan Markdown rapi, sub-heading yang jelas, dan penekanan cetak tebal pada istilah kunci.

Materi Lengkap:
"""
${doc.content.slice(0, 25000)}
"""`;

      const summary = await callRouter([
        { role: "system", content: "You are an elite academic tutor providing high-retention comprehensive study notes." },
        { role: "user", content: prompt }
      ], model);

      db.prepare("UPDATE documents SET summary = ? WHERE id = ?").run(summary, docId);
      return sendJSON(res, { success: true, summary, style });
    }

    // 7. POST /api/ai/chat - conversational grounded tutor
    if (req.method === "POST" && pathname === "/api/ai/chat") {
      const { docId, message, history = [], model = "ag/gemini-3.8-flash-low" } = await getBody(req);
      if (!message) return sendJSON(res, { error: "Message required" }, 400);

      let contextText = "";
      if (docId) {
        const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
        if (doc) {
          contextText = `Referensi Materi Aktif: "${doc.title}":\n"""\n${doc.content.slice(0, 8000)}\n"""\n\n`;
        }
      }

      const systemPrompt = `Anda adalah Nara, tutor belajar AI yang cerdas dan adaptif.
Tugas Anda: Menjelaskan konsep secara to-the-point, interaktif, dan mudah dipahami.
Jika ada rumus atau definisi penting, jelaskan intuisi di baliknya.
Sesuaikan gaya jawaban dengan level materi — bahasa sederhana untuk dasar, presisi akademik untuk tingkat lanjut.
${contextText}Jawab pertanyaan pengguna dengan jelas dan fokus.
ATURAN FORMAT MATEMATIKA: Untuk rumus matematika, pecahan, akar, sigma, kuadrat, atau variabel aljabar, WAJIB bungkus ekspresi dengan tanda dollar ($...$ untuk inline, $$...$$ untuk blok) menggunakan LaTeX standar (misal $ax^2 + bx + c = 0$, $\\frac{a}{b}$, $\\sqrt{x}$, $\\sum$) agar ter-render sempurna oleh KaTeX. JANGAN biarkan rumus mentah tanpa tanda dollar.`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...history.slice(-8),
        { role: "user", content: message }
      ];

      const reply = await callRouter(messages, model);

      // Save to chat_messages
      const msgId = "msg_" + Date.now();
      db.prepare("INSERT INTO chat_messages (id, doc_id, role, content, model, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run(msgId, docId || null, "user", message, model, Date.now());
      db.prepare("INSERT INTO chat_messages (id, doc_id, role, content, model, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run(msgId + "_r", docId || null, "assistant", reply, model, Date.now());

      return sendJSON(res, { reply, model });
    }

    // 8. PATCH /api/flashcards/:id/review - update flashcard score/status
    const cardMatch = pathname.match(/^\/api\/flashcards\/([^/]+)\/review$/);
    if (req.method === "POST" && cardMatch) {
      const cardId = cardMatch[1];
      const { difficulty } = await getBody(req); // 'again', 'hard', 'good', 'easy'
      db.prepare("UPDATE flashcards SET difficulty = ?, review_count = review_count + 1 WHERE id = ?").run(difficulty || "good", cardId);
      return sendJSON(res, { success: true });
    }

    // 9. POST /api/ai/generate-quiz - generate custom count multiple choice questions with explanations & pitfalls
    if (req.method === "POST" && pathname === "/api/ai/generate-quiz") {
      const { docId, model = "ag/gemini-3.8-flash-low", count = 5, quizType = "conceptual" } = await getBody(req);
      const finalCount = Math.max(1, Math.min(30, parseInt(count || "5", 10)));
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

      const isMathDomain = detectRealMath(doc.content);

      let typeGuidance = "";
      if (quizType === "conceptual") {
        typeGuidance = `TIPE KUIS: KONSEPTUAL TERAPAN & PEMAHAMAN LOGIS
- HINDARI SOAL HAFALAN ROBOTIK yang hanya menguji ingatan teks (DILARANG: "Berdasarkan definisi pada modul...", "Menurut teks di atas...").
- Gunakan SOAL APLIKATIF SKENARIO RINGAN: Berikan situasi praktis, contoh kasus mini, atau konteks nyata, lalu uji apakah pembelajar paham cara kerja konsep tersebut.
- Tetap ramah untuk ujian sekolah/harian tanpa hitungan yang berbelit-belit.`;
      } else {
        typeGuidance = `TIPE KUIS: ANALISIS MENDALAM & PREDIKSI UJIAN (HOTS / SELEKSI TINGGI)
- Fokus pada penalaran tingkat tinggi, analisis variabel tersembunyi, komparasi multi-konsep, dan pemecahan masalah non-rutin.
- Rancang variasi soal yang berpotensi menjadi soal pembeda nilai di ujian seleksi atau kompetisi.`;
      }

      // Query unresolved mistakes for adaptive remedial weighting
      const unresolvedMistakes = db.prepare(
        "SELECT question, pitfall, formula FROM mistake_notebook WHERE doc_id = ? AND resolved = 0 LIMIT 5"
      ).all(docId);

      let weaknessContext = "";
      if (unresolvedMistakes && unresolvedMistakes.length > 0) {
        weaknessContext = `\nCATATAN EVALUASI & TITIK LEMAH PEMBELAJAR (PRIORITAS REMEDIAL):
Pembelajar sebelumnya pernah keliru pada konsep/soal berikut:
${unresolvedMistakes.map((m, i) => `${i + 1}. Soal Terkait: "${m.question}" | Analisis Jebakan: ${m.pitfall || "Miskonsepsi pemahaman"}`).join("\n")}
PRIORITAS: Alokasikan 1 atau 2 butir soal variasi baru yang menyasar konsep di atas untuk menguji apakah pemahaman pembelajar sudah benar-benar pulih.\n`;
      }

      const mathRule = isMathDomain
        ? `ATURAN FORMAT MATEMATIKA:
Jika materi/soal mengandung rumus atau hitungan, WAJIB gunakan KaTeX LaTeX ($...$ inline atau $$...$$ blok), contoh: $\\frac{a}{b}$, $\\sqrt{x}$, $x^2$.`
        : `ATURAN MATERI NON-HITUNGAN:
Materi ini adalah materi konseptual/teori non-matematika. DILARANG KERAS memaksakan rumus atau angka hitungan buatan. Kosongkan field "formula": "" dan fokus pada pemahaman konsep/fakta.`;

      const prompt = `Anda adalah pembuat soal ujian akademik profesional berstandar tinggi.
Buatkan TEPAT ${finalCount} butir soal pilihan ganda dengan 5 PILIHAN JAWABAN (A, B, C, D, E).

${typeGuidance}

STANDAR KUALITAS SOAL (ANTI-SLOP & HIDUP):
1. Setiap soal harus terasa alami dan relevan. Hindari kalimat pembuka klise seperti "Berdasarkan materi...", langsung masuk ke skenario atau inti pertanyaan.
2. OPSI PENGECOH (DISTRACTORS):
   - 4 pilihan salah HARUS berasal dari miskonsepsi nyata, kesalahan kalkulasi umum, atau konsep yang saling tertukar. Jangan pernah membuat opsi konyol.
3. KUNCI JAWABAN & SINKRONISASI INDEKS (MUTLAK):
   - correctIndex: 0 = Pilihan A
   - correctIndex: 1 = Pilihan B
   - correctIndex: 2 = Pilihan C
   - correctIndex: 3 = Pilihan D
   - correctIndex: 4 = Pilihan E
   - Kunci jawaban WAJIB terdistribusi secara acak merata di antara opsi A, B, C, D, dan E.
   - Pada teks "desc" langkah pembahasan dan "explanation", HURUF YANG DISEBUT WAJIB SINKRON 100% dengan correctIndex.
4. KUALITAS PEMBAHASAN STEP-BY-STEP (DILARANG MALAS):
   - Setiap "desc" dalam "steps" WAJIB terdiri dari minimal 2-3 kalimat penjelasan yang tuntas.
   - Langkah 1: Bedah apa yang diketahui dan konsep yang menjadi kunci pemecahan.
   - Langkah 2: Uraikan alur pembuktian atau penalaran detail mengapa opsi benar terpilih DAN mengapa opsi pengecoh gugur.
   - Langkah 3: Berikan simpulan tegas yang memantapkan pemahaman.

${weaknessContext}
${mathRule}

Format output WAJIB HANYA berupa array JSON valid tanpa markdown fence atau teks tambahan:
[
  {
    "id": 1,
    "question": "Pertanyaan berbasis skenario/aplikasi...",
    "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D", "Opsi E"],
    "correctIndex": 0,
    "formula": "${isMathDomain ? '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$ (Rumus kunci jika materi berhitung)' : ''}",
    "steps": [
      {"step": 1, "title": "Identifikasi Masalah & Premis", "desc": "Penjelasan mendalam 2-3 kalimat mengenai apa yang ditanyakan dan konsep yang relevan..."},
      {"step": 2, "title": "Bedah Analisis & Eliminasi Pengecoh", "desc": "Penjelasan rinci 2-3 kalimat mengapa opsi tertentu benar dan opsi lainnya keliru..."},
      {"step": 3, "title": "Kesimpulan Solutif", "desc": "Simpulan konklusif yang mengunci jawaban dan menegaskan kaidah intinya..."}
    ],
    "explanation": "Penjelasan menyeluruh mengapa jawaban huruf tersebut tepat...",
    "pitfall": "Jebakan umum: pembelajar sering terkecoh pada opsi X karena..."
  }
]

Materi:
"""
${doc.content.slice(0, 15000)}
"""`;

      const reply = await callRouter([
        { role: "system", content: "You are an expert exam question generator that strictly outputs valid JSON arrays." },
        { role: "user", content: prompt }
      ], model, 0.2);

      let cleanJSON = reply.trim();
      if (cleanJSON.startsWith("```json")) cleanJSON = cleanJSON.slice(7);
      else if (cleanJSON.startsWith("```")) cleanJSON = cleanJSON.slice(3);
      if (cleanJSON.endsWith("```")) cleanJSON = cleanJSON.slice(0, -3);
      cleanJSON = cleanJSON.trim();

      // Clean trailing commas before closing braces/brackets (common LLM JSON quirk)
      cleanJSON = cleanJSON.replace(/,\s*([\]}])/g, "$1");

      let questions = [];
      try {
        questions = JSON.parse(cleanJSON);
      } catch (parseErr) {
        const jsonMatch = cleanJSON.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const sanitizedMatch = jsonMatch[0].replace(/,\s*([\]}])/g, "$1");
          questions = JSON.parse(sanitizedMatch);
        } else {
          return sendJSON(res, { error: "Format JSON soal tidak valid dari model AI", raw: reply }, 500);
        }
      }

      // Server-side True Randomization: Fisher-Yates shuffle of options to prevent any predictable pattern
      questions.forEach((q) => {
        if (Array.isArray(q.options) && q.options.length >= 2) {
          const originalCorrect = q.options[q.correctIndex];
          for (let i = q.options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
          }
          q.correctIndex = q.options.indexOf(originalCorrect);
        }
      });

      const quizId = "quiz_" + Date.now();
      db.prepare("INSERT INTO quizzes (id, doc_id, questions, created_at) VALUES (?, ?, ?, ?)")
        .run(quizId, docId, JSON.stringify(questions), Date.now());

      return sendJSON(res, { success: true, quizId, questions });
    }

    // 10. GET /api/documents/:id/quizzes - get last saved quiz
    const quizMatch = pathname.match(/^\/api\/documents\/([^/]+)\/quizzes$/);
    if (req.method === "GET" && quizMatch) {
      const docId = quizMatch[1];
      const row = db.prepare("SELECT * FROM quizzes WHERE doc_id = ? ORDER BY created_at DESC LIMIT 1").get(docId);
      return sendJSON(res, { quiz: row ? { id: row.id, questions: JSON.parse(row.questions) } : null });
    }

    // 10.b POST /api/ai/quiz-question-chat - chat with AI specifically about an individual quiz question
    if (req.method === "POST" && pathname === "/api/ai/quiz-question-chat") {
      const {
        docId,
        question,
        options = [],
        correctIndex,
        userSelectedIndex,
        userMessage,
        chatHistory = [],
        model = "ag/gemini-3.8-flash-low"
      } = await getBody(req);

      if (!userMessage || !userMessage.trim()) {
        return sendJSON(res, { error: "Pertanyaan tidak boleh kosong" }, 400);
      }

      let docContext = "";
      if (docId) {
        const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
        if (doc) docContext = `Konteks Materi ("${doc.title}"):\n"""\n${doc.content.slice(0, 8000)}\n"""\n\n`;
      }

      const optionsList = options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n");
      const correctLetter = String.fromCharCode(65 + correctIndex);
      const userSelectedLetter = userSelectedIndex !== null && userSelectedIndex !== undefined
        ? String.fromCharCode(65 + userSelectedIndex)
        : "Belum dipilih";

      const systemPrompt = `Anda adalah Nara, tutor AI spesialis bedah soal.
Siswa sedang berlatih pada soal pilihan ganda berikut:

Soal: "${question}"
Pilihan:
${optionsList}

Kunci Jawaban yang Benar: Pilihan ${correctLetter}
Pilihan yang Dipilih Siswa: Pilihan ${userSelectedLetter}

${docContext}Tugas Anda:
1. Jawab pertanyaan siswa secara spesifik, to-the-point, ramah, dan mendidik.
2. Jelaskan logika mengapa opsi tertentu keliru atau mengecoh dan mengapa kunci jawaban tepat.
3. Berikan analogi sederhana jika siswa meminta penyederhanaan konsep.
4. Gunakan bahasa Indonesia yang santai tapi tepat secara konsep keilmuan.
5. FORMAT RUMUS: Untuk rumus matematika, pecahan, akar, sigma, kuadrat, atau aljabar, bungkus ekspresi dengan sintaks LaTeX dollar ($...$) misal $\\frac{a}{b}$, $\\sqrt{x}$, $\\sum$, agar ter-render sempurna oleh KaTeX.
6. STRUKTUR LANGKAH PENGERJAAN: Jika pertanyaan melibatkan hitungan atau rumus, WAJIB susun jawaban dengan format terstruktur:
   - **Rumus Kunci**: Rumus utama yang dipakai (blok LaTeX $$...$$).
   - **Langkah Pengerjaan**:
     - *Langkah 1 (Identifikasi)*: Nilai variabel yang diketahui & ditanyakan.
     - *Langkah 2 (Substitusi & Hitung)*: Turunan perhitungan baris demi baris.
     - *Langkah 3 (Kesimpulan)*: Jawaban akhir dan verifikasi.
   - **Waspada Jebakan**: Kesalahan umum atau jebakan pengecoh yang sering terjadi.`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...chatHistory.slice(-6),
        { role: "user", content: userMessage.trim() }
      ];

      try {
        const reply = await callRouter(messages, model, 0.3);
        return sendJSON(res, { success: true, reply });
      } catch (err) {
        return sendJSON(res, { error: "Gagal memproses tanya AI: " + err.message }, 500);
      }
    }

    // 11. POST /api/ai/feynman-evaluate - evaluate student's own explanation using Feynman active recall
    if (req.method === "POST" && pathname === "/api/ai/feynman-evaluate") {
      const { docId, topic, explanation, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
      if (!explanation || !explanation.trim()) {
        return sendJSON(res, { error: "Penjelasan tidak boleh kosong" }, 400);
      }

      let docContext = "";
      if (docId) {
        const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
        if (doc) docContext = `Konteks Materi Rujukan ("${doc.title}"):\n"""\n${doc.content.slice(0, 8000)}\n"""\n\n`;
      }

      const prompt = `Anda adalah evaluator metode Feynman akademik tingkat lanjut.
Siswa sedang melatih active recall dengan menjelaskan suatu konsep dengan bahasanya sendiri.
Tugas Anda: Evaluasi keakuratan penjelasan siswa secara jujur, konstruktif, dan presisi.

${docContext}Topik yang dijelaskan siswa: "${topic || 'Konsep Materi'}"
Penjelasan dari siswa:
"""
${explanation.trim()}
"""

ATURAN FORMAT MATEMATIKA: Jika ulasan mengandung rumus matematika, pecahan, akar, sigma, kuadrat, atau aljabar, WAJIB bungkus ekspresi dengan tanda dollar ($...$) menggunakan LaTeX standar agar ter-render rapi oleh KaTeX.

Format output WAJIB HANYA berupa JSON valid tanpa teks tambahan:
{
  "score": 85,
  "verdict": "Pemahaman Sangat Kuat / Pemahaman Cukup / Ada Miskonsepsi",
  "accuratePoints": ["Poin 1 yang dipahami dengan benar", "Poin 2 yang tepat"],
  "missedOrFlawedPoints": ["Nuansa penting yang terlewat atau definisi yang kurang presisi"],
  "perfectAnalogy": "Analogi singkat, hidup, dan aplikatif sehari-hari untuk mengunci pemahaman ini di memori jangka panjang",
  "feedback": "Ulasan singkat 2-3 kalimat yang ramah, memotivasi, dan langsung ke inti perbaikan."
}`;

      const reply = await callRouter([
        { role: "system", content: "You are an expert Feynman learning evaluator strictly returning valid JSON objects." },
        { role: "user", content: prompt }
      ], model, 0.2);

      let cleanJSON = reply.trim();
      if (cleanJSON.startsWith("```json")) cleanJSON = cleanJSON.slice(7);
      else if (cleanJSON.startsWith("```")) cleanJSON = cleanJSON.slice(3);
      if (cleanJSON.endsWith("```")) cleanJSON = cleanJSON.slice(0, -3);
      cleanJSON = cleanJSON.trim();

      let evalResult = {};
      try {
        evalResult = JSON.parse(cleanJSON);
      } catch (e) {
        const objMatch = cleanJSON.match(/\{[\s\S]*\}/);
        if (objMatch) {
          evalResult = JSON.parse(objMatch[0]);
        } else {
          return sendJSON(res, { error: "Format evaluasi model AI tidak valid", raw: reply }, 500);
        }
      }

      return sendJSON(res, { success: true, evaluation: evalResult });
    }

    // 12. GET /api/mistakes - list all active mistakes
    if (req.method === "POST" && pathname === "/api/mistakes/record") {
      const { docId, docTitle = "", question, options = [], correctIndex, userAnswerIndex, formula = "", steps = [], explanation = "", pitfall = "" } = await getBody(req);
      if (!question) return sendJSON(res, { error: "Question required" }, 400);

      const existing = db.prepare("SELECT id FROM mistake_notebook WHERE doc_id = ? AND question = ?").get(docId, question);
      const now = Date.now();
      if (existing) {
        db.prepare("UPDATE mistake_notebook SET user_answer_index = ?, resolved = 0, updated_at = ? WHERE id = ?")
          .run(userAnswerIndex, now, existing.id);
        return sendJSON(res, { success: true, id: existing.id, updated: true });
      } else {
        const id = "mistake_" + now + "_" + Math.random().toString(36).slice(2, 6);
        db.prepare("INSERT INTO mistake_notebook (id, doc_id, doc_title, question, options, correct_index, user_answer_index, formula, steps, explanation, pitfall, resolved, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)")
          .run(id, docId || "", docTitle, question, JSON.stringify(options), correctIndex, userAnswerIndex, formula, JSON.stringify(steps), explanation, pitfall, now, now);
        return sendJSON(res, { success: true, id, created: true });
      }
    }

    if (req.method === "GET" && pathname === "/api/mistakes") {
      const rows = db.prepare("SELECT * FROM mistake_notebook WHERE resolved = 0 ORDER BY updated_at DESC").all();
      const mistakes = rows.map(r => ({
        id: r.id,
        docId: r.doc_id,
        docTitle: r.doc_title,
        question: r.question,
        options: JSON.parse(r.options || "[]"),
        correctIndex: r.correct_index,
        userAnswerIndex: r.user_answer_index,
        formula: r.formula,
        steps: r.steps ? JSON.parse(r.steps) : [],
        explanation: r.explanation,
        pitfall: r.pitfall,
        resolved: r.resolved,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
      return sendJSON(res, { success: true, count: mistakes.length, mistakes });
    }

    if (req.method === "POST" && pathname.startsWith("/api/mistakes/") && pathname.endsWith("/resolve")) {
      const mistakeId = pathname.split("/")[3];
      db.prepare("UPDATE mistake_notebook SET resolved = 1, updated_at = ? WHERE id = ?").run(Date.now(), mistakeId);
      return sendJSON(res, { success: true, id: mistakeId, resolved: true });
    }

    if (req.method === "DELETE" && pathname.startsWith("/api/mistakes/")) {
      const mistakeId = pathname.split("/")[3];
      db.prepare("DELETE FROM mistake_notebook WHERE id = ?").run(mistakeId);
      return sendJSON(res, { success: true, id: mistakeId });
    }

    // 16. POST /api/ai/extract-formulas - extract cheat sheet formulas from document
    if (req.method === "POST" && pathname === "/api/ai/extract-formulas") {
      const { docId, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
      if (!docId) return sendJSON(res, { error: "docId required" }, 400);

      const cached = db.prepare("SELECT * FROM formula_cheatsheets WHERE doc_id = ?").get(docId);
      if (cached && cached.formulas) {
        return sendJSON(res, { success: true, cached: true, formulas: JSON.parse(cached.formulas) });
      }

      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

      const prompt = `Anda adalah spesialis penyusun lembar rumus (Cheat Sheet) akademik resmi.
Ekstrak SELURUH rumus, persamaan penting, definisi matematis, atau aturan kunci dari materi berikut.
Format output WAJIB HANYA berupa array JSON valid tanpa markdown formatting tambahan:
[
  {
    "name": "Nama Rumus / Konsep (contoh: Rumus Diskriminan)",
    "formula": "$$D = b^2 - 4ac$$ (Gunakan blok LaTeX $$...$$ yang rapi)",
    "meaning": "Keterangan variabel dan fungsi rumus...",
    "category": "Aljabar / Geometri / Teori / Deret / dll"
  }
]

ATURAN RUMUS:
Gunakan sintaks LaTeX standar dengan pecahan \\frac{a}{b}, akar \\sqrt{...}, sigma \\sum, dan eksponen ^2.

Materi:
"""
${doc.content.slice(0, 10000)}
"""`;

      const reply = await callRouter([
        { role: "system", content: "You are an elite formula cheat sheet extractor returning valid JSON arrays." },
        { role: "user", content: prompt }
      ], model, 0.2);

      let cleanJSON = reply.trim();
      if (cleanJSON.startsWith("```json")) cleanJSON = cleanJSON.slice(7);
      else if (cleanJSON.startsWith("```")) cleanJSON = cleanJSON.slice(3);
      if (cleanJSON.endsWith("```")) cleanJSON = cleanJSON.slice(0, -3);
      cleanJSON = cleanJSON.trim();

      let formulas = [];
      try {
        formulas = JSON.parse(cleanJSON);
      } catch (e) {
        const match = cleanJSON.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) formulas = JSON.parse(match[0]);
        else formulas = [];
      }

      if (formulas.length > 0) {
        db.prepare("INSERT OR REPLACE INTO formula_cheatsheets (doc_id, formulas, created_at) VALUES (?, ?, ?)")
          .run(docId, JSON.stringify(formulas), Date.now());
      }

      return sendJSON(res, { success: true, count: formulas.length, formulas });
    }

    if (req.method === "GET" && pathname.startsWith("/api/documents/") && pathname.endsWith("/formulas")) {
      const docId = pathname.split("/")[3];
      const cached = db.prepare("SELECT * FROM formula_cheatsheets WHERE doc_id = ?").get(docId);
      if (cached && cached.formulas) {
        return sendJSON(res, { success: true, formulas: JSON.parse(cached.formulas) });
      }
      return sendJSON(res, { success: true, formulas: [] });
    }

    // 18. POST /api/ai/topic-clarify - ask diagnostic questions before generating a topic
    if (req.method === "POST" && pathname === "/api/ai/topic-clarify") {
      const { topic, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
      if (!topic || !topic.trim()) return sendJSON(res, { error: "Topic required" }, 400);

      const prompt = `Pengguna ingin mempelajari topik berikut tanpa memiliki file dokumen/buku:
"${topic.trim()}"

Tugas Anda:
1. Identifikasi bidang ilmu yang relevan (misal: Matematika, Ekonomi, Sosiologi, Bahasa, Pemrograman, Sains, Sejarah, dll).
2. Tentukan judul topik formal akademik (contoh: "Matriks Transformasi Geometri Ordo 2x2", "Dasar-Dasar Machine Learning Supervisi").
3. Buat 2 atau 3 pertanyaan diagnostik interaktif singkat untuk memastikan materi yang disusun tepat sasaran sesuai kebutuhan pengguna. Tiap pertanyaan memiliki 3 atau 4 pilihan opsi ringkas.

Format output WAJIB HANYA berupa JSON valid tanpa markdown formatting:
{
  "subject": "Nama Mata Pelajaran",
  "formalTitle": "Judul Topik Formal Akademik",
  "questions": [
    {
      "id": "q1",
      "question": "Pertanyaan diagnostik 1...",
      "choices": ["Pilihan 1", "Pilihan 2", "Pilihan 3"]
    },
    {
      "id": "q2",
      "question": "Pertanyaan diagnostik 2...",
      "choices": ["Pilihan A", "Pilihan B", "Pilihan C"]
    }
  ]
}`;

      const reply = await callRouter([
        { role: "system", content: "You are an elite academic curriculum architect. Strictly return valid JSON." },
        { role: "user", content: prompt }
      ], model, 0.2);

      let cleanJSON = reply.trim();
      if (cleanJSON.startsWith("```json")) cleanJSON = cleanJSON.slice(7);
      else if (cleanJSON.startsWith("```")) cleanJSON = cleanJSON.slice(3);
      if (cleanJSON.endsWith("```")) cleanJSON = cleanJSON.slice(0, -3);
      cleanJSON = cleanJSON.trim();

      try {
        const parsed = JSON.parse(cleanJSON);
        return sendJSON(res, { success: true, ...parsed });
      } catch (e) {
        return sendJSON(res, {
          success: true,
          subject: "Umum",
          formalTitle: topic.trim(),
          questions: [
            {
              id: "focus",
              question: "Aspek materi mana yang ingin Anda prioritaskan?",
              choices: ["Penurunan Rumus & Konsep Teori", "Trik Cepat & Pola Soal HOTS", "Studi Kasus & Pembahasan Aplikasi"]
            },
            {
              id: "depth",
              question: "Tingkat kedalaman pembahasan yang diinginkan?",
              choices: ["Fondasi Dasar (Konseptual & Mudah Dipahami)", "Intensif Terapan (Persiapan Ujian / Uji Kompetensi)", "Tingkat Lanjut (Analisis Mendalam & Soal Jebakan)"]
            }
          ]
        });
      }
    }

    // 19. POST /api/ai/topic-generate - generate full academic document from topic + user clarification answers
    if (req.method === "POST" && pathname === "/api/ai/topic-generate") {
      const { topic, formalTitle, subject, answers = {}, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
      if (!topic) return sendJSON(res, { error: "Topic required" }, 400);

      const prompt = `Anda adalah pendidik ahli spesialis kurikulum dan penyusunan modul ajar komprehensif.
Pengguna ingin mempelajari materi: "${topic}"
Judul Formal: "${formalTitle || topic}"
Bidang / Mata Pelajaran: "${subject || "Umum"}"
Preferensi / Kebutuhan Pembelajar:
${Object.entries(answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

Tugas Anda: Susun dokumen materi belajar mandiri yang LENGKAP, MENDALAM, dan TERSTRUKTUR (bukan sekadar ringkasan pendek).
Struktur isi materi:
1. **Definisi & Peta Konsep Utama**: Penjelasan inti konsep dengan bahasa lugas dan analogi intuitif.
2. **Rumus Kunci & Persamaan / Aturan Pokok**:
   - Jika ada rumus/persamaan, WAJIB gunakan LaTeX ($...$ atau $$...$$) dengan garis pecahan horizontal bertingkat \\frac{a}{b}, akar \\sqrt{...}, sigma \\sum, dan eksponen kuadrat.
   - Cantumkan keterangan jelas setiap variabel dan satuan/kondisi.
3. **Pola Soal Ujian & Strategi Solusi**: Variasi pola soal yang sering diujikan beserta trik efisiensi/pengerjaan cepat.
4. **2 Contoh Soal Bertingkat Beserta Langkah Solusi Sistematis**:
   - Contoh 1: Tingkat Konseptual / Sedang.
   - Contoh 2: Tingkat Analisis Kritis / Kasus Lanjutan.
5. **Analisis Jebakan & Miskonsepsi**: Hal yang sering mengecoh saat menghadapi ujian atau aplikasi praktis.

Tulis materi secara utuh dan kaya (minimal 600-1000 kata) dalam bahasa Indonesia akademis yang enak dibaca.`;

      const content = await callRouter([
        { role: "system", content: "Anda adalah pengajar ahli yang menyusun modul ajar dan buku teks studi mendalam." },
        { role: "user", content: prompt }
      ], model, 0.3);

      const docId = "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const title = (formalTitle || topic).trim();

      db.prepare("INSERT INTO documents (id, title, content, summary, created_at) VALUES (?, ?, ?, ?, ?)")
        .run(docId, title, content, "", Date.now());

      return sendJSON(res, { success: true, docId, title, content_length: content.length });
    }

    // 20. Static file fallback (if built frontend exists)
    const distPath = path.join(__dirname, "dist");
    let filePath = path.join(distPath, pathname === "/" ? "index.html" : pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".json": "application/json",
        ".woff2": "font/woff2",
        ".woff": "font/woff",
        ".ttf": "font/ttf",
      };
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
      return fs.createReadStream(filePath).pipe(res);
    }

    // If API route not found
    sendJSON(res, { error: "Route not found" }, 404);
  } catch (err) {
    console.error("[tanka-server] Error handling request:", err);
    sendJSON(res, { error: err.message }, 500);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[tanka-server] Running on http://0.0.0.0:${PORT}`);
  console.log(`[tanka-server] Connected to 9Router at ${ROUTER_URL}`);
});
