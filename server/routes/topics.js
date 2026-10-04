const { db } = require("../db");
const { callRouter, multiSourceAcademicSearch } = require("../ai");
const { NARA_GLOBAL_PERSONA } = require("../prompts/nara");

async function handleTopicsRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. POST /api/ai/topic-clarify - ask diagnostic questions before generating a topic
  if (req.method === "POST" && pathname === "/api/ai/topic-clarify") {
    const { topic, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    if (!topic || !topic.trim()) return sendJSON(res, { error: "Topic required" }, 400);

    const prompt = `Pengguna ingin mempelajari topik/sub-topik berikut:
"${topic.trim()}"

Tugas Anda:
1. Identifikasi bidang ilmu yang relevan (misal: Matematika, Ekonomi, Sosiologi, Fisika, Biologi, Sejarah, dll).
2. Tentukan judul topik formal akademik ("formalTitle") YANG DISIPLIN & MENGIKUTI RUANG LINGKUP PERMINTAAN:
   - DILARANG memperlebar judul menjadi bab induk raksasa jika pengguna meminta sub-topik spesifik!
3. Buat 2 pertanyaan preferensi belajar pengguna ("questions"):
   - DILARANG KERAS MEMBUAT KUIS / SOAL TEBAK FAKTA! Pengguna belum belajar materi ini!
   - Pertanyaan HANYA boleh menanyakan:
     a. Target Pembelajaran (pilihan: "Paham Alur Cerita & Sebab-Akibat", "Persiapan Ujian / Nilai Rapor", "Bedah Soal HOTS & Penalaran UTBK")
     b. Kedalaman & Gaya Belajar (pilihan: "Penjelasan Runtut & Bebas Hafalan Buta", "Ringkasan Poin Inti Cepat", "Mendalam Komprehensif")

Format output WAJIB HANYA berupa JSON valid tanpa markdown formatting:
{
  "subject": "Nama Mata Pelajaran",
  "formalTitle": "Judul Topik Formal Akademik",
  "questions": [
    {
      "id": "target",
      "question": "Fokus target yang ingin kamu capai di materi ini?",
      "choices": ["Paham Alur Kausalitas & Bebas Hafalan Buta", "Persiapan Ujian Sekolah / Harian", "Penalaran Analitis HOTS UTBK"]
    },
    {
      "id": "depth",
      "question": "Gaya penyajian materi yang kamu sukai?",
      "choices": ["Alur Cerita Bertahap & Mudah Dipahami", "Poin Inti Ringkas & Padat", "Bedah Menyeluruh dengan Studi Kasus"]
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
            choices: ["Fondasi Dasar (Konseptual & Mudah Dipahami)", "Intensif Terapan (Persiapan Ujian)", "Tingkat Lanjut (Analisis Mendalam)"]
          }
        ]
      });
    }
  }

  // 2. POST /api/ai/topic-generate - generate full academic document from web search via Two-Pass Pipeline
  if (req.method === "POST" && pathname === "/api/ai/topic-generate") {
    const { topic, formalTitle, subject, answers = {}, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    if (!topic) return sendJSON(res, { error: "Topic required" }, 400);

    const docId = "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const title = (formalTitle || topic).trim();

    // 1. INGESTION: Multi-Source Web Search across Curricular & Academic Sources
    let webRes = null;
    try {
      webRes = await multiSourceAcademicSearch(title, subject);
    } catch (err) {
      console.error("[topics] Multi-source academic search failed:", err);
    }

    const { segmentDocumentText, extractConceptsAndOutline, generateNaraModule } = require("../services/curriculumPipeline");

    let segments = [];
    let rawContext = "";

    const insertSeg = db.prepare("INSERT INTO document_segments (id, doc_id, segment_index, source_type, raw_text, normalized_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");

    if (webRes && webRes.sources && webRes.sources.length > 0) {
      webRes.sources.forEach((src, idx) => {
        const segId = `seg_${docId}_${idx}`;
        const header = `[Sumber: ${src.title}${src.url ? ` (${src.url})` : ""}]`;
        const textWithHeader = `${header}\n${src.text}`;
        insertSeg.run(segId, docId, idx, src.sourceType || "web_search", textWithHeader, textWithHeader, Date.now());
        segments.push({ id: segId, index: idx, title: src.title, text: textWithHeader, sourceType: src.sourceType });
        rawContext += `\n\n${textWithHeader}`;
      });
    } else {
      rawContext = (webRes && webRes.bundle) || (typeof webRes === "string" ? webRes : title);
      segments = segmentDocumentText(rawContext, "web_search");
      segments.forEach((seg) => {
        insertSeg.run(`seg_${docId}_${seg.index}`, docId, seg.index, "web_search", seg.text, seg.text, Date.now());
      });
    }

    // 2. PASS 1: CANONICAL CONCEPT & OUTLINE EXTRACTION FROM RAW WEB SEGMENTS
    const outline = await extractConceptsAndOutline(title, rawContext, segments, model);

    if (outline && Array.isArray(outline.concepts)) {
      const insertConcept = db.prepare("INSERT INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for (const c of outline.concepts) {
        const conceptId = `${docId}_${c.id || Math.random().toString(36).slice(2, 6)}`;
        const def = c.definisi_baku || c.definition || "";
        const extra = JSON.stringify({
          rumus: c.rumus || "",
          tokoh: c.tokoh || [],
          salah_kaprah: c.salah_kaprah || "",
          sumber_ref: c.sumber_ref || "web_search"
        });
        insertConcept.run(conceptId, docId, c.name, def, extra, c.origin || "source", Date.now());
      }
    }

    // 3. PASS 2: GENERATE NARA'S STUDY MODULE GROUNDED IN CANONICAL OUTLINE & SOURCE CHUNKS
    const content = await generateNaraModule(outline, rawContext, segments, model);

    db.prepare("INSERT INTO documents (id, title, content, summary, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(docId, title, content, outline.executiveSummary || "", Date.now());

    return sendJSON(res, { success: true, docId, title, content_length: content.length });
  }

  return false;
}

module.exports = {
  handleTopicsRoutes
};
