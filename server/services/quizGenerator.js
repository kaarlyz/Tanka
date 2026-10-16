const crypto = require("node:crypto");
const { db } = require("../db");
const { callRouter, detectRealMath } = require("../ai");
const { safeJsonParse, healControlCharsToLatex } = require("../utils/jsonParser");
const { validateAndNormalizeQuiz } = require("./quizValidator");

/**
 * Core question generator for Tanka
 * Generates verified, curriculum-grounded multiple-choice questions (A-E)
 * using canonical concepts, HOTS scenarios, and KaTeX mathematical notation.
 */
async function generateQuestionsCore({
  docId,
  count = 5,
  quizType = "conceptual",
  model = "ag/gemini-3.8-flash-low",
  customInstruction = "",
  referenceQuestions = [],
  lastScore = null
}) {
  const parsedCount = parseInt(count, 10);
  const finalCount = Number.isFinite(parsedCount) ? Math.max(1, Math.min(30, parsedCount)) : 5;
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
  if (!doc) throw new Error("Document not found");

  const isMathDomain = detectRealMath(doc.content);

  let typeGuidance = "";
  if (isMathDomain) {
    if (quizType === "beginner") {
      typeGuidance = `TIPE KUIS: MATEMATIKA / EKSAK - LEVEL PEMULA (MURNI FONDASI ANGKA & SIMBOLIK)
- PRINSIP UTAMA: MURNI OPERASI MATEMATIKA TELANJANG (NAKED MATH).
- LARANGAN KERAS (HARAM MUTLAK):
  * DILARANG KERAS menyertakan stimulus cerita, studi kasus narasi panjang, atau konteks terapan (contoh HARAM: biologi, ragi, kultur bakteri, fisika terapan, nano material, perdagangan, lab).
  * Pertanyaan HARUS langsung to-the-point berupa simbol dan angka matematika (contoh BENAR: "Sederhanakan bentuk...", "Tentukan nilai x dari persamaan...").
- TANGGA KESULITAN BUTIR SOAL:
  * Soal 1–2 (Pemanasan Notasi & Identifikasi): Ubah basis angka (misal: ubah 8 ke basis 2), sifat dasar eksponen/akar (misal: $2^3 \\times 2^2$, nilai $a^0$), atau identifikasi komponen dasar.
  * Soal 3–4 (Operasi Aljabar 1–2 Langkah Telanjang): Persamaan dasar tanpa cerita (misal: $2^{6/k} = 4$, tentukan $k$; $3^{x+1} = 27$, tentukan $x$).
  * Soal 5 (Penyederhanaan Operasi Langsung): Penyederhanaan pecahan basis prima langsung atau akar sederhana tanpa variabel rumit.
- OPSI JAWABAN (A, B, C, D, E): WAJIB berupa angka bulat sederhana atau pecahan paling ringkas. Dilarang opsi narasi panjang.`;
    } else if (quizType === "conceptual") {
      typeGuidance = `TIPE KUIS: MATEMATIKA / EKSAK - LEVEL STANDAR (UJIAN SEKOLAH / TKA)
- Uji keterampilan kurikulum standar: operasi campuran pecahan eksponen, penyederhanaan bentuk akar kuadrat sempurna, dan persamaan eksponen/aljabar baku.
- Soal to-the-point, fokus pada ketepatan manipulasi aljabar baku tanpa narasi bertele-tele.
- Opsi jawaban berupa ekspresi aljabar atau angka rapi. Pembahasan membedah langkah sistematis tuntas.`;
    } else {
      typeGuidance = `TIPE KUIS: MATEMATIKA / EKSAK - LEVEL HOTS (ANALITIK & PENALARAN TINGKAT TINGGI)
- Penalaran tingkat tinggi: penggabungan multi-aturan sifat matematis, pemecahan parameter variabel ganda, pembuktian non-rutin.
- DI SINI (DAN HANYA DI LEVEL INI) diizinkan menggunakan skenario pemodelan kontekstual terapan nyata atau stimulus masalah kuantitatif kompleks.`;
    }
  } else {
    if (quizType === "beginner") {
      typeGuidance = `TIPE KUIS: TEORI / NON-MATEMATIKA - LEVEL PEMULA (FONDASI KONSEP & FAKTA)
- Uji penguasaan fondasi: definisi terminologi pokok, klasifikasi fungsi, dan tokoh/peristiwa kunci yang tertulis langsung pada materi sumber.
- Pertanyaan langsung dan jelas.
- OPSI JAWABAN (A, B, C, D, E): WAJIB SANGAT SINGKAT (1–4 kata), padat, dan langsung ke inti.`;
    } else if (quizType === "conceptual") {
      typeGuidance = `TIPE KUIS: TEORI / NON-MATEMATIKA - LEVEL STANDAR (KONSEPTUAL & PEMAHAMAN)
- Uji pemahaman relasional: hubungan sebab-akibat, perbandingan antar-kategori/paradigma, dan analisis faktor pembeda antar-konsep materi.
- Opsi jawaban setara dan menguji penalaran logis materi.`;
    } else {
      typeGuidance = `TIPE KUIS: TEORI / NON-MATEMATIKA - LEVEL HOTS (ANALISIS KRITIS & EVALUASI WACANA)
- Uji evaluasi tingkat tinggi: analisis fenomena kasus sosial/wacana nyata, evaluasi dilema teori, kritik asumsi, dan keterkaitan multi-variabel.`;
    }
  }

  let antiSlopRule = "";
  if (isMathDomain) {
    if (quizType === "beginner") {
      antiSlopRule = `- PENGECUALIAN MATEMATIKA PEMULA: DILARANG KERAS membuat soal cerita, studi kasus narasi, atau konteks biologi/ragi/lab/teknik. Soal WAJIB manipulasi simbolik dan aljabar angka telanjang (naked math).`;
    } else if (quizType === "conceptual") {
      antiSlopRule = `- MATEMATIKA STANDAR: Soal to-the-point pada rumus dan manipulasi persamaan baku tanpa narasi berlebihan.`;
    } else {
      antiSlopRule = `- MATEMATIKA HOTS: Hadirkan masalah pemodelan nyata kontekstual, keterkaitan multi-konsep, atau penalaran non-rutin.`;
    }
  } else {
    if (quizType === "beginner") {
      antiSlopRule = `- TEORI PEMULA: Soal menguji terminologi kunci, klasifikasi, dan fakta langsung materi sumber. Opsi jawaban sangat singkat.`;
    } else {
      antiSlopRule = `- DILARANG membuat soal template kamus/hafalan kaku. Soal WAJIB menghadirkan kasus nyata, fenomena kontekstual, atau dinamika sebab-akibat.`;
    }
  }

  let customDirective = "";
  if (customInstruction && customInstruction.trim()) {
    customDirective = `
ARAHAN KHUSUS & KEINGINAN SISWA MENGENAI SOAL INI:
"${customInstruction.trim()}"
PENTING:
- Jika siswa meminta "buat soal sejenis / kloning": ambil pola soal yang sudah ada tetapi ubah angka/variabelnya agar siswa bisa melatih konsep yang sama berulang kali.
- Jika siswa meminta topik tertentu diperbanyak: jadikan topik tersebut fokus utama pada seluruh butir soal.
- Jika siswa meminta soal penalaran/HOTS: rancang pertanyaan berbasis analisis mendalam atau stimulus cerita/kasus.
- Jika siswa meminta soal pemahaman fondasi: rancang pertanyaan logika konsep tanpa perhitungan rumit yang membingungkan.
`;
  }

  let referenceContext = "";
  if (Array.isArray(referenceQuestions) && referenceQuestions.length > 0) {
    referenceContext = `
CONTOH BUTIR SOAL ACUAN DARI MATERI SAAT INI:
${JSON.stringify(referenceQuestions.slice(0, 4).map((q) => ({ question: q.question, options: q.options, explanation: q.explanation })), null, 2)}
Gunakan acuan di atas untuk membuat soal sejenis/variasi sesuai arahan siswa.
`;
  }

  const unresolvedMistakes = db.prepare(
    "SELECT question, pitfall, formula FROM mistake_notebook WHERE doc_id = ? AND resolved = 0 LIMIT 5"
  ).all(docId);

  let weaknessContext = "";
  if (unresolvedMistakes && unresolvedMistakes.length > 0) {
    weaknessContext = `\nCATATAN EVALUASI & TITIK LEMAH PEMBELAJAR (PRIORITAS REMEDIAL):
Pembelajar sebelumnya pernah keliru pada konsep/soal berikut:
${unresolvedMistakes.map((m, i) => `${i + 1}. Soal Terkait: "${m.question}" | Analisis Jebakan: ${m.pitfall || "Miskonsepsi pemahaman"}`).join("\n")}
PRIORITAS: Alokasikan 1 atau 2 butir soal variasi baru yang menyasar konsep di atas. Buat opsi pengecoh yang dirancang persis dengan miskonsepsi (jebakan) tersebut agar kita tahu apakah dia jatuh ke lubang yang sama.\n`;
  }

  let adaptiveContext = "";
  if (lastScore !== null && lastScore !== undefined) {
    const s = parseInt(lastScore, 10);
    if (s < 40) {
      adaptiveContext = `\n[SISTEM ADAPTIF - SKOR TERAKHIR: ${s}/100]\nPengguna sangat kesulitan pada tes sebelumnya.\nINSTRUKSI KHUSUS:\n1. SCAFFOLDING MUNDUR: Turunkan tingkat kesulitan 1 level. Awali dengan 2 soal fundamental / konsep paling dasar sebelum ke hitungan kompleks.\n2. DRILL ISOMORFIK: Buat soal identik (isomorphic) dengan kesalahan sebelumnya tapi dengan angka/situasi yang diubah, agar ia membiasakan jalan pikiran yang benar.\n`;
    } else if (s < 75) {
      adaptiveContext = `\n[SISTEM ADAPTIF - SKOR TERAKHIR: ${s}/100]\nPengguna masih ragu di beberapa konsep menengah.\nINSTRUKSI KHUSUS: Pertahankan level ini, tapi pastikan bagian 'explanation' (pembahasan) dijabarkan jauh lebih mendetail dan asyik. Jelaskan *kenapa* opsi lain salah secara psikologis.\n`;
    } else if (s >= 85) {
      adaptiveContext = `\n[SISTEM ADAPTIF - SKOR TERAKHIR: ${s}/100]\nPengguna telah menguasai materi ini dengan baik!\nINSTRUKSI KHUSUS: Naikkan tingkat kesulitan (HOTS). Berikan soal sintesis/gabungan multi-aturan, atau studi kasus nyata yang menantang pemikiran kritisnya. Buat pengecoh (distractors) yang lebih halus.\n`;
    }
  }

  const concepts = db.prepare("SELECT * FROM document_concepts WHERE doc_id = ?").all(docId);
  const segments = db.prepare("SELECT raw_text FROM document_segments WHERE doc_id = ? ORDER BY segment_index ASC").all(docId);

  let factsContext = "";
  if (concepts && concepts.length > 0) {
    factsContext = "DAFTAR KONSEP KANONIKAL RESMI (SUMBER UTAMA):\n" +
      concepts.map((c, i) => `${i + 1}. [${c.name}]: ${c.definition}`).join("\n") + "\n\n";
  }
  if (segments && segments.length > 0) {
    factsContext += "SUMBER FAKTA ASLI:\n" + segments.map(s => s.raw_text).join("\n\n").slice(0, 5000);
  } else {
    factsContext += "TEKS MATERI:\n" + doc.content.slice(0, 5000);
  }

  const mathRule = isMathDomain
    ? `ATURAN FORMAT MATEMATIKA:
Jika materi/soal mengandung rumus atau hitungan, WAJIB gunakan KaTeX LaTeX ($...$ inline atau $$...$$ blok), contoh: $\\frac{a}{b}$, $\\sqrt{x}$, $x^2$.`
    : `ATURAN MATERI NON-HITUNGAN:
Materi ini adalah materi konseptual/teori non-matematika. Kosongkan field "formula": "" dan fokus pada pemahaman konsep/fakta. DILARANG MENGARANG RUMUS FISIKA/MATEMATIKA PADA ILMU SOSIAL.`;

  const generateQuizBatch = async (batchCount, offsetId = 1) => {
    const prompt = `Anda adalah pembuat soal ujian akademik profesional berstandar tinggi (UTBK & Ujian Sekolah).
Buatkan TEPAT ${batchCount} butir soal pilihan ganda dengan 5 PILIHAN JAWABAN (A, B, C, D, E) mulai nomor urut ID ${offsetId}.

${typeGuidance}
${customDirective}
${referenceContext}
${weaknessContext}
${adaptiveContext}

STANDAR KUALITAS SOAL (STANDAR RESMI UTBK & ANTI AI-SLOP MUTLAK):
1. ATURAN RELEVANSI & ANTI-SLOP (MUTLAK):
   ${antiSlopRule}
2. SEMANTIC SYMMETRY & ANTI-LEAK PADA OPSI A-E:
   - DILARANG membuat opsi jawaban benar menjadi opsi yang paling panjang atau paling rinci.
   - Kelima opsi (A, B, C, D, E) WAJIB memiliki jumlah kata dan panjang karakter yang setara (variasi panjang maksimal 15%).
   - Pilihan pengecoh (distraktor) WAJIB mewakili kesalahan berpikir/perhitungan nyata siswa, BUKAN opsi ngawur/absurd.
   - DILARANG menggunakan opsi klise AI: "Semua benar", "Semua salah", atau "Tidak ada pilihan yang tepat".
3. PEMBAHASAN TANPA BASA-BASI AI (DIRECT MECHANICAL PROOF):
   - DILARANG menulis basa-basi seperti "Tentu saja", "Mari kita bahas", "Jawaban yang benar adalah...".
   - Pembahasan langsung membedah bukti faktual/matematis langkah demi langkah pada field "steps".
   - Field "pitfall" WAJIB menjelaskan jebakan logika spesifik yang sengaja dipasang pada opsi pengecoh.
4. KUNCI JAWABAN: correctIndex 0=A, 1=B, 2=C, 3=D, 4=E.
5. FORMAT TEKS OPSI: DILARANG menyertakan prefix huruf seperti "A.", "B." di teks options.

${mathRule}

Format output WAJIB HANYA berupa array JSON valid tanpa markdown fence:
[
  {
    "id": ${offsetId},
    "question": "...",
    "options": ["...", "...", "...", "...", "..."],
    "correctIndex": 1,
    "formula": "",
    "steps": [
      {"step": 1, "title": "Identifikasi", "desc": "..."},
      {"step": 2, "title": "Operasi/Penalaran", "desc": "..."},
      {"step": 3, "title": "Kesimpulan", "desc": "..."}
    ],
    "explanation": "...",
    "pitfall": "..."
  }
]

Fakta & Konsep Sumber:
"""
${factsContext}
"""`;

    const tokenBudget = Math.min(8192, Math.max(2048, batchCount * 800));
    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const reply = await callRouter([
          { role: "system", content: "You are an expert exam question generator that strictly outputs valid JSON arrays." },
          { role: "user", content: prompt }
        ], model, 0.2, tokenBudget);

        const parsed = safeJsonParse(reply);
        let items = parsed;
        if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
          const possibleArray = parsed.questions || parsed.data || parsed.soal || parsed.items || Object.values(parsed).find(Array.isArray);
          if (Array.isArray(possibleArray)) {
            items = possibleArray;
          }
        }
        if (Array.isArray(items) && items.length > 0) {
          return items;
        }
        throw new Error("Format JSON soal tidak valid dari model AI");
      } catch (err) {
        lastError = err;
        if (attempt < 2) {
          console.warn(`[QuizGenerator] Gagal parse batch (offset ${offsetId}, percobaan ${attempt}). Mencoba ulang... Alasan: ${err.message}`);
        }
      }
    }

    throw lastError || new Error("Format JSON soal tidak valid dari model AI");
  };

  const maxBatch = quizType === "analytical" || quizType === "hots" ? 3 : 5;
  let questions = [];

  if (finalCount <= maxBatch) {
    questions = await generateQuizBatch(finalCount, 1);
  } else {
    const batchSize = maxBatch;
    const tasks = [];
    let remaining = finalCount;
    let currentOffset = 1;
    while (remaining > 0) {
      const take = Math.min(batchSize, remaining);
      tasks.push({ count: take, offset: currentOffset });
      currentOffset += take;
      remaining -= take;
    }

    const results = await Promise.all(
      tasks.map(t => generateQuizBatch(t.count, t.offset))
    );
    questions = results.flat();
  }

  // Bersihkan karakter kontrol dari output model sebelum validasi
  const healedQuestions = questions.map(q => {
    if (!q || typeof q !== "object") return q;
    return {
      ...q,
      question: healControlCharsToLatex(q.question),
      options: Array.isArray(q.options) ? q.options.map(opt => healControlCharsToLatex(opt)) : q.options,
      formula: healControlCharsToLatex(q.formula || ""),
      explanation: healControlCharsToLatex(q.explanation || ""),
      pitfall: healControlCharsToLatex(q.pitfall || ""),
      steps: Array.isArray(q.steps)
        ? q.steps.map(s => ({
            ...s,
            title: healControlCharsToLatex(s.title || ""),
            desc: healControlCharsToLatex(s.desc || "")
          }))
        : q.steps
    };
  });

  // Validasi dan normalisasi kanonis dengan pengacakan opsi dan pembersihan letter-reference
  return validateAndNormalizeQuiz(healedQuestions, { shuffleOptions: true, renumber: true });
}

module.exports = {
  generateQuestionsCore
};
