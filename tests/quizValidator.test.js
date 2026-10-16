const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateAndNormalizeQuizQuestion,
  validateAndNormalizeQuiz,
  stripOptionPrefix,
  scrubStaleLetterReferences,
  sanitizeMathString
} = require("../server/services/quizValidator");

test("Quiz Validator: valid question and options pass cleanly", () => {
  const raw = {
    id: 1,
    question: "Apa fungsi utama mitokondria?",
    options: ["Respirasi sel", "Fotosintesis", "Sintesis lipid", "Pencernaan sel"],
    correctIndex: 0,
    explanation: "Mitokondria menghasilkan ATP melalui respirasi sel.",
    pitfall: "Jangan tertukar dengan kloroplas"
  };

  const res = validateAndNormalizeQuizQuestion(raw, 1);
  assert.equal(res.id, 1);
  assert.equal(res.question, "Apa fungsi utama mitokondria?");
  assert.equal(res.correctIndex, 0);
  assert.equal(res.correct_index, 0);
  assert.equal(res.options.length, 4);
  assert.equal(res.explanation, "Mitokondria menghasilkan ATP melalui respirasi sel.");
});

test("Quiz Validator: legacy alias answer (number, letter A-E, matching string)", () => {
  // Case A: answer is number
  const qNum = {
    question: "Siapa penemu kalkulus?",
    options: ["Newton", "Einstein", "Galileo", "Bohr"],
    answer: 0
  };
  const resNum = validateAndNormalizeQuizQuestion(qNum, 1);
  assert.equal(resNum.correctIndex, 0);

  // Case B: answer is letter 'B'
  const qLetter = {
    question: "Apa ibu kota Indonesia?",
    options: ["Bandung", "Nusantara", "Surabaya", "Medan"],
    answer: "B"
  };
  const resLetter = validateAndNormalizeQuizQuestion(qLetter, 2);
  assert.equal(resLetter.correctIndex, 1);

  // Case C: answer is matching option text
  const qText = {
    question: "Berapa 5 + 7?",
    options: ["10", "11", "12", "13"],
    answer: "12"
  };
  const resText = validateAndNormalizeQuizQuestion(qText, 3);
  assert.equal(resText.correctIndex, 2);
});

test("Quiz Validator: konflik antara answer dan correctIndex melempar error", () => {
  const conflict = {
    question: "Apakah air senyawa?",
    options: ["Ya", "Bukan"],
    correctIndex: 1,
    answer: "A" // 'A' maps to index 0 != 1
  };

  assert.throws(() => {
    validateAndNormalizeQuizQuestion(conflict, 1);
  }, /Konflik kunci jawaban/);
});

test("Quiz Validator: indeks di luar batas melempar error", () => {
  const outOfBounds = {
    question: "Contoh soal",
    options: ["A", "B", "C"],
    correctIndex: 5
  };

  assert.throws(() => {
    validateAndNormalizeQuizQuestion(outOfBounds, 1);
  }, /di luar rentang opsi/);

  const negativeIdx = {
    question: "Contoh soal",
    options: ["A", "B", "C"],
    correctIndex: -1
  };

  assert.throws(() => {
    validateAndNormalizeQuizQuestion(negativeIdx, 1);
  }, /di luar rentang opsi/);
});

test("Quiz Validator: opsi kurang dari 2 atau pertanyaan kosong melempar error", () => {
  assert.throws(() => {
    validateAndNormalizeQuizQuestion({ question: "", options: ["A", "B"], correctIndex: 0 });
  }, /tidak boleh kosong/);

  assert.throws(() => {
    validateAndNormalizeQuizQuestion({ question: "Valid?", options: ["Satu Opsi Saja"], correctIndex: 0 });
  }, /minimal 2 pilihan/);
});

test("Quiz Validator: pembersihan prefix opsi (A., B., dsb)", () => {
  const withPrefix = {
    question: "Pilih yang benar",
    options: ["A. Pertama", "B) Kedua", "C. Ketiga", "D) Keempat"],
    correctIndex: 2
  };
  const res = validateAndNormalizeQuizQuestion(withPrefix, 1);
  assert.deepEqual(res.options, ["Pertama", "Kedua", "Ketiga", "Keempat"]);
});

test("Quiz Validator: pengacakan opsi memperbarui correctIndex dan membersihkan stale letters", () => {
  const q = {
    id: 1,
    question: "Nilai dari 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctIndex: 1, // '4'
    explanation: "Pilihan B benar karena 2 + 2 = 4.",
    steps: [{ step: 1, title: "Hitung", desc: "Opsi B tepat secara aritmetika." }]
  };

  const res = validateAndNormalizeQuizQuestion(q, 1, { shuffleOptions: true });
  // Opsi yang benar harus tetap '4' pada indeks baru
  assert.equal(res.options[res.correctIndex], "4");
  // Penjelasan tidak boleh mengandung 'Pilihan B benar'
  assert.ok(!res.explanation.includes("Pilihan B benar"));
  assert.ok(res.explanation.includes("Jawaban yang tepat"));
  assert.ok(!res.steps[0].desc.includes("Opsi B tepat"));
});

