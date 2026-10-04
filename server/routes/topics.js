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

PRINSIP PEDAGOGI KOGNITIF (WAJIB DIPATUHI):
1. JANGAN MULAI DENGAN HAFALAN TANGGAL/RUMUS KERING. Mulailah dengan memberikan "peta mental" yang menenangkan pikiran siswa: pahami dulu benturan kepentingan, motif para aktor, atau logika kausalitasnya.
2. BAHASA MENTOR EMPATIS & TRANSPARAN: Gunakan gaya bahasa yang renyah, jelas, komunikatif, dan lugas (seperti ChatGPT / tutor privat terbaik). Hindari bahasa birokratis atau teks klise yang kaku.
3. KELENGKAPAN SEJARAH & KURIKULUM: Pastikan fakta penting kurikulum resmi Indonesia (tokoh, lokasi, insiden pemicu, tanggal kunci) tetap tercakup lengkap, namun DISAJIKAN DALAM RANTAI SEBAB-AKIBAT LOGIS, bukan sekadar daftar poin hafalan mati.

SUSUNAN WAJIB STRUKTUR MODUL BELAJAR:

### ${formalTitle || topic}

Kalimat pembuka: Kalimat orientasi yang menenangkan dan memandu pola pikir siswa (Contoh: "Kalau tujuanmu belajar untuk memahami dan bisa menjawab soal, jangan mulai dengan menghafal tanggal. Kita pahami dulu alur peristiwanya...").

#### 1. Inti Cerita & Peta Benturan Kepentingan
- Rumuskan inti masalah dalam 1-2 kalimat padat.
- Bedah pihak-pihak yang terlibat beserta motif/kepentingannya yang bertabrakan (gunakan poin berbendera/ikon jika relevan, misal 🇮🇩 Indonesia vs 🇳🇱 NICA vs 🇬🇧 Sekutu).
- Jelaskan mengapa benturan tersebut tak terhindarkan.

#### 2. Latar Belakang & Rantai Kausalitas (Mengapa Terjadi?)
- Jelaskan kronologi mengapa peristiwa ini meletus secara bertahap.
- Bedah insiden pemicu emosional/spesifik di lapangan secara hidup dan faktual (misal: insiden Jalan Bali, penginjakan lencana Merah Putih, dsb).

#### 3. Bedah Asal-Usul Nama & Jebakan Konseptual (Common Pitfalls)
- Soroti bagian yang PALING SERING MEMBUAT SISWA SALAH / TERKECOH di soal ujian.
- Jelaskan asal-usul istilah/nama konsepnya (misal: "Apa itu Medan Area? Medan Area bukan sekadar nama pertempuran, melainkan papan batas Fixed Boundaries...").
- Koreksi penyederhanaan yang keliru (misal: "Jangan menyederhanakan menjadi Indonesia vs Inggris saja, karena...").

#### 4. Peta Alur Kausalitas Sederhana (Vertical Pipeline)
Sajikan alur peristiwa atau logika tahap demi tahap menggunakan panah vertikal sederhana agar mudah dipotret secara visual ke dalam memori jangka panjang:
[Titik Awal]
↓
[Peristiwa 1]
↓
[Eskalasi / Pemicu]
↓
[Puncak Perlawanan]
↓
[Dampak / Hasil Akhir]

#### 5. Kancing Memori Soal (Anchor Q&A)
Pasangkan langsung kata kunci soal ujian yang paling sering muncul dengan jawaban spesifiknya:
- Kalau ditanya "apa penyebab langsungnya?" ➔ Ingat: [Pemicu spesifik]
- Kalau ditanya "apa yang menjadi tanda khas/pembedanya?" ➔ Ingat: [Ciri unik/pembeda]

#### 6. 🧠 Cara Menghafalnya (Rantai Kausalitas 1 Baris & Tanggal Jangkar)
- **Rantai 1 Baris:** Tuliskan rantai mnemonik ringkas: A ➔ B ➔ C ➔ D ➔ E
- **Tanggal/Angka Kunci (Maksimal 2-3 Saja):** Sajikan tabel mini 2-3 baris tanggal paling menentukan, buang tanggal sampingan yang membebani memori.

#### 7. Panduan Menjawab Soal Ujian (Actionable Exam Mastery)
Tunjukkan cara mentransfer pemahaman ini saat menjawab soal ujian sekolah maupun soal penalaran analitis/HOTS:
- Berikan contoh pertanyaan ujian tipikal: "Kalau nanti keluar soal: '...?'"
- Contoh jawaban lemah/dangkal yang sering ditulis siswa (dan mengapa itu kurang tepat).
- Contoh formulasi jawaban kuat & berbobot ilmiah (yang menunjukkan analisis sebab-akibat komprehensif).

Penutup Belajar Aktif:
Tutup dengan kalimat pemantik belajar aktif ke fitur Tanka: "Setelah paham alur dasarnya, buka tab **Uji Feynman** untuk jelaskan kembali dengan bahasamu sendiri, atau uji di tab **Latihan Kuis**!"

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
