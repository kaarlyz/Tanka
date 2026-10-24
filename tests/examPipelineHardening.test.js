const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  splitDocumentIntoQuestionChunks,
  detectSubtes,
  pipelineToTankaFormat,
} = require("../server/services/examPipeline");

test("Exam Pipeline Hardening: splitDocumentIntoQuestionChunks tidak memotong di Bentuk Soal dan menjaga keutuhan butir soal", () => {
  // Mock 6 butir soal TKA resmi dengan Hierarki Indikator, Indikator (N), Bentuk Soal, dan Gambar
  const mockTkaText = `Soal TKA Ekonomi (Pilihan) SMA/MA/SMK Tahun 2025

S Hierarki Indikator
Elemen: Konsep Dasar Ilmu Ekonomi
Kompetensi: Menganalisis kelangkaan
Indikator: Menentukan solusi permasalahan kelangkaan sumber daya ekonomi (1)
2SEKOKDIKDEEO1SA-000000-0453 Bentuk Soal : Pilihan Ganda
Di kawasan pinggiran kota besar alih fungsi lahan meningkat...
Apa penyebab peralihan lahan?
A. Opsi A
B. Opsi B

S Hierarki Indikator
Elemen: Konsep Dasar Ilmu Ekonomi
Kompetensi: Menganalisis biaya peluang
Indikator: Menentukan biaya peluang berdasarkan kegiatan ekonomi. (2)
25EKOKDIKDEEO1SA-000000-0304 Bentuk Soal : Pilihan Ganda
Safia baru saja menyelesaikan pendidikan S1...
Berapakah jumlah biaya peluang yang dikorbankan?
A. Rp10.000.000,00
B. Rp16.000.000,00

[Gambar: /uploads/exam_images/ekonomi_img-018.png]

S Hierarki Indikator
Elemen: Ekonomi Mikro dan Makro
Kompetensi: Menganalisis kurva permintaan
Indikator: Menginterpretasikan grafik permintaan berdasarkan pergeseran kurva (3)
25EKOEMMIKDE01SA-000000-0305 Bentuk Soal : Pilihan Ganda
Berdasarkan grafik di atas, pergeseran kurva disebabkan oleh...
A. Penurunan pendapatan
B. Kenaikan harga barang substitusi

S Hierarki Indikator
Elemen: Ekonomi Mikro dan Makro
Kompetensi: Elastisitas
Indikator: Menghitung koefisien elastisitas penawaran (4)
25EKOEMMIKDE01SA-000000-0306 Bentuk Soal : Pilihan Ganda
Tabel harga dan jumlah penawaran...
A. 0.5
B. 1.2

S Hierarki Indikator
Elemen: Ekonomi Mikro dan Makro
Kompetensi: Keseimbangan pasar
Indikator: Menentukan harga keseimbangan pasar (5)
25EKOEMMIKDE01SA-000000-0307 Bentuk Soal : Pilihan Ganda
Fungsi permintaan Pd = 100 - 2Q...
A. Rp50
B. Rp60

S Hierarki Indikator
Elemen: Ekonomi Makro
Kompetensi: Kebijakan Fiskal
Indikator: Menganalisis dampak defisit anggaran (6)
25EKOEMMIKDE01SA-000000-0308 Bentuk Soal : Pilihan Ganda
Ketika pemerintah meningkatkan belanja infrastruktur...
A. Pertumbuhan ekonomi meningkat
B. Inflasi terkendali
`;

  const chunks = splitDocumentIntoQuestionChunks(mockTkaText);

  // 6 butir soal dengan batas CHUNK_SOAL_COUNT = 5 harus menghasilkan 2 chunks (5 soal + 1 soal)
  assert.equal(chunks.length, 2, "6 soal harus di-batch menjadi 2 chunk");

  // Chunk 1 harus memuat Soal 1 s/d 5 utuh tanpa ada yang terpotong di leher
  const chunk1 = chunks[0];
  assert.ok(chunk1.includes("Indikator: Menentukan solusi permasalahan kelangkaan"), "Chunk 1 memuat Soal 1");
  assert.ok(chunk1.includes("Bentuk Soal : Pilihan Ganda"), "Chunk 1 mempertahankan Bentuk Soal");
  assert.ok(chunk1.includes("Indikator: Menentukan harga keseimbangan pasar (5)"), "Chunk 1 memuat Soal 5");

  // Gambar pada Soal 3 harus tetap melekat di chunk 1 pada Soal 3
  assert.ok(chunk1.includes("[Gambar: /uploads/exam_images/ekonomi_img-018.png]"), "Tag gambar tetap utuh");

  // Chunk 2 harus memuat Soal 6 utuh
  const chunk2 = chunks[1];
  assert.ok(chunk2.includes("Indikator: Menganalisis dampak defisit anggaran (6)"), "Chunk 2 memuat Soal 6");
});

