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

// Clean up any orphaned records from previously deleted documents
try {
  db.prepare("DELETE FROM mistake_notebook WHERE doc_id NOT IN (SELECT id FROM documents)").run();
  db.prepare("DELETE FROM flashcards WHERE doc_id NOT IN (SELECT id FROM documents)").run();
  db.prepare("DELETE FROM quizzes WHERE doc_id NOT IN (SELECT id FROM documents)").run();
  db.prepare("DELETE FROM chat_messages WHERE doc_id NOT IN (SELECT id FROM documents)").run();
  db.prepare("DELETE FROM formula_cheatsheets WHERE doc_id NOT IN (SELECT id FROM documents)").run();
} catch (e) {
  console.warn("[tanka-server] Orphan cleanup notice:", e.message);
}

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
  const primaryModel = model || "ag/gemini-3.8-flash-low";

  for (let attempt = 0; attempt < 2; attempt++) {
    const curModel = attempt === 0 ? primaryModel : "ag/gemini-3.8-flash-low";
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000); // 45s timeout

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ROUTER_KEY}`,
        },
        body: JSON.stringify({
          model: curModel,
          messages,
          temperature,
          stream: false,
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text();
        if (attempt === 0) {
          console.warn(`callRouter attempt 1 failed with ${curModel}, retrying... ${errText.slice(0, 100)}`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw new Error(`9Router error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      if (attempt === 0) {
        console.warn(`callRouter attempt 1 threw error with ${curModel}, retrying...`, err.message);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }
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

// Relevance scoring helper to filter out off-topic / wrong-subject search hits
function scoreAcademicRelevance(title, topic, subject = "") {
  const tLower = (title || "").toLowerCase();
  const topLower = (topic || "").toLowerCase().trim();
  const subLower = (subject || "").toLowerCase().trim();

  const stopWords = new Set(["dan", "yang", "di", "ke", "dari", "untuk", "pada", "adalah", "ini", "itu", "tentang", "kelas", "sma", "smp", "sd"]);
  const keywords = topLower.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 2 && !stopWords.has(w));

  let score = 0;
  for (const kw of keywords) {
    if (tLower.includes(kw)) score += 10;
  }
  if (tLower.includes(topLower)) score += 30;

  if (subLower) {
    if (tLower.includes(subLower)) score += 25;
    const allSubjects = ["ekonomi", "sosiologi", "geografi", "sejarah", "matematika", "fisika", "kimia", "biologi"];
    for (const s of allSubjects) {
      if (s !== subLower && tLower.includes(s)) {
        score -= 40; // Penalti berat jika beda mata pelajaran (misal materi sosiologi tapi artikel ekonomi)
      }
    }
  }
  return score;
}

