"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const {
  splitDocumentIntoQuestionChunks,
  propagatePassageStimulus
} = require("../server/services/examPipeline");

const TANKA_DB_PATH = path.join(__dirname, "..", "tanka.sqlite");
const BINDO_FULL_PATH = "/home/vallencia/Documents/TKA_Raw_Sources/bindo_wajib_full.txt";

test("Passage Range Chunking: splitDocumentIntoQuestionChunks menempatkan wacana baru di awal chunk soal yang bersangkutan", () => {
  const mockText = `Soal TKA Bahasa Indonesia Wajib

Teks “Tradisi Buwuhan” untuk soal nomor 1 s.d. 4

Bentuk Soal : Pilihan Ganda
Tradisi Buwuhan adalah tradisi gotong royong di Jawa.

S Hierarki Indikator
Kompetensi: Pemahaman Tekstual
Indikator: Menentukan makna kata (1)
Apa makna kata hajatan?
A. Opsi A
B. Opsi B

S Hierarki Indikator
Kompetensi: Pemahaman Inferensial
Indikator: Menemukan gagasan pendukung (2)
Gagasan pendukung paragraf dua adalah...
A. Opsi A
B. Opsi B

S Hierarki Indikator
Kompetensi: Pemahaman Inferensial
Indikator: Hubungan makna paragraf (3)
Hubungan paragraf kedua dan ketiga adalah...
A. Opsi A
B. Opsi B

S Hierarki Indikator
Kompetensi: Evaluasi
Indikator: Menilai bahasa (4)
Kalimat penutup yang sesuai adalah...
A. Opsi A
B. Opsi B

Teks “Layur, Teruslah berlayar” untuk soal nomor 5 s.d. 8

Layur, Teruslah Berlayar
“Bapak, pulanglah,” lirih Layur berharap di tepi pantai.
Cerita perjuangan Layur dan Bapak nelayan penangkap ikan.

S Hierarki Indikator
Kompetensi: Pemahaman Tekstual
Indikator: Mengidentifikasi karakter (5)
Bagaimana sifat yang dimiliki oleh Layur?
A. Opsi A
B. Opsi B

S Hierarki Indikator
Kompetensi: Pemahaman Inferensial
Indikator: Menyimpulkan konflik (6)
Apa yang menyebabkan Layur kesal?
A. Opsi A
B. Opsi B
`;

  const chunks = splitDocumentIntoQuestionChunks(mockText);

  assert.ok(chunks.length >= 2, "Harus menghasilkan minimal 2 chunks");

  const chunk1 = chunks[0];
  const chunk2 = chunks[1];

  // Chunk 1 harus memuat Soal 1 s/d 4 dan TIDAK boleh memuat teks cerita Layur
  assert.ok(chunk1.includes("Tradisi Buwuhan"), "Chunk 1 harus memuat wacana Tradisi Buwuhan");
  assert.ok(chunk1.includes("Apa makna kata hajatan?"), "Chunk 1 harus memuat Soal 1");
  assert.ok(!chunk1.includes("Layur, Teruslah Berlayar"), "Chunk 1 TIDAK boleh memuat teks cerita Layur");

  // Chunk 2 harus dimulai dengan deklarasi wacana Layur dan memuat Soal 5
  assert.ok(chunk2.includes("Teks “Layur, Teruslah berlayar”"), "Chunk 2 harus memuat header Teks Layur");
  assert.ok(chunk2.includes("Layur, Teruslah Berlayar"), "Chunk 2 harus memuat naskah cerita Layur");
  assert.ok(chunk2.includes("Bagaimana sifat yang dimiliki oleh Layur?"), "Chunk 2 harus memuat Soal 5");
});

test("Passage Range Chunking: Verifikasi dokumen riil bindo_wajib_full.txt jika ada", () => {
  if (!fs.existsSync(BINDO_FULL_PATH)) {
    return;
  }

  const rawText = fs.readFileSync(BINDO_FULL_PATH, "utf8");
  const chunks = splitDocumentIntoQuestionChunks(rawText);

  // Chunk 1 tidak boleh memuat cerita Layur
  assert.ok(!chunks[0].includes("Layur, Teruslah Berlayar"), "Chunk 1 tidak boleh menyisakan naskah Layur dari Soal 4");

  // Chunk 2 harus diawali dengan header wacana Layur untuk Soal 5 s.d. 8
  assert.ok(chunks[1].includes("Teks “Layur, Teruslah berlayar” untuk soal nomor 5 s.d. 8"), "Chunk 2 harus diawali header wacana Layur");
  assert.ok(chunks[1].includes("Layur, Teruslah Berlayar"), "Chunk 2 harus memuat cerita Layur");
  assert.ok(chunks[1].includes("(5)"), "Chunk 2 harus memuat Soal 5");
});