test("Exam Pipeline Hardening: Verifikasi dokumen naskah TKA 30 soal (ekonomi_full.txt jika ada)", () => {
  const ekonomiPath = "/home/vallencia/Documents/TKA_Raw_Sources/ekonomi_full.txt";
  if (!fs.existsSync(ekonomiPath)) {
    return; // Lewati jika file raw tidak ada di host runner
  }

  const rawText = fs.readFileSync(ekonomiPath, "utf8");
  const chunks = splitDocumentIntoQuestionChunks(rawText);

  // 30 soal dibagi 5 per chunk = tepat 6 chunks
  assert.equal(chunks.length, 6, "30 soal harus menghasilkan tepat 6 chunks");

  // Verifikasi setiap nomor 1 s/d 30 terekstrak di chunks
  for (let num = 1; num <= 30; num++) {
    const found = chunks.some(chunk => {
      const rx = new RegExp(`\\(${num}\\)`, "m");
      return rx.test(chunk);
    });
    assert.ok(found, `Nomor soal (${num}) harus ditemukan di salah satu chunk tanpa hilang`);
  }
});

test("Exam Pipeline Hardening: detectSubtes menghormati domain TKA Ekonomi dan tidak dibajak kata kunci TPS", () => {
  // Kasus 1: Soal Ekonomi memuat kata 'harga' dan 'tabel' (TPS biasa mendeteksi pengetahuan_kuantitatif)
  const qHarga = "Berdasarkan tabel harga beras dan jumlah permintaan di atas, tentukan elastisitas harga!";
  const subtes1 = detectSubtes(qHarga, ["A. 1.5", "B. 2.0"], "Soal TKA Ekonomi SMA 2025");
  assert.equal(subtes1, "mapel_tka", "Judul TKA Ekonomi harus menghasilkan subtes mapel_tka");

  // Kasus 2: Soal Ekonomi tanpa judul eksplisit tapi konten memuat konsep ekonomi mikro/makro
  const qMakro = "Pemerintah menerapkan kebijakan moneter kontraktif untuk mengatasi inflasi dan kenaikan suku bunga bank.";
  const subtes2 = detectSubtes(qMakro, ["A. Menjual SBI", "B. Menurunkan giro wajib"]);
  assert.equal(subtes2, "mapel_tka", "Keyword inflasi dan moneter harus masuk mapel_tka");

  // Kasus 3: Soal Matematika fungsi murni (bukan ekonomi) tetap penalaran_matematika
  const qMtk = "Diketahui fungsi f(x) = 2x^3 - 5x + 3. Nilai turunan f'(2) adalah...";
  const subtes3 = detectSubtes(qMtk, ["A. 19", "B. 20"]);
  assert.equal(subtes3, "penalaran_matematika", "Soal turunan murni tetap penalaran_matematika");

  // Kasus 4: Soal Sosiologi tetap mapel_tka
  const qSos = "Proses diferensiasi sosial horizontal dalam masyarakat multikultural ditandai oleh...";
  const subtes4 = detectSubtes(qSos, ["A. Ras", "B. Kelas ekonomi"]);
  assert.equal(subtes4, "mapel_tka", "Soal sosiologi harus masuk mapel_tka");
});

test("Exam Pipeline Hardening: pipelineToTankaFormat memastikan urutan nomor soal kanonikal 1 s/d N", () => {
  // Input dengan nomor teracak
  const mockPipelineResult = {
    soal: [
      { nomor: 3, pertanyaan: "Soal tiga", subtes: "mapel_tka", _jawaban_final: "C" },
      { nomor: 1, pertanyaan: "Soal satu", subtes: "mapel_tka", _jawaban_final: "A" },
      { nomor: 2, pertanyaan: "Soal dua", subtes: "mapel_tka", _jawaban_final: "B" },
    ],
    terpotong: [],
    stats: { extracted: 3, solved: 3, written: 3, verified: 0, conflicts: 0, flagged: [] }
  };

  const { quizQuestions, studyGuide } = pipelineToTankaFormat(mockPipelineResult, "TKA Ekonomi");

  // quizQuestions harus urut 1, 2, 3
  assert.equal(quizQuestions.length, 3);
  assert.equal(quizQuestions[0].id, 1);
  assert.equal(quizQuestions[1].id, 2);
  assert.equal(quizQuestions[2].id, 3);

  // studyGuide harus memuat Soal 1 sebelum Soal 2 dan Soal 2 sebelum Soal 3
  const pos1 = studyGuide.indexOf("Soal 1");
  const pos2 = studyGuide.indexOf("Soal 2");
  const pos3 = studyGuide.indexOf("Soal 3");
  assert.ok(pos1 < pos2, "Soal 1 harus muncul sebelum Soal 2 di study guide");
  assert.ok(pos2 < pos3, "Soal 2 harus muncul sebelum Soal 3 di study guide");
});
