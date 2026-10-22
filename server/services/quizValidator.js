const crypto = require("node:crypto");
const { healControlCharsToLatex } = require("../utils/jsonParser");

/**
 * Canonical Quiz Normalizer & Validator for Tanka
 * Enforces unified contract:
 * {
 *   id: number,
 *   question: string,
 *   options: string[],
 *   correctIndex: number,
 *   explanation?: string,
 *   steps?: Array<{ step: number, title: string, desc: string }>,
 *   pitfall?: string,
 *   formula?: string
 * }
 */

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Sanitizes KaTeX math notation in text strings
 */
function sanitizeMathString(t) {
  if (!t || typeof t !== "string") return t;
  let cleaned = healControlCharsToLatex(t);
  const dollarCount = (cleaned.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    cleaned += "$";
  }
  return cleaned.replace(/\{\}/g, "");
}

/**
 * Cleans option prefix letters (e.g. "A. Option Text" -> "Option Text")
 */
function stripOptionPrefix(opt) {
  if (typeof opt !== "string") return String(opt || "");
  return opt.replace(/^[A-Ea-e][\.\)]\s*/, "").trim();
}

/**
 * Scrubs stale option letter references from explanation and steps
 * when options are shuffled.
 */
function scrubStaleLetterReferences(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/^(?:Tentu saja|Mari kita bahas|Perlu diingat bahwa|Secara umum|Pertanyaan ini membahas|Pada dasarnya)[,\s]*/gi, "")
    .replace(/(?:Koreksi data|Mari sesuaikan data|Q2 harus|Kita ubah agar)[^.]*\./gi, "")
    .replace(/Pilihan\s+[A-E]\s+benar(?:\s+karena)?/gi, "Jawaban yang tepat adalah")
    .replace(/Opsi\s+[A-E]\s+benar(?:\s+karena)?/gi, "Jawaban yang tepat adalah")
    .replace(/Pilihan\s+[A-E]\s+tepat/gi, "Jawaban yang tepat")
    .replace(/Opsi\s+[A-E]\s+tepat/gi, "Jawaban yang tepat")
    .trim();
}

/**
 * Validates and canonically normalizes a single quiz question.
 *
 * @param {Object} q - Raw question object from AI or storage
 * @param {number} fallbackId - Default numeric id
 * @param {Object} options - { shuffleOptions: boolean }
 * @returns {Object} Canonically formatted QuizQuestion
 */
