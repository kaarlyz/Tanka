const { callRouter } = require("../ai");
const { NARA_GLOBAL_PERSONA } = require("../prompts/nara");
const { safeJsonParse } = require("../utils/jsonParser");

/**
 * Segment raw text into logical parts (per page, per slide, or per ~750 words).
 */
function segmentDocumentText(rawText, sourceType = "text") {
  if (!rawText || typeof rawText !== "string") return [];

  // If already contains slide markers
  if (rawText.includes("--- Slide ")) {
    return rawText
      .split(/--- Slide \d+ ---/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((text, idx) => ({
        index: idx + 1,
        sourceType: "slide",
        text
      }));
  }

  // If contains page markers
  if (rawText.includes("--- Halaman Berikutnya ---")) {
    return rawText
      .split("--- Halaman Berikutnya ---")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((text, idx) => ({
        index: idx + 1,
        sourceType: "pdf_page",
        text
      }));
  }

  // Default: semantic paragraph chunks (~600-900 words)
  const paragraphs = rawText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const segments = [];
  let currentBuffer = [];
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const pWords = para.split(/\s+/).length;
    if (currentWordCount + pWords > 750 && currentBuffer.length > 0) {
      segments.push({
        index: segments.length + 1,
        sourceType: sourceType,
        text: currentBuffer.join("\n\n")
      });
      currentBuffer = [para];
      currentWordCount = pWords;
    } else {
      currentBuffer.push(para);
      currentWordCount += pWords;
    }
  }

  if (currentBuffer.length > 0) {
    segments.push({
      index: segments.length + 1,
      sourceType: sourceType,
      text: currentBuffer.join("\n\n")
    });
  }

  return segments;
}

function detectDomainCategory(title = "", text = "") {
  const combined = (title + " " + text.slice(0, 4000)).toLowerCase();
  const academicTerms = [
    "rumus", "persamaan", "koordinat", "reaksi", "sel", "mitokondria", "vektor",
    "matriks", "diferensial", "integral", "stoikiometri", "enzim", "fotosintesis",
    "kurva", "parabola", "orde baru", "kolonial", "hukum newton", "termodinamika",
    "trigonometri", "logaritma", "kinematika", "translasi", "refleksi", "dilatasi",
    "pancasila", "uud 1945", "geometri", "biologi", "fisika", "kimia"
  ];
  const academicScore = academicTerms.filter((t) => combined.includes(t)).length;
  const growthTerms = [
    "umur", "usia", "kebiasaan", "habit", "finansial", "investasi", "mindset", "karir",
    "podcast", "disiplin", "produktivitas", "bisnis", "gaji", "mental", "psikologi",
    "sukses", "gagal", "pengalaman hidup", "nasihat", "relasi", "komunikasi", "waktu",
    "tonton ini", "pelajaran hidup", "anak muda", "quarter life"
  ];
  const growthScore = growthTerms.filter((t) => combined.includes(t)).length;
  if (growthScore >= 2 && academicScore === 0) return "practical_growth";
  if (growthScore > academicScore * 2) return "practical_growth";
  return "academic_school";
}

/**
 * Step 1: Extract canonical concepts and dynamic curriculum outline without hardcoded 5 chapters.
 */