// Multi-source academic & curriculum aggregator (Wikipedia ID, Wikibuku, CrossRef Educational Research, Ruangguru & 9Router)
async function multiSourceAcademicSearch(topic, subject = "") {
  const findings = {
    encyclopedia: [],
    textbook: [],
    curriculumLiterature: [],
    ruangguru: [],
    web: []
  };

  const cleanTopic = (topic || "").trim();
  const cleanSubject = (subject || "").trim();
  if (!cleanTopic) return "";

  // 1. Wikipedia Indonesia (Ensiklopedi & Konsep Baku Lengkap - Tanpa Truncation MediaWiki)
  try {
    const sUrl = `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanTopic)}&srlimit=4&format=json`;
    const sRes = await fetch(sUrl, { headers: { "User-Agent": "TankaAcademicBot/1.0" } });
    if (sRes.ok) {
      const sData = await sRes.json();
      const hits = (sData.query?.search || [])
        .map(h => ({ title: h.title, score: scoreAcademicRelevance(h.title, cleanTopic, cleanSubject) }))
        .filter(h => h.score > 0)
        .sort((a, b) => b.score - a.score);

      for (const h of hits.slice(0, 2)) {
        const extUrl = `https://id.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(h.title)}&format=json`;
        const extRes = await fetch(extUrl, { headers: { "User-Agent": "TankaAcademicBot/1.0" } });
        if (extRes.ok) {
          const extData = await extRes.json();
          const page = Object.values(extData.query?.pages || {})[0];
          if (page?.extract && page.extract.length > 50 && !findings.encyclopedia.some(e => e.title === page.title)) {
            findings.encyclopedia.push({ title: page.title, snippet: page.extract.slice(0, 3500) });
          }
        }
      }
    }
  } catch (err) {}

  // 2. Wikibooks Indonesia (Buku Teks Bebas & Bab Kurikulum Resmi)
  try {
    const sUrl = `https://id.wikibooks.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${cleanTopic} ${cleanSubject}`.trim())}&srlimit=3&format=json`;
    const sRes = await fetch(sUrl, { headers: { "User-Agent": "TankaAcademicBot/1.0" } });
    if (sRes.ok) {
      const sData = await sRes.json();
      const hits = (sData.query?.search || [])
        .map(h => ({ title: h.title, score: scoreAcademicRelevance(h.title, cleanTopic, cleanSubject) }))
        .filter(h => h.score > 0)
        .sort((a, b) => b.score - a.score);

      for (const h of hits.slice(0, 1)) {
        const extUrl = `https://id.wikibooks.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(h.title)}&format=json`;
        const extRes = await fetch(extUrl, { headers: { "User-Agent": "TankaAcademicBot/1.0" } });
        if (extRes.ok) {
          const extData = await extRes.json();
          const page = Object.values(extData.query?.pages || {})[0];
          if (page?.extract && page.extract.length > 50 && !findings.textbook.some(t => t.title === page.title)) {
            findings.textbook.push({ title: page.title, snippet: page.extract.slice(0, 2500) });
          }
        }
      }
    }
  } catch (err) {}

  // 3. CrossRef Open Academic API (Jurnal Kurikulum & Kajian Buku Teks Indonesia)
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(`${cleanTopic} Kurikulum Merdeka SMA ${cleanSubject}`.trim())}&rows=3&select=title,abstract`;
    const res = await fetch(url, { headers: { "User-Agent": "TankaAcademicBot/1.0 (mailto:study@tanka.app)" } });
    if (res.ok) {
      const data = await res.json();
      const items = data.message?.items || [];
      for (const it of items) {
        const title = it.title?.[0];
        const snippet = it.abstract ? it.abstract.replace(/<[^>]+>/g, "").slice(0, 500) : "";
        if (title && !findings.curriculumLiterature.some(c => c.title === title)) {
          findings.curriculumLiterature.push({ title, snippet });
        }
      }
    }
  } catch (err) {}

  // 4. Ruangguru Pedagogical Articles (Multi-Query + Ranked Selection)
  try {
    const queries = [cleanTopic];
    const simplified = cleanTopic.replace(/^(faktor\s+(?:pendorong|penghambat|penyebab)?|teori|pengertian|konsep|macam-macam|bentuk-bentuk)\s+/i, "").trim();
    if (simplified && simplified.toLowerCase() !== cleanTopic.toLowerCase()) {
      queries.push(simplified);
    }

    const rArticles = new Map();
    for (const q of queries) {
      const searchUrl = `https://www.ruangguru.com/blog/?s=${encodeURIComponent(q)}`;
      const rRes = await fetch(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
      });
      if (rRes.ok) {
        const rHtml = await rRes.text();
        const cardRegex = /<a[^>]+href="(https:\/\/www\.ruangguru\.com\/blog\/[^"]+)"[^>]*>[\s\S]*?<h2 class="content-title">([\s\S]*?)<\/h2>/gi;
        let m;
        while ((m = cardRegex.exec(rHtml)) !== null) {
          const url = m[1];
          if (url.includes("/blog/c/") || url.includes("/tag/")) continue;
          const title = m[2].replace(/<[^>]+>/g, "").replace(/&#038;/g, "&").trim();
          const score = scoreAcademicRelevance(title, cleanTopic, cleanSubject);
          if (score > 0 && !rArticles.has(url)) {
            rArticles.set(url, { url, title, score });
          }
        }
      }
    }

    const sortedArticles = Array.from(rArticles.values()).sort((a, b) => b.score - a.score);
    for (const art of sortedArticles.slice(0, 2)) {
      try {
        const artRes = await fetch(art.url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
        if (artRes.ok) {
          const artHtml = await artRes.text();
          const bodyText = artHtml
            .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, "")
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
          const paras = [...bodyText.matchAll(/<(?:p|h[234]|li)[^>]*>([\s\S]*?)<\/(?:p|h[234]|li)>/gi)]
            .map(p => p[1].replace(/<[^>]+>/g, "").replace(/&#038;/g, "&").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').trim())
            .filter(p => p.length > 25 && 
                         !p.includes("minutes read") && 
                         !p.includes("Download") && 
                         !p.includes("Copyright") &&
                         !p.includes("document.querySelector") &&
                         !p.includes("gtm.start"));
          const fullBody = paras.slice(0, 22).join("\n\n");
          if (fullBody.length > 80) {
            findings.ruangguru.push({ title: art.title, url: art.url, snippet: fullBody.slice(0, 3500) });
          }
        }
      } catch {}
    }
  } catch (err) {}

  // 5. 9Router Search (jika search provider aktif)
  try {
    const res9 = await search9Router(`${cleanTopic} ${cleanSubject} silabus SMA kurikulum merdeka`);
    if (res9) {
      findings.web.push(res9);
    }
  } catch (err) {}

  let bundle = "";
  if (findings.ruangguru.length) {
    bundle += "### 🎒 REFERENSI PEDAGOGIS & POLA AJAR RUANGGURU (Kurikulum Sekolah):\n" +
      findings.ruangguru.map((r, i) => `${i + 1}. **${r.title}**: ${r.snippet}`).join("\n\n") + "\n\n";
  }
  if (findings.encyclopedia.length) {
    bundle += "### 📚 KONSEP & DEFINISI ENSIKLOPEDIS RESMI (Wikipedia ID):\n" +
      findings.encyclopedia.slice(0, 4).map((e, i) => `${i + 1}. **${e.title}**: ${e.snippet}`).join("\n\n") + "\n\n";
  }
  if (findings.textbook.length) {
    bundle += "### 📖 MODUL & BUKU TEKS TERBUKA (Wikibuku ID):\n" +
      findings.textbook.slice(0, 2).map((t, i) => `${i + 1}. **${t.title}**: ${t.snippet}`).join("\n\n") + "\n\n";
  }
  if (findings.curriculumLiterature.length) {
    bundle += "### 🎓 LITERATUR KURIKULUM & KAJIAN BUKU AJAR (CrossRef):\n" +
      findings.curriculumLiterature.slice(0, 3).map((c, i) => `${i + 1}. **${c.title}**${c.snippet ? ": " + c.snippet : ""}`).join("\n\n") + "\n\n";
  }
  if (findings.web.length) {
    bundle += "### 🌐 HASIL PENCARIAN WEB RESMI:\n" + findings.web.join("\n\n") + "\n\n";
  }

  return bundle.trim();
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

    // Multimodal AI Vision for handwritten notes, equations, formulas, diagrams, and photos
    async function extractTextFromImageAI(base64Data, mimeType = "image/jpeg") {
      const prompt = `Anda adalah asisten OCR & transkripsi akademik cerdas untuk aplikasi belajar Tanka.
Tugas Anda: Baca dan transkripsikan SELURUH konten pada gambar ini dengan sangat teliti dan akurat.
Gambar ini bisa berupa:
- Tulisan tangan (catatan buku, coretan rumus, ringkasan belajar)
- Teks cetak buku pelajaran, lembar soal, atau modul
- Rumus matematika atau lambang eksak (WAJIB gunakan notasi LaTeX/KaTeX rapi seperti $x^2$, $\\frac{a}{b}$, $\\sqrt{x}$)
- Diagram, bagan alur, atau mindmap (transkripsikan dalam bentuk teks hierarkis/poin berurutan)

Aturan:
1. Jika tulisan tangan agak miring atau sulit dibaca, gunakan konteks kalimat akademik untuk mengenali kata yang paling tepat. Jangan halusinasi.
2. Jika ada soal latihan, transkripsikan pertanyaan beserta semua pilihan gandanya (A, B, C, D, E) jika ada.
3. HANYA berikan teks transkripsi materi yang terbaca. Jangan tambahkan kata pengantar seperti "Berikut adalah hasil transkripsi" atau kalimat penutup.`;

      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`
              }
            }
          ]
        }
      ];

      try {
        const result = await callRouter(messages, "ag/gemini-3.8-flash-low", 0.1);
        return result ? result.trim() : "";
      } catch (err) {
        console.error("AI Vision extraction failed:", err.message);
        return "";
      }
    }

    // Heuristic detector for exam sheets, test questions, or kisi-kisi latihan
    function detectQuestionPatterns(text) {
      if (!text || typeof text !== "string") return false;
      const optionMatches = text.match(/(?:^|\n|\s)[A-Ea-e][\.\)]\s+[^\n]+/g);
      const questionNumberMatches = text.match(/(?:^|\n)\s*(?:\d+[\.\)]|\bSoal\s*\d+|\bNo\.?\s*\d+)/g);
      const hasKeywords = /\b(kisi-kisi|pilihan ganda|pilihlah|berikut ini yang|manakah|latihan soal|ulangan harian|ujian sekolah|try out|pertanyaan berikut)\b/i.test(text);

      if (optionMatches && optionMatches.length >= 3) return true;
      if (questionNumberMatches && questionNumberMatches.length >= 2 && ((optionMatches && optionMatches.length >= 2) || hasKeywords)) return true;
      if (hasKeywords && optionMatches && optionMatches.length >= 2) return true;
      return false;
    }

    // Intelligent Exam Sheet Processor: extracts questions to quizzes & synthesizes theory study guide
    async function processExamQuestionsIfDetected(docId, rawText, title, dbInstance, goal = "", instruction = "") {
      if (!detectQuestionPatterns(rawText)) {
        return { isExamSheet: false };
      }

      console.log(`[Exam Detection] Terdeteksi lembar soal / kisi-kisi pada: "${title}". Mengekstrak butir soal & menyusun teori penguasaan...`);

      try {
        let goalGuidance = "";
        if (goal === "clone") {
          goalGuidance = "\nPERMINTAAN KHUSUS SISWA: Buat 3-5 variasi soal latihan kloning (tipe dan pola sama dengan angka berbeda) agar siswa bisa berlatih mandiri.\n";
        } else if (goal === "solve") {
          goalGuidance = "\nPERMINTAAN KHUSUS SISWA: Berikan kunci jawaban dan langkah pengerjaan tuntas setiap nomor tanpa terlewat.\n";
        } else if (goal === "hots") {
          goalGuidance = "\nPERMINTAAN KHUSUS SISWA: Fokuskan pada variasi soal penalaran tingkat tinggi (HOTS) dan pola jebakan ujian.\n";
        } else if (goal === "summary") {
          goalGuidance = "\nPERMINTAAN KHUSUS SISWA: Rangkum intisari rumus kunci dan tabel ringkas materi tanpa bertele-tele.\n";
        }

        const customClause = instruction ? `\nCATATAN / ARAHAN TAMBAHAN DARI SISWA: "${instruction}"\n` : "";

        const prompt = `Anda adalah asisten kurikulum akademik dan pakar bedah kisi-kisi ujian.
Teks berikut terdeteksi sebagai lembar soal latihan / kisi-kisi ujian.

JUDUL / TOPIK: "${title}"
${goalGuidance}${customClause}
TEKS SUMBER SOAL:
"""
${rawText.slice(0, 16000)}
"""

TUGAS UTAMA (WAJIB DUA HAL DALAM FORMAT JSON):
1. "questions": Ekstrak SEMUA butir pertanyaan pilihan ganda atau latihan yang ada di dokumen. Untuk setiap butir soal:
   - "id": integer urut (1, 2, 3...)
   - "question": Teks pertanyaan lengkap (sertakan rumus LaTeX/KaTeX jika ada, misalnya $x^2$, $\\frac{a}{b}$).
   - "options": Array 4-5 opsi pilihan jawaban ["A. ...", "B. ...", "C. ...", "D. ..."]. Jika di dokumen berupa essay/isian tanpa pilihan, formulasikan 4 pilihan ganda logis yang menguji konsep tersebut.
   - "correctIndex": Indeks integer jawaban yang benar (0=A, 1=B, 2=C, 3=D). Gunakan kunci jawaban dokumen jika tersedia, atau tentukan jawaban paling akurat secara akademis.
   - "explanation": Langkah pembahasan bertahap dan konsep ilmiah di balik jawaban benar.
   - "formula": Rumus atau kaidah kunci.
   - "pitfall": Jebakan umum yang sering mengecoh siswa pada soal ini.

2. "studyGuide": Susun PANDUAN MATERI BELAJAR & TEORI PENGUASAAN KISI-KISI yang komprehensif berdasarkan soal-soal di atas.
   PENTING: Jangan hanya mengulang soal! Buatkan materi catatan belajar terstruktur agar siswa memahami teori dan rumus di balik soal-soal tersebut:
   - # Panduan Belajar & Teori Kisi-Kisi: ${title}
   - ## 1. Peta Materi & Teori Dasar (Menjelaskan latar belakang topik yang diujikan secara runut)
   - ## 2. Bedah Konsep & Formula Kunci (Rumus KaTeX dan cara menerapkannya)
   - ## 3. Pola Analisis Soal & Trik Cepat (Cara berpikir sistematis membedah tipe soal ini)
   - ## 4. Jebakan Umum & Poin Wajib Ingat (Catatan ringkas untuk menghadapi ujian)

KEMBALIKAN HANYA FORMAT JSON VALID:
{
  "questions": [
    {
      "id": 1,
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctIndex": 0,
      "explanation": "...",
      "formula": "...",
      "pitfall": "..."
    }
  ],
  "studyGuide": "# Panduan Belajar..."
}`;

        const rawResponse = await callRouter([{ role: "user", content: prompt }], "ag/gemini-3.8-flash-low", 0.2);
        if (!rawResponse) return { isExamSheet: false };

        let cleanJson = rawResponse.trim();
        if (cleanJson.startsWith("```json")) cleanJson = cleanJson.slice(7);
        if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3);
        if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);

        const parsed = JSON.parse(cleanJson.trim());
        const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
        const studyGuide = typeof parsed.studyGuide === "string" ? parsed.studyGuide : "";

        if (questions.length > 0) {
          const quizId = "quiz_exam_" + Date.now();
          dbInstance.prepare("INSERT INTO quizzes (id, doc_id, questions, created_at) VALUES (?, ?, ?, ?)").run(
            quizId,
            docId,
            JSON.stringify(questions),
            Date.now()
          );
          console.log(`[Exam Detection] Sukses menyimpan ${questions.length} butir soal ke tabel quizzes.`);
        }

        if (studyGuide) {
          const enrichedContent = `${studyGuide}\n\n---\n\n### 📋 Soal Latihan Terdeteksi dari Dokumen Asli\nButir-butir soal ini telah otomatis dimasukkan ke menu **Latihan Soal** agar siap Anda kerjakan secara interaktif.\n\n${rawText.slice(0, 5000)}`;

          dbInstance.prepare("UPDATE documents SET content = ? WHERE id = ?").run(enrichedContent, docId);
          console.log(`[Exam Detection] Sukses memperbarui dokumen dengan materi teori kisi-kisi.`);
          return {
            isExamSheet: true,
            questionCount: questions.length,
            newContent: enrichedContent,
            questions
          };
        }

        return {
          isExamSheet: questions.length > 0,
          questionCount: questions.length,
          questions
        };
      } catch (err) {
        console.error("[Exam Detection Error]:", err.message);
        return { isExamSheet: false };
      }
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
        let text = "";
        const isImage = [".png", ".jpg", ".jpeg", ".webp", ".bmp"].includes(ext);

        if (isImage) {
          const mimeMap = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".bmp": "image/bmp"
          };
          const mimeType = mimeMap[ext] || "image/jpeg";
          try {
            console.log(`[Upload] Menjalankan AI Vision Multimodal OCR untuk gambar: ${f.fileName}...`);
            text = await extractTextFromImageAI(f.fileData, mimeType);
          } catch (aiErr) {
            console.warn("AI vision extraction failed, fallback to script:", aiErr.message);
          }
        }

        // If not image or AI vision returned empty, fallback to local extract_text.py
        if (!text) {
          const tmpFilePath = path.join(scratchDir, `upload_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`);
          try {
            fs.writeFileSync(tmpFilePath, Buffer.from(f.fileData, "base64"));
            text = execFileSync(scriptPath, [tmpFilePath], {
              encoding: "utf8",
              maxBuffer: 25 * 1024 * 1024
            }).trim();
          } catch (err) {
            console.error(`Gagal ekstrak ${f.fileName}:`, err.message);
          } finally {
            if (fs.existsSync(tmpFilePath)) {
              try { fs.unlinkSync(tmpFilePath); } catch {}
            }
          }
        }

        if (text && !text.startsWith("[Error OCR Gambar:")) {
          extractedParts.push({ name: f.fileName, text });
          fileNames.push(path.basename(f.fileName, ext).replace(/[_-]/g, " ").trim());
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

      const rawTitle = (body.title && body.title.trim()) || fileNames.join(" & ") || "Modul Materi";
      const cleanTitle = (body.title && body.title.trim()) || await detectDocumentTitle(mergedText, rawTitle);
      const id = "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const createdAt = Date.now();
      const insert = db.prepare("INSERT INTO documents (id, title, content, created_at) VALUES (?, ?, ?, ?)");
      insert.run(id, cleanTitle, mergedText, createdAt);

      // Intelligent exam sheet & kisi-kisi question detection
      const examResult = await processExamQuestionsIfDetected(id, mergedText, cleanTitle, db, body.goal, body.instruction);
      let finalContent = examResult.newContent || mergedText;

      // If not an exam sheet but student provided special goals/instructions, synthesize tailored study notes
      if (!examResult.isExamSheet && (body.instruction || (body.goal && body.goal !== "theory"))) {
        try {
          const synthesisPrompt = `Pengguna mengunggah catatan belajar berjudul "${cleanTitle}".
Arahan / Keinginan Khusus Pengguna: "${body.instruction || body.goal}".

Isi Catatan Belajar:
"""
${mergedText.slice(0, 12000)}
"""

Tugas Anda: Susun modul materi terstruktur yang secara langsung menjawab kebutuhan pengguna tersebut:
- Jelaskan konsep yang ditanyakan secara gamblang dan mudah dipahami
- Gunakan rumus KaTeX rapi jika berkaitan dengan matematika/eksak
- Tuliskan langkah penyelesaian konkret step-by-step
Format dalam markdown rapi.`;
          const tailoredNotes = await callRouter([{ role: "user", content: synthesisPrompt }], "ag/gemini-3.8-flash-low", 0.2);
          if (tailoredNotes) {
            finalContent = `${tailoredNotes.trim()}\n\n---\n\n### 📄 Catatan Asli dari Berkas\n\n${mergedText}`;
            db.prepare("UPDATE documents SET content = ? WHERE id = ?").run(finalContent, id);
          }
        } catch (e) {
          console.warn("[tanka] Tailored notes synthesis error:", e.message);
        }
      }

      return sendJSON(res, {
        success: true,
        id,
        title: cleanTitle,
        content: finalContent,
        fileCount: extractedParts.length,
        wordCount: finalContent.split(/\s+/).length,
        created_at: createdAt,
        isExamSheet: examResult.isExamSheet || false,
        questionCount: examResult.questionCount || 0,
        detectedQuestions: examResult.questions || []
      });
    }

    // 2.c POST /api/documents/:id/enrich - enrich document content with comprehensive web knowledge / additional references
    if (req.method === "POST" && pathname.match(/^\/api\/documents\/([^/]+)\/enrich$/)) {
      const docId = pathname.split("/")[3];
      const { focusTopic, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (!doc) return sendJSON(res, { error: "Dokumen tidak ditemukan" }, 404);

      let webFindings = await multiSourceAcademicSearch(doc.title, focusTopic);
      let webContext = "";
      if (webFindings) {
        webContext = `\nHASIL PENELUSURAN REFERENSI AKADEMIK & KURIKULUM MULTI-SUMBER:\n${webFindings}\n\n`;
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

    // 2.d POST /api/documents/enrich-suggestions - smart AI recommendations based on document context
    if (req.method === "POST" && pathname === "/api/documents/enrich-suggestions") {
      const body = await getBody(req);
      const { title, content } = body;
      if (!content || !content.trim()) {
        return sendJSON(res, { suggestions: [] });
      }

      const prompt = `Anda adalah konsultan kurikulum & pedagogi cerdas Tanka.
Tugas Anda: Baca materi belajar berikut dan berikan TEPAT 4 rekomendasi fokus pengayaan materi bernilai tinggi yang paling dibutuhkan oleh materi ini agar siswa menguasai konsep secara utuh tanpa kebingungan.

Judul Modul: "${title || "Materi Belajar"}"
Kutipan materi saat ini:
"""
${content.slice(0, 3000)}
"""

Format keluaran WAJIB berupa JSON array valid MURNI tanpa markdown wrapping (tanpa \`\`\`json):
[
  {
    "title": "Nama Fokus (Maks 3-4 kata)",
    "focus": "Instruksi pencarian pengayaan spesifik untuk memperdalam materi ini",
    "reason": "Mengapa materi ini butuh tambahan ini (1 kalimat pendek)"
  }
]

Saran harus adaptif:
- Jika materi eksak/rumus: tawarkan pembuktian intuitif, variasi soal jebakan, atau batasan legal aturan.
- Jika materi humaniora/sosial: tawarkan studi kasus konkret Indonesia terkini, komparasi pemikiran tokoh, atau dampak sosial.
- Jika materi hafalan: tawarkan jembatan keledai murni atau analogi sehari-hari bebas jargon.`;

      try {
        const aiResponse = await callRouter([{ role: "user", content: prompt }], "ag/gemini-3.8-flash-low", 0.3);
        const cleanJson = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        const suggestions = JSON.parse(cleanJson);
        return sendJSON(res, { suggestions });
      } catch (err) {
        console.error("Gagal generate enrich suggestions:", err.message);
        return sendJSON(res, {
          suggestions: [
            {
              title: "Studi Kasus Konkret",
              focus: "Berikan contoh kasus nyata terkini di Indonesia beserta analisis penerapannya",
              reason: "Menghubungkan teori ke fenomena nyata agar tidak sekadar hafalan"
            },
            {
              title: "Miskonsepsi Umum Ujian",
              focus: "Jelaskan jebakan soal atau miskonsepsi yang sering mengecoh siswa pada materi ini",
              reason: "Melatih kepekaan terhadap pola soal ujian sekolah dan UTBK"
            },
            {
              title: "Analogi Bebas Jargon",
              focus: "Gambarkan konsep inti dengan analogi sederhana sehari-hari",
              reason: "Mempermudah pemahaman intuitif bagi pemula"
            },
            {
              title: "Trik Cepat & Rumus Kunci",
              focus: "Rangkum kaidah esensial, jembatan keledai, atau batasan legal aturan",
              reason: "Meringkas hafalan ke format padat dan mudah diingat"
            }
          ]
        });
      }
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

      // Intelligent exam sheet & kisi-kisi question detection
      const examResult = await processExamQuestionsIfDetected(id, content.trim(), finalTitle, db);
      const finalContent = examResult.newContent || content.trim();

      return sendJSON(res, {
        success: true,
        id,
        title: finalTitle,
        content: finalContent,
        created_at: createdAt,
        isExamSheet: examResult.isExamSheet || false,
        questionCount: examResult.questionCount || 0,
        detectedQuestions: examResult.questions || []
      });
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
        db.prepare("DELETE FROM mistake_notebook WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM quizzes WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM chat_messages WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM formula_cheatsheets WHERE doc_id = ?").run(docId);
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

ATURAN STRUKTUR KARTU (PRINSIP ATOMIK SUPERMEMO / ANKI):
1. PRINSIP 1 KARTU = 1 FAKTA ATOMIK TUNGGAL (DILARANG KARTU KOMBO 'DAN ... DAN ...'):
   - DILARANG KERAS menggabungkan dua topik atau daftar panjang dalam satu kartu (misal: 'Definisi X dan 4 fungsinya' -> SALAH BESAR).
   - JIKA SATU TOPIK MEMILIKI BEBERAPA CABANG/POIN, WAJIB DIPISAH MENJADI BEBERAPA KARTU ATOMIK:
     * Kartu 1: Menanyakan definisi dasar tunggal konsep.
     * Kartu 2: Menyebutkan daftar poin/cabang secara ringkas.
     * Kartu 3: Membedah arti spesifik dari salah satu poin kunci tersebut.
     * Kartu 4: Menanyakan contoh konkret / aplikasi dari konsep tersebut.
   - Setiap kartu harus bisa dijawab dalam 3–5 detik di kepala tanpa beban menghafal paragraf tebal!
2. DISTRIBUSI SEIMBANG DARI AWAL HINGGA AKHIR MATERI (MUTLAK):
   - Kartu 1–4: FONDASI & DEFINISI DASAR di bab pembuka dokumen sumber. DILARANG LANGSUNG LOMPAT ke materi akhir.
   - Kartu 5–8: Perkembangan konsep, konteks, aturan/sifat di bab tengah.
   - Kartu 9–dst: Tokoh kunci, teknik khusus, dan pembeda konsep di bab akhir.
3. SISI DEPAN (Front) - Pertanyaan Spesifik & Langsung ke Sasaran (3-10 kata):
   - Gunakan pertanyaan langsung ke objek materi: "Apa definisi dari [Konsep]?", "Apa syarat berlakunya [Aturan]?", "Siapa pencetus teori [Konsep]?", "Apa ciri khas utama dari [Kategori]?"
   - DILARANG membuat kartu depan hanya 1 kata ambigu.
4. SISI BELAKANG (Back) - Jawaban Padat, Konkret & Manusiawi (1-2 kalimat):
   - Bebas jargon robotik palsu. Langsung ke inti poin kunci.
   - Jika materi kuantitatif/eksak, gunakan LaTeX ($...$) untuk simbol dan rumus.

Format output WAJIB HANYA berupa array JSON murni tanpa markdown codeblock formatting atau teks pengantar:
[
  {"front": "Pertanyaan stimulus atomik tunggal", "back": "Jawaban ringkas 1-2 kalimat konkret atau nilai rumus"}
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
      if (style === "tutor") {
        styleGuidance = `GAYA PENULISAN: TUTOR ADAPTIF & LATIHAN MANDIRI (CREATIVE SCAFFOLDING)
- PRINSIP: Jelaskan persis seperti seorang mentor sebaya yang asyik, tajam, fleksibel, dan adaptif terhadap karakter materi. Bimbing siswa agar punya intuisi kuat dan mandiri menyelesaikan soal.
- PENDEKATAN PEMBUKA: Masuk langsung secara organik ke persoalan nyata atau rasa penasaran di balik topik ini tanpa kalimat template kaku.
- FLEKSIBILITAS PEDAGOGIS (ADAPTASI SESUAI KARAKTER MAPEL):
  * Eksak / Matematika / Fisika: Berikan intuisi konsep terlebih dahulu -> contoh pengerjaan angka kecil konkret langkah demi langkah -> soroti kondisi batas / syarat legal rumus -> intisari mental model.
  * Sosial / Sosiologi / Sejarah: Bedah dialektika & perdebatan pemikir -> studi kasus nyata masyarakat (khususnya konteks Indonesia atau isu kontemporer) -> tabel/bagan komparasi sudut pandang -> trik eliminasi jebakan ujian.
  * Ekonomi / Bisnis: Jelaskan mekanisme insentif & sebab-akibat (aksi -> reaksi pasar) -> skenario nyata kebijakan riil -> komparasi instrumen -> intisari pengambilan keputusan.
  * Bahasa / Sastra / Komunikasi: Contoh teks atau kalimat riil -> dekonstruksi kaidah atau fungsi retorika -> kontras bentuk baku vs non-baku -> trik analisis cepat.
- KREATIF & ALAMI: Gunakan analogi konkret yang memicu 'Aha! moment'. Hindari diktat kaku.
- CARA MENGINGAT / INTUISI KUNCI: Berikan rangkuman ringkas padat di setiap segmen penting.
- SEKSI PENUTUP: "INTISARI KUNCI (MENTAL MODEL)" berisi 3–4 kaidah emas untuk merekatkan pemahaman sebelum ujian.
- DILARANG KERAS membuat daftar soal latihan / kuis / pertanyaan PR di dalam catatan (latihan soal sudah memiliki tab interaktif tersendiri di aplikasi).`;
      } else if (style === "memorization") {
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
- Gunakan analogi konkret yang langsung memicu 'Aha! moment' dari kehidupan sehari-hari.
- Pertahankan substansi 100% lengkap dan akurat, hanya ubah cara penyampaiannya agar hidup dan mudah dicerna.`;
      }

      const mathSectionBlock = isMathDomain
        ? `3. **Rumus, Persamaan, & Aturan Pokok**:
   - Tuliskan rumus matematika/fisika yang benar-benar ada dalam materi menggunakan KaTeX LaTeX ($...$ inline atau $$...$$ blok).
   - Wajib sertakan cara membaca rumus dengan bahasa manusia biasa dan contoh angka kecil sederhana agar pembaca langsung paham cara memakainya.`
        : `3. **Kaidah Pokok, Karakteristik Utama, & Klasifikasi**:
   - DILARANG KERAS MENGARANG RUMUS/PERSAMAAN MATEMATIKA PALSU (PSEUDO-MATH) seperti membuat $V = f(X, Y)$ atau persamaan fungsi simbolik buatan untuk materi seni, sejarah, kriya, atau ilmu sosial.
   - Sajikan prinsip inti, kaidah perancangan, tabel perbandingan konsep, atau taksonomi klasifikasi murni konseptual tanpa rumus buatan sama sekali.`;

      const prompt = style === "tutor"
        ? `Anda adalah mentor belajar pribadi yang ramah, taktis, dan fokus pada penguasaan mandiri.
Pelajari materi di bawah dan susun panduan belajar bertahap yang hidup, kreatif, dan adaptif:

${styleGuidance}

STANDAR INTEGRITAS PENGAJARAN (ANTI-LOMPAT & ANTI-JARGON ROBOTIK):
1. FONDASI PEMBUKA WAJIB DIBEDAH PERTAMA KALI:
   - Mulai dari konsep dasar paling awal di dokumen (definisi objek/materi, fungsi utama, karakter dasar).
   - DILARANG LANGSUNG LOMPAT ke aliran modern atau tokoh spesifik tanpa menanamkan fondasi dasarnya.
2. DILARANG MENGGUNAKAN JARGON BIROKRATIK/PALSU:
   - Jelaskan konsep dengan bahasa manusia yang langsung terbayang wujud fisiknya, contoh bendanya, dan pembeda dari teknik lain.
3. KRONOLOGI SEJARAH & RELASI SEBAB-AKIBAT:
   - Sajikan alur waktu atau logika sebab-akibat secara konsisten dan logis.
4. FLEKSIBILITAS ARTEFAK VISUAL & STRUKTUR:
   - Pilih representasi visual yang PALING COCOK untuk materi ini (alur bertahap '->', tabel komparasi, studi kasus nyata, atau perbandingan konsep). Dilarang memaksakan format seragam jika materi tidak membutuhkannya.

Format dengan Markdown rapi, KaTeX LaTeX ($...$ inline atau $$...$$ blok) untuk rumus/angka, dan kotak penekanan untuk trik kunci.

Materi Lengkap:
"""
${doc.content.slice(0, 25000)}
"""`
        : `Anda adalah pakar sintesis materi edukasi yang mampu mengubah materi rumit/kering menjadi modul belajar yang sangat hidup, aplikatif, dan mudah dipahami.
Lakukan AUDIT LENGKAP terhadap seluruh isi dokumen dan susun Catatan Inti & Peta Konsep Komprehensif yang MENCAKUP SELURUH materi tanpa ada bagian penting yang terlewat.

${styleGuidance}

STANDAR INTEGRITAS PENGAJARAN (ANTI-LOMPAT & ANTI-JARGON ROBOTIK):
1. FONDASI PEMBUKA WAJIB DIBEDAH PERTAMA KALI:
   - Mulai dari konsep dasar paling awal di dokumen (definisi objek/materi, fungsi utama, karakter dasar).
   - DILARANG LANGSUNG LOMPAT ke aliran modern atau tokoh spesifik tanpa menanamkan fondasi dasarnya.
2. DILARANG MENGGUNAKAN JARGON BIROKRATIK/PALSU:
   - Jelaskan konsep dengan bahasa manusia yang langsung terbayang wujud fisiknya, contoh bendanya, dan pembeda dari teknik lain.
3. KRONOLOGI SEJARAH & RELASI SEBAB-AKIBAT:
   - Sajikan urutan waktu secara konsisten dan logis.

STRUKTUR SISTEMATIS CATATAN (ADAPTIF & KREATIF):
1. **Peta Konsep & Kerangka Besar**:
   - Pilih representasi visual yang PALING COCOK dan organik untuk topik ini:
     * Jika ada alur proses/siklus/tahapan bertingkat -> gunakan alur panah '->' atau tahapan langkah.
     * Jika ada perbandingan dua konsep atau mazhab pemikiran -> sajikan tabel komparasi kontras.
     * Jika materi berupa hierarki atau pembagian kategori -> buat pengelompokan bertingkat.
     * Jika materi berupa definisi mandiri -> rangkai 2-3 poin pengelompokan logis tanpa memaksakan gambar garis.
   - 2 kalimat pembuka: Masalah nyata apa yang dijawab oleh materi ini.
2. **Bedah Konsep Kunci & Analogi Nyata**:
   - Setiap istilah/konsep tidak hanya didefinisikan secara formal, tapi WAJIB dilengkapi minimal 1 analogi konkret atau contoh kasus nyata.
${mathSectionBlock}
4. **Pola Kritis & Analisis Jebakan (Common Pitfalls)**:
   - Miskonsepsi yang paling sering membuat siswa salah kaprah saat ujian/praktek, lengkap dengan trik membedakannya.
5. **Rangkuman Eksekutif & Kaidah Kunci (Mental Model)**:
   - 3-4 intisari mutlak dan prinsip kunci untuk merekatkan materi di kepala.
   - DILARANG menyertakan daftar soal latihan / kuis / pertanyaan PR di dalam catatan (latihan soal sudah memiliki tab interaktif tersendiri di aplikasi).

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

      const systemPrompt = `Anda adalah Nara, tutor belajar AI yang ramah, cerdas, adaptif, dan suportif.
Tugas Anda: Menjelaskan konsep secara to-the-point, interaktif, dan mudah dipahami.
Jika pengguna mengirimkan jawaban latihan mandiri (seperti Soal 1–5 dari modul tutor), koreksi jawaban mereka SATU PER SATU secara teliti dan bersahabat:
- Tunjukkan nomor mana yang sudah 100% tepat.
- Jika ada nomor yang keliru, tunjukkan di mana letak melesetnya dan beri petunjuk cara berpikirnya tanpa memarahi.
- Berikan skor/apresiasi, lalu tawarkan materi lanjutan ("Mau kita lanjut ke transpose dan determinan sekarang?").
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
      const parsedCount = parseInt(count, 10);
      const finalCount = Number.isFinite(parsedCount) ? Math.max(1, Math.min(30, parsedCount)) : 5;
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

      const isMathDomain = detectRealMath(doc.content);

      let typeGuidance = "";
      if (isMathDomain) {
        if (quizType === "beginner") {
          typeGuidance = `TIPE KUIS: EKSAK / KUANTITATIF - PEMULA & FONDASI BERTAHAP
- PRINSIP: Mulai dari angka kecil konkret dan pembacaan notasi dasar, bukan rumus abstrak yang menakutkan pemula.
- URUTAN TANGGA KESULITAN (DARI MUDAH KE MENENGAH):
  * Soal 1 (Pemanasan Fondasi): Identifikasi variabel/elemen, membaca grafik/tabel, atau pemahaman dimensi/ordo dari besaran materi terkait.
  * Soal 2–3 (Operasi Tunggal Sederhana): Satu langkah pengerjaan dasar (substitusi langsung nilai angka kecil, atau verifikasi syarat legal operasi).
  * Soal 4–5 (Operasi Terarah Bertahap): Operasi 2 tahap pengerjaan (penyederhanaan, eliminasi bertahap, atau penerapan rumus inti).
- OPSI JAWABAN (A, B, C, D, E): WAJIB berupa angka bulat, nilai pecahan sederhana, atau notasi variabel yang ringkas dan to-the-point. Dilarang cerita panjang!
- PEMBAHASAN STEPPER: Langkah 1 identifikasi apa yang diketahui -> Langkah 2 tuliskan proses hitung eksplisit baris per baris -> Langkah 3 simpulan hasil.`;
        } else if (quizType === "conceptual") {
          typeGuidance = `TIPE KUIS: EKSAK / KUANTITATIF - STANDAR UJIAN SEKOLAH
- Uji sifat-sifat matematis, pemecahan persamaan standar, hubungan antar-variabel, dan penerapan aturan baku materi.
- Soal to-the-point dengan angka bulat rapi. Pembahasan menjabarkan langkah hitung tuntas.`;
        } else {
          typeGuidance = `TIPE KUIS: EKSAK / KUANTITATIF - HOTS & SELEKSI TINGGI
- Penalaran tingkat tinggi: penggabungan multi-aturan, pemecahan parameter variabel tak diketahui, atau pembuktian sifat non-rutin.`;
        }
      } else {
        if (quizType === "beginner") {
          typeGuidance = `TIPE KUIS: KONSEPTUAL / ILMU SOSIAL / TEORI - PEMULA & ULANGAN HARIAN
- PRINSIP: Guru kelas menyusun soal langsung dari poin-poin yang tertera di dokumen/silabus sumber. DILARANG mengarang cerita fiktif di luar konteks materi.
- POLA VARIASI SOAL UJIAN (IKUTI URUTAN MATERI DARI BAB PEMBUKA KE BAB AKHIR):
  * Soal 1 (Definisi Harfiah Bab Awal): Tanyakan definisi dasar konsep atau istilah pokok paling awal dari materi sumber.
  * Soal 2 (Pengecualian / Klasifikasi): Uji daftar fungsi, karakter, atau jenis ("Berikut ini yang BUKAN merupakan...").
  * Soal 3 (Tokoh / Periode / Peristiwa / Latar Belakang): Tanyakan tokoh penggagas, periode era, atau latar belakang yang tertulis di materi.
  * Soal 4–5 (Kaidah Pembeda & Komparasi Langsung): Tanyakan perbandingan dua konsep/aliran/prinsip yang tertulis jelas di materi agar siswa tidak tertukar.
- OPSI JAWABAN (A, B, C, D, E): WAJIB SINGKAT, PADAT, DAN LANGSUNG KE INTI (istilah, nama tokoh, frasa pendek, atau klasifikasi). DILARANG opsi berupa paragraf panjang.`;
        } else if (quizType === "conceptual") {
          typeGuidance = `TIPE KUIS: KONSEPTUAL / ILMU SOSIAL / TEORI - STANDAR UJIAN SEMESTER
- Uji penguasaan konsep menyeluruh: hubungan sebab-akibat, perbandingan antar-kategori, dan analisis pembeda istilah yang sering tertukar di ujian.`;
        } else {
          typeGuidance = `TIPE KUIS: KONSEPTUAL / ILMU SOSIAL / TEORI - ANALISIS MENDALAM (HOTS)
- Analisis kritis antar-teori, evaluasi studi kasus kontekstual, dan keterkaitan multi-variabel fenomena materi.`;
        }
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

STANDAR KUALITAS SOAL (ANTI-SLOP & RAMAH SISWA):
1. SEBARAN TOPIK PROPORSIONAL DARI BAB AWAL HINGGA AKHIR:
   - Soal 1 (Level Fondasi): WAJIB diambil dari BAB AWAL materi (definisi dasar objek/materi, fungsi utama, karakter awal, atau premis dasar). Siswa pemula yang baru membaca halaman pembuka harus bisa memahaminya.
   - Soal 2–3 (Level Perkembangan & Konteks): Diambil dari BAB TENGAH materi (konteks sejarah, ciri khas era, perbandingan konsep atau operasi bertahap).
   - Soal 4–5 (Level Lanjutan & Penerapan): Diambil dari BAB AKHIR materi (tokoh kunci, teknik khusus, atau analisis pembeda).
   - DILARANG KERAS memusatkan seluruh butir soal hanya pada istilah-istilah di slide/halaman terakhir!
2. BAHASA PERTANYAAN WAJIB LANGSUNG KE SASARAN OBJEKTIF (TO-THE-POINT & ALAMI):
   - Gunakan kalimat tanya ujian baku modern yang ringkas, hindari basa-basi atau frasa kaku yang berbelit-belit.
   - Contoh Matematika:
     * TEPAT: "Jika $2x + 3 = 11$, maka nilai $x = \\dots$" atau "Nilai $x$ dari persamaan $2x + 3 = 11$ adalah..."
     * SALAH / KAKU: "Jika $2x + 3 = 11$, berapa nilai $x$ yang memenuhi persamaan?"
   - Contoh Teori / Kualitatif:
     * TEPAT: "Tokoh pelopor gerakan Arts and Crafts di Inggris adalah..."
     * SALAH / KAKU: "Berdasarkan tinjauan materi di atas, siapakah tokoh yang memelopori..."
3. ATURAN PENGISIAN FIELD "formula" PADA SOAL (MUTLAK):
   - Field "formula" pada soal HANYA diisi jika ada matriks besar atau ekspresi matematika khusus yang menjadi fokus stimulus visual (contoh: "$$\\begin{bmatrix} 2 & 1 \\\\ 4 & 5 \\end{bmatrix}$$").
   - JIKA SOAL SUDAH BERUPA KALIMAT BIASA (seperti "Jika $2x + 3 = 11$, maka $x = \\dots$"), MAKA FIELD "formula" WAJIB KOSONGKAN: "".
   - DILARANG KERAS menaruh rumus solusi umum (misal: $ax + b = c \\implies x = \\frac{c - b}{a}$) di field "formula" soal karena akan memunculkan kotak rumus yang membocorkan langkah dan mengganggu fokus siswa. Rumus pengerjaan HANYA berada di "steps" dan "explanation"!
4. OPSI PILIHAN JAWABAN (A, B, C, D, E):
   - Buat opsi yang RINGKAS, PADAT, dan TIDAK MEMBINGUNGKAN (siswa harus bisa membaca seluruh opsi dalam hitungan detik).
   - 4 pilihan salah HARUS berasal dari kesalahan hitung wajar atau miskonsepsi nyata, bukan kalimat membingungkan.
5. KUNCI JAWABAN & SINKRONISASI INDEKS (MUTLAK):
   - correctIndex: 0 = Pilihan A
   - correctIndex: 1 = Pilihan B
   - correctIndex: 2 = Pilihan C
   - correctIndex: 3 = Pilihan D
   - correctIndex: 4 = Pilihan E
   - Kunci jawaban WAJIB terdistribusi secara acak merata di antara opsi A, B, C, D, dan E.
   - Pada teks "desc" langkah pembahasan dan "explanation", HURUF YANG DISEBUT WAJIB SINKRON 100% dengan correctIndex.
6. KUALITAS PEMBAHASAN STEP-BY-STEP:
   - Setiap "desc" dalam "steps" terdiri dari 2-3 kalimat penjelasan runut yang membimbing pemula.
   - Langkah 1: Bedah apa yang diketahui dan konsep dasar yang dipakai.
   - Langkah 2: Tunjukkan proses pengerjaan eksplisit mengapa opsi benar terpilih.
   - Langkah 3: Simpulan jelas yang memantapkan pemahaman.

${weaknessContext}
${mathRule}

Format output WAJIB HANYA berupa array JSON valid tanpa markdown fence atau teks tambahan:
[
  {
    "id": 1,
    "question": "Jika $2x + 3 = 11$, maka nilai $x = \\dots$",
    "options": ["3", "4", "7", "8", "14"],
    "correctIndex": 1,
    "formula": "",
    "steps": [
      {"step": 1, "title": "Identifikasi Masalah & Bentuk Persamaan", "desc": "Persamaan yang diberikan adalah $2x + 3 = 11$. Tujuannya adalah mengisolasi variabel $x$ pada satu ruas."},
      {"step": 2, "title": "Operasi Aljabar Eliminasi", "desc": "Kurangkan kedua ruas dengan 3: $2x = 11 - 3 = 8$. Kemudian bagi kedua ruas dengan 2: $x = \\frac{8}{2} = 4$."},
      {"step": 3, "title": "Kesimpulan & Pengujian", "desc": "Diperoleh $x = 4$. Pengujian: $2(4) + 3 = 8 + 3 = 11$ (terbukti benar). Pilihan yang tepat adalah B."}
    ],
    "explanation": "Nilai $x$ dari persamaan $2x + 3 = 11$ adalah 4 (Pilihan B).",
    "pitfall": "Jebakan umum: Siswa sering lupa mengurangkan 3 sebelum membagi, atau salah menghitung $11 - 3$."
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
      const letters = ["A", "B", "C", "D", "E"];
      questions.forEach((q) => {
        if (Array.isArray(q.options) && q.options.length >= 2) {
          const oldCorrectIdx = typeof q.correctIndex === "number" && q.correctIndex >= 0 ? q.correctIndex : 0;
          const originalCorrect = q.options[oldCorrectIdx];
          const oldLetter = letters[oldCorrectIdx] || "A";

          for (let i = q.options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
          }
          q.correctIndex = q.options.indexOf(originalCorrect);
          const newLetter = letters[q.correctIndex] || "A";

          // Dynamically synchronize letter references in explanation and steps
          if (q.explanation) {
            q.explanation = q.explanation
              .replace(new RegExp(`(Pilihan|Opsi)\\s+${oldLetter}\\b`, "gi"), `$1 ${newLetter}`)
              .replace(/(Pilihan|Opsi)\s+[A-E]\s+(benar|tepat)/gi, `$1 ${newLetter} $2`);
          }

          if (Array.isArray(q.steps)) {
            q.steps = q.steps.map((s) => {
              let desc = s.desc || "";
              desc = desc
                .replace(new RegExp(`(pilihan|opsi)\\s+${oldLetter}\\b`, "gi"), `$1 ${newLetter}`)
                .replace(/(pilihan|opsi)\s+[A-E]\s+(benar|tepat)/gi, `$1 ${newLetter} $2`);
              return { ...s, desc };
            });
          }
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
      const urlObj = new URL(req.url, "http://localhost");
      const docId = urlObj.searchParams.get("docId");
      let query = "SELECT * FROM mistake_notebook WHERE resolved = 0";
      const params = [];
      if (docId) {
        query += " AND doc_id = ?";
        params.push(docId);
      }
      query += " ORDER BY updated_at DESC";
      const rows = db.prepare(query).all(...params);
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

    // 12.b Clear all mistakes or clear mistakes by docId
    if ((req.method === "POST" && pathname === "/api/mistakes/clear") || (req.method === "DELETE" && pathname === "/api/mistakes")) {
      const urlObj = new URL(req.url, "http://localhost");
      const docId = urlObj.searchParams.get("docId");
      if (docId) {
        db.prepare("DELETE FROM mistake_notebook WHERE doc_id = ?").run(docId);
      } else {
        db.prepare("DELETE FROM mistake_notebook").run();
      }
      return sendJSON(res, { success: true });
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

      const prompt = `Pengguna ingin mempelajari topik/sub-topik berikut:
"${topic.trim()}"

Tugas Anda:
1. Identifikasi bidang ilmu yang relevan (misal: Matematika, Ekonomi, Sosiologi, Fisika, Biologi, Sejarah, dll).
2. Tentukan judul topik formal akademik ("formalTitle") YANG DISIPLIN & MENGIKUTI RUANG LINGKUP (SCOPE) PERMINTAAN:
   - DILARANG memperlebar judul menjadi bab induk raksasa jika pengguna meminta sub-topik spesifik!
   - Contoh BENAR: Jika input "faktor pendorong perubahan sosial", judul formal adalah "Faktor Pendorong dan Penghambat Perubahan Sosial", BUKAN "Sosiologi: Teori Perubahan Sosial Lengkap".
   - Contoh BENAR: Jika input "aturan rantai turunan", judul formal adalah "Kalkulus: Aturan Rantai Diferensial Fungsi Komposisi", BUKAN "Kalkulus Diferensial Integral Lengkap".
3. Buat 2 atau 3 pertanyaan diagnostik interaktif singkat terfokus pada sub-topik tersebut untuk memastikan materi yang disusun tepat sasaran sesuai kebutuhan pengguna. Tiap pertanyaan memiliki 3 atau 4 pilihan opsi ringkas.

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

      // Search multi-source academic & curriculum sources (Wikipedia, Wikibuku, CrossRef Educational Research)
      let webContext = "";
      try {
        const webRes = await multiSourceAcademicSearch(formalTitle || topic, subject);
        if (webRes) {
          webContext = `\nHASIL PENELUSURAN REFERENSI KURIKULUM & SUMBER INTERNET MULTI-SUMBER:\n${webRes}\n\n`;
        }
      } catch (err) {
        console.error("Multi-source academic search for topic generate failed:", err);
      }

      const prompt = `Anda adalah pendidik ahli spesialis kurikulum nasional (Kurikulum Merdeka / SMA / UTBK) dan penyusunan modul ajar berstandar tinggi.
Pengguna ingin mempelajari materi dari topik spesifik: "${topic}"
Judul Formal Modul: "${formalTitle || topic}"
Bidang / Mata Pelajaran: "${subject || "Umum"}"
Preferensi / Kebutuhan Pembelajar:
${Object.entries(answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}
${webContext}
TUGAS UTAMA:
Susun dokumen materi ajar belajar mandiri yang MENDALAM, TAJAM, TERFOKUS 100% PADA SUB-TOPIK YANG DIMINTA, dan SESUAI KURIKULUM RESMI INDONESIA.

PRINSIP KUNCI RUANG LINGKUP (STRICT SCOPE LOCK — ANTI-SCOPE-CREEP):
1. FOKUS 100% PADA SUB-TOPIK YANG DIMINTA!
   - DILARANG KERAS memperluas materi menjadi rangkuman bab induk raksasa yang membuang ruang.
   - Jangan memasukkan materi sub-bab lain yang tidak ditanyakan (misal jika ditanya "Faktor Pendorong", JANGAN jelaskan definisi bab besar dari 4 tokoh sosiologi, jangan bahas bentuk perubahan lambat/cepat, jangan bahas discovery/invention/innovation).
   - Berikan pengantar hanya 1-2 kalimat untuk menyambungkan posisi materi ke konteks besarnya, lalu LANGSUNG masuk ke substansi sub-topik yang diminta.
2. PASANGAN DIKOTOMI & LAWAN TANDING KONSEP UJIAN (PENTING):
   - Soal ujian sekolah / UTBK hampir selalu menguji konsep faktor/proses dalam format perbandingan dengan lawannya:
     * Jika materi FAKTOR PENDORONG: WAJIB bahas tuntas klasifikasi Faktor Pendorong (Internal & Eksternal) DAN sandingkan dengan FAKTOR PENGHAMBAT (vested interest, adat kolot, isolasi geografis, prasangka budaya luar).
     * Jika materi PROSES EKSOGEN/ENDOGEN: Perjelas garis batas kapan suatu peristiwa terhitung internal vs eksternal.
3. KELENGKAPAN TAKSONOMI KURIKULUM RESMI (BUKU TEKS & RUANGGURU):
   - Uraikan butir-butir resmi yang biasa diujikan di sekolah secara lengkap (misal 8 faktor pendorong sosiologis resmi), jangan hanya menyebut 2-3 poin sambil mengarang analogi panjang.
   - Setiap butir wajib disertai CONTOH KASUS NYATA di Indonesia yang konkret dan mudah dibayangkan siswa.
4. GROUNDED KE REFERENSI PENCARIAN (RUANGGURU, WIKIPEDIA, WIKIBUKU):
   - Jika bagian "HASIL PENELUSURAN REFERENSI KURIKULUM & SUMBER INTERNET MULTI-SUMBER" tersedia di atas:
     * WAJIB jadikan data tersebut sebagai patokan fakta, silabus resmi, nama tokoh, dan taksonomi utama.
     * Serap pola ajar ramah siswa dan analogi konkret dari Ruangguru serta definisi baku dari Wikipedia.
     * DILARANG mengarang bebas nama klasifikasi atau teori yang bertentangan dengan materi kurikulum yang ditemukan.

STANDAR TERMINOLOGI & PENDIDIKAN INDONESIA (MUTLAK):
1. GUNAKAN TERMINOLOGI RESMI BUKU TEKS & KURIKULUM:
   - Jika bidang EKONOMI (misal Perdagangan Internasional/Keunggulan Komparatif David Ricardo):
     * Gunakan istilah resmi: "Tabel Produksi 2 Negara x 2 Komoditas" atau "Tabel Keunggulan Komparatif", BUKAN "matriks 2x2"! Istilah matriks hanya untuk aljabar linier matematika.
     * Jelaskan konsep Dasar Tukar Dalam Negeri (DTD), Biaya Peluang (Opportunity Cost), dan Terms of Trade (ToT).
   - Jika bidang MATEMATIKA / FISIKA / KIMIA:
     * Gunakan notasi baku dan KaTeX ($...$ inline atau $$...$$ blok).
   - Jika bidang SOSIOLOGI / SEJARAH / SENI:
     * Gunakan peristilahan ilmiah baku tanpa rumus semu (pseudo-math).

STRUKTUR ISI MODUL:
1. **Peta Konsep & Inti Sub-Topik**:
   - 1-2 kalimat pengantar posisi materi, diikuti bagan taksonomi ringkas sub-topik (faktor pendorong vs penghambat, atau syarat vs konsekuensi).
2. **Bedah Mendalam Butir-Butir Materi Baku**:
   - Uraikan setiap butir klasifikasi kurikulum secara sistematis, lengkap dengan penjelasan logis dan contoh kasus riil.
3. **Komparasi Lawan Tanding / Garis Batas Kritis**:
   - Tabel perbandingan komparatif (misal Faktor Pendorong vs Faktor Penghambat, atau Syarat A vs Syarat B) agar siswa tidak tertukar di ujian.
4. **Pola Soal Ujian & Jebakan Konseptual (Common Pitfalls)**:
   - 3-4 jebakan khas yang paling sering mengecoh siswa di ujian sekolah / UTBK terkait sub-topik ini.
5. **Studi Kasus Kontekstual & Bedah Solusi Nyata**:
   - Sajikan 1 skenario studi kasus riil terapan, lalu bedah dan analisis secara tuntas langkah demi langkah sebagai demonstrasi penerapan materi (DILARANG menaruh daftar lembar soal latihan / PR tanpa pembahasan di catatan, karena latihan soal sudah memiliki tab khusus interaktif tersendiri).

Tulis materi secara padat, tajam, dan berbobot akademis tinggi (minimal 800-1200 kata) dalam bahasa Indonesia yang lugas dan enak dipelajari.`;

      const content = await callRouter([
        { role: "system", content: "Anda adalah pengajar ahli yang menyusun modul ajar dan buku teks studi mendalam berbasis kurikulum resmi." },
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