function validateAndNormalizeQuizQuestion(q, fallbackId = 1, { shuffleOptions = false } = {}) {
  if (!q || typeof q !== "object") {
    throw new Error(`Item soal nomor ${fallbackId} bukan objek valid`);
  }

  // 1. Validasi teks pertanyaan
  const rawQuestion = typeof q.question === "string" ? q.question.trim() : "";
  if (!rawQuestion) {
    throw new Error(`Pertanyaan pada soal nomor ${fallbackId} tidak boleh kosong`);
  }

  // 2. Validasi opsi jawaban
  if (!Array.isArray(q.options) || q.options.length < 2) {
    throw new Error(`Soal nomor ${fallbackId} harus memiliki minimal 2 pilihan jawaban`);
  }

  let cleanOptions = q.options.map(stripOptionPrefix).map(sanitizeMathString);

  // 3. Resolusi dan validasi correctIndex, correctIndices & legacy answer
  let resolvedCorrectIndex = null;
  let resolvedCorrectIndices = null;

  // Deteksi multi-kunci (Pilgan Kompleks): e.g. correctIndices=[0, 2] atau answer="A, C" atau answer=["A", "C"]
  if (Array.isArray(q.correctIndices) && q.correctIndices.length > 0) {
    resolvedCorrectIndices = q.correctIndices.map(x => typeof x === "number" ? x : parseInt(x, 10)).filter(Number.isInteger);
  } else if (typeof q.answer === "string" && /[A-Ea-e]\s*,\s*[A-Ea-e]/.test(q.answer)) {
    const letters = q.answer.match(/[A-Ea-e]/g) || [];
    resolvedCorrectIndices = [...new Set(letters.map(l => LETTERS.indexOf(l.toUpperCase())).filter(i => i >= 0))];
  } else if (Array.isArray(q.answer) && q.answer.length > 0) {
    resolvedCorrectIndices = q.answer.map(x => {
      if (typeof x === "number") return x;
      if (typeof x === "string" && LETTERS.includes(x.trim().toUpperCase())) return LETTERS.indexOf(x.trim().toUpperCase());
      return parseInt(x, 10);
    }).filter(Number.isInteger);
  }

  if (resolvedCorrectIndices && resolvedCorrectIndices.length > 1) {
    resolvedCorrectIndices.sort((a, b) => a - b);
    for (const idx of resolvedCorrectIndices) {
      if (idx < 0 || idx >= cleanOptions.length) {
        throw new Error(`Indeks kunci jawaban (${idx}) di luar rentang opsi (0..${cleanOptions.length - 1}) pada soal ${fallbackId}`);
      }
    }
    resolvedCorrectIndex = resolvedCorrectIndices[0];
  } else {
    const hasCorrectIndex = q.correctIndex !== undefined && q.correctIndex !== null;
    const hasAnswer = q.answer !== undefined && q.answer !== null;

    let parsedCorrectIndex = null;
    if (hasCorrectIndex) {
      if (typeof q.correctIndex === "number" && Number.isInteger(q.correctIndex)) {
        parsedCorrectIndex = q.correctIndex;
      } else if (typeof q.correctIndex === "string" && /^-?\d+$/.test(q.correctIndex.trim())) {
        parsedCorrectIndex = parseInt(q.correctIndex.trim(), 10);
      }
    }

    let parsedAnswerIndex = null;
    if (hasAnswer) {
      if (typeof q.answer === "number" && Number.isInteger(q.answer)) {
        parsedAnswerIndex = q.answer;
      } else if (typeof q.answer === "string") {
        const trimmed = q.answer.trim();
        const upper = trimmed.toUpperCase();
        if (LETTERS.includes(upper)) {
          parsedAnswerIndex = LETTERS.indexOf(upper);
        } else if (/^-?\d+$/.test(trimmed)) {
          const numeric = parseInt(trimmed, 10);
          if (numeric >= 0 && numeric < cleanOptions.length) {
            parsedAnswerIndex = numeric;
          } else {
            const matchedIdx = cleanOptions.findIndex((opt) => opt.toLowerCase() === trimmed.toLowerCase());
            if (matchedIdx !== -1) {
              parsedAnswerIndex = matchedIdx;
            } else {
              parsedAnswerIndex = numeric;
            }
          }
        } else {
          const matchedIdx = cleanOptions.findIndex((opt) => opt.toLowerCase() === trimmed.toLowerCase());
          if (matchedIdx !== -1) {
            parsedAnswerIndex = matchedIdx;
          }
        }
      }
    }

    // Cek konflik antara correctIndex dan answer
    if (parsedCorrectIndex !== null && parsedAnswerIndex !== null) {
      if (parsedCorrectIndex !== parsedAnswerIndex) {
        throw new Error(
          `Konflik kunci jawaban pada soal ${fallbackId}: correctIndex (${parsedCorrectIndex}) bertentangan dengan answer (${parsedAnswerIndex})`
        );
      }
      resolvedCorrectIndex = parsedCorrectIndex;
    } else if (parsedCorrectIndex !== null) {
      resolvedCorrectIndex = parsedCorrectIndex;
    } else if (parsedAnswerIndex !== null) {
      resolvedCorrectIndex = parsedAnswerIndex;
    } else {
      throw new Error(`Kunci jawaban tidak ditemukan pada soal nomor ${fallbackId}`);
    }

    // Validasi batas indeks
    if (resolvedCorrectIndex < 0 || resolvedCorrectIndex >= cleanOptions.length) {
      throw new Error(
        `Indeks kunci jawaban (${resolvedCorrectIndex}) di luar rentang opsi (0..${cleanOptions.length - 1}) pada soal ${fallbackId}`
      );
    }
    resolvedCorrectIndices = [resolvedCorrectIndex];
  }

  // 4. Pengacakan opsi (jika diminta) dengan pemetaan presisi
  if (shuffleOptions && cleanOptions.length >= 2) {
    const originalCorrectOption = cleanOptions[resolvedCorrectIndex];

    // Fisher-Yates shuffle
    for (let i = cleanOptions.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [cleanOptions[i], cleanOptions[j]] = [cleanOptions[j], cleanOptions[i]];
    }

    // Tentukan indeks baru dari opsi yang benar
    const newCorrectIdx = cleanOptions.indexOf(originalCorrectOption);
    if (newCorrectIdx !== -1) {
      resolvedCorrectIndex = newCorrectIdx;
    }
  }

  // 5. Normalisasi penjelasan dan langkah
  let cleanExplanation = scrubStaleLetterReferences(sanitizeMathString(q.explanation || ""));
  let cleanSteps = Array.isArray(q.steps)
    ? q.steps.map((s) => ({
        step: typeof s.step === "number" ? s.step : 1,
        title: sanitizeMathString(s.title || ""),
        desc: scrubStaleLetterReferences(sanitizeMathString(s.desc || ""))
      }))
    : undefined;

  const normalized = {
    id: typeof q.id === "number" ? q.id : fallbackId,
    question: sanitizeMathString(
      rawQuestion
        .replace(/^(?:Berdasarkan materi(?: yang telah dipelajari)?,?\s*|Dalam konteks pembelajaran ini,?\s*)/gi, "")
        .trim()
    ),
    options: cleanOptions,
    correctIndex: resolvedCorrectIndex,
    correct_index: resolvedCorrectIndex, // alias kompatibilitas
    correctIndices: resolvedCorrectIndices,
    questionType: resolvedCorrectIndices.length > 1 ? "multiple" : (q.questionType || "single"),
    explanation: cleanExplanation,
    pitfall: typeof q.pitfall === "string" ? sanitizeMathString(q.pitfall.trim()) : "",
    formula: typeof q.formula === "string" ? sanitizeMathString(q.formula.trim()) : ""
  };

  if (q.imageUrl) normalized.imageUrl = q.imageUrl;
  if (q.imageCaption) normalized.imageCaption = sanitizeMathString(String(q.imageCaption).trim());
  if (q.has_visual) normalized.has_visual = true;

  if (cleanSteps && cleanSteps.length > 0) {
    normalized.steps = cleanSteps;
  }

  // Field dari examPipeline (EXTRACT→SOLVE→WRITE→VERIFY) harus ikut, jangan dibuang normalizer.
  if (q.stimulus) normalized.stimulus = q.stimulus;
  if (q.subtes) normalized.subtes = q.subtes;
  if (q.tingkat) normalized.tingkat = q.tingkat;
  if (q.estimasi_detik) normalized.estimasi_detik = q.estimasi_detik;
  if (q.trik_cepat) normalized.trik_cepat = sanitizeMathString(String(q.trik_cepat).trim());
  if (q.analisis_opsi && typeof q.analisis_opsi === "object") {
    const cleanAnalisis = {};
    for (const [k, v] of Object.entries(q.analisis_opsi)) {
      if (typeof v === "string" && v.trim()) cleanAnalisis[k] = sanitizeMathString(v.trim());
    }
    if (Object.keys(cleanAnalisis).length > 0) normalized.analisis_opsi = cleanAnalisis;
  }
  if (q.confidence) normalized.confidence = q.confidence;
  if (q.konflik_kunci) normalized.konflik_kunci = true;
  if (q.perlu_review) normalized.perlu_review = true;

  return normalized;
}

/**
 * Validates and normalizes an entire array of quiz questions.
 *
 * @param {Array<Object>} questionsList
 * @param {Object} options - { shuffleOptions: boolean, renumber: boolean }
 * @returns {Array<Object>} Validated and normalized quiz questions
 */
function validateAndNormalizeQuiz(questionsList, { shuffleOptions = false, renumber = true } = {}) {
  if (!Array.isArray(questionsList) || questionsList.length === 0) {
    throw new Error("Daftar soal kuis kosong atau bukan array valid");
  }

  return questionsList.map((q, idx) => {
    const id = renumber ? idx + 1 : (typeof q.id === "number" ? q.id : idx + 1);
    const normalized = validateAndNormalizeQuizQuestion(q, id, { shuffleOptions });
    if (renumber) {
      normalized.id = id;
    }
    return normalized;
  });
}

module.exports = {
  validateAndNormalizeQuizQuestion,
  validateAndNormalizeQuiz,
  stripOptionPrefix,
  scrubStaleLetterReferences,
  sanitizeMathString
};
