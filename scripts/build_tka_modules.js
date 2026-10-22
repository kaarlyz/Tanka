const fs = require("fs");
const path = require("path");
const { db } = require("../server/db");
const { callRouter } = require("../server/ai");
const { safeJsonParse } = require("../server/utils/jsonParser");

const SOURCES_DIR = "/home/vallencia/Documents/TKA_Raw_Sources";

// Define 22 Canonical TKA Modules across 5 Subjects
const MODULES = [
  // --- 1. MATEMATIKA WAJIB (4 Modul) ---
  {
    subject: "Matematika Wajib",
    sourceFile: "mtk_wajib_full.txt",
    id: "tka_mtk_01_bilangan_eksponen",
    title: "TKA Matematika Wajib - Bilangan Real, Himpunan & Eksponen",
    scope: "Himpunan bilangan asli/cacah/prima, operasi irisan dan gabungan, penyederhanaan bilangan berpangkat bulat dan pecahan, sifat operasi hitung dan operasi biner bilangan asli.",
    indicators: "Indikator 1 (Irisan & gabungan himpunan), Indikator 2 (Eksponen & bentuk akar), Indikator 3 (Operasi biner & sifat bilangan asli)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Matematika Wajib",
    sourceFile: "mtk_wajib_full.txt",
    id: "tka_mtk_02_aljabar_fungsi",
    title: "TKA Matematika Wajib - Aljabar, Fungsi & Barisan Deret",
    scope: "Invers fungsi linear dan kontekstual, syarat komposisi dua fungsi, barisan dan deret aritmetika/geometri, pemodelan sistem persamaan dan pertidaksamaan linear (SPLDV/SPtLDV).",
    indicators: "Indikator 4 (Invers fungsi kontekstual), Indikator 5 (Komposisi fungsi), Indikator 6-7 (Barisan & deret), Indikator 8-9 (SPLDV & grafik daerah penyelesaian)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Matematika Wajib",
    sourceFile: "mtk_wajib_full.txt",
    id: "tka_mtk_03_geometri_transformasi",
    title: "TKA Matematika Wajib - Geometri, Dimensi Tiga & Transformasi",
    scope: "Hubungan antar garis dan sudut, dimensi tiga kedudukan garis/bidang bangun ruang, teorema Pythagoras & luas/keliling gabungan, volume bangun ruang, komposisi transformasi geometri (refleksi, translasi, rotasi), perbandingan trigonometri.",
    indicators: "Indikator 10-13 (Sudut, dimensi tiga, Pythagoras), Indikator 14 (Komposisi transformasi geometri), Indikator 15-19 (Pengukuran keliling, luas, volume), Indikator 20 (Trigonometri segitiga siku-siku)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Matematika Wajib",
    sourceFile: "mtk_wajib_full.txt",
    id: "tka_mtk_04_statistika_peluang",
    title: "TKA Matematika Wajib - Statistika, Kaidah Pencacahan & Peluang",
    scope: "Interpretasi data diagram garis, aturan pencacahan (aturan perkalian, permutasi, kombinasi), konsep peluang kejadian tunggal dan majemuk kontekstual.",
    indicators: "Indikator 21 (Diagram garis), Indikator 22-23 (Aturan pencacahan/kombinatorika), Indikator 24-25 (Peluang tunggal & majemuk)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },

  // --- 2. SOSIOLOGI (5 Modul) ---
  {
    subject: "Sosiologi",
    sourceFile: "sosiologi_full.txt",
    id: "tka_sos_01_hakikat_hubungan_sosial",
    title: "TKA Sosiologi - Hakikat Sosiologi & Konsep Hubungan Sosial",
    scope: "Pengertian etimologis & historis sosiologi, 4 ciri keilmuan (empiris, teoretis, kumulatif, non-etis), objek formal & material, syarat interaksi sosial (kontak & komunikasi), dinamika masyarakat multikultural, kelompok dan lembaga sosial, dampak ragam gejala sosial.",
    indicators: "Indikator 1 (Ruang lingkup sosiologi), Indikator 2 (Syarat interaksi), Indikator 3 (Masyarakat multikultural), Indikator 4 (Bentuk hubungan sosial), Indikator 5 (Proses kelompok sosial), Indikator 6 (Gejala sosial)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Sosiologi",
    sourceFile: "sosiologi_full.txt",
    id: "tka_sos_02_penelitian_sosial",
    title: "TKA Sosiologi - Metode & Rancangan Penelitian Sosial",
    scope: "Struktur dan sistematika penelitian sosial, pendekatan kualitatif vs kuantitatif, teknik pengumpulan data (observasi, wawancara, kuesioner), sampling, interpretasi data, evaluasi manfaat hasil riset bagi kebijakan publik.",
    indicators: "Indikator 8 (Struktur sistematika penelitian), Indikator 9 (Metode penelitian), Indikator 10 (Manfaat penelitian), Indikator 11 (Interpretasi hasil), Indikator 13 (Rancangan penelitian)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Sosiologi",
    sourceFile: "sosiologi_full.txt",
    id: "tka_sos_03_konflik_resolusi",
    title: "TKA Sosiologi - Kelompok Sosial & Resolusi Konflik",
    scope: "Klasifikasi kelompok sosial (in-group, out-group, paguyuban/gemeinschaft, patembayan/gesellschaft), akar penyebab konflik sosial, bentuk-bentuk konflik, akomodasi dan resolusi konflik (mediasi, arbitrasi, konsiliasi, kompromi, ajudikasi), upaya membangun perdamaian integratif.",
    indicators: "Indikator 14 (Bentuk konflik), Indikator 15 (Rekomendasi resolusi penanganan konflik), Indikator 16 (Penyebab konflik), Indikator 17 (Membangun perdamaian), Indikator 18 & 22 (Dinamika kelompok)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Sosiologi",
    sourceFile: "sosiologi_full.txt",
    id: "tka_sos_04_stratifikasi_kesetaraan",
    title: "TKA Sosiologi - Diferensiasi, Stratifikasi & Ketimpangan Sosial",
    scope: "Diferensiasi sosial (horizontal: ras, etnis, agama, klan), stratifikasi sosial (vertikal: kekayaan, kekuasaan, kehormatan, pendidikan), faktor penyebab ketimpangan sosial, dampak diskriminasi dan marginalisasi, prinsip kesetaraan dan harmoni sosial.",
    indicators: "Indikator 19 (Faktor penyebab ketidaksetaraan), Indikator 20 (Dampak ketidaksetaraan), Indikator 21 (Prinsip kesetaraan dalam masyarakat)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Sosiologi",
    sourceFile: "sosiologi_full.txt",
    id: "tka_sos_05_perubahan_globalisasi",
    title: "TKA Sosiologi - Perubahan Sosial, Globalisasi & Kearifan Lokal",
    scope: "Bentuk-bentuk perubahan sosial (evolusi vs revolusi, terencana vs tidak terencana, kecil vs besar), teori siklus dan linear, dampak globalisasi, konsumerisme, westernisasi, neokolonialisme, sikap kritis selektif, pemberdayaan komunitas lokal berbasis kearifan budaya.",
    indicators: "Indikator 23-24 (Dampak globalisasi), Indikator 25-26 (Bentuk perubahan sosial), Indikator 27 (Masalah sosial akibat globalisasi), Indikator 28-30 (Sikap kritis & kearifan lokal)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },

  // --- 3. EKONOMI (5 Modul) ---
  {
    subject: "Ekonomi",
    sourceFile: "ekonomi_full.txt",
    id: "tka_eko_01_kelangkaan_mekanisme_pasar",
    title: "TKA Ekonomi - Konsep Dasar Kelangkaan & Keseimbangan Pasar",
    scope: "Kelangkaan sumber daya ekonomi, biaya peluang (opportunity cost), masalah pokok ekonomi klasik vs modern, hukum permintaan dan penawaran, fungsi linier Qd & Qs, pergeseran ekuilibrium pasar, elastisitas harga, dampak intervensi pajak dan subsidi.",
    indicators: "Indikator 1 (Solusi kelangkaan), Indikator 2 (Biaya peluang), Indikator 3 (Masalah pelaku ekonomi), Indikator 4 (Faktor perubahan harga ekuilibrium), Indikator 5 (Fungsi penawaran), Indikator 6 (Keseimbangan pasca pajak), Indikator 7 (Grafik kurva permintaan)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Ekonomi",
    sourceFile: "ekonomi_full.txt",
    id: "tka_eko_02_pendapatan_nasional_pembangunan",
    title: "TKA Ekonomi - Pendapatan Nasional & Pembangunan Ekonomi",
    scope: "Konsep dan rumus pendapatan nasional (GDP, GNP, NNP, NNI, PI, DI), pendekatan pengeluaran vs penerimaan, pendapatan per kapita, indikator pertumbuhan ekonomi vs pembangunan ekonomi, indeks pembangunan manusia (IPM), peran ekonomi digital.",
    indicators: "Indikator 8 (Perhitungan pendapatan nasional), Indikator 9 (Faktor pertumbuhan ekonomi), Indikator 10 (Pertumbuhan vs kesejahteraan), Indikator 11 (Perbandingan pembangunan dua negara)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Ekonomi",
    sourceFile: "ekonomi_full.txt",
    id: "tka_eko_03_ketenagakerjaan_inflasi_kebijakan",
    title: "TKA Ekonomi - Ketenagakerjaan, Inflasi & Kebijakan Fiskal-Moneter",
    scope: "Ketenagakerjaan dan jenis-jenis pengangguran (struktural, friksional, siklis, musiman) serta solusinya, indeks harga konsumen (IHK) metode agregatif sederhana, laju inflasi dan penyebabnya (demand-pull vs cost-push), peran Bank Sentral, instrumen moneter (diskonto, operasi pasar terbuka, cadangan kas), instrumen kebijakan fiskal dan fungsi perpajakan.",
    indicators: "Indikator 12-13 (Jenis & solusi pengangguran), Indikator 14-16 (Faktor inflasi & hitung IHK), Indikator 17-19 (Bank Sentral & instrumen moneter), Indikator 20-21 (Kebijakan fiskal & pajak)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Ekonomi",
    sourceFile: "ekonomi_full.txt",
    id: "tka_eko_04_badan_usaha_koperasi",
    title: "TKA Ekonomi - Badan Usaha & Manajemen Koperasi",
    scope: "Peran dan karakteristik badan usaha (BUMN, BUMD, BUMS, firma, CV, PT), fungsi-fungsi manajemen (POAC: Planning, Organizing, Actuating, Controlling), prinsip koperasi Indonesia, rumus dan perhitungan Sisa Hasil Usaha (SHU) berdasarkan jasa modal dan jasa usaha anggota.",
    indicators: "Indikator 22-23 (Solusi manajemen badan usaha), Indikator 24 (Perhitungan SHU anggota koperasi)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Ekonomi",
    sourceFile: "ekonomi_full.txt",
    id: "tka_eko_05_perdagangan_internasional_akuntansi",
    title: "TKA Ekonomi - Perdagangan Internasional & Persamaan Dasar Akuntansi",
    scope: "Faktor pendorong perdagangan internasional, teori keunggulan mutlak (Adam Smith) & keunggulan komparatif (David Ricardo), kebijakan proteksi (tarif, kuota, subsidi, dumping), neraca pembayaran, persamaan dasar akuntansi (Aset = Liabilitas + Ekuitas), analisis transaksi keuangan, laporan laba rugi dan modal akhir perusahaan jasa.",
    indicators: "Indikator 25-27 (Kerja sama ekonomi, kebijakan perdagangan, hambatan ekspor), Indikator 28-30 (Persamaan dasar akuntansi, catatan transaksi, modal awal/akhir)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },

  // --- 4. BAHASA INDONESIA WAJIB (4 Modul) ---
  {
    subject: "Bahasa Indonesia",
    sourceFile: "bindo_wajib_full.txt",
    id: "tka_bin_01_gagasan_utama_hubungan_kalimat",
    title: "TKA Bahasa Indonesia - Gagasan Utama & Hubungan Antarkalimat",
    scope: "Penemuan gagasan utama dan gagasan pendukung (deduktif, induktif, campuran), teknik membaca skimming & scanning teks panjang, analisis hubungan antarkalimat/antarparagraf (kausalitas/sebab-akibat, penegasan, analogi, generalisasi), evaluasi kesesuaian struktur logika kalimat.",
    indicators: "Indikator 2 (Gagasan utama/pendukung), Indikator 3 & 12 (Hubungan antarkalimat sebab-akibat/analogi), Indikator 4 (Kesesuaian penggunaan bahasa)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Bahasa Indonesia",
    sourceFile: "bindo_wajib_full.txt",
    id: "tka_bin_02_analisis_prosa_sastra",
    title: "TKA Bahasa Indonesia - Analisis Teks Prosa, Cerita & Sastra",
    scope: "Unsur intrinsik prosa (tema, latar suasana/waktu/tempat, penokohan/watak tokoh, alur kronologis, sudut pandang), dinamika konflik internal vs eksternal tokoh, inferensi nilai moral, budaya, dan sosial tersirat, prediksi kelanjutan alur cerita, penilaian tanggapan emosional pembaca dan relevansi cerita dalam kehidupan nyata.",
    indicators: "Indikator 5 & 18 (Unsur intrinsik latar/karakter), Indikator 6 & 16 (Simpulan informasi & konflik), Indikator 7 & 20 (Prediksi kelanjutan cerita), Indikator 8 (Tanggapan emosional latar suasana), Indikator 9 (Kronologi peristiwa), Indikator 10 (Nilai cerita), Indikator 11 (Keterkaitan tindakan tokoh), Indikator 19 & 21 (Penyebab konflik & kesesuaian karakter)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Bahasa Indonesia",
    sourceFile: "bindo_wajib_full.txt",
    id: "tka_bin_03_teks_faktual_infografis",
    title: "TKA Bahasa Indonesia - Teks Faktual, Berita & Data Visual (Infografis)",
    scope: "Karakteristik teks berita & faktual (5W+1H), struktur piramida terbalik (judul, kepala, tubuh, ekor berita), penulisan kalimat penutup berita, analisis kesesuaian data visual (tabel, diagram batang/garis, grafik, infografis) dengan opini teks, identifikasi fenomena utama berdasarkan diksi.",
    indicators: "Indikator 13 (Kesesuaian data visual tabel/diagram dengan opini), Indikator 15 (Fenomena utama berbasis kosakata), Indikator 17 (Menyusun kalimat penutup/ekor berita)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Bahasa Indonesia",
    sourceFile: "bindo_wajib_full.txt",
    id: "tka_bin_04_kebahasaan_ejaan_diksi",
    title: "TKA Bahasa Indonesia - Kaidah Kebahasaan, Kata Serapan & Ejaan",
    scope: "Makna kata serapan bahasa asing (Inggris, Belanda, Sanskerta, Arab) dan bahasa daerah, kata konotatif vs denotatif, idiom dan ungkapan klise, pembentukan istilah bidang ilmu, kaidah kalimat efektif (kepaduan, kehematan, kelogisan), penerapan ejaan baku PUEBI.",
    indicators: "Indikator 1 & 22 (Makna kosakata serapan asing/daerah), Indikator 14 (Kata konotatif, idiom, istilah), Indikator 25 (Kesesuaian penggunaan kata, frasa, kalimat efektif)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },

  // --- 5. BAHASA INGGRIS WAJIB (4 Modul) ---
  {
    subject: "Bahasa Inggris",
    sourceFile: "bing_wajib_full.txt",
    id: "tka_big_01_narrative_moral_value",
    title: "TKA Bahasa Inggris - Narrative Text & Moral Value Analysis",
    scope: "Generic structure of narrative texts (orientation, complication, resolution, re-orientation/coda), identifying main plot points, characterizing protagonist & antagonist, analyzing character actions and relationships, predicting story endings, inferring universal moral values without overgeneralization, past tense mechanics.",
    indicators: "Indikator 1 (Main points of narrative text), Indikator 2 (Moral value), Indikator 3 (Action relationship), Indikator 4 (Predicting story ending), Indikator 5 (Character description)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Bahasa Inggris",
    sourceFile: "bing_wajib_full.txt",
    id: "tka_big_02_procedure_infographic",
    title: "TKA Bahasa Inggris - Procedure & Infographic Text Comprehension",
    scope: "Structure of procedure & instructional texts (goal/aim, materials/tools, step-by-step methods), imperative verbs (action verbs), sequence adverbs (first, next, then, finally), categorizing items/actions, outlining steps into structured checklists, identifying author's communicative purpose, evaluating real-world practical application.",
    indicators: "Indikator 6 (Key information in procedure text), Indikator 7 (Categorization of items/steps), Indikator 8 (Organizing main points into outline), Indikator 9 (Author's purpose), Indikator 10 (Practical real-life application)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Bahasa Inggris",
    sourceFile: "bing_wajib_full.txt",
    id: "tka_big_03_descriptive_text",
    title: "TKA Bahasa Inggris - Descriptive Text & Contextual Meaning",
    scope: "Generic structure of descriptive texts (identification and description of features), locating explicit factual details, scanning specific attributes, inferring contextual phrase meaning (idiomatic & academic expressions), analyzing sensory adjectives & linking verbs, evaluating core aspects vs supporting background details.",
    indicators: "Indikator 11 (Explicit key information), Indikator 12 (Contextual phrase meaning), Indikator 13 (Summarizing topic/main idea), Indikator 14 (Additional supporting facts for persuasiveness/clarity), Indikator 15 (Evaluating primary aspects of the subject)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  },
  {
    subject: "Bahasa Inggris",
    sourceFile: "bing_wajib_full.txt",
    id: "tka_big_04_analytical_exposition",
    title: "TKA Bahasa Inggris - Analytical Exposition & Multi-Source Synthesis",
    scope: "Generic structure of analytical exposition (thesis statement, structured supporting arguments, reiteration/conclusion), distinguishing empirical facts vs subjective author opinions, discourse markers of contrast and causation (however, furthermore, therefore, on the other hand), synthesizing information from disparate passages, identifying persuasive rhetorical techniques.",
    indicators: "Indikator 16 (Categorizing arguments & entities), Indikator 17 (Synthesizing info across multiple texts), Indikator 18 (Implicit inferential conclusions), Indikator 19 (Evaluating additional persuasive facts), Indikator 20 (Distinguishing facts vs opinions)",
    model: "ag/gemini-3.8-flash-low",
    fallbackModel: "ag/claude-sonnet-4-6"
  }
];

function loadSubjectRawText(filename) {
  const p = path.join(SOURCES_DIR, filename);
  if (!fs.existsSync(p)) return "";
  return fs.readFileSync(p, "utf-8");
}

async function generateModule(mod) {
  console.log(`\n======================================================`);
  console.log(`🚀 [${mod.subject}] Memulai Generator Modul: "${mod.title}"`);
  console.log(`   Scope: ${mod.scope}`);
  console.log(`   Indikator: ${mod.indicators}`);

  // Check if document already exists with full content
  const existing = db.prepare("SELECT id, length(content) as len FROM documents WHERE id = ?").get(mod.id);
  if (existing && existing.len > 5000) {
    console.log(`   ✔ Modul sudah ada di database (${existing.len} karakter). Melewati...`);
    return true;
  }

  const rawText = loadSubjectRawText(mod.sourceFile);
  const rawExcerpt = rawText.slice(0, 35000); // Excerpt within prompt limits

  const prompt = `Anda adalah Lead Curriculum Architect dan Master Tutor TKA (Tes Kemampuan Akademik) Nasional.
Tugas Anda: Susun MODUL PEMBELAJARAN TANKA MASTER yang sangat mendalam, runut, dan siap dibaca langsung oleh siswa SMA kelas 12 untuk persiapan ujian TKA 2026.

MATA PELAJARAN: ${mod.subject}
JUDUL RESMI MODUL: ${mod.title}
CAKUPAN MATERI: ${mod.scope}
INDIKATOR SOAL RESMI YANG DIUJI: ${mod.indicators}

REFERENSI DOKUMEN ASLI KISI-KISI / BANK SOAL BSKAP:
"""
${rawExcerpt}
"""

PETUNJUK STRUKTUR MODUL NARA (Wajib gunakan format Markdown editorial tingkat tinggi, padat, tanpa basa-basi):
1. Judul Utama: # ${mod.title}
2. Tesis Modul: > 📌 **Tesis & Esensi Modul:** (Ringkasan komprehensif 2-3 kalimat mengenai urgensi dan indikator kompetensi modul ini).
3. Buat minimal 3-4 BAB LENGKAP berurutan logis (## Bab 1, ## Bab 2, dst).
   Untuk setiap Bab:
   - Judul Bab yang deskriptif dan ilmiah
   - Minimal 2 Sub-topik (### Judul Subtopik)
   - Setiap Subtopik wajib memiliki struktur standar Nara:
     #### Situasi Konkret & Pemicu Intuisi
     (Jelaskan fenomena nyata atau kasus langsung tanpa analogi klise).
     #### Inti Konsep & Definisi Baku
     (Definisi ilmiah presisi, istilah baku, dan batasan teoretis).
     #### Kaidah / Rumus Kunci KaTeX
     (Untuk MTK/Ekonomi: tuliskan rumus matematika dalam KaTeX $ ... $ dan $$ ... $$. Untuk Sosiologi/Bahasa: tuliskan hukum, prinsip, atau matriks pembeda berbentuk tabel Markdown).
     #### Mekanisme & Sebab-Akibat
     (Alur kerja logis, urutan kronologis, atau proses analitis bertahap).
     #### Batas Konsep & Pembeda
     (Batas berlakunya aturan, distingsi tajam dari konsep yang mirip).
     #### Peringatan Salah Kaprah (Pitfall)
     (Kesalahan fatal, miskonsepsi umum yang sering mengecoh siswa di ujian).
     #### Bedah Tuntas Soal Ujian Asli
     (Ambil 1 butir soal relevan dari dokumen kisi-kisi di atas. Tuliskan teks soal, opsi jawaban, kunci jawaban yang benar, langkah pengerjaan analitis bertahap, dan telaah kenapa opsi lain salah).
   - Setiap akhir Bab wajib ditutup dengan ### Cek Pemahaman (2 pertanyaan retensi ringkas dan jawabannya).

PASTIKAN KUALITAS: Sangat detail, tidak ada bab yang diringkas atau terpotong, bebas analogi dunia nyata yang tidak relevan, 100% literal dan fungsional. Kembalikan HANYA teks Markdown dokumen modul.`;

  let markdownContent = "";
  try {
    markdownContent = await callRouter([{ role: "user", content: prompt }], mod.model, 0.2, 12000);
  } catch (err) {
    console.warn(`   ⚠ Model ${mod.model} gagal (${err.message}). Mencoba model fallback: ${mod.fallbackModel}...`);
    markdownContent = await callRouter([{ role: "user", content: prompt }], mod.fallbackModel, 0.2, 12000);
  }

  if (!markdownContent || markdownContent.length < 500) {
    throw new Error(`Output modul ${mod.title} terlalu pendek atau kosong (${markdownContent?.length || 0} chars)`);
  }

  // Step 2: Generate 5 HOTS Quizzes JSON
  console.log(`   ℹ Generating 5 HOTS quizzes for ${mod.title}...`);
  let questions = [];
  try {
    const quizPrompt = `Anda adalah master penguji TKA. Buat 5 butir soal pilihan ganda HOTS (A-E) tingkat SMA berdasarkan materi "${mod.title}" (Cakupan: ${mod.indicators}).
Format wajib HANYA JSON valid:
{
  "questions": [
    {
      "id": 1,
      "question": "Teks pertanyaan kontekstual/analitis...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ...", "E. ..."],
      "correctIndex": 0,
      "explanation": "Langkah pembahasan terperinci...",
      "formula": "Rumus atau kaidah kunci...",
      "pitfall": "Jebakan salah kaprah...",
      "steps": [
        {"step": 1, "title": "Identifikasi", "desc": "..."},
        {"step": 2, "title": "Eksekusi", "desc": "..."}
      ]
    }
  ]
}`;
    const qRaw = await callRouter([{ role: "user", content: quizPrompt }], "ag/gemini-3.8-flash-low", 0.2, 4000);
    const parsedQ = safeJsonParse(qRaw);
    if (parsedQ && Array.isArray(parsedQ.questions)) questions = parsedQ.questions;
  } catch (qErr) {
    console.warn(`   ⚠ Warning generating quizzes: ${qErr.message}`);
  }

  // Step 3: Generate 8 Atomic Flashcards JSON
  console.log(`   ℹ Generating 8 atomic flashcards for ${mod.title}...`);
  let flashcards = [];
  try {
    const fcPrompt = `Buat TEPAT 8 flashcard atomik (1 kartu 1 fakta spesifik) untuk review cepat materi "${mod.title}".
Format wajib HANYA JSON valid:
{
  "flashcards": [
    {"front": "Pertanyaan pemicu ingatan aktif 1 fakta...", "back": "Jawaban lugas, presisi, tanpa basa-basi..."}
  ]
}`;
    const fcRaw = await callRouter([{ role: "user", content: fcPrompt }], "ag/gemini-3.8-flash-low", 0.2, 3000);
    const parsedFc = safeJsonParse(fcRaw);
    if (parsedFc && Array.isArray(parsedFc.flashcards)) flashcards = parsedFc.flashcards;
  } catch (fcErr) {
    console.warn(`   ⚠ Warning generating flashcards: ${fcErr.message}`);
  }

  // Insert or Replace into SQLite
  const now = Date.now();
  db.prepare("DELETE FROM documents WHERE id = ?").run(mod.id);
  db.prepare("DELETE FROM quizzes WHERE doc_id = ?").run(mod.id);
  db.prepare("DELETE FROM flashcards WHERE doc_id = ?").run(mod.id);

  const insertDoc = db.prepare("INSERT INTO documents (id, title, content, summary, status, created_at) VALUES (?, ?, ?, ?, 'completed', ?)");
  insertDoc.run(mod.id, mod.title, markdownContent, `Modul Resmi TKA 2026: ${mod.scope}`, now);

  if (questions.length > 0) {
    const qId = `quiz_${mod.id}_${now}`;
    db.prepare("INSERT INTO quizzes (id, doc_id, questions, quiz_type, created_at) VALUES (?, ?, ?, 'conceptual', ?)").run(
      qId, mod.id, JSON.stringify(questions), now
    );
  }

  if (flashcards.length > 0) {
    const insertFc = db.prepare("INSERT INTO flashcards (id, doc_id, front, back, difficulty, review_count, created_at) VALUES (?, ?, ?, ?, 'new', 0, ?)");
    for (let i = 0; i < flashcards.length; i++) {
      const fc = flashcards[i];
      if (fc.front && fc.back) {
        insertFc.run(`fc_${mod.id}_${i + 1}`, mod.id, fc.front.trim(), fc.back.trim(), now);
      }
    }
  }

  // Verify directly from SQLite
  const verifiedDoc = db.prepare("SELECT length(content) as len FROM documents WHERE id = ?").get(mod.id);
  const verifiedQ = db.prepare("SELECT count(*) as count FROM quizzes WHERE doc_id = ?").get(mod.id);
  const verifiedFc = db.prepare("SELECT count(*) as count FROM flashcards WHERE doc_id = ?").get(mod.id);

  console.log(`   ✔ BERHASIL TERSIMPAN & TERVERIFIKASI:`);
  console.log(`     - Dokumen: ${verifiedDoc?.len} karakter Markdown`);
  console.log(`     - Kuis: ${questions.length} butir soal terdaftar`);
  console.log(`     - Flashcard: ${verifiedFc?.count} kartu atomik aktif`);

  return true;
}

async function main() {
  const targetSubject = process.argv[2]; // Optional filter: e.g. "Matematika Wajib" or "all"
  console.log(`🏁 Memulai Pipeline Pembangunan Modul TKA Tanka 2026...`);
  console.log(`Target: ${targetSubject || 'Semua 5 Mata Pelajaran (22 Modul)'}`);

  const queue = targetSubject && targetSubject !== "all"
    ? MODULES.filter(m => m.subject.toLowerCase() === targetSubject.toLowerCase() || m.id.toLowerCase() === targetSubject.toLowerCase())
    : MODULES;

  console.log(`Total antrean modul: ${queue.length}`);

  let successCount = 0;
  for (const mod of queue) {
    try {
      await generateModule(mod);
      successCount++;
    } catch (err) {
      console.error(`   ✖ GAGAL memproses modul "${mod.title}":`, err.message);
    }
  }

  console.log(`\n🎉 SELESAI: ${successCount} dari ${queue.length} modul TKA berhasil digenerate dan aktif di Tanka!`);
}

main().catch(err => {
  console.error("Fatal Pipeline Error:", err);
  process.exit(1);
});
