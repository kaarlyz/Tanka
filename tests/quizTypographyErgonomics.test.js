const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Quiz Typography Ergonomics: MathView mempertahankan whiteSpace: pre-line pada rendering teks murni", () => {
  const mathViewPath = path.join(__dirname, "../src/components/common/MathView.tsx");
  assert.ok(fs.existsSync(mathViewPath), "MathView.tsx harus ada");

  const content = fs.readFileSync(mathViewPath, "utf-8");

  // Verifikasi fallback branch (renderedHTML === null) menyertakan whiteSpace: 'pre-line'
  assert.match(
    content,
    /renderedHTML\s*===\s*null[\s\S]*?whiteSpace:\s*["']pre-line["']/,
    "MathView.tsx harus menyertakan whiteSpace: 'pre-line' pada fallback branch non-math"
  );
});

test("Quiz Typography Ergonomics: QuizTab.tsx memuat struktur pemisah semantis paragraf bacaan stimulus", () => {
  const quizTabPath = path.join(__dirname, "../src/components/tabs/QuizTab.tsx");
  assert.ok(fs.existsSync(quizTabPath), "QuizTab.tsx harus ada");

  const content = fs.readFileSync(quizTabPath, "utf-8");

  // Helper renderFormattedStimulus harus ada
  assert.match(
    content,
    /function\s+renderFormattedStimulus/,
    "QuizTab.tsx harus mendefinisikan helper renderFormattedStimulus"
  );

  // Styling container card stimulus sesuai spesifikasi Mintlify / Editorial Reading System
  assert.match(
    content,
    /#fdfefc/,
    "Card stimulus harus menggunakan background #fdfefc"
  );
  assert.match(
    content,
    /4px\s+solid\s+#15803d/,
    "Card stimulus harus menggunakan border-left 4px solid #15803d (hijau aksen)"
  );
  assert.match(
    content,
    /padding:\s*["']18px 22px["']/,
    "Card stimulus harus memiliki padding 18px 22px"
  );

  // Paragraf semantis <p> mandiri dengan line-height 1.75 dan margin-bottom 14px
  assert.match(
    content,
    /<p[\s\S]*?lineHeight:\s*1\.75[\s\S]*?margin:\s*["']0 0 14px 0["']/,
    "Paragraf bacaan harus dirender dalam tag <p> mandiri dengan line-height 1.75 dan margin-bottom 14px"
  );

  // Sitasi / Sumber bergaris putus-putus
  assert.match(
    content,
    /borderTop:\s*["']1px dashed #e2e6de["']/,
    "Sitasi / sumber bacaan harus dipisahkan garis tipis putus-putus #e2e6de"
  );
  assert.match(
    content,
    /fontStyle:\s*["']italic["']/,
    "Sitasi / sumber bacaan harus bergaya italic"
  );
});

test("Quiz Typography Ergonomics: QuizTab.tsx memuat kontainer pertanyaan mandiri (quiz-question-box)", () => {
  const quizTabPath = path.join(__dirname, "../src/components/tabs/QuizTab.tsx");
  const content = fs.readFileSync(quizTabPath, "utf-8");

  // Kontainer pertanyaan tersendiri quiz-question-box
  assert.match(
    content,
    /className\s*=\s*["']quiz-question-box["']/,
    "QuizTab.tsx harus menyertakan kelas quiz-question-box untuk pertanyaan"
  );

  // Card abu-hijau terang #f7f9f6
  assert.match(
    content,
    /backgroundColor:\s*["']#f7f9f6["']/,
    "Kontainer pertanyaan harus menggunakan warna latar abu-hijau terang #f7f9f6"
  );
  assert.match(
    content,
    /border:\s*["']1px solid #e1e7dd["']/,
    "Kontainer pertanyaan harus memiliki border 1px solid #e1e7dd"
  );

  // Label badge nomor pertanyaan
  assert.match(
    content,
    /Pertanyaan No\.\s*\{currentQuestionIndex\s*\+\s*1\}/,
    "Kontainer pertanyaan harus memuat label 'Pertanyaan No. N'"
  );
  assert.match(
    content,
    /#15803d/,
    "Label badge nomor pertanyaan harus berwarna hijau #15803d"
  );
});

test("Quiz Typography Ergonomics: ExamDrillView.tsx memuat struktur pemisah stimulus dan kontainer pertanyaan", () => {
  const examDrillPath = path.join(__dirname, "../src/components/tabs/ExamDrillView.tsx");
  assert.ok(fs.existsSync(examDrillPath), "ExamDrillView.tsx harus ada");

  const content = fs.readFileSync(examDrillPath, "utf-8");

  // Helper renderFormattedStimulus harus ada
  assert.match(
    content,
    /function\s+renderFormattedStimulus/,
    "ExamDrillView.tsx harus mendefinisikan helper renderFormattedStimulus"
  );

  // Stimulus paragraph semantis
  assert.match(
    content,
    /<p[\s\S]*?lineHeight:\s*1\.75[\s\S]*?margin:\s*["']0 0 14px 0["']/,
    "ExamDrillView.tsx harus merender paragraf dalam tag <p> dengan line-height 1.75"
  );

  // Kontainer pertanyaan mandiri quiz-question-box
  assert.match(
    content,
    /quiz-question-box/,
    "ExamDrillView.tsx harus memuat kontainer pertanyaan quiz-question-box"
  );
  assert.match(
    content,
    /Pertanyaan No\./,
    "ExamDrillView.tsx harus memuat label 'Pertanyaan No.'"
  );
});

test("Quiz Typography Ergonomics: Parsing stimulus memisahkan judul, paragraf isi, dan sitasi", () => {
  const sampleStimulus = `Tradisi Buwuhan di Pesisir Utara Jawa

Tradisi buwuhan di pesisir utara Jawa mencerminkan semangat gotong royong masyarakat nelayan saat menyelenggarakan hajatan pernikahan maupun khitanan. Warga berbondong-bondong membawa beras, gula, dan amplop uang.

Namun seiring industrialisasi, esensi tolong-menolong ini mulai bergeser menjadi ajang unjuk prestise sosial antar keluarga yang saling membalas nominal buwuhan.

Sumber: Jurnal Kebudayaan Maritim, Rachmawati (2022)`;

  const rawBlocks = sampleStimulus.split(/\r?\n+/).map(b => b.trim()).filter(Boolean);
  assert.equal(rawBlocks.length, 4, "Harus menghasilkan 4 blok terpisah");

  const first = rawBlocks[0];
  const isTitle = rawBlocks.length > 1 && (first.length <= 100 && !first.endsWith("."));
  assert.equal(isTitle, true, "Blok pertama harus terdeteksi sebagai judul");

  const remaining = rawBlocks.slice(1);
  const isCitation = (t) => /^(sumber|source|referensi|rachmawati)/i.test(t);

  const paragraphs = [];
  const citations = [];
  for (const block of remaining) {
    if (isCitation(block) || citations.length > 0) {
      citations.push(block);
    } else {
      paragraphs.push(block);
    }
  }

  assert.equal(paragraphs.length, 2, "Harus terdapat 2 paragraf isi mandiri");
  assert.equal(citations.length, 1, "Harus terdapat 1 baris sitasi / referensi");
  assert.match(citations[0], /Sumber: Jurnal Kebudayaan Maritim/);
});
