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

  // Deteksi Domain Matematika & Hitung Eksak Murni
  const mathTerms = [
    "matematika", "math", "aritmatika", "aritmetika", "aljabar", "trigonometri",
    "kalkulus", "integral", "turunan", "diferensial", "limit", "matriks", "vektor",
    "peluang", "statistika", "kombinatorika", "permutasi", "kombinasi", "eksponen",
    "logaritma", "persamaan", "pertidaksamaan", "fungsi", "polinomial", "suku banyak",
    "lingkaran", "dimensi tiga", "bangun ruang", "bangun datar", "pythagoras",
    "barisan", "deret", "bilangan", "pecahan", "operasi hitung", "geometri",
    "transformasi", "dilatasi", "translasi", "rotasi", "refleksi", "notasi sigma"
  ];
  const mathScore = mathTerms.filter((t) => combined.includes(t)).length;
  if (mathScore >= 2 || /matematika|trigonometri|aljabar|kalkulus|aritmatika|aritmetika|matriks|vektor|geometri|persamaan|integral|turunan|dilatasi/i.test(title)) {
    return "mathematics";
  }

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
async function extractConceptsAndOutline(docTitle, fullText, segments = [], model = "ag/gemini-3.8-flash-low", jenjang = "SMA", customInstruction = "") {
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

  const wordCount = fullText.trim().split(/\s+/).length;
  let targetChapterMin = 1;
  let targetChapterMax = 2;
  if (wordCount < 400) {
    targetChapterMin = 1;
    targetChapterMax = 2;
  } else if (wordCount < 1000) {
    targetChapterMin = 2;
    targetChapterMax = 3;
  } else if (wordCount < 2500) {
    targetChapterMin = 3;
    targetChapterMax = 5;
  } else if (wordCount < 5000) {
    targetChapterMin = 4;
    targetChapterMax = 6;
  } else {
    targetChapterMin = 5;
    targetChapterMax = Math.min(10, Math.ceil(wordCount / 600));
  }

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
- ATURAN ATOMIK DAFTAR FAKTOR / KLASIFIKASI: Jika bahan sumber memuat daftar bernomor/berbutir (misalnya "7 Faktor Penghambat" atau "Faktor Pendorong"), SETIAP FAKTOR ATAU BUTIR BERNOMOR WAJIB MENJADI 1 ENTITAS KONSEP TERSENDIRI di array "concepts" (misal: "Hambatan Ideologis", "Adat Istiadat", "Vested Interest", "Isolasi Geografis/Sosial"). DILARANG KERAS menggabungkan atau menghilangkan butir bernomor menjadi konsep payung abstrak.
- Masukkan seluruh konsep inti yang didukung bahan sumber ("origin": "source").
- "bukti_kutipan": Kutip klausa teks asli dari bahan (maksimal 20 kata) beserta kode segmennya (misal: "S1").
- "definisi": Tuliskan dalam kalimat utuh baku yang lugas dan presisi, bukan sekadar kata kunci telegram.
- "prasyarat": Daftar ID konsep lain yang wajib dipahami lebih dulu sebelum konsep ini dipelajari.
- "level": Tentukan tingkat kognitif konsep ("ingat", "pahami", "terapkan", "analisis").
- "rumus": Berikan rumus KaTeX hanya jika materi hitung kuantitatif (Matematika/Fisika/Kimia Stoikiometri/Ekonomi Kurva). Pada materi Biologi konseptual, Sosiologi, dan Sejarah, kosongkan rumus ("").
- "salah_kaprah": Isi miskonsepsi siswa yang masuk akal. Jika tidak ada yang signifikan, kosongkan ("").

3. PRINSIP PEMBENTUKAN BAB & BEBAN KOGNITIF ADAPTIF
- KAPASITAS KOGNITIF KETAT: Setiap bab adalah 1 unit belajar 10-15 menit siswa. Idealnya memuat 2 sampai 4 konsep kunci. MAKSIMAL 4 KONSEP PER BAB.
- DILARANG BAB KANTONG RAKSASA (ANTI-MONOLITHIC): DILARANG KERAS menumpuk seluruh faktor ke dalam 1 bab tunggal (misal menumpuk 8 faktor pendorong ke dalam 1 bab, atau 7 faktor penghambat ke dalam 1 bab)! Kategori besar wajib dipecah menjadi beberapa bab tematik (misal: faktor kultural/pengetahuan terpisah dari faktor struktural/mobilitas).
- BEBAN SUMBER OTOMATIS: Dokumen ini memiliki bobot ~${wordCount} kata. Rencanakan antara ${targetChapterMin} hingga ${targetChapterMax} bab!
- DILARANG TERPAKU PADA ANGKA STATIS:
  * Jika dokumen ringkas (1-2 topik), rencanakan 1-2 bab saja. DILARANG memaksakan bab tambahan yang kosong.
  * Jika dokumen luas/multi-bagian, rencanakan lebih banyak bab (${targetChapterMin}-${targetChapterMax} bab) agar setiap domain materi (faktor, studi kasus, teori) terbahas mendalam.
- Urutkan bab dari konsep fondasi (konkret/definisi), lanjut ke mekanisme/cara kerja/rumus, hingga ke penerapan/perbandingan/teori.
- Setiap bab wajib memiliki "pertanyaanPemantik" dan "keyConceptIds" yang menjadi fokusnya.`;

  const prompt = `${rolePrompt}
Tugas Anda: Analisis bahan sumber berikut, ekstrak konsep/prinsip kunci berbukti, dan susun alur bab yang mengalir secara alami.

Judul Materi: "${docTitle}"
${customInstruction ? `Instruksi Khusus Pengguna: "${customInstruction}"` : ""}
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
 * Auto-repair curriculum outline coverage if planner missed any required concepts
 * or if any chapter exceeds cognitive load limits (max 4 concepts per chapter).
 */
function autoRepairOutlineCoverage(outline) {
  if (!outline || !Array.isArray(outline.concepts) || !Array.isArray(outline.chapters)) {
    return outline;
  }

  // 1. DIVERSIFIKASI & PECAH BAB OVERLOAD (MAKSIMAL 4 KONSEP PER BAB)
  // Mencegah AI menumpuk 6-8 konsep ke dalam 1 bab raksasa
  const MAX_CONCEPTS_PER_CHAPTER = 4;
  const newChapters = [];
  let chNum = 1;

  for (const ch of outline.chapters) {
    const rawIds = Array.isArray(ch.keyConceptIds) ? ch.keyConceptIds : [];
    if (rawIds.length <= MAX_CONCEPTS_PER_CHAPTER) {
      newChapters.push({
        ...ch,
        chapterNumber: chNum++
      });
    } else {
      // Pecah bab overload menjadi unit belajar maksimal 4 konsep
      const splitChunks = [];
      const numSplits = Math.ceil(rawIds.length / MAX_CONCEPTS_PER_CHAPTER);
      const chunkSize = Math.ceil(rawIds.length / numSplits);
      for (let i = 0; i < rawIds.length; i += chunkSize) {
        splitChunks.push(rawIds.slice(i, i + chunkSize));
      }

      splitChunks.forEach((chunkIds, subIdx) => {
        const chunkConcepts = outline.concepts.filter((c) => chunkIds.includes(c.id));
        const subNames = chunkConcepts.map((c) => c.name).slice(0, 2).join(" & ");
        
        let subTitle = ch.chapterTitle;
        if (splitChunks.length > 1) {
          subTitle = `${ch.chapterTitle} (Bagian ${subIdx + 1}: ${subNames || "Lanjutan"})`;
        }

        newChapters.push({
          chapterNumber: chNum++,
          chapterTitle: subTitle,
          pertanyaanPemantik: ch.pertanyaanPemantik || "Bagaimana keterkaitan konsep-konsep ini dalam dinamika masyarakat?",
          targetGoal: `${ch.targetGoal || "Memahami esensi materi"} [Fokus: ${subNames}]`,
          keyConceptIds: chunkIds
        });
      });
    }
  }

  outline.chapters = newChapters;

  const validation = validateCurriculumCoverage(outline.concepts, outline.chapters);
  if (validation.isValid) {
    return outline;
  }

  // 2. Tangani konsep wajib yang tercecer
  if (validation.unmappedRequiredConceptIds.length > 0) {
    const unmappedIds = new Set(validation.unmappedRequiredConceptIds);
    const unmappedConcepts = outline.concepts.filter((c) => unmappedIds.has(c.id));
    console.warn(`[curriculumPipeline] Menyelamatkan ${unmappedConcepts.length} konsep wajib yang belum terpetakan ke bab:`, unmappedConcepts.map(c => c.name));

    if (outline.chapters.length > 0 && outline.chapters.length < 8) {
      outline.chapters.push({
        chapterNumber: outline.chapters.length + 1,
        chapterTitle: "Pendalaman Faktor & Konsep Kunci Terkait",
        pertanyaanPemantik: "Bagaimana dinamika dan faktor-faktor penentu lainnya saling melengkapi topik ini?",
        targetGoal: "Memahami seluruh klasifikasi dan faktor pendukung yang esensial",
        keyConceptIds: unmappedConcepts.map((c) => c.id)
      });
    } else if (outline.chapters.length > 0) {
      const lastCh = outline.chapters[outline.chapters.length - 1];
      const existing = Array.isArray(lastCh.keyConceptIds) ? lastCh.keyConceptIds : [];
      lastCh.keyConceptIds = Array.from(new Set([...existing, ...unmappedConcepts.map((c) => c.id)]));
    }
  }

  // 3. Bersihkan referensi ID yang tidak dikenal dari bab
  if (validation.invalidConceptReferences.length > 0) {
    const validIds = new Set(outline.concepts.map((c) => c.id));
    outline.chapters.forEach((ch) => {
      if (Array.isArray(ch.keyConceptIds)) {
        ch.keyConceptIds = ch.keyConceptIds.filter((id) => validIds.has(id));
      }
    });
  }

  return outline;
}

/**
 * Sinkronisasi daftar rencana bab ke tabel SQLite chapter_plans dengan status 'planned'.
 */
function syncChapterPlansToDb(dbInstance, docId, chapters) {
  if (!dbInstance || !docId || !Array.isArray(chapters)) return;

  const upsertPlan = dbInstance.prepare(`
    INSERT INTO chapter_plans (
      id, doc_id, chapter_number, title, trigger_question, target_goal, key_concept_ids, content, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(doc_id, chapter_number) DO UPDATE SET
      title = excluded.title,
      trigger_question = excluded.trigger_question,
      target_goal = excluded.target_goal,
      key_concept_ids = excluded.key_concept_ids,
      content = CASE WHEN excluded.content != '' THEN excluded.content ELSE chapter_plans.content END,
      status = excluded.status,
      updated_at = excluded.updated_at
  `);

  const now = Date.now();
  for (const ch of chapters) {
    const chNum = Number(ch.chapterNumber ?? ch.chapter_number ?? 1);
    const planId = `${docId}_ch_${chNum}`;
    const title = ch.chapterTitle || ch.title || `Bab ${chNum}`;
    const trigger = ch.pertanyaanPemantik || ch.trigger_question || "";
    const goal = ch.targetGoal || ch.target_goal || "";
    const keyConceptIdsStr = JSON.stringify(ch.keyConceptIds || ch.key_concept_ids || []);

    upsertPlan.run(
      planId,
      docId,
      chNum,
      title,
      trigger,
      goal,
      keyConceptIdsStr,
      ch.content || "",
      ch.status || "planned",
      now,
      now
    );
  }
}

/**
 * AI Modular Chapter Writer: Menulis satu bab terarah fokus pada konsep kunci bab tersebut.
 */
async function generateChapterModular(chapter, chapterConcepts = [], sourceContext = "", overallMeta = {}, model = "ag/gemini-3.8-flash-low", jenjang = "SMA") {
  const domainCategory = detectDomainCategory(overallMeta.courseTitle || "", sourceContext);
  const isMath = domainCategory === "mathematics";
  const isGrowth = domainCategory === "practical_growth";

  const chNum = chapter.chapterNumber || chapter.chapter_number || 1;
  const chTitle = chapter.chapterTitle || chapter.title || `Bab ${chNum}`;
  const trigger = chapter.pertanyaanPemantik || chapter.trigger_question || "Bagaimana fenomena ini terjadi?";
  const goal = chapter.targetGoal || chapter.target_goal || "Memahami mekanisme konsep";

  let specificGuidelines = "";
  if (isMath) {
    specificGuidelines = `
PETUNJUK PENULISAN BAB MATEMATIKA:
1. Mulai langsung dengan heading bab: ## Bab ${chNum}: ${chTitle}
2. Hubungkan singkat pertanyaan pemantik ("${trigger}") dalam 1-2 kalimat intuisi geometris/aljabar.
3. Bedah setiap konsep kunci di bawah ini satu per satu (Gunakan ### [Nama Konsep]):
   Setiap sub-bab konsep WAJIB memuat:
   a. Definisi Padat (1-2 kalimat).
   b. Tabel Formula KaTeX komprehensif ($...$ atau $$...$$) lengkap dengan notasi dan syarat batas.
   c. 1 Contoh Soal Taktis & Bedah Penurunan Langkah demi Langkah (Worked Example) berstandar UTBK.
   d. Peringatan Jebakan Soal (Pitfall) aljabar/tanda minus.
4. Akhiri bab dengan "### Cek Intuisi Taktis" (1 pertanyaan penalaran analitis tanpa pilihan ganda).
5. DILARANG membuat soal pilihan ganda A, B, C, D, E di dalam modul bab!`;
  } else if (isGrowth) {
    specificGuidelines = `
PETUNJUK PENULISAN BAB PENGEMBANGAN DIRI & REALITA:
1. Mulai langsung dengan heading bab: ## Bab ${chNum}: ${chTitle}
2. Tuliskan konteks pembuka pemantik rasa ingin tahu berdasarkan: "${trigger}"
3. Bedah setiap prinsip kunci di bawah ini (Gunakan ### [Nama Prinsip]):
   a. Realita Lapangan & Pengalaman Nyata (fokus pada argumen substantif).
   b. Inti Prinsip (Mental Model) aplikatif.
   c. Filter Realita (pisahkan clickbait/ilusi instan dari aksi realistis).
   d. Peringatan Jebakan Pemula (Pitfall).
4. Akhiri bab dengan "### Refleksi Diri" (1-2 pertanyaan evaluasi kebiasaan harian).
5. DILARANG membuat rumus matematika atau soal pilihan ganda.`;
  } else {
    specificGuidelines = `
PETUNJUK PENULISAN BAB AKADEMIK & ILMU SOSIAL/SAINS:
1. Mulai langsung dengan heading bab: ## Bab ${chNum}: ${chTitle}
2. Buka dengan situasi nyata kontekstual berdasarkan pertanyaan pemantik: "${trigger}" agar siswa memahami relevansinya.
3. Target Capaian Bab: "${goal}".
4. Bedah SETIAP konsep kunci di bawah ini secara mendalam tanpa ada yang dilewati (Gunakan ### [Nama Konsep]):
   Setiap sub-bab konsep WAJIB memuat urutan terstruktur ini:
   a. **Situasi Konkret & Pemicu Intuisi:** Mulai dari konteks nyata yang mudah dibayangkan siswa sebelum memperkenalkan istilah formal.
   b. **Inti Konsep:** Penjelasan makna esensial konsep secara lugas. (Jika konsep didukung kutipan sumber, beri label '> 📖 **Definisi dari Sumber:** [kutipan/definisi]').
   c. **Mekanisme & Sebab-Akibat:** Jelaskan MENGAPA dan BAGAIMANA proses/faktor ini bekerja dalam kenyataan. Uraikan butir-butir penjelas secara runtut.
   d. **Batas Konsep & Pembeda:** Berikan non-contoh atau pembeda jika konsep ini rawan tertukar dengan konsep lain.
   e. **Peringatan Salah Kaprah (Pitfall):** 1 kalimat miskonsepsi umum yang sering mengecoh siswa saat ujian.
5. Akhiri bab dengan:
   ### Cek Pemahaman
   Sajikan 1-2 pertanyaan kasus penerapan terbuka yang menguji apakah siswa dapat membedakan konsep dan menjelaskan mekanismenya (DILARANG opsi pilihan ganda A, B, C, D, E).`;
  }

  const prompt = `${NARA_GLOBAL_PERSONA}

Tugas Anda: Tulis modul BACAAN LENGKAP untuk SATU BAB TUNGGAL: Bab ${chNum} dari materi "${overallMeta.courseTitle || 'Materi Belajar'}".
Jenjang Target: ${jenjang} (Kurikulum Nasional Indonesia)

RENCANA BAB INI:
- Nomor & Judul: Bab ${chNum}: ${chTitle}
- Pertanyaan Pemantik: "${trigger}"
- Capaian Pembelajaran: "${goal}"

DAFTAR KONSEP KUNCI YANG WAJIB DIBAHAS TUNTAS DI BAB INI:
${JSON.stringify(chapterConcepts, null, 2)}

POTONGAN SUMBER ASLI TERKAIT:
"""
${sourceContext.slice(0, 30000)}
"""

${specificGuidelines}

PERINGATAN FORMAT:
- Bab WAJIB langsung dimulai dengan "## Bab ${chNum}: ${chTitle}".
- DILARANG menulis ulang judul kursus "# ${overallMeta.courseTitle || ''}" di awal bab.
- DILARANG menyingkat penjelasan menjadi deretan angka telanjang. Jelaskan secara tuntas dan mengalir.`;

  const chapterContent = await callRouter(
    [
      { role: "system", content: "You are Nara, an empathetic, highly articulate educational writer. Strictly generate only this specific chapter in clean markdown." },
      { role: "user", content: prompt }
    ],
    model,
    0.25,
    null,
    180000
  );

  return chapterContent ? chapterContent.trim() : `## Bab ${chNum}: ${chTitle}\n\n${trigger}\n\n${goal}`;
}

/**
 * Step 2: Generate full pedagogical module using modular per-chapter pipeline with deterministic gatekeeper.
 */
async function generateModularCurriculumModule(outline, fullText, segments = [], model = "ag/gemini-3.8-flash-low", jenjang = "SMA", dbInstance = null, docId = null) {
  // 1. Jalankan Deterministic Gatekeeper & Auto-Repair Coverage
  const safeOutline = autoRepairOutlineCoverage(outline);
  const sourceContext = segments.length > 0
    ? segments.map((s) => `--- Bagian ${s.index} (${s.sourceType}) ---\n${s.text}`).join("\n\n")
    : fullText;

  // 2. Simpan chapter plans ke database dengan status 'planned' (jika dbInstance tersedia)
  if (dbInstance && docId && Array.isArray(safeOutline.chapters)) {
    try {
      syncChapterPlansToDb(dbInstance, docId, safeOutline.chapters);
    } catch (dbErr) {
      console.warn("[curriculumPipeline] Notice syncing planned chapters:", dbErr.message);
    }
  }

  // 3. Bangun Header Modul (Judul & Ringkasan Eksekutif)
  const header = `# ${safeOutline.title}\n\n> 📌 **Tesis & Esensi Modul:** ${safeOutline.executiveSummary || "Modul pembelajaran mendalam terstruktur."}\n\n---\n\n`;

  // 4. Generasi Setiap Bab Secara Modular (Paralel / Terkontrol)
  const chapters = safeOutline.chapters || [];
  const conceptMap = new Map((safeOutline.concepts || []).map((c) => [c.id, c]));

  console.log(`[curriculumPipeline] Memulai generasi modular untuk ${chapters.length} bab pada dokumen "${safeOutline.title}"...`);

  const chapterPromises = chapters.map(async (ch) => {
    const rawKeys = Array.isArray(ch.keyConceptIds) ? ch.keyConceptIds : [];
    const chConcepts = rawKeys.map((kId) => conceptMap.get(kId)).filter(Boolean);

    // Fallback jika konsep tidak terpetakan langsung
    const assignedConcepts = chConcepts.length > 0 ? chConcepts : (safeOutline.concepts || []).slice(0, 3);

    let chapterMarkdown = "";
    let isSuccess = false;
    let lastError = null;

    // Bounded retry per bab (maksimal 2 percobaan per bab sebelum menandai gagal)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        chapterMarkdown = await generateChapterModular(
          ch,
          assignedConcepts,
          sourceContext,
          {
            courseTitle: safeOutline.title,
            totalChapters: chapters.length,
            executiveSummary: safeOutline.executiveSummary
          },
          model,
          jenjang
        );

        if (chapterMarkdown && chapterMarkdown.length > 200) {
          isSuccess = true;
          break;
        } else {
          throw new Error("Output bab terlalu pendek atau kosong");
        }
      } catch (err) {
        lastError = err;
        console.warn(`[curriculumPipeline] Percobaan ${attempt} gagal untuk Bab ${ch.chapterNumber}: ${err.message}`);
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    }

    if (isSuccess) {
      if (dbInstance && docId) {
        try {
          const chNum = Number(ch.chapterNumber ?? ch.chapter_number ?? 1);
          dbInstance.prepare(`
            UPDATE chapter_plans
            SET content = ?, status = 'completed', updated_at = ?
            WHERE doc_id = ? AND chapter_number = ?
          `).run(chapterMarkdown, Date.now(), docId, chNum);
        } catch (updateErr) {
          console.warn(`[curriculumPipeline] Notice updating chapter plan ${ch.chapterNumber}:`, updateErr.message);
        }
      }
      return { chapterNumber: ch.chapterNumber || ch.chapter_number || 1, content: chapterMarkdown, success: true };
    } else {
      console.error(`[curriculumPipeline] Gagal menulis Bab ${ch.chapterNumber} setelah retry:`, lastError ? lastError.message : "Error");
      const fallbackContent = `## Bab ${ch.chapterNumber}: ${ch.chapterTitle || 'Bab Materi'}\n\n*Gagal menyusun bab ini secara lengkap: ${lastError ? lastError.message : 'Terjadi kendala jaringan'}*`;
      if (dbInstance && docId) {
        try {
          const chNum = Number(ch.chapterNumber ?? ch.chapter_number ?? 1);
          dbInstance.prepare(`
            UPDATE chapter_plans
            SET content = ?, status = 'failed', updated_at = ?
            WHERE doc_id = ? AND chapter_number = ?
          `).run(fallbackContent, Date.now(), docId, chNum);
        } catch {}
      }
      return { chapterNumber: ch.chapterNumber || ch.chapter_number || 1, content: fallbackContent, success: false };
    }
  });

  const generatedChapters = await Promise.all(chapterPromises);

  // 5. Urutkan bab sesuai nomor urut dan gabungkan
  generatedChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  const fullDocumentMarkdown = header + generatedChapters.map((c) => c.content).join("\n\n---\n\n");

  const anyFailed = generatedChapters.some(c => !c.success);
  if (dbInstance && docId) {
    try {
      dbInstance.prepare("UPDATE documents SET status = ? WHERE id = ?").run(anyFailed ? "partial" : "completed", docId);
    } catch {}
  }

  console.log(`[curriculumPipeline] Selesai merakit modul kurikulum modular (${fullDocumentMarkdown.length} karakter).`);
  return fullDocumentMarkdown;
}

/**
 * Step 2 Wrapper: Kompatibel dengan pemanggilan legacy generateNaraModule.
 */
async function generateNaraModule(outline, fullText, segments = [], model = "ag/gemini-3.8-flash-low", jenjang = "SMA", dbInstance = null, docId = null) {
  try {
    return await generateModularCurriculumModule(outline, fullText, segments, model, jenjang, dbInstance, docId);
  } catch (err) {
    console.warn("[curriculumPipeline] Fallback ke modul monolitik akibat:", err.message);
    return fullText;
  }
}

const {
  validateCurriculumCoverage,
  validateDocumentCoverageFromDb,
  isConceptRequired
} = require("./coverageValidator");

module.exports = {
  segmentDocumentText,
  extractConceptsAndOutline,
  generateNaraModule,
  generateChapterModular,
  generateModularCurriculumModule,
  syncChapterPlansToDb,
  autoRepairOutlineCoverage,
  validateCurriculumCoverage,
  validateDocumentCoverageFromDb,
  isConceptRequired
};
