/**
 * examPipeline.js — 4-Stage Exam Processing Pipeline
 * EXTRACT → SOLVE (3× vote) → WRITE (per-subtes) → VERIFY
 * 
 * Replaces single-shot exam processing with structured multi-pass pipeline.
 */

const { callRouter } = require("../ai");
const { mathify } = require("../utils/mathify");
const { safeJsonParse } = require("../utils/jsonParser");

// ─── Global Rules (injected into every prompt) ─────────────────────
const ATURAN_MODE_SOAL = `ATURAN MODE SOAL
1. Akurasi di atas gaya. Jika tidak yakin, katakan tidak yakin; jangan mengarang.
2. Hanya gunakan fakta dari soal/stimulus atau konsep baku kurikulum Indonesia.
   Dilarang menambah data, angka, nama, atau kutipan yang tidak ada di soal.
3. Jangan mengoreksi atau "memperbaiki" soal. Jika soal ambigu/cacat/typo OCR,
   laporkan di field "catatan_soal", jangan diam-diam diubah.
4. Angka, simbol, dan satuan disalin persis. Tulis perhitungan lengkap, jangan lompat.
5. Bahasa Indonesia baku, ringkas, tanpa basa-basi, tanpa emoji.
6. Output HANYA JSON valid sesuai skema. Tanpa markdown, tanpa teks di luar JSON.`;

// ─── Subtes Detection ──────────────────────────────────────────────
function detectSubtes(questionText, options) {
  const optText = Array.isArray(options)
    ? options.join(" ")
    : options && typeof options === "object"
      ? Object.values(options).join(" ")
      : String(options || "");
  const t = (questionText + " " + optText).toLowerCase();

  if (/\b(paragraph|passage|read|text|the\s+author|main\s+idea|implies?|infer|vocabulary|synonym|antonym|closest\s+in\s+meaning)\b/i.test(t))
    return "literasi_inggris";
  if (/\b(paragraf|bacaan|teks|penulis|gagasan\s+utama|simpulan|kalimat\s+efektif|ejaan|diksi|puebi|konjungsi|klausa)\b/.test(t))
    return "literasi_indonesia";
  if (/\b(integral|turunan|limit|logaritma|trigonometri|persamaan|pertidaksamaan|fungsi|matriks|vektor|peluang|statistik|barisan|deret|eksponen|akar|pangkat)\b/.test(t))
    return "penalaran_matematika";
  if (/\b(persen|diskon|bunga|untung|rugi|harga|rasio|perbandingan|rata-rata|median|modus|diagram|tabel|data|grafik)\b/.test(t))
    return "pengetahuan_kuantitatif";
  if (/\b(silogisme|premis|kesimpulan|logika|penalaran|analitik|pola|deret\s+angka|hubungan\s+antar|sebab-akibat|argumen)\b/.test(t))
    return "penalaran_umum";
  if (/\b(kelangkaan|permintaan|penawaran|inflasi|deflasi|gdp|pdb|apbn|fiskal|moneter|ketenagakerjaan|koperasi|perdagangan|akuntansi|neraca|laba|rugi|ekonomi)\b/.test(t))
    return "mapel_tka";
  if (/\b(sosiologi|stratifikasi|mobilitas|konflik|integrasi|globalisasi|perubahan\s+sosial|interaksi\s+sosial|lembaga|kelompok\s+sosial|diferensiasi)\b/.test(t))
    return "mapel_tka";
  if (/\b(makna|kata|struktur|ide\s+pokok|pemahaman|umum)\b/.test(t))
    return "pengetahuan_pemahaman_umum";

  return "mapel_tka";
}

