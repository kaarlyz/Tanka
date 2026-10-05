const path = require("path");
const fs = require("fs");
const { execFileSync } = require("node:child_process");
const { db } = require("../db");
const {
  callRouter,
  multiSourceAcademicSearch,
  detectDocumentTitle,
  extractTextWithAIVision,
  detectQuestionPatterns
} = require("../ai");
const {
  segmentDocumentText,
  extractConceptsAndOutline,
  generateNaraModule
} = require("../services/curriculumPipeline");
const { safeJsonParse } = require("../utils/jsonParser");

// Intelligent Exam Sheet Processor
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

    const parsed = safeJsonParse(rawResponse);
    if (!parsed) return { isExamSheet: false };
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

function detectFileExtension(fileName, base64Data) {
  let ext = path.extname(fileName || "").toLowerCase();
  if (ext && ext !== ".bin" && ext !== ".tmp") return ext;
  if (!base64Data || typeof base64Data !== "string") return ".txt";
  const head = base64Data.slice(0, 40);
  if (head.startsWith("/9j/")) return ".jpg";
  if (head.startsWith("iVBORw")) return ".png";
  if (head.startsWith("UklGR")) return ".webp";
  if (head.startsWith("JVBERi0")) return ".pdf";
  if (head.startsWith("UEsDBBQ")) return ".docx";
  if (head.startsWith("0M8R4kg")) return ".doc";
  return ".txt";
}