async function extractConceptsAndOutline(docTitle, fullText, segments = [], model = "ag/gemini-3.8-flash-low", jenjang = "SMA") {
  // Label segments clearly as [S1], [S2], [S3] for exact quote traceability
  let segmentOverview = "";
  if (segments.length > 0) {
    segmentOverview = segments
      .map((s, idx) => {
        const text = s.text || "";
        let slice = text.length <= 5000 ? text : text.slice(0, 5000);
        if (text.length > 5000) {
          const lastBreak = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf(". "));
          if (lastBreak > 2000) slice = slice.slice(0, lastBreak + 1);
        }
        return `[S${idx + 1}] (${s.sourceType || "sumber"} - "${s.title || "Referensi"}"):\n${slice}`;
      })
      .join("\n\n---\n\n");
  } else {
    segmentOverview = `[S1] (dokumen_sumber):\n${fullText.slice(0, 50000)}`;
  }

  const isGrowth = detectDomainCategory(docTitle, fullText) === "practical_growth";

  const rolePrompt = isGrowth
    ? `Anda adalah mentor pembelajaran mandiri dan analis strategis yang menyusun intisari wawasan, pola pikir, dan prinsip praktis berbobot untuk anak muda usia 15-20 tahun.`
    : `Anda adalah perancang kurikulum ahli yang menyusun kerangka belajar mandiri adaptif untuk siswa Indonesia.`;

  const targetCategory = isGrowth
    ? `Target Kategori: Pengembangan Diri, Mindset, & Strategi Nyata Kehidupan (Usia 15-20 Tahun)`
    : `Target Jenjang: ${jenjang} (Kurikulum Nasional Indonesia)`;

  const principlesPrompt = isGrowth
    ? `PRINSIP PERANCANGAN INTISARI PRAKTIS:
1. EKSTRAK MENTAL MODEL & PRINSIP KUNCI
- Ekstrak 3-6 prinsip atau kebiasaan kunci yang diajarkan pembicara/penulis. Dilarang membuang poin inti yang ditekankan.
- "definisi": Tuliskan esensi prinsip secara lugas, tajam, dan realistis (bukan hafalan kaku).
- "salah_kaprah": Tuliskan ilusi atau jebakan yang sering dialami anak muda pemula pada topik ini.
- "rumus": Kosongkan ("").
- "level": Tentukan tingkat kedalaman kognitif ("pahami", "terapkan", "analisis").

2. ALUR BAB TEMATIK & ACTIONABLE
- Bagi materi menjadi 2-4 bab tematik yang runtut (dari paradigma/realita keras, pembongkaran jebakan, hingga strategi aksi nyata).
- Setiap bab wajib memiliki "pertanyaanPemantik" (situasi nyata pengungkit rasa ingin tahu) dan "keyConceptIds".`
    : `PRINSIP PERANCANGAN KURIKULUM:

1. KESESUAIAN JENJANG & INTEGRITAS FAKTA
- Sesuaikan kedalaman dengan jenjang "${jenjang}" (Kurikulum Merdeka).
- Jika jenjang = "SMP": Utamakan konsep visual, konkret, dan prosedur hitung dasar.
- Jika jenjang = "SMA": Gunakan kedalaman kurikulum SMA (Fase E/F) untuk penalaran ujian/UTBK.
- Jangan memasukkan materi tingkat perguruan tinggi di luar silabus sekolah.
- Jika bahan sumber kurang relevan atau tidak memadai, tandai "status": "sumber_tidak_memadai".
- KHUSUS MATEMATIKA: Bab 1 wajib memetakan seluruh cakupan topik besar secara menyeluruh (misal pada Transformasi Geometri: petakan 4 pilarnya yaitu Translasi, Refleksi, Rotasi, dan Dilatasi agar siswa melihat peta besarnya sebelum membedah sub-bab).
- KHUSUS SOSIOLOGI & HUMANIORA: Susun rencana bab secara bertingkat dan struktural, diawali dari latar belakang fundamental dan akar masalah sosial mengapa fenomena tersebut lahir sebelum masuk ke bab klasifikasi/faktor.

2. KONSEP KUNCI LENGKAP & ANTI-PENGHAPUSAN (EXHAUSTIVE COVERAGE MUTLAK)
- DOKUMEN UPLOAD SERINGKALI ADALAH MATERI/KISI-KISI UJIAN SEBENARNYA! Dilarang keras memangkas, meringkas dangkal, atau menghilangkan butir-butir materi dari teks sumber!
- Bahasa boleh disederhanakan dan dimudahkan agar ramah siswa, TETAPI ESENSI DAN SELURUH POIN MATERI DARI SUMBER ASLI HARUS MENCAKUP 100% TANPA ADA YANG TERPOTONG.
- JIKA BAHAN MEMUAT DAFTAR BUTIR/FAKTOR/KLASIFIKASI: Setiap butir, pilar, atau klasifikasi yang tertulis di teks sumber WAJIB diekstrak menjadi konsep tersendiri agar materi ujian tidak buntung.
- Jangan menggabungkan dua butir berbeda secara serakah hanya untuk memperpendek daftar konsep.
- Masukkan seluruh konsep inti yang didukung bahan sumber ("origin": "source").
- "bukti_kutipan": Kutip klausa teks asli dari bahan (maksimal 20 kata) beserta kode segmennya (misal: "S1").
- "definisi": Tuliskan dalam kalimat utuh baku yang lugas dan presisi, bukan sekadar kata kunci telegram.
- "prasyarat": Daftar ID konsep lain yang wajib dipahami lebih dulu sebelum konsep ini dipelajari.
- "level": Tentukan tingkat kognitif konsep ("ingat", "pahami", "terapkan", "analisis").
- "rumus": Berikan rumus KaTeX hanya jika materi hitung kuantitatif (Matematika/Fisika/Kimia Stoikiometri/Ekonomi Kurva). Pada materi Biologi konseptual, Sosiologi, dan Sejarah, kosongkan rumus ("").
- "salah_kaprah": Isi miskonsepsi siswa yang masuk akal. Jika tidak ada yang signifikan, kosongkan ("").

3. PRINSIP PEMBENTUKAN BAB (PROGRESSIVE COGNITIVE LOAD)
- Bab adalah satu unit belajar 10-15 menit yang memayungi 1 hingga 4 konsep kunci yang saling bersandar.
- Tentukan jumlah bab secara alami berdasarkan kepadatan materi (materi ringkas cukup 2 bab, materi luas bisa 3-5 bab).
- Urutkan bab dari konsep fondasi (konkret/definisi), lanjut ke mekanisme/cara kerja/rumus, hingga ke penerapan/perbandingan.
- Setiap bab wajib memiliki "pertanyaanPemantik" (situasi nyata pengungkit rasa ingin tahu) dan "keyConceptIds" yang menjadi fokusnya.`;

  const prompt = `${rolePrompt}
Tugas Anda: Analisis bahan sumber berikut, ekstrak konsep/prinsip kunci berbukti, dan susun alur bab yang mengalir secara alami.

Judul Materi: "${docTitle}"
${targetCategory}

Bahan Sumber (masing-masing diberi label kode [S1], [S2], dst):
"""
${segmentOverview}
"""

${principlesPrompt}

Kembalikan HANYA format JSON valid berikut:
{
  "status": "ok",
  "title": "${docTitle}",
  "executiveSummary": "Ringkasan 2-3 kalimat bertutur tentang esensi materi.",
  "concepts": [
    {
      "id": "c1",
      "name": "Nama Konsep Baku",
      "definisi": "Definisi baku resmi kalimat utuh",
      "rumus": "",
      "tokoh": ["Nama Tokoh/Ahli jika relevan"],
      "salah_kaprah": "Miskonsepsi umum siswa",
      "level": "pahami",
      "prasyarat": [],
      "bukti_kutipan": "kutipan pendek dari teks sumber",
      "segmen_id": "S1",
      "origin": "source"
    }
  ],
  "chapters": [
    {
      "chapterNumber": 1,
      "chapterTitle": "Judul Bab Runtut & Bermakna",
      "pertanyaanPemantik": "Situasi atau analogi konkret sehari-hari yang memancing rasa penasaran siswa",
      "targetGoal": "Kemampuan spesifik yang dikuasai siswa di bab ini",
      "keyConceptIds": ["c1"]
    }
  ]
}`;

  try {
    const response = await callRouter(
      [
        { role: "system", content: "You are an elite educational curriculum coordinator. Strictly return valid JSON without commentary." },
        { role: "user", content: prompt }
      ],
      model,
      0.15,
      null,
      180000
    );

    const parsed = safeJsonParse(response);
    if (!parsed) {
      throw new Error("Gagal mem-parsing outline JSON dari AI");
    }

    // Machine Validator: Normalisasi & Verifikasi Bukti Sumber (Provenance Check)
    if (parsed && Array.isArray(parsed.concepts)) {
      parsed.concepts = parsed.concepts.map((c, idx) => {
        const cId = c.id || `c${idx + 1}`;
        const def = c.definisi || c.definisi_baku || c.definition || "";
        const quote = (c.bukti_kutipan || "").toLowerCase().trim();
        
        // Verifikasi deterministik: Apakah kutipan benar-benar ada di teks bahan sumber?
        let verifiedSource = false;
        if (quote && quote.length >= 8 && segmentOverview.toLowerCase().includes(quote)) {
          verifiedSource = true;
        }

        return {
          ...c,
          id: cId,
          definisi_baku: def,
          origin: verifiedSource ? "source" : (c.origin === "source" && !quote ? "source" : "ai_enrichment"),
          verified_by_engine: verifiedSource
        };
      });
    }

    return parsed;
  } catch (err) {
    console.warn("[curriculumPipeline] Fallback outline due to error:", err.message);
    return {
      status: "fallback",
      title: docTitle,
      executiveSummary: "Modul pembelajaran mandiri terstruktur.",
      concepts: [{ id: "c1", name: docTitle, definisi_baku: "Konsep utama materi.", origin: "source", level: "pahami", prasyarat: [] }],
      chapters: [
        { chapterNumber: 1, chapterTitle: "Fondasi Materi", pertanyaanPemantik: "Pernahkah kamu memperhatikan fenomena ini di sekitarmu?", targetGoal: "Memahami konsep dasar", keyConceptIds: ["c1"] },
        { chapterNumber: 2, chapterTitle: "Mekanisme & Penerapan", pertanyaanPemantik: "Bagaimana cara kerja prinsip ini saat diterapkan?", targetGoal: "Menguasai cara kerja dan contoh", keyConceptIds: ["c1"] }
      ]
    };
  }
}