// ─── Stage 1: EXTRACT ──────────────────────────────────────────────
const EXTRACT_PROMPT = `Kamu parser dokumen soal UTBK-SNBT/TKA.
Dari potongan teks berikut, ekstrak SETIAP soal utuh menjadi JSON.

Aturan ekstraksi:
- Salin teks soal dan opsi PERSIS seperti di dokumen. Jangan parafrase, jangan benahi ejaan.
- Jika beberapa soal berbagi satu bacaan/tabel/grafik, isi "stimulus" di tiap soal tersebut dengan teks lengkapnya.
- "tipe": pilihan_ganda | pilihan_ganda_kompleks (boleh >1 jawaban) | kategori (tabel matriks baris pernyataan benar/salah) | isian.
- "subtes": tentukan dari isi soal: penalaran_umum | pengetahuan_pemahaman_umum |
  pemahaman_bacaan_menulis | pengetahuan_kuantitatif | literasi_indonesia |
  literasi_inggris | penalaran_matematika | mapel_tka.
- "kunci_dokumen": isi HANYA jika dokumen menuliskan kunci jawaban untuk soal itu. Jika tidak ada, null. Jangan menebak.
- Soal terpotong di batas potongan (opsi/pertanyaan tidak lengkap): jangan keluarkan, tulis nomornya di "terpotong".
- Teks rusak/tidak terbaca: tulis "[TIDAK TERBACA]" di posisinya, jangan ditebak.

FORMAT KHUSUS — tangani dengan benar:
- Soal pernyataan romawi (I, II, III, IV): pertanyaan dan pernyataan masuk ke "pertanyaan", opsi kombinasi (mis. "A. I dan II", "B. II dan III") masuk ke "opsi". Tipe tetap "pilihan_ganda".
- Soal dengan opsi kurang dari 5 (A-C atau A-D): tulis opsi yang ada saja, jangan tambahkan opsi fiktif.
- Soal pilihan ganda kompleks kategori (tabel pernyataan Benar/Salah): "tipe": "kategori", simpan baris-baris pernyataan ke dalam array "matrixStatements": [{"statement": "teks pernyataan", "correctAnswer": "BENAR atau SALAH"}]. Jika dokumen tidak memuat kunci jawaban, isi correctAnswer dengan null. Opsi utama biarkan null atau kosong {}.
- Gambar/grafik/diagram: jika teks mengandung placeholder seperti [Gambar: ...], [Gambar], [Grafik], [Tabel], [Diagram], (Lihat gambar), atau referensi "gambar di atas/bawah/samping", salin placeholder persis ke "pertanyaan" atau isi field "imageUrl" dengan path yang tertera, dan tambah field "has_visual": true.
- Nomor soal tidak urut (misal loncat dari 5 ke 8): gunakan nomor asli dari dokumen, jangan re-number.

Skema output: {"soal":[{"nomor":1,"subtes":"...","tipe":"pilihan_ganda","stimulus":"...atau null","pertanyaan":"...","imageUrl":"...atau null","opsi":{"A":"...","B":"...","C":"...","D":"..."},"matrixStatements":[{"statement":"...","correctAnswer":"BENAR"}],"kunci_dokumen":"A atau null","has_visual":false}],"terpotong":[]}`;

// ─── Stage 2: SOLVE ────────────────────────────────────────────────
const SOLVE_PROMPT = `Kamu penyelesai soal UTBK-SNBT/TKA tingkat ahli.
Kerjakan soal dari nol. Jangan menebak berdasarkan pola opsi.

Cara kerja:
1. Pahami apa yang ditanyakan dan data yang diberikan.
2. Selesaikan langkah demi langkah sampai hasil akhir.
3. Cocokkan hasil dengan opsi. Jika tidak ada opsi yang cocok, periksa ulang hitunganmu SEKALI, lalu laporkan jika tetap tidak cocok.
4. Untuk pilihan_ganda_kompleks/benar_salah, nilai SETIAP pernyataan/opsi secara terpisah.
5. Untuk soal pernyataan romawi (I, II, III, IV) dengan opsi kombinasi: evaluasi kebenaran SETIAP pernyataan romawi satu per satu, lalu cocokkan kombinasi yang benar dengan opsi.
6. Jika soal mereferensikan gambar/grafik/tabel yang tidak tersedia ("[Gambar]", "[Grafik]", "gambar di atas"), selesaikan sebisa mungkin dari data teks yang ada. Jika mustahil tanpa visual, isi "tidak_cocok_opsi": true dan "penalaran" jelaskan bahwa soal membutuhkan visual yang tidak tersedia.

Skema output: {"penalaran":"<ringkas, maks 8 kalimat>","jawaban":"<huruf; kompleks: 'A,C'; isian: nilai>","tidak_cocok_opsi":false}`;

