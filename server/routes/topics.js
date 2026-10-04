const { db } = require("../db");
const { callRouter, multiSourceAcademicSearch } = require("../ai");

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
3. Buat 2 atau 3 pertanyaan diagnostik interaktif singkat terfokus pada sub-topik tersebut untuk memastikan materi yang disusun tepat sasaran. Tiap pertanyaan memiliki 3 atau 4 pilihan opsi ringkas.

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

    const prompt = `Anda adalah pendidik ahli spesialis kurikulum nasional (Kurikulum Merdeka / SMA / UTBK) dan penyusunan modul ajar berstandar tinggi.
Pengguna ingin mempelajari materi dari topik spesifik: "${topic}"
Judul Formal Modul: "${formalTitle || topic}"
Bidang / Mata Pelajaran: "${subject || "Umum"}"
Preferensi / Kebutuhan Pembelajar:
${Object.entries(answers).map(([k, v]) => `- ${k}: ${v}`).join("\n")}
${webContext}
TUGAS UTAMA:
Susun dokumen materi ajar belajar mandiri yang MENDALAM, TAJAM, TERFOKUS 100% PADA SUB-TOPIK YANG DIMINTA, dan SESUAI KURIKULUM RESMI INDONESIA.

PRINSIP KUNCI RUANG LINGKUP:
1. FOKUS 100% PADA SUB-TOPIK YANG DIMINTA (ANTI-SCOPE-CREEP).
2. PASANGAN DIKOTOMI & LAWAN TANDING KONSEP UJIAN.
3. KELENGKAPAN TAKSONOMI KURIKULUM RESMI (BUKU TEKS & RUANGGURU).
4. GROUNDED KE REFERENSI PENCARIAN RESMI.

STRUKTUR ISI MODUL:
1. **Peta Konsep & Inti Sub-Topik**
2. **Bedah Mendalam Butir-Butir Materi Baku**
3. **Komparasi Lawan Tanding / Garis Batas Kritis**
4. **Pola Soal Ujian & Jebakan Konseptual (Common Pitfalls)**
5. **Studi Kasus Kontekstual & Bedah Solusi Nyata**

Tulis materi secara padat, tajam, dan berbobot akademis tinggi dalam bahasa Indonesia yang lugas dan enak dipelajari.`;

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

  return false;
}

module.exports = {
  handleTopicsRoutes
};
