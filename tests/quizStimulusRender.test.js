const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  validateAndNormalizeQuizQuestion,
  validateAndNormalizeQuiz
} = require("../server/services/quizValidator");

test("Quiz Stimulus Render: QuizTab.tsx memuat elemen rendering paper-ledger untuk stimulus bacaan", () => {
  const quizTabPath = path.join(__dirname, "../src/components/tabs/QuizTab.tsx");
  assert.ok(fs.existsSync(quizTabPath), "src/components/tabs/QuizTab.tsx harus ada");

  const content = fs.readFileSync(quizTabPath, "utf-8");

  // Verifikasi rendering currentQuestion?.stimulus untuk active question
  assert.match(
    content,
    /currentQuestion\?\.stimulus/,
    "QuizTab harus merender currentQuestion?.stimulus pada active question"
  );

  // Verifikasi rendering q.stimulus pada review / evaluasi akhir
  assert.match(
    content,
    /q\.stimulus/,
    "QuizTab harus merender q.stimulus pada daftar review hasil pengerjaan"
  );

  // Verifikasi styling paper-ledger dan header teks bacaan
  assert.match(
    content,
    /quiz-stimulus-card/,
    "QuizTab harus menyertakan class quiz-stimulus-card"
  );

  assert.match(
    content,
    /Teks Bacaan \/ Stimulus Cerita/,
    "QuizTab harus memiliki header 'Teks Bacaan / Stimulus Cerita'"
  );

  assert.match(
    content,
    /#72a728/,
    "QuizTab harus menggunakan aksen border / icon hijau paper-ledger #72a728"
  );

  assert.match(
    content,
    /#fbfcf9/,
    "QuizTab harus menggunakan warna latar paper-ledger #fbfcf9"
  );
});

test("Quiz Stimulus Render: validateAndNormalizeQuiz melestarikan field stimulus bacaan", () => {
  const sampleQuiz = [
    {
      id: 1,
      stimulus: "Tradisi buwuhan di pesisir utara Jawa mencerminkan gotong royong warga saat hajatan pernikahan atau khitanan. Namun, modernisasi mulai menggeser esensi tolong-menolong menjadi ajang unjuk gengsi.",
      question: "Apa pesan utama yang tersirat dalam kutipan teks tersebut?",
      options: [
        "Modernisasi mengancam nilai luhur gotong royong dalam tradisi buwuhan",
        "Tradisi buwuhan hanya ada di pesisir utara Jawa",
        "Pernikahan warga pesisir selalu dirayakan secara mewah",
        "Warga pesisir menolak segala bentuk modernisasi"
      ],
      correctIndex: 0,
      explanation: "Kutipan menyoroti pergeseran esensi dari tolong-menolong menjadi unjuk gengsi akibat modernisasi."
    },
    {
      id: 2,
      question: "Soal tanpa stimulus bacaan langsung ke pertanyaan inti?",
      options: ["Opsi A", "Opsi B", "Opsi C"],
      correctIndex: 1,
      explanation: "Penjelasan soal biasa."
    }
  ];

  const normalized = validateAndNormalizeQuiz(sampleQuiz);
  assert.equal(normalized.length, 2);

  // Soal 1 harus mempertahankan stimulus
  assert.equal(
    normalized[0].stimulus,
    "Tradisi buwuhan di pesisir utara Jawa mencerminkan gotong royong warga saat hajatan pernikahan atau khitanan. Namun, modernisasi mulai menggeser esensi tolong-menolong menjadi ajang unjuk gengsi."
  );

  // Soal 2 tanpa stimulus tidak boleh menambahkan field stimulus fiktif
  assert.equal(normalized[1].stimulus, undefined);
});

test("Quiz Stimulus Render: validateAndNormalizeQuizQuestion menangani stimulus berformat multiline dan karakter khusus", () => {
  const rawQuestion = {
    id: 10,
    stimulus: "Paragraf 1: Pengamatan mikroskopik sel gabus.\n\nParagraf 2: Rumus laju difusi dinyatakan dengan $J = -D \\frac{dc}{dx}$.",
    question: "Berdasarkan stimulus di atas, variabel $D$ merepresentasikan?",
    options: [
      "Koefisien difusi",
      "Konsentrasi zat terlarut",
      "Ketebalan membran",
      "Fluks difusi total"
    ],
    correctIndex: 0,
    explanation: "Variabel D adalah koefisien difusi."
  };

  const normalized = validateAndNormalizeQuizQuestion(rawQuestion, 1);
  assert.ok(normalized.stimulus, "Stimulus harus ada pada objek hasil normalisasi");
  assert.match(normalized.stimulus, /Paragraf 1/);
  assert.match(normalized.stimulus, /\$J = -D/);
  assert.equal(normalized.correctIndex, 0);
});