// ─── Stage 3: WRITE (per-subtes appendix map) ──────────────────────
const WRITE_BASE = `Kamu penulis pembahasan buku bimbel premium untuk siswa SMA Indonesia.
JAWABAN FINAL sudah ditetapkan dan benar. Tugasmu menjelaskan, BUKAN menilai ulang.
Jangan mengubah jawaban. Jika langkahmu tidak sampai ke jawaban final, laporkan di "catatan_soal".

Isi pembahasan:
- "konsep_kunci": 1-3 konsep/rumus/aturan yang diuji, tulis sebagai pernyataan yang bisa dihafal.
- "langkah": urut, satu inferensi atau perhitungan per langkah. Langkah terakhir HARUS menghasilkan jawaban final.
- "analisis_opsi": untuk SETIAP opsi, 1-2 kalimat: kenapa benar atau salah, dan jenis pengecohnya:
  salah_konsep | salah_hitung | terlalu_umum | terlalu_ekstrem | di_luar_konteks | kebalikan | benar_tapi_tidak_menjawab.
- "trik_cepat": jalan pintas yang VALID secara matematis/logis; jika tidak ada, null. Jangan memaksa.
- "jebakan": kesalahan paling umum siswa di soal ini, spesifik, bukan nasihat umum. Atau null.
- "tingkat": mudah | sedang | sulit (relatif terhadap peserta UTBK).
- "estimasi_detik": waktu realistis untuk siswa yang menguasai konsepnya.
- "catatan_soal": ambigu/cacat/typo OCR, atau null.

Skema output: {"jawaban":"...","konsep_kunci":[],"langkah":[],"analisis_opsi":{"A":"...","B":"...","C":"...","D":"..."},"trik_cepat":"...atau null","jebakan":"...atau null","tingkat":"mudah|sedang|sulit","estimasi_detik":60,"catatan_soal":"...atau null"}`;

const WRITE_SUBTES_APPENDIX = {
  penalaran_umum: `\nTambahan: Tunjukkan struktur logikanya: premis → inferensi → kesimpulan. Untuk soal analitik/penjadwalan, buat tabel kemungkinan dan coret kasus yang gugur.`,
  pengetahuan_kuantitatif: `\nTambahan: Tulis tiap langkah aljabar/hitung. Sebut rumus sebelum dipakai. Jika ada cara estimasi/substitusi angka yang valid, jadikan trik_cepat.`,
  penalaran_matematika: `\nTambahan: Tulis tiap langkah aljabar/hitung. Sebut rumus sebelum dipakai. Jika ada cara estimasi/substitusi angka yang valid, jadikan trik_cepat.`,
  pemahaman_bacaan_menulis: `\nTambahan: Rujuk bagian teks/kalimat yang relevan (parafrase, jangan salin panjang). Untuk soal kebahasaan, sebut kaidah yang berlaku (PUEBI/kalimat efektif/koherensi).`,
  literasi_indonesia: `\nTambahan: Letakkan bukti dari bacaan (rujuk paragraf/kalimat). Jelaskan kenapa pengecoh "terdengar benar" tapi tidak didukung teks.`,
  literasi_inggris: `\nTambahan: Letakkan bukti dari bacaan (rujuk paragraf/kalimat). Jelaskan kenapa pengecoh "terdengar benar" tapi tidak didukung teks. Literasi Inggris: pembahasan dalam bahasa Indonesia, kutipan kunci dalam bahasa Inggris maks 1 kalimat.`,
  pengetahuan_pemahaman_umum: `\nTambahan: Jelaskan makna kata/struktur/ide pokok dan alasan opsi lain menyimpang makna.`,
  mapel_tka: `\nTambahan: Sebut kompetensi/materi kurikulum yang diuji dan rumus/konsep inti sebelum langkah.`,
};

// ─── Stage 4: VERIFY ───────────────────────────────────────────────
const VERIFY_PROMPT = `Kamu pemeriksa pembahasan. Diberikan soal, jawaban final, dan pembahasan.
Periksa:
1. Apakah setiap langkah valid dan langkah terakhir benar-benar menghasilkan jawaban final?
2. Apakah analisis tiap opsi konsisten dengan jawaban final?
3. Adakah fakta/angka dalam pembahasan yang tidak ada di soal atau tidak baku?
4. Apakah trik_cepat valid untuk SEMUA kasus, bukan hanya soal ini?

Skema output: {"lolos":true,"masalah":[]}
Jika ada masalah: {"lolos":false,"masalah":[{"bagian":"langkah|analisis_opsi|trik_cepat|fakta","detail":"..."}]}
Jika lolos=false, jangan memperbaiki; cukup laporkan.`;

// ─── Orchestrator ──────────────────────────────────────────────────

function splitDocumentIntoQuestionChunks(rawText) {
  // Cek apakah dokumen memiliki pola pemisah butir soal resmi TKA
  // Pola 1: Indikator: ... (N)
  // Pola 2: Bentuk Soal :
  // Pola 3: Soal No. N / Nomor N
  const splitRegex = /(?=(?:Indikator:[^\n]*\(\d+\)|Bentuk Soal\s*:|Soal No\.\s*\d+))/i;
  const rawParts = rawText.split(splitRegex).map(p => p.trim()).filter(Boolean);

  if (rawParts.length <= 1) {
    // Fallback: chunk biasa per 40.000 karakter
    const chunks = [];
    for (let i = 0; i < rawText.length; i += 40000) {
      chunks.push(rawText.slice(i, i + 40000));
    }
    return chunks;
  }

  // Gabungkan per 5-6 soal per chunk agar tidak token fatigue dan anti-missing
  const CHUNK_SOAL_COUNT = 5;
  const batchedChunks = [];
  for (let i = 0; i < rawParts.length; i += CHUNK_SOAL_COUNT) {
    const batch = rawParts.slice(i, i + CHUNK_SOAL_COUNT);
    batchedChunks.push(batch.join("\n\n---\n\n"));
  }
  return batchedChunks;
}

