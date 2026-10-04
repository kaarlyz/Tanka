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

  // 2. POST /api/ai/topic-generate - generate full academic document from topic + user clarification answers
  if (req.method === "POST" && pathname === "/api/ai/topic-generate") {
    const { topic, formalTitle, subject, answers = {}, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    if (!topic) return sendJSON(res, { error: "Topic required" }, 400);

    let webContext = "";
    try {
      const webRes = await multiSourceAcademicSearch(formalTitle || topic, subject);
      if (webRes) {
        webContext = `\nHASIL PENELUSURAN REFERENSI KURIKULUM & SUMBER INTERNET MULTI-SUMBER:\n${webRes}\n\n`;
      }
    } catch (err) {
      console.error("Multi-source academic search for topic generate failed:", err);
    }

    const prompt = `${NARA_GLOBAL_PERSONA}

Pengguna ingin mempelajari topik: "${formalTitle || topic}" (Mata Pelajaran: ${subject || "Umum"}).
Preferensi/fokus belajar pengguna: ${JSON.stringify(answers)}.
${webContext}

PRINSIP PEDAGOGI NARA:
1. JANGAN TERPAKU PADA JUMLAH BAB KAKU: Tentukan jumlah bab secara dinamis (3, 4, atau 5 bab) sesuai kebutuhan materi.
2. JANGAN MULAI DENGAN HAFALAN KERING: Awali bab 1 dengan situasi masalah nyata atau pertanyaan pemantik yang hangat.
3. GAYA BERTUTUR PAPAN TULIS: Gunakan kalimat lengkap, mengalir, maksimal 3-4 kalimat per paragraf. Hindari gaya kamus/telegram.
4. PEMISAHAN MATERI & PENGAYAAN: Jika menyajikan analogi baru atau contoh di luar kurikulum standar, tandai dengan:
   > 💡 **Insight Nara (Pengayaan):** [Analogi/contoh...]
5. STRUKTUR BAB BERSIH: Gunakan '## Bab [N]: [Nama Bab]' dan '### [Nama Sub-konsep]' agar otomatis terpetakan menjadi Mind Map dan Chapter Reader.

SUSUNAN MODUL:
# ${formalTitle || topic}
> [Kalimat orientasi singkat yang menenangkan dan memandu pola pikir siswa]

## Bab 1: [Fondasi & Pertanyaan Masalah Nyata]
[Uraian situasi, motif, atau masalah awal]

## Bab 2: [Mekanisme Inti & Rantai Sebab-Akibat]
[Uraian bertutur konsep utama, rumus KaTeX jika eksak, dan alur proses]

(Lanjutkan Bab 3, dst sesuai kedalaman topik)

## Bab [Terakhir]: Kancing Memori Soal & Panduan Ujian (Exam Mastery)
- **Alur Kausalitas Sederhana:** Sajikan alur peristiwa menggunakan panah (A ➔ B ➔ C).
- **Kancing Memori Soal:** Pasangkan kata kunci ujian dengan konsep jawabannya.
- **Poin Pengecoh yang Sering Mengecoh:** Bedah salah kaprah siswa.

Tulis modul secara lengkap dan nyaman dibaca siswa SMA.`;

    const content = await callRouter([
      { role: "system", content: "You are Nara, an empathetic and articulate study tutor who explains concepts from first principles." },
      { role: "user", content: prompt }
    ], model, 0.25);

    const docId = "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const title = (formalTitle || topic).trim();

    db.prepare("INSERT INTO documents (id, title, content, summary, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(docId, title, content, "", Date.now());

    // Segment and store canonical concepts for search-generated topics to feed quizzes & flashcards
    try {
      const { segmentDocumentText, extractConceptsAndOutline } = require("../services/curriculumPipeline");
      const segments = segmentDocumentText(content, "web_search");
      const insertSeg = db.prepare("INSERT INTO document_segments (id, doc_id, segment_index, source_type, raw_text, normalized_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for (const seg of segments) {
        insertSeg.run(`seg_${docId}_${seg.index}`, docId, seg.index, "web_search", seg.text, seg.text, Date.now());
      }
      const outline = await extractConceptsAndOutline(title, content, segments, model);
      if (outline && Array.isArray(outline.concepts)) {
        const insertConcept = db.prepare("INSERT INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        for (const c of outline.concepts) {
          const conceptId = `${docId}_${c.id || Math.random().toString(36).slice(2, 6)}`;
          const def = c.definisi_baku || c.definition || "";
          const extra = JSON.stringify({ rumus: c.rumus || "", tokoh: c.tokoh || [], salah_kaprah: c.salah_kaprah || "" });
          insertConcept.run(conceptId, docId, c.name, def, extra, c.origin || "source", Date.now());
        }
      }
    } catch (e) {
      console.warn("[tanka] Failed to save concepts for topic:", e.message);
    }

    return sendJSON(res, { success: true, docId, title, content_length: content.length });
  }

  return false;
}

module.exports = {
  handleTopicsRoutes
};
