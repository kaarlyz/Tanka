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

    const prompt = `Anda adalah seorang tutor/mentor belajar pribadi tingkat elit untuk siswa SMA dan persiapan UTBK.
Pengguna ingin mempelajari topik berikut secara mendalam, runut, dan bebas dari kebingungan hafalan buta:
"${topic}"
Judul Materi: "${formalTitle || topic}"
Mata Pelajaran: "${subject || "Umum"}"
${webContext}

PRINSIP PEDAGOGI KOGNITIF & PENYUSUNAN BAB DINAMIS:
1. JANGAN TERPAKU PADA JUMLAH BAB KAKU: Anda BEBAS MENENTUKAN JUMLAH BAB SECARA OTONOM (misal: 3 bab untuk konsep padat, atau 4-7 bab untuk materi sejarah/teori luas). Pikirkan berapa bab yang paling efektif agar siswa memahami dari fondasi dasar sampai mahir.
2. JANGAN MULAI DENGAN HAFALAN TANGGAL/RUMUS KERING: Awali bab 1 dengan "peta mental" yang menenangkan: pahami motif aktor, benturan kepentingan, atau kausalitas dasar.
3. BAHASA MENTOR EMPATIS & TRANSPARAN: Gunakan gaya bahasa yang renyah, jelas, komunikatif, dan lugas (ala tutor privat terbaik).
4. SETIAP BAB MEMILIKI SUB-KONSEP BERSIH: Gunakan '## Bab [N]: [Nama Bab]' untuk setiap bab utama dan '### [Nama Sub-konsep]' untuk setiap gagasan kunci agar otomatis terpetakan menjadi Mind Map dan Chapter Reader interaktif.

SUSUNAN WAJIB STRUKTUR MODUL BELAJAR:

# ${formalTitle || topic}

> Kalimat orientasi yang menenangkan dan memandu pola pikir siswa (Contoh: "Kalau tujuanmu belajar untuk memahami dan bisa menjawab soal, jangan mulai dengan menghafal tanggal. Kita pahami dulu alur peristiwanya...").

## Bab 1: [Inti Cerita & Peta Benturan Kepentingan / Fondasi Dasar]
- Rumuskan inti masalah dalam 1-2 kalimat padat.
- Bedah pihak-pihak yang terlibat beserta motif/kepentingannya yang bertabrakan (gunakan poin berbendera/ikon jika relevan, misal 🇮🇩 Indonesia vs 🇳🇱 NICA vs 🇬🇧 Sekutu).
- Jelaskan mengapa benturan tersebut tak terhindarkan.

## Bab 2: [Rantai Kausalitas & Kronologi / Mekanisme Inti]
- Jelaskan kronologi mengapa peristiwa ini meletus secara bertahap.
- Bedah insiden pemicu emosional/spesifik di lapangan secara hidup dan faktual (misal: insiden Jalan Bali, penginjakan lencana Merah Putih, dsb).

(Lanjutkan Bab 3, 4, dst sesuai evaluasi pedagogis terbaik Anda untuk mengupas topik secara tuntas).

## Bab [Terakhir]: Kancing Memori Soal & Panduan Ujian (Exam Mastery)
- **Peta Alur Kausalitas Sederhana:** Sajikan alur peristiwa menggunakan panah vertikal (A ↓ B ↓ C).
- **Kancing Memori Soal (Anchor Q&A):** Pasangkan kata kunci ujian dengan jawaban spesifiknya (Misal: "Penyebab langsung?" ➔ Insiden Jalan Bali).
- **🧠 Cara Menghafalnya:** Rantai mnemonik ringkas 1 baris (A ➔ B ➔ C ➔ D) dan tabel 2-3 tanggal/angka jangkar esensial.
- **Panduan Menjawab Soal Ujian (HOTS):** Contoh perbandingan jawaban dangkal vs formulasi jawaban analitis berbobot.

Penutup Belajar Aktif:
Tutup dengan kalimat pemantik belajar aktif: "Setelah paham alur dasarnya, buka tab **Uji Feynman** untuk jelaskan kembali dengan bahasamu sendiri, atau uji di tab **Latihan Kuis**!"

Tulis modul secara lengkap, mendalam, dan memuaskan rasa ingin tahu siswa tanpa ada bagian penting yang terpotong.`;

    const content = await callRouter([
      { role: "system", content: "Anda adalah tutor privat elit yang menjelaskan materi pelajaran dengan pendekatan alur kausalitas, bebas hafalan buta, dan tajam untuk menjawab soal ujian." },
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