/**
 * Run the 4-stage exam pipeline on raw text.
 * Returns { soal: [...enriched questions...], terpotong: [...], stats: {...} }
 */
async function runExamPipeline(rawText, title, userModel = "ag/gemini-3.8-flash-low") {
  const stats = { extracted: 0, solved: 0, written: 0, verified: 0, conflicts: 0, flagged: [] };

  // Choose models: extract uses flash-low for fast parsing anti-timeout, solve uses Gemini high thinking
  const extractModel = "ag/gemini-3.8-flash-low";
  const solveModel = "ag/gemini-3.8-flash-high";
  const writeModel = userModel;
  const verifyModel = userModel;

  // ── STAGE 1: EXTRACT (Deterministic Chunking) ──
  console.log(`[ExamPipeline] Stage 1: EXTRACT from ${rawText.length} chars...`);
  const textChunks = splitDocumentIntoQuestionChunks(rawText);
  console.log(`[ExamPipeline] Split text into ${textChunks.length} chunks for deterministic extraction`);

  let allExtractedQuestions = [];
  let allTerpotong = [];

  for (let cIdx = 0; cIdx < textChunks.length; cIdx++) {
    const chunkText = textChunks[cIdx];
    try {
      const extractResponse = await callRouter([
        { role: "system", content: ATURAN_MODE_SOAL },
        { role: "user", content: `${EXTRACT_PROMPT}\n\nTEKS DOKUMEN (Bagian ${cIdx + 1}/${textChunks.length}):\n"""\n${chunkText}\n"""` }
      ], extractModel, 0.0, 16384);

      const parsedChunk = safeJsonParse(extractResponse);
      if (parsedChunk && Array.isArray(parsedChunk.soal)) {
        allExtractedQuestions.push(...parsedChunk.soal);
        if (Array.isArray(parsedChunk.terpotong)) {
          allTerpotong.push(...parsedChunk.terpotong);
        }
      }
    } catch (err) {
      console.warn(`[ExamPipeline] Extraction error on chunk ${cIdx + 1}: ${err.message}`);
    }
  }

  // Deduplikasi jika ada nomor ganda
  const questionMap = new Map();
  for (const q of allExtractedQuestions) {
    if (q && q.nomor !== undefined && !questionMap.has(q.nomor)) {
      questionMap.set(q.nomor, q);
    }
  }
  const questions = Array.from(questionMap.values()).sort((a, b) => (Number(a.nomor) || 0) - (Number(b.nomor) || 0));
  const terpotong = allTerpotong;

  if (questions.length === 0) {
    console.warn("[ExamPipeline] EXTRACT failed or no questions found");
    return { soal: [], terpotong: [], stats };
  }
  stats.extracted = questions.length;

  // Granular extraction diagnostics
  const tipeBreakdown = {};
  let visualCount = 0;
  for (const q of questions) {
    const t = q.tipe || "pilihan_ganda";
    tipeBreakdown[t] = (tipeBreakdown[t] || 0) + 1;
    if (q.has_visual) visualCount++;
    // Normalize: ensure opsi is object even if AI returned array
    if (Array.isArray(q.opsi)) {
      const fixed = {};
      q.opsi.forEach((v, i) => { fixed[String.fromCharCode(65 + i)] = String(v).replace(/^[A-Ea-e][.)]\s*/, ""); });
      q.opsi = fixed;
    }
  }
  console.log(`[ExamPipeline] Extracted ${questions.length} questions, ${terpotong.length} truncated. Types: ${JSON.stringify(tipeBreakdown)}${visualCount > 0 ? `, ${visualCount} with visual refs` : ""}`);

  // ── STAGE 2: SOLVE (3× vote per question) ──
  console.log(`[ExamPipeline] Stage 2: SOLVE (3× vote) for ${questions.length} questions...`);
  
  const SOLVE_BATCH_SIZE = 4;
  for (let i = 0; i < questions.length; i += SOLVE_BATCH_SIZE) {
    const batch = questions.slice(i, i + SOLVE_BATCH_SIZE);
    await Promise.all(batch.map(async (q) => {
      const soalText = buildSoalText(q);
      
      // Run 3 solve attempts in parallel
      const solvePromises = [0, 1, 2].map(() =>
        callRouter([
          { role: "system", content: ATURAN_MODE_SOAL },
          { role: "user", content: `${SOLVE_PROMPT}\n\nSOAL:\n${soalText}` }
        ], solveModel, 0.4, 4096).catch(err => {
          console.warn(`[ExamPipeline] Solve attempt failed: ${err.message}`);
          return null;
        })
      );

      const solveResults = await Promise.all(solvePromises);
      const parsedSolves = solveResults
        .filter(Boolean)
        .map(r => safeJsonParse(r))
        .filter(Boolean);

      // Vote on answers
      const voteResult = voteAnswers(parsedSolves, q.kunci_dokumen);
      q._jawaban_final = voteResult.jawaban;
      q._confidence = voteResult.confidence;
      q._konflik_kunci = voteResult.konflik_kunci;
      q._penalaran_votes = parsedSolves.map(s => s.penalaran);
      q._tidak_cocok_opsi = parsedSolves.some(s => s.tidak_cocok_opsi);

      if (q._konflik_kunci) stats.conflicts++;
      if (q._tidak_cocok_opsi) {
        stats.flagged.push({ nomor: q.nomor, reason: "tidak_cocok_opsi" });
      }
      
      // Auto-detect subtes if not set or generic
      if (!q.subtes || q.subtes === "mapel_tka") {
        const optionsText = q.opsi ? Object.values(q.opsi).join(" ") : "";
        q.subtes = detectSubtes(q.pertanyaan + " " + (q.stimulus || ""), optionsText);
      }
      
      stats.solved++;
    }));
  }

  // Solve stage diagnostics
  const confidenceCounts = { yakin: 0, mayoritas: 0, perlu_verifikasi: 0, kunci_saja: 0, gagal: 0 };
  for (const q of questions) {
    const c = q._confidence || "gagal";
    confidenceCounts[c] = (confidenceCounts[c] || 0) + 1;
  }
  console.log(`[ExamPipeline] SOLVE complete. Confidence: ${JSON.stringify(confidenceCounts)}, conflicts: ${stats.conflicts}, flagged: ${stats.flagged.length}`);

  // ── STAGE 3: WRITE (per question, subtes-specific) ──
  console.log(`[ExamPipeline] Stage 3: WRITE pembahasan for ${questions.length} questions...`);

  // Process in batches of 5 to avoid rate limits
  const WRITE_BATCH_SIZE = 5;
  for (let i = 0; i < questions.length; i += WRITE_BATCH_SIZE) {
    const batch = questions.slice(i, i + WRITE_BATCH_SIZE);
    const writePromises = batch.map(q => {
      if (q._tidak_cocok_opsi) {
        // Skip write for flagged questions
        q._pembahasan = { catatan_soal: "Soal di-flag: opsi tidak cocok dengan hasil penyelesaian. Kemungkinan soal cacat atau OCR error." };
        return Promise.resolve();
      }

      const soalText = buildSoalText(q);
      const subtesAppendix = WRITE_SUBTES_APPENDIX[q.subtes] || WRITE_SUBTES_APPENDIX.mapel_tka;
      const writePrompt = `${WRITE_BASE}${subtesAppendix}`;

      return callRouter([
        { role: "system", content: ATURAN_MODE_SOAL },
        { role: "user", content: `${writePrompt}\n\nJAWABAN FINAL: ${q._jawaban_final}\n\nSOAL:\n${soalText}` }
      ], writeModel, 0.3, 8192).then(res => {
        const parsed = safeJsonParse(res);
        if (parsed) {
          // Enforce consistency: pembahasan jawaban must match final answer
          if (parsed.jawaban && parsed.jawaban !== q._jawaban_final) {
            console.warn(`[ExamPipeline] Write inconsistency on Q${q.nomor}: wrote ${parsed.jawaban}, final is ${q._jawaban_final}`);
            parsed.jawaban = q._jawaban_final;
            parsed._forced_consistency = true;
          }
          q._pembahasan = parsed;
          stats.written++;
        } else {
          q._pembahasan = { catatan_soal: "Gagal generate pembahasan (parse error)" };
        }
      }).catch(err => {
        console.warn(`[ExamPipeline] Write failed for Q${q.nomor}: ${err.message}`);
        q._pembahasan = { catatan_soal: `Write error: ${err.message}` };
      });
    });

    await Promise.all(writePromises);
  }

  // Write stage diagnostics
  const writeFailed = questions.filter(q => q._pembahasan?.catatan_soal?.startsWith("Gagal") || q._pembahasan?.catatan_soal?.startsWith("Write error")).length;
  console.log(`[ExamPipeline] WRITE complete. Success: ${stats.written}/${questions.length}${writeFailed > 0 ? `, failed: ${writeFailed}` : ""}`);

  // ── STAGE 4: VERIFY (for sulit questions or low confidence) ──
  const needsVerify = questions.filter(q =>
    !q._tidak_cocok_opsi &&
    q._pembahasan &&
    !q._pembahasan.catatan_soal?.startsWith("Gagal") &&
    (q._confidence !== "yakin" || q._pembahasan?.tingkat === "sulit" || q._konflik_kunci)
  );

  if (needsVerify.length > 0) {
    console.log(`[ExamPipeline] Stage 4: VERIFY ${needsVerify.length} questions...`);

    const VERIFY_BATCH_SIZE = 5;
    for (let i = 0; i < needsVerify.length; i += VERIFY_BATCH_SIZE) {
      const batch = needsVerify.slice(i, i + VERIFY_BATCH_SIZE);
      const verifyPromises = batch.map(q => {
        const soalText = buildSoalText(q);
        return callRouter([
          { role: "system", content: ATURAN_MODE_SOAL },
          { role: "user", content: `${VERIFY_PROMPT}\n\nSOAL:\n${soalText}\n\nJAWABAN FINAL: ${q._jawaban_final}\n\nPEMBAHASAN:\n${JSON.stringify(q._pembahasan)}` }
        ], verifyModel, 0.1, 4096).then(res => {
          const parsed = safeJsonParse(res);
          if (parsed) {
            q._verifikasi = parsed;
            if (!parsed.lolos) {
              q._perlu_review = true;
              stats.flagged.push({ nomor: q.nomor, reason: "verify_failed", masalah: parsed.masalah });
            }
            stats.verified++;
          }
        }).catch(err => {
          console.warn(`[ExamPipeline] Verify failed for Q${q.nomor}: ${err.message}`);
        });
      });
      await Promise.all(verifyPromises);
    }
  }

  console.log(`[ExamPipeline] Complete. Stats:`, JSON.stringify(stats));
  return { soal: questions, terpotong, stats };
}