/**
 * Step 2: Generate full pedagogical module using Nara persona, based on dynamic outline.
 */
async function generateNaraModule(outline, fullText, segments = [], model = "ag/gemini-3.8-flash-low", jenjang = "SMA") {
  // Use segment text context
  const sourceContext = segments.length > 0
    ? segments.map((s) => `--- Bagian ${s.index} (${s.sourceType}) ---\n${s.text}`).join("\n\n")
    : fullText;

  const isGrowth = detectDomainCategory(outline.title, fullText) === "practical_growth";

  let prompt;
  if (isGrowth) {
    prompt = `${NARA_GLOBAL_PERSONA}

Tugas Anda: Susun modul intisari pembelajaran mendalam untuk anak muda usia 15-20 tahun berdasarkan kerangka (outline) dan teks transkrip pembicara berikut.

Judul: "${outline.title}"
Rencana Bab:
${JSON.stringify(outline.chapters, null, 2)}

Daftar Prinsip Kunci:
${JSON.stringify(outline.concepts, null, 2)}

Teks Sumber Asli:
"""
${sourceContext.slice(0, 24000)}
"""

PETUNJUK PENULISAN (MODUL PENGEMBANGAN DIRI & REALITA KEHIDUPAN):
1. Mulai dengan judul markdown: # ${outline.title}
2. Tuliskan ringkasan eksekutif / tesis utama dalam blockquote:
   > 📌 **Tesis Utama & Esensi Video:** [Saring omong kosong filler 5 menit pertama; tuliskan 2-3 kalimat tajam inti pesan pembicara]
3. Tulis pembatas horizontal sebelum bab pertama: ---
4. Tulis bab per bab mengikuti rencana bab (Gunakan ## untuk Bab, ### untuk Sub-bab):
   Setiap sub-bab (### [Prinsip / Topik]) WAJIB memuat:
   a. **Realita Lapangan & Pengalaman Nyata:** Cerita riil atau latar belakang mengapa pembicara menekankan hal ini (fokus pada argumen substantif, buang basa-basi).
   b. **Prinsip Kunci (Mental Model):**
      > 💡 **Prinsip Inti:** [Pernyataan prinsip hidup/kerja yang padat, aplikatif, dan membumi]
   c. **Filter Realita (Bedah Objektif):** Pisahkan antara poin yang benar-benar bisa diterapkan anak muda umur 15-20 dengan bumbu motivasi/clickbait berlebihan. Tunjukkan batas realistisnya.
   d. **Peringatan Jebakan Pemula (Pitfall):** Kesalahan umum, ilusi instan, atau jebakan overthinking yang sering bikin orang gagal mempraktikkannya.
5. Bab Penutup / Bab Terakhir WAJIB berupa panduan aksi nyata:
   ## Playbook: Rencana Tindakan Terukur (Action Checklist)
   - Berikan 4-5 checklist aksi nyata yang bisa dieksekusi anak muda umur 15-20 tahun mulai hari ini (konkret, terukur, tanpa biaya mahal).
   - Berikan 2-3 pertanyaan refleksi diri jujur untuk mengevaluasi kebiasaan harian.
6. LARANGAN:
   - DILARANG membuat rumus KaTeX atau contoh soal latihan ujian/UTBK.
   - DILARANG menggunakan gaya motivator klise basi; gunakan gaya Nara yang santai, cerdas, realistis, dan berpihak pada masa depan anak muda.`;
  } else {
    prompt = `${NARA_GLOBAL_PERSONA}

Tugas Anda: Susun materi pembelajaran lengkap untuk siswa jenjang ${jenjang} (Kurikulum Nasional Indonesia) berdasarkan kerangka (outline) dan teks sumber berikut.

Judul: "${outline.title}"
Target Jenjang: ${jenjang}
Rencana Bab:
${JSON.stringify(outline.chapters, null, 2)}

Daftar Konsep Kunci:
${JSON.stringify(outline.concepts, null, 2)}

Teks Sumber Asli:
"""
${sourceContext.slice(0, 50000)}
"""

PETUNJUK PENULISAN:
1. Mulai dengan judul markdown: # ${outline.title}
2. Tuliskan ringkasan eksekutif dokumen dalam blockquote: > [Ringkasan singkat bertutur 2-3 kalimat]
3. Tulis pembatas horizontal sebelum bab pertama: ---
4. MANDAT CAKUPAN LENGKAP & KEDALAMAN ADAPTIF KONTEKSTUAL:
   - DILARANG MERANGKUM DANGKAL ATAU MEMANGKAS ISI DOKUMEN ASLI!
   - Ingat bahwa materi upload ini seringkali merupakan bahan kisi-kisi ujian asli siswa. Jika materi dipotong atau diringkas terlalu pendek, siswa akan kehilangan poin materi yang keluar saat ujian.
   - JANGAN SENGAJA MEMPERSEMPIT MATERI YANG KAYA: Jika bahan sumber memuat materi yang luas (seperti sejarah seni rupa, pergerakan estetika, ragam kriya mancanegara, tokoh perintis, teknik material, atau bab sosiologi/sejarah yang padat), DILARANG MEMADATKANNYA menjadi poin kurus atau deretan angka telanjang (1, 1, 2, 3, 4, 5). Jelaskan secara luas, filosofis, tekniknya, dan ragam karyanya agar pemahaman siswa benar-benar luas dan mendalam.
   - JANGAN MEMANJANG-MANJANGKAN TANPA ARTI (ANTI-FLUFF): Sebaliknya, jika suatu materi memang sederhana atau ringkas, jangan dipaksakan berbunga-bunga kosong. Sesuaikan kedalaman dan volume penjelasan secara proporsional dengan bobot konteks aslinya.
   - BERSIHKAN SAMPAH SLIDE/OCR: Jangan biarkan angka urutan slide mentah (seperti "1", "2", "3") atau penanda teknis "--- Slide X ---" mengotori modul. Ubah menjadi narasi bab dan sub-bab yang berkelas, mengalir, dan hidup.
   - Bahasakan dengan mengalir, santai, dan mudah dipahami, TAPI PASTIKAN SETIAP POIN PENTING, SUB-BAB, DAN RINCIAN OPERASIONAL DARI SUMBER ASLI TERTAMPUNG DAN DIJELASKAN SECARA TUNTAS.
5. Tulis bab per bab mengikuti rencana bab (Gunakan ## untuk Bab, ### untuk Sub-bab). Gunakan "pertanyaanPemantik" yang ada pada rencana bab sebagai pintu masuk pengait situasi nyata di awal setiap bab.
   PERINGATAN FORMAT: Jangan pernah mengulang penulisan "# Judul" atau ringkasan dokumen di dalam Bab 1. Bab 1 harus langsung dimulai dengan "## Bab 1: [Judul Bab]".
6. KONTRAK STRUKTUR SUB-BAB (WAJIB DIPATUHI PER KONSEP):
   Setiap sub-bab (### [Nama Konsep]) WAJIB memuat urutan ini:
   a. Situasi / Intuisi konkret sehari-hari (1-2 paragraf pendek):
      - Untuk Sosiologi & Humaniora: Ceritakan latar belakang fundamental mengapa fenomena tersebut lahir di masyarakat, akar masalahnya, baru sambungkan ke konsep.
      - Untuk Matematika: Gambarkan fenomena visual/geometris atau masalah nyata secara singkat.
   b. Kotak Definisi Baku resmi dalam blockquote:
      > 📖 **Definisi Baku:** [Tuliskan definisi baku kurikulum/buku teks di sini secara presisi. KHUSUS MATEMATIKA: Tulis definisi SEDIKIT & PADAT saja (1-2 kalimat), dilarang dongeng panjang!]
   c. Penjelasan Mekanisme & Sebab-Akibat yang runtut dan struktural.
   d. Rumus, Tabel Pemetaan, & Operasional Konkret:
      - HANYA berlaku untuk materi hitung kuantitatif resmi (Matematika, Fisika, Kimia Stoikiometri, dan Ekonomi Hitung/Kurva).
      - KHUSUS MATEMATIKA (PONDASI, TABEL RUMUS, & ALJABAR OPERASIONAL):
        * Bedah seluruh cakupannya di awal topik agar siswa melihat peta besarnya.
        * WAJIB MENYAJIKAN TABEL RUMUS / TABEL PEMETAAN KaTeX yang rapi dan terstruktur (misal untuk Refleksi: buatkan tabel pemetaan titik $(x, y) \rightarrow (x', y')$ dan matriks transformasinya untuk cermin sumbu-x, sumbu-y, garis $y = x$, garis $y = -x$, titik asal $(0,0)$, garis $x = h$, dan garis $y = k$).
        * Jelaskan bagaimana rumus/matriks tersebut diterapkan pada kurva/garis $y = f(x)$, bukan hanya titik koordinat tunggal.
        * Tunjukkan langkah substitusi balik ($x = x' - a, y = y' - b$) secara gamblang saat menurunkan persamaan bayangan kurva.
      - DILARANG KERAS memaksakan rumus matematis/biofisika/kalkulus pada Biologi SMA (seperti anatomi jaringan, transpirasi, organ, sel), Sosiologi, Sejarah, dan Bahasa. Pada materi Biologi, fokuskan pada mekanisme biologis, regulasi organel, dan reaksi biokimia kualitatif tanpa hitungan fluks buatan.
      - Jika bukan materi hitung kuantitatif resmi, LEWATKAN poin rumus ini secara alami.
   e. Contoh Soal Taktis & Bedah Langkah Pengerjaan (Worked Example):
      - Berikan 1 contoh soal representatif UTBK/Ujian beserta pembongkaran pengerjaan langkah demi langkah secara runtut (bukan sekadar hasil akhir). Tunjukkan cara mengeliminasi jebakan umum aljabar (seperti tanda minus atau kelalaian perkalian distributif).
   f. Peringatan Salah Kaprah (Pitfall): Kesalahan umum siswa di ujian.
5. LARANGAN MUTLAK ANTI-HALUSINASI:
   - DILARANG KERAS MENCIPTAKAN RUMUS FISIKA/MATEMATIKA PADA TOPIK BIOLOGI KONSEPTUAL ATAU ILMU SOSIAL/HUMANIORA.
   - Dilarang mengarang tokoh fiktif atau istilah palsu.
6. Jika ada contoh kasus atau analogi di luar teks sumber, wajib tandai dengan:
   > 💡 **Insight Nara (Pengayaan):** [Uraian contoh/analogi...]
7. Jika ada rumus eksak/matematika, WAJIB gunakan format KaTeX rapi ($rumus$ atau $$blok$$).`;
  }

  const content = await callRouter(
    [
      { role: "system", content: "You are Nara, an empathetic and highly articulate study tutor for high school students." },
      { role: "user", content: prompt }
    ],
    model,
    0.25,
    null,
    240000
  );

  return content ? content.trim() : fullText;
}

module.exports = {
  segmentDocumentText,
  extractConceptsAndOutline,
  generateNaraModule
};