async function handleDocumentsRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. GET /api/documents - list all documents
  if (req.method === "GET" && pathname === "/api/documents") {
    const docs = db.prepare("SELECT id, title, created_at, substr(content, 1, 150) as preview FROM documents ORDER BY created_at DESC").all();
    return sendJSON(res, { documents: docs });
  }

  // 2. POST /api/documents/upload - handle file & image uploads
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
    const scriptPath = path.join(__dirname, "..", "..", "extract_text.py");

    const extractedParts = [];
    const fileNames = [];

    // Ekstrak berkas OCR secara paralel (maksimal 4 berkas sekaligus) agar hemat waktu & anti-timeout
    const concurrency = 4;
    for (let i = 0; i < incomingFiles.length; i += concurrency) {
      const chunk = incomingFiles.slice(i, i + concurrency);
      await Promise.all(
        chunk.map(async (f) => {
          if (!f.fileName || !f.fileData) return;
          const ext = detectFileExtension(f.fileName, f.fileData);
          let text = "";
          const isImage = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".heic", ".heif", ".avif", ".tiff", ".tif"].includes(ext) || f.fileType === "image";

          if (isImage) {
            const mimeMap = {
              ".png": "image/png",
              ".jpg": "image/jpeg",
              ".jpeg": "image/jpeg",
              ".webp": "image/webp",
              ".bmp": "image/bmp",
              ".heic": "image/heic",
              ".heif": "image/heif",
              ".avif": "image/avif",
              ".tiff": "image/tiff",
              ".tif": "image/tiff"
            };
            let visionB64 = f.fileData;
            let visionMime = mimeMap[ext] || "image/jpeg";

            // Jika format HEIC/HEIF/AVIF/TIFF, konversi dulu ke JPEG via magick agar dapat dibaca AI Vision
            if ([".heic", ".heif", ".avif", ".tiff", ".tif"].includes(ext)) {
              const tmpSrc = path.join(scratchDir, `src_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`);
              const tmpDst = path.join(scratchDir, `dst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpg`);
              try {
                fs.writeFileSync(tmpSrc, Buffer.from(f.fileData, "base64"));
                execFileSync("magick", [tmpSrc, "-quality", "85", tmpDst]);
                if (fs.existsSync(tmpDst)) {
                  visionB64 = fs.readFileSync(tmpDst).toString("base64");
                  visionMime = "image/jpeg";
                }
              } catch (magickErr) {
                console.warn("[Upload] Gagal konversi format gambar via magick:", magickErr.message);
              } finally {
                try { if (fs.existsSync(tmpSrc)) fs.unlinkSync(tmpSrc); } catch {}
                try { if (fs.existsSync(tmpDst)) fs.unlinkSync(tmpDst); } catch {}
              }
            }

            try {
              console.log(`[Upload] Menjalankan AI Vision Multimodal OCR untuk gambar: ${f.fileName}...`);
              text = await extractTextWithAIVision(visionB64, visionMime, body.model);
            } catch (aiErr) {
              console.warn("AI vision extraction failed, fallback to script:", aiErr.message);
            }
          }

          // If AI vision failed, empty, or file is document (PDF, DOCX, PPTX, TXT)
          if (!text || text.trim().length === 0) {
            const tmpFilePath = path.join(scratchDir, `upload_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`);
            try {
              fs.writeFileSync(tmpFilePath, Buffer.from(f.fileData, "base64"));
              const scriptOutput = execFileSync("python3", [scriptPath, tmpFilePath], {
                encoding: "utf8",
                maxBuffer: 25 * 1024 * 1024
              }).trim();
              text = scriptOutput;
            } catch (err) {
              console.error(`Gagal ekstrak ${f.fileName}:`, err.message);
            } finally {
              if (fs.existsSync(tmpFilePath)) {
                try { fs.unlinkSync(tmpFilePath); } catch {}
              }
            }
          }

          const isErrorText = !text ||
            text.startsWith("[Error OCR Gambar:") ||
            text.startsWith("[Error ekstrak PDF:") ||
            text.startsWith("[Error ekstrak DOCX:") ||
            text.startsWith("[Error ekstrak PPTX:") ||
            text.startsWith("[Error ekstrak XLSX:") ||
            text.startsWith("[Error konversi LibreOffice:") ||
            text.startsWith("[Format berkas") ||
            text.trim().length === 0;

          if (!isErrorText) {
            extractedParts.push({ name: f.fileName, text: text.trim() });
            fileNames.push(path.basename(f.fileName, ext).replace(/[_-]/g, " ").trim());
          } else {
            console.warn(`[Upload Warning] Teks dari ${f.fileName} kosong atau menghasilkan error: ${text.slice(0, 100)}`);
          }
        })
      );
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

    // Auto-detect clean academic title from content if user didn't explicitly give one or if it's a raw filename
    let cleanTitle = (body.title && body.title.trim()) || "";
    const isGenericOrFilename = !cleanTitle ||
      /^(img|image|scan|doc|file|screenshot|whatsapp|telegram)[_\d\s]/i.test(cleanTitle) ||
      /\.(png|jpg|jpeg|webp|pdf|docx|txt)$/i.test(cleanTitle);

    if (isGenericOrFilename) {
      cleanTitle = await detectDocumentTitle(mergedText, fileNames.join(" & ") || "Materi Pembelajaran");
    }

    const id = "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const createdAt = Date.now();
    const insert = db.prepare("INSERT INTO documents (id, title, content, created_at) VALUES (?, ?, ?, ?)");
    insert.run(id, cleanTitle, mergedText, createdAt);

    // Persist document segments into document_segments table (no truncation)
    try {
      const segments = segmentDocumentText(mergedText, extractedParts[0]?.name?.endsWith(".pptx") ? "slide" : "text");
      const insertSeg = db.prepare("INSERT INTO document_segments (id, doc_id, segment_index, source_type, raw_text, normalized_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for (const seg of segments) {
        const segId = `seg_${id}_${seg.index}`;
        insertSeg.run(segId, id, seg.index, seg.sourceType, seg.text, seg.text, createdAt);
      }
    } catch (segErr) {
      console.warn("[tanka] Failed to persist segments:", segErr.message);
    }

    // Intelligent exam sheet & kisi-kisi question detection
    const examResult = await processExamQuestionsIfDetected(id, mergedText, cleanTitle, db, body.goal, body.instruction);
    let finalContent = examResult.newContent || mergedText;

    // If not an exam sheet, use Nara Pipeline (Two-Pass: Canonical Concepts + Dynamic Outline + Nara Prosa)
    if (!examResult.isExamSheet) {
      try {
        console.log(`[Curriculum Pipeline] Menyusun modul dinamis Nara untuk: "${cleanTitle}"...`);
        const segments = segmentDocumentText(mergedText);
        const dynamicOutline = await extractConceptsAndOutline(cleanTitle, mergedText, segments, body.model || "ag/gemini-3.8-flash-low");
        
        // Persist concepts to document_concepts table
        if (dynamicOutline && Array.isArray(dynamicOutline.concepts)) {
          const insertConcept = db.prepare("INSERT INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
          for (const c of dynamicOutline.concepts) {
            const conceptId = `${id}_${c.id || Math.random().toString(36).slice(2, 6)}`;
            const def = c.definisi_baku || c.definition || "";
            const extra = JSON.stringify({
              rumus: c.rumus || "",
              tokoh: c.tokoh || [],
              salah_kaprah: c.salah_kaprah || ""
            });
            insertConcept.run(conceptId, id, c.name, def, extra, c.origin || "source", createdAt);
          }
        }

        const naraContent = await generateNaraModule(dynamicOutline, mergedText, segments, body.model || "ag/gemini-3.8-flash-low");
        if (naraContent && naraContent.length > 300) {
          finalContent = naraContent;
          db.prepare("UPDATE documents SET content = ? WHERE id = ?").run(finalContent, id);
          console.log(`[Curriculum Pipeline] Sukses menyusun modul Nara (${finalContent.length} karakter).`);
        }
      } catch (e) {
        console.warn("[tanka] Curriculum pipeline error:", e.message);
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

  // 2b. POST /api/documents/:id/restructure - re-synthesize document into chapter-by-chapter curriculum via Two-Pass Pipeline
  const restructureMatch = pathname.match(/^\/api\/documents\/([^/]+)\/restructure$/);
  if (req.method === "POST" && restructureMatch) {
    const docId = restructureMatch[1];
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
    if (!doc) {
      return sendJSON(res, { error: "Dokumen tidak ditemukan" }, 404);
    }
    const body = await getBody(req);
    const model = body.model || "ag/gemini-3.8-flash-low";
    const customInstruction = (body.instruction || body.tailorPrompt || "").trim();

    console.log(`[Curriculum Synthesis] Restructuring doc ${docId} ("${doc.title}") via Two-Pass Pipeline... ${customInstruction ? `(Instruksi: "${customInstruction}")` : ""}`);

    const { segmentDocumentText, extractConceptsAndOutline, generateNaraModule } = require("../services/curriculumPipeline");

    // 1. Get or create source segments
    let segments = db.prepare("SELECT id, segment_index as [index], source_type as sourceType, raw_text as text FROM document_segments WHERE doc_id = ? ORDER BY segment_index ASC").all(docId);
    if (!segments || segments.length === 0) {
      const rawSegs = segmentDocumentText(doc.content, "source_document");
      const insertSeg = db.prepare("INSERT INTO document_segments (id, doc_id, segment_index, source_type, raw_text, normalized_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
      segments = [];
      rawSegs.forEach(seg => {
        const segId = `seg_${docId}_${seg.index}`;
        insertSeg.run(segId, docId, seg.index, "source_document", seg.text, seg.text, Date.now());
        segments.push({ id: segId, index: seg.index, text: seg.text, sourceType: "source_document" });
      });
    }

    // 2. Pass 1: Extract concepts and autonomous dynamic outline strictly bound to actual concepts
    const outline = await extractConceptsAndOutline(
      customInstruction ? `${doc.title} (Instruksi Tambahan: ${customInstruction})` : doc.title,
      doc.content,
      segments,
      model
    );

    // Sync concepts to database
    if (outline && Array.isArray(outline.concepts)) {
      db.prepare("DELETE FROM document_concepts WHERE doc_id = ?").run(docId);
      const insertConcept = db.prepare("INSERT INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for (const c of outline.concepts) {
        const conceptId = `${docId}_${c.id || Math.random().toString(36).slice(2, 6)}`;
        const def = c.definisi_baku || c.definition || "";
        const extra = JSON.stringify({
          rumus: c.rumus || "",
          tokoh: c.tokoh || [],
          salah_kaprah: c.salah_kaprah || "",
          sumber_ref: c.sumber_ref || "source_document"
        });
        insertConcept.run(conceptId, docId, c.name, def, extra, c.origin || "source", Date.now());
      }
    }

    // 3. Pass 2: Generate Nara module strictly respecting outline chapters
    const structuredCurriculum = await generateNaraModule(
      outline, 
      customInstruction ? `${doc.content}\n\n[Instruksi Khusus Revisi Pengguna]: ${customInstruction}` : doc.content, 
      segments, 
      model
    );
    if (!structuredCurriculum) {
      return sendJSON(res, { error: "Gagal menyusun ulang kurikulum materi" }, 500);
    }

    db.prepare("UPDATE documents SET content = ?, summary = ? WHERE id = ?").run(structuredCurriculum, outline.executiveSummary || "", docId);
    return sendJSON(res, {
      success: true,
      id: docId,
      title: doc.title,
      content: structuredCurriculum,
      chapterCount: (outline.chapters || []).length
    });
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

    const examResult = await processExamQuestionsIfDetected(id, content.trim(), finalTitle, db);
    const finalContent = examResult.newContent || content.trim();

    return sendJSON(res, {
      ok: true,
      success: true,
      document: {
        id,
        title: finalTitle,
        content: finalContent,
        created_at: createdAt
      },
      id,
      title: finalTitle,
      content: finalContent,
      created_at: createdAt,
      isExamSheet: examResult.isExamSheet || false,
      questionCount: examResult.questionCount || 0,
      detectedQuestions: examResult.questions || []
    });
  }

  // 4. POST /api/documents/enrich-suggestions
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
]`;

    try {
      const aiResponse = await callRouter([{ role: "user", content: prompt }], "ag/gemini-3.8-flash-low", 0.3);
      const parsed = safeJsonParse(aiResponse);
      const suggestions = Array.isArray(parsed) ? parsed : [];
      return sendJSON(res, { success: true, suggestions });
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

  // 5. POST /api/documents/:id/enrich
  const enrichMatch = pathname.match(/^\/api\/documents\/([^/]+)\/enrich$/);
  if (req.method === "POST" && enrichMatch) {
    const docId = enrichMatch[1];
    const { focusTopic, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
    if (!doc) return sendJSON(res, { error: "Dokumen tidak ditemukan" }, 404);

    let webFindings = await multiSourceAcademicSearch(doc.title, focusTopic);
    let webContext = "";
    if (webFindings) {
      webContext = `\nHASIL PENELUSURAN REFERENSI AKADEMIK & KURIKULUM MULTI-SUMBER:\n${webFindings}\n\n`;
    }

    const prompt = `Anda adalah asisten riset dan pengayaan materi pembelajaran tingkat elit.
Topik Utama Dokumen: "${doc.title}"
Instruksi / Fokus Khusus Pengguna: "${focusTopic || "Perluas materi ini secara maksimal: lengkapi konsep-konsep kunci yang belum mendalam, berikan contoh dunia nyata, eksplorasi teori/variasi, dan bedah pola soal ujian."}"

${webContext}

Isi Dokumen Sumber Saat Ini:
"""
${doc.content.slice(0, 25000)}
"""

PRINSIP RISET & PENGAYAAN MAKSIMAL (BEBAS BATASAN):
1. EKSPLORASI BEBAS & MENDALAM: Jangan membatasi panjang tulisan, jangan gunakan ringkasan dangkal. Jelaskan setiap konsep, variasi fenomena, data historis/eksak, serta bukti penerapannya secara komprehensif sampai tuntas.
2. INTEGRASI BAB & SUB-KONSEP TERSTRUKTUR:
   Format suplemen pengayaan ini ke dalam bab-bab baru terstruktur (misal: '## Bab Pengayaan: [Judul Pengayaan Mendalam]') dan gunakan sub-heading '### [Nama Sub-konsep]' untuk setiap gagasan kunci agar otomatis terintegrasi ke dalam Mind Map dan Chapter Reader Tanka.
3. KAYA CONTOH NYATA & BEDAH SOAL HOTS:
   Sajikan studi kasus konkret, analogi yang mencerahkan, komparasi tabel, serta bedah soal penalaran ujian tingkat tinggi (HOTS) beserta analisis langkah pemecahannya.

Tulis dalam Bahasa Indonesia yang mengalir, komunikatif, dan kaya wawasan ilmiah.`;

    const enrichmentText = await callRouter([
      { role: "system", content: "Anda adalah pakar riset kurikulum dan mentor akademik yang memperkaya materi belajar secara mendalam, luas, dan tanpa pembatasan kata." },
      { role: "user", content: prompt }
    ], model, 0.3);

    const updatedContent = doc.content + "\n\n---\n\n" + enrichmentText.trim();
    db.prepare("UPDATE documents SET content = ? WHERE id = ?").run(updatedContent, docId);

    return sendJSON(res, {
      success: true,
      docId,
      addedLength: enrichmentText.length,
      totalLength: updatedContent.length,
      content: updatedContent
    });
  }

  // 6. POST /api/documents/:id/tailor-material
  const tailorMatch = pathname.match(/^\/api\/documents\/([^/]+)\/tailor-material$/);
  if (req.method === "POST" && tailorMatch) {
    const docId = tailorMatch[1];
    const { instruction, mode = "update", model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
    if (!doc) return sendJSON(res, { error: "Dokumen tidak ditemukan" }, 404);

    if (!instruction || !instruction.trim()) {
      return sendJSON(res, { error: "Instruksi penyesuaian materi diperlukan" }, 400);
    }

    const prompt = `Anda adalah editor kurikulum pembelajaran mandiri.
Materi Sumber: "${doc.title}"
Isi Materi Saat Ini:
"""
${doc.content.slice(0, 15000)}
"""

PERMINTAAN PENYESUAIAN PENGGUNA:
"${instruction.trim()}"

Tugas Anda:
1. Sesuaikan dan kembangkan materi di atas sesuai instruksi pengguna secara langsung dan mendalam.
2. Gunakan rumus KaTeX LaTeX rapi ($...$ atau $$...$$) jika materi melibatkan matematika/eksak.
3. Pertahankan struktur penjelasan yang runtut, hilangkan istilah berbelit-belit, dan sertakan contoh langkah nyata.
4. Format output berupa Markdown rapi yang langsung siap dipelajari.`;

    const tailoredContent = await callRouter([
      { role: "system", content: "You are a professional educational curriculum editor." },
      { role: "user", content: prompt }
    ], model, 0.2);

    if (!tailoredContent) return sendJSON(res, { error: "Gagal menyusun materi penyesuaian" }, 500);

    if (mode === "variant") {
      const newDocId = "doc_var_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      const variantTitle = `${doc.title} (${instruction.slice(0, 24)}...)`;
      db.prepare("INSERT INTO documents (id, title, content, created_at) VALUES (?, ?, ?, ?)").run(
        newDocId,
        variantTitle,
        tailoredContent.trim(),
        Date.now()
      );
      return sendJSON(res, { success: true, isVariant: true, newDocId, newDocTitle: variantTitle, content: tailoredContent.trim() });
    } else {
      db.prepare("UPDATE documents SET content = ? WHERE id = ?").run(tailoredContent.trim(), docId);
      return sendJSON(res, { success: true, isVariant: false, docId, content: tailoredContent.trim() });
    }
  }

  // 7. POST /api/documents/:id/detect-title
  const detectTitleMatch = pathname.match(/^\/api\/documents\/([^/]+)\/detect-title$/);
  if (req.method === "POST" && detectTitleMatch) {
    const docId = detectTitleMatch[1];
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
    if (!doc) return sendJSON(res, { error: "Dokumen tidak ditemukan" }, 404);

    const newTitle = await detectDocumentTitle(doc.content, doc.title);
    db.prepare("UPDATE documents SET title = ? WHERE id = ?").run(newTitle, docId);
    return sendJSON(res, { success: true, title: newTitle });
  }

  // 8. Single Document operations: GET, PATCH, DELETE /api/documents/:id
  const singleDocMatch = pathname.match(/^\/api\/documents\/([^/]+)$/);
  if (singleDocMatch) {
    const docId = singleDocMatch[1];
    if (req.method === "GET") {
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (!doc) return sendJSON(res, { error: "Document not found" }, 404);
      const cards = db.prepare("SELECT * FROM flashcards WHERE doc_id = ? ORDER BY created_at ASC").all(docId);
      return sendJSON(res, { document: doc, flashcards: cards });
    }

    if (req.method === "PATCH") {
      const body = await getBody(req);
      const { title, content } = body;
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

      const updatedTitle = title !== undefined ? title.trim() : doc.title;
      const updatedContent = content !== undefined ? content : doc.content;
      db.prepare("UPDATE documents SET title = ?, content = ? WHERE id = ?").run(updatedTitle, updatedContent, docId);
      return sendJSON(res, { success: true, id: docId, title: updatedTitle, content: updatedContent });
    }

    if (req.method === "DELETE") {
      db.prepare("DELETE FROM flashcards WHERE doc_id = ?").run(docId);
      db.prepare("DELETE FROM mistake_notebook WHERE doc_id = ?").run(docId);
      db.prepare("DELETE FROM quizzes WHERE doc_id = ?").run(docId);
      db.prepare("DELETE FROM chat_messages WHERE doc_id = ?").run(docId);
      db.prepare("DELETE FROM formula_cheatsheets WHERE doc_id = ?").run(docId);
      db.prepare("DELETE FROM document_concepts WHERE doc_id = ?").run(docId);
      db.prepare("DELETE FROM document_segments WHERE doc_id = ?").run(docId);
      db.prepare("DELETE FROM documents WHERE id = ?").run(docId);
      return sendJSON(res, { success: true, id: docId });
    }
  }

  return false;
}

module.exports = {
  handleDocumentsRoutes
};