// ─── Helpers ───────────────────────────────────────────────────────

function buildSoalText(q) {
  let text = "";
  if (q.stimulus) text += `Stimulus:\n${q.stimulus}\n\n`;
  text += `Soal ${q.nomor} [${q.tipe || "pilihan_ganda"}]:\n${q.pertanyaan}\n`;
  if (q.opsi && typeof q.opsi === "object") {
    for (const [key, val] of Object.entries(q.opsi)) {
      text += `${key}. ${val}\n`;
    }
  }
  if (q.kunci_dokumen) text += `\nKunci jawaban dari dokumen: ${q.kunci_dokumen}`;
  return text;
}

function voteAnswers(parsedSolves, kunciDokumen) {
  if (parsedSolves.length === 0) {
    return {
      jawaban: kunciDokumen || null,
      confidence: kunciDokumen ? "kunci_saja" : "gagal",
      konflik_kunci: false
    };
  }

  // Count votes
  const votes = {};
  for (const s of parsedSolves) {
    const ans = (s.jawaban || "").toUpperCase().trim();
    votes[ans] = (votes[ans] || 0) + 1;
  }

  // Find majority
  const sorted = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  const topAnswer = sorted[0][0];
  const topCount = sorted[0][1];

  let confidence;
  if (topCount === parsedSolves.length) confidence = "yakin";       // unanimous
  else if (topCount >= 2) confidence = "mayoritas";                  // 2/3
  else confidence = "perlu_verifikasi";                              // 1/1/1 split

  // Ground truth: kunci_dokumen overrides, but flag conflict
  let konflik_kunci = false;
  let jawaban = topAnswer;
  if (kunciDokumen) {
    const kunci = kunciDokumen.toUpperCase().trim();
    if (kunci !== topAnswer) {
      konflik_kunci = true;
      jawaban = kunci;  // kunci_dokumen = ground truth
      console.warn(`[ExamPipeline] Vote conflict: AI voted ${topAnswer} (${topCount}/${parsedSolves.length}), kunci=${kunci}. Using kunci.`);
    }
  }

  return { jawaban, confidence, konflik_kunci };
}