test("Quiz Validator: validateAndNormalizeQuiz memproses array lengkap", () => {
  const list = [
    { question: "Soal 1", options: ["A", "B"], correctIndex: 0 },
    { question: "Soal 2", options: ["C", "D"], answer: "B" }
  ];

  const res = validateAndNormalizeQuiz(list);
  assert.equal(res.length, 2);
  assert.equal(res[0].id, 1);
  assert.equal(res[1].id, 2);
  assert.equal(res[1].correctIndex, 1);
});

test("Quiz Lifecycle: simulasi penilaian jawaban benar & salah dengan skor deterministik", () => {
  const quiz = validateAndNormalizeQuiz([
    { question: "Soal 1", options: ["Salah", "Benar"], correctIndex: 1 },
    { question: "Soal 2", options: ["Benar", "Salah"], correctIndex: 0 },
    { question: "Soal 3", options: ["Pilihan X", "Pilihan Y"], correctIndex: 1 }
  ]);

  const userAnswers = { 0: 1, 1: 0, 2: 0 }; // 2 benar, 1 salah
  let correctCount = 0;
  quiz.forEach((q, idx) => {
    if (userAnswers[idx] === q.correctIndex) {
      correctCount++;
    }
  });

  const finalScore = Math.round((correctCount / quiz.length) * 100);
  assert.equal(correctCount, 2);
  assert.equal(finalScore, 67);
});

test("Quiz Validator: rooms.js-style fallback quiz (no 'answer' field) passes cleanly", () => {
  // Simulates the rooms.js fallback quiz format after the fix (no stale 'answer' letter)
  const q = {
    id: 1,
    question: "Manakah definisi yang tepat untuk konsep X?",
    options: ["Definisi B", "Definisi C", "Definisi A", "Definisi D"],
    correctIndex: 2,
    correct_index: 2,
    explanation: "Konsep X didefinisikan sebagai: Definisi A."
  };
  const result = validateAndNormalizeQuizQuestion(q, 1, { shuffleOptions: false });
  // correctIndex must be preserved
  assert.equal(result.correctIndex, 2);
  assert.equal(result.options[2], "Definisi A");
});

test("Quiz Validator: stale 'answer' letter konflik dengan correctIndex dilempar error", () => {
  // The OLD rooms.js format could produce a stale 'answer' letter inconsistent with correctIndex
  // after a shuffle — the validator must throw on conflict
  const q = {
    id: 1,
    question: "Soal konflik?",
    options: ["A opsi", "B opsi", "C opsi", "D opsi"],
    correctIndex: 0, // means "A opsi"
    answer: "B",     // means index 1 — CONFLICTS with correctIndex 0
    explanation: "Seharusnya A."
  };
  assert.throws(
    () => validateAndNormalizeQuizQuestion(q, 1),
    /Konflik kunci jawaban/
  );
});

test("Quiz Validator: automatically heals control characters in question, options, and explanation", () => {
  const corrupted = {
    id: 1,
    question: "Berapakah hasil dari $27^{\u000crac{2}{3}}$?",
    options: ["$9$", "$3$", "$27$", "$\u0008eta$"],
    correctIndex: 0,
    explanation: "Hitung dengan formula \u000crac{2}{3} sehingga didapat 9."
  };
  const result = validateAndNormalizeQuizQuestion(corrupted, 1);
  assert.ok(!result.question.includes("\u000c"));
  assert.ok(result.question.includes("\\frac{2}{3}"));
  assert.ok(!result.options[3].includes("\u0008"));
  assert.ok(result.options[3].includes("\\beta"));
  assert.ok(!result.explanation.includes("\u000c"));
  assert.ok(result.explanation.includes("\\frac{2}{3}"));
});

test("Quiz Validator: preserves and validates questions across quiz difficulty types (beginner, conceptual, analytical)", () => {
  const types = ["beginner", "conceptual", "analytical", "hots"];
  for (const qType of types) {
    const raw = [
      {
        id: 1,
        question: `Soal latihan bertingkat ${qType}?`,
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
        correctIndex: 1,
        explanation: `Penjelasan valid untuk kesulitan ${qType}`
      }
    ];
    const normalized = validateAndNormalizeQuiz(raw, { shuffleOptions: false, renumber: true });
    assert.equal(normalized.length, 1);
    assert.equal(normalized[0].question, `Soal latihan bertingkat ${qType}?`);
    assert.equal(normalized[0].correctIndex, 1);
  }
});