test("Stimulus Propagation: Mewariskan teks wacana dan gambar ke seluruh soal dalam rentang", () => {
  const mockRawText = `
Teks “Layur, Teruslah berlayar” untuk soal nomor 5 s.d. 8

Layur, Teruslah Berlayar
“Bapak, pulanglah,” lirih Layur berharap. Ini hari keenam.

S Hierarki Indikator (5)
Pertanyaan 5?

S Hierarki Indikator (6)
Pertanyaan 6?

[Gambar: /uploads/exam_images/pantai_img-020.png]
Teks “Pantai Bersih Tanpa Sampah” untuk soal nomor 9 s.d. 11

Pantai Bersih Tanpa Sampah
Di sebuah daerah wisata yang terkenal dengan keindahan pantainya...

S Hierarki Indikator (9)
Pertanyaan 9?
`;

  const questions = [
    { id: 5, question: "Pertanyaan 5?", stimulus: null },
    { id: 6, question: "Pertanyaan 6?", stimulus: "" },
    { id: 7, question: "Pertanyaan 7?", stimulus: null },
    { id: 8, question: "Pertanyaan 8?", stimulus: null },
    { id: 9, question: "Pertanyaan 9?", stimulus: null, imageUrl: null },
    { id: 10, question: "Pertanyaan 10?", stimulus: null },
    { id: 11, question: "Pertanyaan 11?", stimulus: null },
  ];

  propagatePassageStimulus(questions, mockRawText);

  // Soal 5 s.d. 8 harus memiliki stimulus Layur lengkap
  for (let num = 5; num <= 8; num++) {
    const q = questions.find(item => item.id === num);
    assert.ok(q, `Soal ${num} harus ada`);
    assert.ok(q.stimulus, `Soal ${num} harus memiliki stimulus`);
    assert.ok(q.stimulus.includes("Layur, Teruslah Berlayar"), `Soal ${num} harus memuat judul wacana Layur`);
    assert.ok(q.stimulus.includes("Bapak, pulanglah"), `Soal ${num} harus memuat kutipan naskah Layur`);
  }

  // Soal 9 s.d. 11 harus memiliki stimulus Pantai Bersih Tanpa Sampah
  for (let num = 9; num <= 11; num++) {
    const q = questions.find(item => item.id === num);
    assert.ok(q, `Soal ${num} harus ada`);
    assert.ok(q.stimulus, `Soal ${num} harus memiliki stimulus`);
    assert.ok(q.stimulus.includes("Pantai Bersih Tanpa Sampah"), `Soal ${num} harus memuat judul wacana Pantai Bersih`);
  }

  // Soal 9 harus mewarisi visual imageUrl dari wacana
  const q9 = questions.find(item => item.id === 9);
  assert.equal(q9.imageUrl, "/uploads/exam_images/pantai_img-020.png", "Soal 9 harus mewarisi imageUrl wacana");
});

test("Database Sync: Sinkronisasi database tanka.sqlite doc_1792838551616_b7k6g stimulus wacana lengkap", () => {
  if (!fs.existsSync(TANKA_DB_PATH)) {
    return;
  }

  const db = new DatabaseSync(TANKA_DB_PATH, { readOnly: true });
  try {
    const quizRow = db.prepare("SELECT questions FROM quizzes WHERE doc_id = ?").get("doc_1792838551616_b7k6g");
    if (!quizRow) return;

    const questions = JSON.parse(quizRow.questions);

    // Soal 5, 6, 7, 8: memuat stimulus Layur
    for (let num = 5; num <= 8; num++) {
      const q = questions.find(item => item.id === num);
      assert.ok(q, `Soal ${num} harus ada`);
      assert.ok(q.stimulus && q.stimulus.length > 500, `Soal ${num} harus memiliki stimulus Layur lengkap (>500 chars)`);
      assert.ok(q.stimulus.includes("Layur, Teruslah Berlayar"), `Soal ${num} harus memuat judul Layur`);
      assert.ok(q.stimulus.includes("Bapak, pulanglah"), `Soal ${num} harus memuat kutipan cerita Layur`);
    }

    // Soal 9, 10, 11: memuat stimulus Pantai Bersih
    for (let num = 9; num <= 11; num++) {
      const q = questions.find(item => item.id === num);
      assert.ok(q, `Soal ${num} harus ada`);
      assert.ok(q.stimulus && q.stimulus.length > 500, `Soal ${num} harus memiliki stimulus Pantai Bersih lengkap`);
      assert.ok(q.stimulus.includes("Pantai Bersih Tanpa Sampah"), `Soal ${num} harus memuat judul Pantai Bersih`);
    }

    // Soal 12, 13, 14: memuat stimulus Pulihkan Ekosistem
    for (let num = 12; num <= 14; num++) {
      const q = questions.find(item => item.id === num);
      assert.ok(q, `Soal ${num} harus ada`);
      assert.ok(q.stimulus && q.stimulus.length > 500, `Soal ${num} harus memiliki stimulus Pulihkan Ekosistem`);
      assert.ok(q.stimulus.includes("Pulihkan Ekosistem"), `Soal ${num} harus memuat judul Pulihkan Ekosistem`);
    }

    // Soal 15, 16, 17: memuat stimulus Prospek Ekonomi Global
    for (let num = 15; num <= 17; num++) {
      const q = questions.find(item => item.id === num);
      assert.ok(q, `Soal ${num} harus ada`);
      assert.ok(q.stimulus && q.stimulus.length > 500, `Soal ${num} harus memiliki stimulus Prospek Ekonomi Global`);
      assert.ok(q.stimulus.includes("Prospek Ekonomi Global"), `Soal ${num} harus memuat judul Prospek Ekonomi Global`);
    }

    // Soal 18, 19, 20, 21: memuat stimulus Tari Hudog
    for (let num = 18; num <= 21; num++) {
      const q = questions.find(item => item.id === num);
      assert.ok(q, `Soal ${num} harus ada`);
      assert.ok(q.stimulus && q.stimulus.length > 500, `Soal ${num} harus memiliki stimulus Tari Hudog`);
      assert.ok(q.stimulus.includes("Tari Hudog"), `Soal ${num} harus memuat judul Tari Hudog`);
    }

    // Soal 22, 23, 24, 25: memuat stimulus Tradisi Belis
    for (let num = 22; num <= 25; num++) {
      const q = questions.find(item => item.id === num);
      assert.ok(q, `Soal ${num} harus ada`);
      assert.ok(q.stimulus && q.stimulus.length > 500, `Soal ${num} harus memiliki stimulus Tradisi Belis`);
      assert.ok(q.stimulus.includes("Tradisi Belis"), `Soal ${num} harus memuat judul Tradisi Belis`);
    }
  } finally {
    db.close();
  }
});
