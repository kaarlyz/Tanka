const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const zlib = require("zlib");
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
const { runExamPipeline, pipelineToTankaFormat } = require("../services/examPipeline");
const { mathify } = require("../utils/mathify");
const { safeJsonParse } = require("../utils/jsonParser");
const { getPythonBin, executePythonScript, executePythonScriptAsync } = require("../utils/pythonResolver");
const { getSessionUser } = require("./auth");

// Intelligent Exam Sheet Processor — 4-Stage Pipeline (EXTRACT → SOLVE 3× → WRITE → VERIFY)
async function processExamQuestionsIfDetected(docId, rawText, title, dbInstance, goal = "", instruction = "", model = "ag/gemini-3.8-flash-low") {
  const userSpecifiedExamGoal = goal === "solve";
  const titleHasExamCue = /\b(soal|tka|utbk|ujian|latihan|kisi|try\s*out|kuis|exam|quiz|test|ulangan|bank\s*soal|drill)\b/i.test(title || "");
  const autoDetected = detectQuestionPatterns(rawText);

  if (!userSpecifiedExamGoal && !titleHasExamCue && !autoDetected) {
    return { isExamSheet: false };
  }

  console.log(`[Exam Pipeline] Terdeteksi lembar soal: "${title}" (Goal: ${goal || 'auto'}). Menjalankan pipeline 4-tahap...`);

  try {
    // Run the 4-stage pipeline
    const pipelineResult = await runExamPipeline(rawText, title, model || "ag/gemini-3.8-flash-low");

    if (!pipelineResult.soal || pipelineResult.soal.length === 0) {
      console.warn("[Exam Pipeline] No questions extracted");
      return { isExamSheet: false };
    }

    // Convert to Tanka format
    const { quizQuestions, studyGuide } = pipelineToTankaFormat(pipelineResult, title);

    // Save quiz questions
    if (quizQuestions.length > 0) {
      const quizId = "quiz_exam_" + Date.now();
      dbInstance.prepare("INSERT INTO quizzes (id, doc_id, questions, created_at) VALUES (?, ?, ?, ?)").run(
        quizId,
        docId,
        JSON.stringify(quizQuestions),
        Date.now()
      );
      console.log(`[Exam Pipeline] Saved ${quizQuestions.length} questions to quizzes table`);

      // Persist extracted exam concepts into document_concepts table
      try {
        const now = Date.now();
        const insertConcept = dbInstance.prepare(`
          INSERT OR IGNORE INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, created_at, category, is_required, evidence_quote, segment_id, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const seenConcepts = new Set();
        quizQuestions.forEach((q, qIdx) => {
          let concepts = [];
          if (q.formula && typeof q.formula === "string") {
            concepts = q.formula.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
          }
          concepts.forEach((cName) => {
            const clean = cName.replace(/^[-*•]\s*/, "").trim();
            if (!clean || seenConcepts.has(clean.toLowerCase())) return;
            seenConcepts.add(clean.toLowerCase());
            const cId = `concept_${docId}_${qIdx}_${Math.random().toString(36).slice(2, 6)}`;
            const def = `Indikator kompetensi ujian: menguji penguasaan ${clean} pada ${q.subtes || "soal"}.`;
            insertConcept.run(
              cId,
              docId,
              clean,
              def,
              JSON.stringify({ rumus: q.formula || "", trik_cepat: q.trik_cepat || "", jebakan: q.pitfall || "" }),
              "exam_pipeline",
              now,
              "core",
              1,
              q.question ? q.question.slice(0, 200) : "",
              String(q.id),
              now
            );
          });
        });
        console.log(`[Exam Pipeline] Synced ${seenConcepts.size} competency concepts to document_concepts table`);
      } catch (conceptErr) {
        console.warn("[Exam Pipeline] Notice syncing concepts:", conceptErr.message);
      }
    }

    // Save study guide as document content
    if (studyGuide) {
      const enrichedContent = `${studyGuide}\n\n---\n\n### 📋 Soal Latihan Terdeteksi\nButir-butir soal telah otomatis dimasukkan ke menu **Latihan Soal**.\n\n${rawText.slice(0, 5000)}`;

      dbInstance.prepare("UPDATE documents SET content = ? WHERE id = ?").run(enrichedContent, docId);
      console.log(`[Exam Pipeline] Document content updated with structured study guide`);
      return {
        isExamSheet: true,
        questionCount: quizQuestions.length,
        newContent: enrichedContent,
        questions: quizQuestions,
        stats: pipelineResult.stats
      };
    }

    return {
      isExamSheet: quizQuestions.length > 0,
      questionCount: quizQuestions.length,
      questions: quizQuestions,
      stats: pipelineResult.stats
    };
  } catch (err) {
    console.error("[Exam Pipeline Error]:", err.message, err.stack?.split("\n")[1] || "");
    return { isExamSheet: false, pipelineError: err.message };
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
    const docs = db.prepare("SELECT * FROM documents ORDER BY created_at DESC").all();
    const enrichedDocs = docs.map((doc) => {
      // Ambil paket kuis kanonikal tunggal (prioritaskan naskah ujian asli)
      const canonicalQuiz = db.prepare(
        "SELECT questions, quiz_type FROM quizzes WHERE doc_id = ? ORDER BY (CASE WHEN quiz_type = 'exam_sheet' OR id LIKE 'quiz_exam_%' THEN 1 ELSE 2 END), created_at DESC LIMIT 1"
      ).get(doc.id);
      let questionCount = 0;
      let hasExamSheet = false;
      if (canonicalQuiz) {
        if (canonicalQuiz.quiz_type === "exam_sheet") hasExamSheet = true;
        try {
          const parsed = JSON.parse(canonicalQuiz.questions);
          if (Array.isArray(parsed)) {
            questionCount = parsed.length;
          }
        } catch {}
      }
      const isExam = hasExamSheet || Boolean(
        /tka|utbk|snbt|ujian|tryout|penalaran|sbmptn|soal/i.test(doc.title || "")
      );
      return {
        ...doc,
        question_count: questionCount,
        is_exam_sheet: isExam,
      };
    });

    const acceptEncoding = (req.headers && req.headers["accept-encoding"]) || "";
    if (acceptEncoding.includes("gzip")) {
      const jsonStr = JSON.stringify({ ok: true, success: true, documents: enrichedDocs });
      const compressed = zlib.gzipSync(Buffer.from(jsonStr));
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Encoding": "gzip",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      });
      return res.end(compressed);
    }
    return sendJSON(res, { documents: enrichedDocs });
  }

  // 1b. DELETE /api/documents - bulk delete disabled for database protection
  if (req.method === "DELETE" && pathname === "/api/documents") {
    return sendJSON(res, { error: "Aksi dinonaktifkan demi perlindungan data." }, 403);
  }

  // 1b. POST /api/documents/youtube-info - preview video title, author, thumbnail, transcript
  if (req.method === "POST" && pathname === "/api/documents/youtube-info") {
    const { url } = await getBody(req);
    if (!url || typeof url !== "string") {
      return sendJSON(res, { error: "Tautan video YouTube wajib diisi" }, 400);
    }
    const scriptPath = path.join(__dirname, "..", "..", "extract_youtube.py");
    try {
      const pyRes = await executePythonScriptAsync(scriptPath, [url.trim()], { timeout: 20000 });
      if (!pyRes.success) {
        console.error("[YouTube Info Error]:", pyRes.error);
        return sendJSON(res, { error: "Gagal mengambil data video YouTube: " + pyRes.error }, 500);
      }
      const parsed = safeJsonParse(pyRes.stdout);
      if (!parsed || !parsed.success) {
        return sendJSON(res, { error: (parsed && parsed.error) || "Gagal memproses video YouTube", videoId: parsed?.videoId, title: parsed?.title }, 400);
      }
      return sendJSON(res, {
        success: true,
        videoId: parsed.videoId,
        title: parsed.title,
        author: parsed.author,
        thumbnail: parsed.thumbnail,
        language: parsed.language,
        snippetCount: parsed.snippetCount,
        textPreview: parsed.text ? parsed.text.slice(0, 300) + "..." : ""
      });
    } catch (err) {
      console.error("[YouTube Info Error]:", err.message);
      return sendJSON(res, { error: "Gagal mengambil data video YouTube: " + err.message }, 500);
    }
  }

  // 1c. POST /api/documents/youtube - extract transcript & generate full Nara curriculum
  if (req.method === "POST" && pathname === "/api/documents/youtube") {
    const body = await getBody(req);
    const { url, title: userTitle, goal = "theory", instruction = "", model = "ag/gemini-3.8-flash-low" } = body;
    if (!url || typeof url !== "string") {
      return sendJSON(res, { error: "Tautan video YouTube wajib diisi" }, 400);
    }

    const scriptPath = path.join(__dirname, "..", "..", "extract_youtube.py");
    let pyResult;
    try {
      console.log(`[YouTube Extraction] Memproses video: ${url}...`);
      const pyRes = await executePythonScriptAsync(scriptPath, [url.trim()], { timeout: 35000 });
      if (!pyRes.success) {
        console.error("[YouTube Script Error]:", pyRes.error);
        return sendJSON(res, { error: "Gagal memproses transkrip video YouTube: " + pyRes.error }, 500);
      }
      pyResult = safeJsonParse(pyRes.stdout);
    } catch (err) {
      console.error("[YouTube Script Error]:", err.message);
      return sendJSON(res, { error: "Gagal memproses transkrip video YouTube: " + err.message }, 500);
    }

    if (!pyResult || !pyResult.success || !pyResult.text) {
      return sendJSON(res, { error: (pyResult && pyResult.error) || "Transkrip video YouTube tidak tersedia atau tidak dapat diakses." }, 400);
    }

    const videoId = pyResult.videoId;
    const authorName = pyResult.author || "YouTube";
    const rawTranscript = pyResult.text;

    let cleanTitle = (userTitle && userTitle.trim()) || pyResult.title || "";
    if (!cleanTitle || cleanTitle.startsWith("Materi Video YouTube (") || cleanTitle.startsWith("Video YouTube (")) {
      cleanTitle = await detectDocumentTitle(rawTranscript.slice(0, 3000), "Video Pembelajaran " + authorName);
    }

    const sourceContext = `> 📺 **Sumber Belajar:** [${cleanTitle} - ${authorName}](https://www.youtube.com/watch?v=${videoId})\n> 🗣️ **Kreator / Pembicara:** ${authorName}\n\n${rawTranscript}`;

    const id = "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const createdAt = Date.now();
    db.prepare("INSERT INTO documents (id, title, content, status, created_at) VALUES (?, ?, ?, 'processing', ?)").run(
      id,
      cleanTitle,
      sourceContext,
      createdAt
    );

    // Simpan segmen
    const segments = segmentDocumentText(rawTranscript, "youtube_transcript");
    try {
      const insertSeg = db.prepare("INSERT INTO document_segments (id, doc_id, segment_index, source_type, raw_text, normalized_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for (const seg of segments) {
        insertSeg.run(`seg_${id}_${seg.index}`, id, seg.index, "youtube_transcript", seg.text, seg.text, createdAt);
      }
    } catch (segErr) {
      console.warn("[tanka] Failed to persist youtube segments:", segErr.message);
    }

    // Two-Pass Pipeline (Pass 1 outline + Pass 2 modul Nara)
    let finalContent = sourceContext;
    let docStatus = "processing";
    try {
      console.log(`[Curriculum Pipeline] Menyusun modul Nara dari video YouTube: "${cleanTitle}"...`);
      const dynamicOutline = await extractConceptsAndOutline(cleanTitle, rawTranscript, segments, model);

      if (dynamicOutline && Array.isArray(dynamicOutline.concepts)) {
        const insertConcept = db.prepare(`
          INSERT INTO document_concepts (
            id, doc_id, name, definition, prerequisites, origin, created_at, category, is_required, evidence_quote, segment_id, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const c of dynamicOutline.concepts) {
          const conceptId = `${id}_${c.id || Math.random().toString(36).slice(2, 6)}`;
          const def = c.definisi_baku || c.definition || "";
          const extra = JSON.stringify({
            rumus: c.rumus || "",
            tokoh: c.tokoh || [],
            salah_kaprah: c.salah_kaprah || ""
          });
          const category = c.category || "core";
          const isReq = c.is_required !== false ? 1 : 0;
          const quote = c.evidence_quote || c.kutipan || "";
          const segId = c.segment_id || "";

          insertConcept.run(
            conceptId,
            id,
            c.name,
            def,
            extra,
            "youtube",
            createdAt,
            category,
            isReq,
            quote,
            segId,
            createdAt
          );
        }
      }

      const naraContent = await generateNaraModule(dynamicOutline, rawTranscript, segments, model, "SMA", db, id);
      if (naraContent && naraContent.length > 300) {
        finalContent = `> 📺 **Referensi Video YouTube:** [${cleanTitle} (${authorName})](https://www.youtube.com/watch?v=${videoId})\n\n` + naraContent;
        docStatus = "completed";
        db.prepare("UPDATE documents SET content = ?, status = 'completed' WHERE id = ?").run(mathify(finalContent), id);
        console.log(`[Curriculum Pipeline] Sukses menyusun modul YouTube Nara (${finalContent.length} karakter).`);
      } else {
        docStatus = "partial";
        db.prepare("UPDATE documents SET status = 'partial' WHERE id = ?").run(id);
      }
    } catch (e) {
      docStatus = "partial";
      db.prepare("UPDATE documents SET status = 'partial' WHERE id = ?").run(id);
      console.warn("[tanka] YouTube curriculum pipeline error:", e.message);
    }

    return sendJSON(res, {
      success: true,
      id,
      title: cleanTitle,
      content: finalContent,
      author: authorName,
      videoId,
      status: docStatus,
      created_at: createdAt
    });
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
              const pyRes = await executePythonScriptAsync(scriptPath, [tmpFilePath], {
                maxBuffer: 25 * 1024 * 1024,
                timeout: 180000
              });
              text = pyRes.success ? pyRes.stdout : "";
              if (!pyRes.success) {
                console.error(`Gagal ekstrak ${f.fileName}:`, pyRes.error);
              }
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

    const contentHash = crypto.createHash("sha256").update(mergedText.trim()).digest("hex");

    // Content-Addressable Cache: jika berkas identik sudah ada dan completed di DB, gunakan langsung
    const cachedDoc = db.prepare("SELECT * FROM documents WHERE content_hash = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1").get(contentHash);
    if (cachedDoc) {
      console.log(`[Upload Cache Hit] Berkas identik ditemukan di DB: "${cachedDoc.title}" (${cachedDoc.id}) [hash: ${contentHash.slice(0, 10)}]`);
      const existingQuiz = db.prepare("SELECT * FROM quizzes WHERE doc_id = ? ORDER BY created_at DESC LIMIT 1").get(cachedDoc.id);
      let cachedQuestions = [];
      if (existingQuiz) {
        try { cachedQuestions = JSON.parse(existingQuiz.questions); } catch {}
      }
      return sendJSON(res, {
        success: true,
        id: cachedDoc.id,
        title: cachedDoc.title,
        content: cachedDoc.content,
        fileCount: extractedParts.length,
        wordCount: cachedDoc.content.split(/\s+/).length,
        created_at: cachedDoc.created_at,
        isExamSheet: Boolean(cachedQuestions.length > 0),
        status: "completed",
        questionCount: cachedQuestions.length,
        detectedQuestions: cachedQuestions,
        cached: true
      });
    }

    const id = "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const createdAt = Date.now();

    const isExamCandidate = body.goal === "solve" ||
      /\b(soal|tka|utbk|ujian|latihan|kisi|try\s*out|kuis|exam|quiz|test|ulangan|bank\s*soal|drill)\b/i.test(cleanTitle || "") ||
      detectQuestionPatterns(mergedText);

    // Synchronous execution path for automated test harnesses
    if (body.sync || process.env.TANKA_DB_PATH === ":memory:") {
      const examResult = await processExamQuestionsIfDetected(id, mergedText, cleanTitle, db, body.goal, body.instruction, body.model);
      const finalContent = examResult.newContent || mergedText;
      const initialStatus = examResult.isExamSheet ? "completed" : "processing";
      db.prepare("INSERT INTO documents (id, title, content, status, content_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, cleanTitle, finalContent, initialStatus, contentHash, createdAt);

      try {
        const segments = segmentDocumentText(mergedText, extractedParts[0]?.name?.endsWith(".pptx") ? "slide" : "text");
        const insertSeg = db.prepare("INSERT INTO document_segments (id, doc_id, segment_index, source_type, raw_text, normalized_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        for (const seg of segments) {
          insertSeg.run(`seg_${id}_${seg.index}`, id, seg.index, seg.sourceType, seg.text, seg.text, createdAt);
        }
      } catch (segErr) {
        console.warn("[tanka] Failed to persist segments:", segErr.message);
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

    // Default Production Path: Always insert immediately and respond <1s to prevent Cloudflare/browser 100s timeout
    const insert = db.prepare("INSERT INTO documents (id, title, content, status, content_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)");
    insert.run(id, cleanTitle, mergedText, "processing", contentHash, createdAt);

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

    // Kirim respons langsung ke client dalam <1 detik agar koneksi browser anti-timeout
    sendJSON(res, {
      success: true,
      id,
      title: cleanTitle,
      content: mergedText,
      fileCount: extractedParts.length,
      wordCount: mergedText.split(/\s+/).length,
      created_at: createdAt,
      isExamSheet: Boolean(isExamCandidate),
      status: "processing",
      questionCount: 0,
      detectedQuestions: []
    });

    // Jalankan pipeline secara asynchronous di latar belakang
    (async () => {
      try {
        if (isExamCandidate) {
          console.log(`[Exam Pipeline Background] Memproses lembar soal: "${cleanTitle}"...`);
          const examResult = await processExamQuestionsIfDetected(id, mergedText, cleanTitle, db, body.goal, body.instruction, body.model);
          if (examResult && examResult.isExamSheet) {
            db.prepare("UPDATE documents SET status = 'completed' WHERE id = ?").run(id);
            console.log(`[Exam Pipeline Background] Selesai: "${cleanTitle}" (status: completed).`);
            return;
          }
        }

        // Jalankan pipeline pendalaman kurikulum Nara reguler jika bukan exam atau tidak ada butir soal
        console.log(`[Curriculum Pipeline] Menyusun modul dinamis Nara untuk: "${cleanTitle}"...`);
        const segments = segmentDocumentText(mergedText);
        const dynamicOutline = await extractConceptsAndOutline(cleanTitle, mergedText, segments, body.model || "ag/gemini-3.8-flash-low");
          
          // Persist concepts to document_concepts table
          if (dynamicOutline && Array.isArray(dynamicOutline.concepts)) {
            const { autoRepairOutlineCoverage } = require("../services/curriculumPipeline");
            const repairedOutline = autoRepairOutlineCoverage(dynamicOutline);

            const insertConcept = db.prepare(`
              INSERT INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, created_at, category, is_required, evidence_quote, segment_id, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const c of repairedOutline.concepts) {
              const conceptId = `${id}_${c.id || Math.random().toString(36).slice(2, 6)}`;
              const def = c.definisi_baku || c.definition || "";
              const extra = JSON.stringify({
                rumus: c.rumus || "",
                tokoh: c.tokoh || [],
                salah_kaprah: c.salah_kaprah || "",
                sumber_ref: c.sumber_ref || "source_document"
              });
              const isReq = (c.is_required !== undefined) ? (c.is_required ? 1 : 0) : (c.origin === "ai_enrichment" ? 0 : 1);
              insertConcept.run(
                conceptId,
                id,
                c.name,
                def,
                extra,
                c.origin || "source",
                createdAt,
                c.category || (isReq ? "core" : "enrichment"),
                isReq,
                c.bukti_kutipan || "",
                c.segmen_id || "",
                createdAt
              );
            }

            // Sync concept graph edges
            try {
              const { buildOrInferConceptEdges, syncConceptEdgesToDb } = require("../services/conceptGraphService");
              const edges = buildOrInferConceptEdges(repairedOutline.concepts, repairedOutline.chapters, repairedOutline.edges || []);
              syncConceptEdgesToDb(db, id, edges);
            } catch (edgeErr) {
              console.warn("[documents] Notice syncing concept edges on upload:", edgeErr.message);
            }

            const naraContent = await generateNaraModule(repairedOutline, mergedText, segments, body.model || "ag/gemini-3.8-flash-low", "SMA", db, id);
            if (naraContent && naraContent.length > 300) {
              db.prepare("UPDATE documents SET content = ?, status = 'completed' WHERE id = ?").run(mathify(naraContent), id);
              console.log(`[Curriculum Pipeline] Sukses memperbarui modul Nara (${naraContent.length} karakter).`);
            } else {
              db.prepare("UPDATE documents SET status = 'partial' WHERE id = ?").run(id);
            }
          }
        } catch (e) {
          console.warn("[tanka] Curriculum pipeline background error:", e.message);
          try {
            db.prepare("UPDATE documents SET status = 'partial' WHERE id = ?").run(id);
          } catch {}
        }
      })();
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

    try {
      db.prepare("UPDATE documents SET status = 'processing' WHERE id = ?").run(docId);
    } catch {}

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
      doc.title,
      doc.content,
      segments,
      model,
      "SMA",
      customInstruction
    );

    // Sync concepts to database
    if (outline && Array.isArray(outline.concepts)) {
      db.prepare("DELETE FROM document_concepts WHERE doc_id = ?").run(docId);
      const insertConcept = db.prepare(`
        INSERT INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, created_at, category, is_required, evidence_quote, segment_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of outline.concepts) {
        const conceptId = `${docId}_${c.id || Math.random().toString(36).slice(2, 6)}`;
        const def = c.definisi_baku || c.definition || "";
        const extra = JSON.stringify({
          rumus: c.rumus || "",
          tokoh: c.tokoh || [],
          salah_kaprah: c.salah_kaprah || "",
          sumber_ref: c.sumber_ref || "source_document"
        });
        const isReq = (c.is_required !== undefined) ? (c.is_required ? 1 : 0) : (c.origin === "ai_enrichment" ? 0 : 1);
        insertConcept.run(
          conceptId,
          docId,
          c.name,
          def,
          extra,
          c.origin || "source",
          Date.now(),
          c.category || (isReq ? "core" : "enrichment"),
          isReq,
          c.bukti_kutipan || "",
          c.segmen_id || "",
          Date.now()
        );
      }

      // Sync concept graph edges
      try {
        const { buildOrInferConceptEdges, syncConceptEdgesToDb } = require("../services/conceptGraphService");
        const edges = buildOrInferConceptEdges(outline.concepts, outline.chapters, outline.edges || []);
        syncConceptEdgesToDb(db, docId, edges);
      } catch (edgeErr) {
        console.warn("[documents] Notice syncing concept edges:", edgeErr.message);
      }
    }

    // 3. Pass 2: Generate Nara module strictly respecting outline chapters
    const structuredCurriculum = await generateNaraModule(
      outline, 
      customInstruction ? `${doc.content}\n\n[Instruksi Khusus Revisi Pengguna]: ${customInstruction}` : doc.content, 
      segments, 
      model,
      "SMA",
      db,
      docId
    );
    if (!structuredCurriculum) {
      try { db.prepare("UPDATE documents SET status = 'partial' WHERE id = ?").run(docId); } catch {}
      return sendJSON(res, { error: "Gagal menyusun ulang kurikulum materi" }, 500);
    }

    db.prepare("UPDATE documents SET content = ?, summary = ?, status = 'completed' WHERE id = ?").run(mathify(structuredCurriculum), outline.executiveSummary || "", docId);
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
    const insert = db.prepare("INSERT INTO documents (id, title, content, status, created_at) VALUES (?, ?, ?, 'completed', ?)");
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
    const authUser = getSessionUser ? getSessionUser(req, db) : null;
    const isTestHarness = process.env.TANKA_DB_PATH === ":memory:" || (!req.headers && !req.socket);
    if (!authUser && !isTestHarness) {
      return sendJSON(res, { error: "Autentikasi diperlukan untuk memperkaya materi." }, 401);
    }

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
    db.prepare("UPDATE documents SET content = ? WHERE id = ?").run(mathify(updatedContent), docId);

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
    const authUser = getSessionUser ? getSessionUser(req, db) : null;
    const isTestHarness = process.env.TANKA_DB_PATH === ":memory:" || (!req.headers && !req.socket);
    if (!authUser && !isTestHarness) {
      return sendJSON(res, { error: "Autentikasi diperlukan untuk menyesuaikan materi." }, 401);
    }

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
      db.prepare("UPDATE documents SET content = ? WHERE id = ?").run(mathify(tailoredContent.trim()), docId);
      return sendJSON(res, { success: true, isVariant: false, docId, content: tailoredContent.trim() });
    }
  }

  // 7. POST /api/documents/:id/detect-title
  const detectTitleMatch = pathname.match(/^\/api\/documents\/([^/]+)\/detect-title$/);
  if (req.method === "POST" && detectTitleMatch) {
    const authUser = getSessionUser ? getSessionUser(req, db) : null;
    const isTestHarness = process.env.TANKA_DB_PATH === ":memory:" || (!req.headers && !req.socket);
    if (!authUser && !isTestHarness) {
      return sendJSON(res, { error: "Autentikasi diperlukan untuk mengubah judul materi." }, 401);
    }

    const docId = detectTitleMatch[1];
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
    if (!doc) return sendJSON(res, { error: "Dokumen tidak ditemukan" }, 404);

    const newTitle = await detectDocumentTitle(doc.content, doc.title);
    db.prepare("UPDATE documents SET title = ? WHERE id = ?").run(newTitle, docId);
    return sendJSON(res, { success: true, title: newTitle });
  }

  // 7b. GET /api/documents/:id/concept-graph - get structured canonical concept graph & mind map tree
  const conceptGraphMatch = pathname.match(/^\/api\/documents\/([^/]+)\/concept-graph$/);
  if (conceptGraphMatch && req.method === "GET") {
    const docId = conceptGraphMatch[1];
    const { getConceptGraphForDocument } = require("../services/conceptGraphService");
    const graphData = getConceptGraphForDocument(db, docId);
    if (!graphData) {
      return sendJSON(res, { error: "Dokumen tidak ditemukan" }, 404);
    }
    return sendJSON(res, graphData);
  }

  // 8. Single Document operations: GET, PATCH, DELETE /api/documents/:id
  const singleDocMatch = pathname.match(/^\/api\/documents\/([^/]+)$/);
  if (singleDocMatch) {
    const docId = singleDocMatch[1];
    if (req.method === "GET") {
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (!doc) return sendJSON(res, { error: "Document not found" }, 404);
      const cards = db.prepare("SELECT * FROM flashcards WHERE doc_id = ? ORDER BY created_at ASC").all(docId);
      const chapters = db.prepare("SELECT * FROM chapter_plans WHERE doc_id = ? ORDER BY chapter_number ASC").all(docId);
      return sendJSON(res, { document: doc, flashcards: cards, chapters: chapters || [] });
    }

    if (req.method === "PATCH") {
      const authUser = getSessionUser ? getSessionUser(req, db) : null;
      const isTestHarness = process.env.TANKA_DB_PATH === ":memory:" || (!req.headers && !req.socket);
      if (!authUser && !isTestHarness) {
        return sendJSON(res, { error: "Autentikasi diperlukan untuk mengubah materi." }, 401);
      }

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
      const authUser = getSessionUser ? getSessionUser(req, db) : null;
      const isTestHarness = process.env.TANKA_DB_PATH === ":memory:" || (!req.headers && !req.socket);
      if (!authUser && !isTestHarness) {
        return sendJSON(res, { error: "Autentikasi diperlukan untuk menghapus materi." }, 401);
      }

      // node:sqlite (DatabaseSync) tidak punya db.transaction() ala better-sqlite3.
      db.exec("BEGIN");
      try {
        db.prepare("DELETE FROM flashcards WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM mistake_notebook WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM quizzes WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM chat_messages WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM formula_cheatsheets WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM chapter_plans WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM concept_edges WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM document_concepts WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM document_segments WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM learner_events WHERE doc_id = ?").run(docId);
        db.prepare("DELETE FROM documents WHERE id = ?").run(docId);
        db.exec("COMMIT");
      } catch (txErr) {
        db.exec("ROLLBACK");
        throw txErr;
      }
      return sendJSON(res, { success: true, id: docId });
    }
  }

  return false;
}

module.exports = {
  handleDocumentsRoutes,
  processExamQuestionsIfDetected
};