/**
 * Convert pipeline result into Tanka-compatible format:
 * - questions array for quizzes table
 * - studyGuide markdown for document content
 */
function pipelineToTankaFormat(pipelineResult, title) {
  const { soal, terpotong, stats } = pipelineResult;

  // Build quiz-compatible questions
  const quizQuestions = soal.map(q => {
    const options = q.opsi ? Object.entries(q.opsi).map(([k, v]) => `${k}. ${v}`) : [];
    const rawAnswer = String(q._jawaban_final || "A").trim().toUpperCase();
    const letters = rawAnswer.match(/[A-E]/g) || ["A"];
    const correctIndices = [...new Set(letters.map(l => "ABCDE".indexOf(l)).filter(idx => idx >= 0))].sort((a, b) => a - b);
    const isMultiple = correctIndices.length > 1;

    // Detect markdown or explicit [Gambar: ...] image in stimulus or question if not explicitly provided
    let imageUrl = q.imageUrl || null;
    let imageCaption = q.imageCaption || null;
    if (!imageUrl) {
      const explicitImgMatch = (q.pertanyaan + " " + (q.stimulus || "")).match(/\[Gambar:\s*([^\]]+)\]/i);
      if (explicitImgMatch) {
        imageUrl = explicitImgMatch[1].trim();
      } else {
        const imgMatch = (q.pertanyaan + " " + (q.stimulus || "")).match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imgMatch) {
          imageUrl = imgMatch[2];
          imageCaption = imgMatch[1] || null;
        }
      }
    }

    // Detect visual reference placeholder from OCR text
    const hasVisual = q.has_visual || /\[(Gambar|Grafik|Tabel|Diagram)\]|\(Lihat gambar\)|gambar di (atas|bawah|samping|berikut)|pada infografis|berdasarkan infografis|berdasarkan grafik|berdasarkan gambar/i.test(
      (q.pertanyaan || "") + " " + (q.stimulus || "")
    );

    // Kategori format
    const isKategori = q.tipe === "kategori" || (Array.isArray(q.matrixStatements) && q.matrixStatements.length > 0);
    const matrixStatements = isKategori && Array.isArray(q.matrixStatements)
      ? q.matrixStatements.map(s => ({
          statement: s.statement || s.text || "",
          correctAnswer: s.correctAnswer || (s.jawaban ? String(s.jawaban).toUpperCase() : "BENAR")
        }))
      : undefined;

    return {
      id: q.nomor,
      question: q.pertanyaan,
      stimulus: q.stimulus || null,
      imageUrl,
      imageCaption,
      questionType: isKategori ? "kategori" : (isMultiple ? "multiple" : (q.tipe === "pilihan_ganda_kompleks" ? "multiple" : "single")),
      matrixStatements,
      options,
      correctIndex: correctIndices[0] ?? 0,
      correctIndices,
      explanation: Array.isArray(q._pembahasan?.langkah) ? q._pembahasan.langkah.join("\n") : (q._pembahasan?.langkah || ""),
      formula: Array.isArray(q._pembahasan?.konsep_kunci) ? q._pembahasan.konsep_kunci.join("; ") : (q._pembahasan?.konsep_kunci || ""),
      pitfall: q._pembahasan?.jebakan || null,
      subtes: q.subtes,
      tingkat: q._pembahasan?.tingkat || "sedang",
      estimasi_detik: q._pembahasan?.estimasi_detik || 90,
      trik_cepat: q._pembahasan?.trik_cepat || null,
      analisis_opsi: q._pembahasan?.analisis_opsi || null,
      confidence: q._confidence,
      konflik_kunci: q._konflik_kunci || false,
      perlu_review: q._perlu_review || false,
      has_visual: hasVisual,
    };
  });

  // Build study guide markdown (semua teks lewat mathify() di bawah)
  for (const qq of quizQuestions) {
    qq.question = mathify(qq.question);
    if (qq.formula) qq.formula = mathify(qq.formula);
    if (qq.explanation) qq.explanation = mathify(qq.explanation);
    if (qq.pitfall) qq.pitfall = mathify(qq.pitfall);
    if (qq.trik_cepat) qq.trik_cepat = mathify(qq.trik_cepat);
    if (Array.isArray(qq.options)) qq.options = qq.options.map((o) => mathify(o));
    if (qq.analisis_opsi) {
      for (const k of Object.keys(qq.analisis_opsi)) qq.analisis_opsi[k] = mathify(qq.analisis_opsi[k]);
    }
  }
  let guide = `# Bedah Tuntas: ${title}\n\n`;
  guide += `> **${soal.length} butir soal** diproses melalui pipeline 4-tahap (Extract → Solve 3× Vote → Write → Verify).\n`;
  if (stats.conflicts > 0) guide += `> ⚠️ ${stats.conflicts} soal memiliki konflik antara jawaban AI dan kunci dokumen.\n`;
  if (stats.flagged.length > 0) guide += `> ⚠️ ${stats.flagged.length} soal di-flag untuk review manual.\n`;
  guide += `\n---\n\n`;

  // Group by subtes
  const bySubtes = {};
  for (const q of soal) {
    const st = q.subtes || "lainnya";
    if (!bySubtes[st]) bySubtes[st] = [];
    bySubtes[st].push(q);
  }

  const subtesLabels = {
    penalaran_umum: "Penalaran Umum",
    pengetahuan_pemahaman_umum: "Pengetahuan & Pemahaman Umum",
    pemahaman_bacaan_menulis: "Pemahaman Bacaan & Menulis",
    pengetahuan_kuantitatif: "Pengetahuan Kuantitatif",
    literasi_indonesia: "Literasi Bahasa Indonesia",
    literasi_inggris: "Literasi Bahasa Inggris",
    penalaran_matematika: "Penalaran Matematika",
    mapel_tka: "Mata Pelajaran TKA",
    lainnya: "Lainnya",
  };

  // Konsep kunci summary section
  const allKonsep = soal.flatMap(q => q._pembahasan?.konsep_kunci || []);
  const uniqueKonsep = [...new Set(allKonsep)];
  if (uniqueKonsep.length > 0) {
    guide += `## Konsep Kunci yang Diuji\n\n`;
    uniqueKonsep.forEach(k => { guide += `- ${mathify(k)}\n`; });
    guide += `\n---\n\n`;
  }

  // Per-subtes sections
  for (const [st, qs] of Object.entries(bySubtes)) {
    guide += `## ${subtesLabels[st] || st}\n\n`;

    for (const q of qs) {
      const pb = q._pembahasan || {};
      const badges = [];
      if (q._confidence === "perlu_verifikasi") badges.push("🔍 Perlu Verifikasi");
      if (q._konflik_kunci) badges.push("⚠️ Konflik Kunci");
      if (q._perlu_review) badges.push("❌ Review Manual");
      if (q._tidak_cocok_opsi) badges.push("🚫 Opsi Tidak Cocok");
      if (q.has_visual) badges.push("🖼️ Merujuk Gambar");
      const badgeStr = badges.length > 0 ? ` ${badges.join(" ")}` : "";

      guide += `### Soal ${q.nomor}${badgeStr}\n\n`;

      if (q.stimulus) guide += `> ${q.stimulus.slice(0, 500)}${q.stimulus.length > 500 ? "..." : ""}\n\n`;
      guide += `**${mathify(q.pertanyaan)}**\n\n`;

      if (q.opsi) {
        for (const [k, v] of Object.entries(q.opsi)) {
          const mark = k.toUpperCase() === (q._jawaban_final || "").toUpperCase() ? " ✓" : "";
          guide += `- ${k}. ${mathify(v)}${mark}\n`;
        }
        guide += `\n`;
      }

      guide += `**Jawaban: ${q._jawaban_final || "?"}** (${pb.tingkat || "?"}, ~${pb.estimasi_detik || "?"}s)\n\n`;

      if (Array.isArray(pb.konsep_kunci) && pb.konsep_kunci.length) {
        guide += `**Konsep:** ${pb.konsep_kunci.map(mathify).join(" · ")}\n\n`;
      }

      if (pb.langkah) {
        guide += `**Langkah Penyelesaian:**\n`;
        const langkahArr = Array.isArray(pb.langkah) ? pb.langkah : [pb.langkah];
        langkahArr.forEach((l, i) => { guide += `${i + 1}. ${mathify(l)}\n`; });
        guide += `\n`;
      }

      if (pb.analisis_opsi && typeof pb.analisis_opsi === "object") {
        guide += `**Analisis Opsi:**\n`;
        for (const [k, v] of Object.entries(pb.analisis_opsi)) {
          guide += `- **${k}:** ${mathify(v)}\n`;
        }
        guide += `\n`;
      }

      if (pb.trik_cepat) guide += `💡 **Trik Cepat:** ${mathify(pb.trik_cepat)}\n\n`;
      if (pb.jebakan) guide += `⚠️ **Jebakan:** ${mathify(pb.jebakan)}\n\n`;
      if (pb.catatan_soal) guide += `📝 **Catatan:** ${pb.catatan_soal}\n\n`;

      guide += `---\n\n`;
    }
  }

  // Terpotong section
  if (terpotong.length > 0) {
    guide += `## Soal Terpotong\n\nSoal nomor ${terpotong.join(", ")} terpotong di batas dokumen dan tidak diproses.\n\n`;
  }

  return { quizQuestions, studyGuide: guide };
}

module.exports = {
  runExamPipeline,
  pipelineToTankaFormat,
  ATURAN_MODE_SOAL,
  detectSubtes,
};
