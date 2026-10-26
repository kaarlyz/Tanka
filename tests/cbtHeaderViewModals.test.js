const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("CBT Header View Modals: Tombol Soal dan Wacana terpasang di header CBT runner", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtTabPath), "ExamCbtTab.tsx harus ada");

  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Verifikasi tombol Soal di header
  assert.match(
    content,
    /onClick=\{\(\)\s*=>\s*setIsSoalModalOpen\(true\)\}/,
    "Tombol Soal harus memiliki onClick untuk membuka modal soal"
  );
  assert.match(
    content,
    /<HelpCircle\s+size=\{14\}\s+color=["']#c8f064["']\s*\/>\s*<span>Soal<\/span>/,
    "Tombol Soal harus merender icon HelpCircle lime dan label Soal"
  );

  // 2. Verifikasi tombol Wacana di header (jika hasBacaan)
  assert.match(
    content,
    /\{hasBacaan\s*&&\s*\(\s*<motion\.button[\s\S]*?onClick=\{\(\)\s*=>\s*setIsWacanaModalOpen\(true\)\}/,
    "Tombol Wacana harus terpasang kondisional hasBacaan dengan handler buka modal wacana"
  );
  assert.match(
    content,
    /<BookOpen\s+size=\{14\}\s+color=["']#c8f064["']\s*\/>\s*<span>Wacana<\/span>/,
    "Tombol Wacana harus merender icon BookOpen lime dan label Wacana"
  );

  // 3. Verifikasi kelas tombol cbt-header-btn-quick-view
  assert.match(
    content,
    /className=["']cbt-header-btn-quick-view["']/,
    "Tombol aksi cepat harus menggunakan class cbt-header-btn-quick-view"
  );
});

test("CBT Header View Modals: Modal sheet soal lengkap isSoalModalOpen dengan CbtContentRenderer & gambar", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Verifikasi state isSoalModalOpen
  assert.match(
    content,
    /const\s*\[isSoalModalOpen,\s*setIsSoalModalOpen\]\s*=\s*useState\s*\(\s*false\s*\)/,
    "ExamCbtTab harus mendefinisikan state isSoalModalOpen"
  );

  // 2. Verifikasi modal sheet sheet-modal class
  assert.match(
    content,
    /className=["']cbt-soal-sheet-modal["']/,
    "Modal sheet soal harus memiliki class cbt-soal-sheet-modal"
  );

  // 3. Verifikasi rendering judul nomor soal
  assert.match(
    content,
    /Soal Nomor\s*\{currentItem\.nomor\}\s*\(dari\s*\{total\}\s*butir\)/,
    "Modal sheet soal harus menampilkan label nomor soal aktif dan total butir"
  );

  // 4. Verifikasi CbtContentRenderer dan gambar soal
  assert.match(
    content,
    /<CbtContentRenderer\s+content=\{currentItem\.soal\}[\s\S]*?\/>/,
    "Modal sheet soal harus merender konten soal via CbtContentRenderer"
  );
  assert.match(
    content,
    /currentItem\.soal_img\s*&&\s*\(/,
    "Modal sheet soal harus menampilkan gambar stimulus soal jika tersedia"
  );

  // 5. Verifikasi tombol close modal
  assert.match(
    content,
    /onClick=\{\(\)\s*=>\s*setIsSoalModalOpen\(false\)\}/,
    "Modal sheet soal harus memiliki handler untuk menutup modal"
  );
});

test("CBT Header View Modals: Fitur long-press dan hint gesture dibersihkan dari codebase", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Tidak boleh ada state / ref long-press di ExamCbtTab.tsx
  assert.equal(
    /isPeekActive/.test(content),
    false,
    "State isPeekActive harus sudah dihapus dari ExamCbtTab.tsx"
  );
  assert.equal(
    /longPressTimerRef/.test(content),
    false,
    "Ref longPressTimerRef harus sudah dihapus dari ExamCbtTab.tsx"
  );
  assert.equal(
    /isLongPressTriggeredRef/.test(content),
    false,
    "Ref isLongPressTriggeredRef harus sudah dihapus dari ExamCbtTab.tsx"
  );
  assert.equal(
    /handlePointerDownPeek/.test(content),
    false,
    "Handler handlePointerDownPeek harus sudah dihapus dari ExamCbtTab.tsx"
  );
  assert.equal(
    /handlePointerUpPeek/.test(content),
    false,
    "Handler handlePointerUpPeek harus sudah dihapus dari ExamCbtTab.tsx"
  );

  // 2. Tidak boleh ada bubble peek atau hint tips
  assert.equal(
    /cbt-question-peek-bubble/.test(content),
    false,
    "Class cbt-question-peek-bubble harus sudah dihapus dari ExamCbtTab.tsx"
  );
  assert.equal(
    /cbt-peek-gesture-hint/.test(content),
    false,
    "Class cbt-peek-gesture-hint harus sudah dihapus dari ExamCbtTab.tsx"
  );
  assert.equal(
    /Tahan \(tekan lama\) opsi/.test(content),
    false,
    "Teks tips gesture intip harus sudah dihapus dari ExamCbtTab.tsx"
  );

  // 3. Verifikasi CSS index.css bersih dari bubble peek & hint
  const cssPath = path.join(__dirname, "../src/index.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.equal(
    /cbt-question-peek-bubble/.test(css),
    false,
    "CSS cbt-question-peek-bubble harus sudah dihapus dari src/index.css"
  );
  assert.equal(
    /cbt-peek-gesture-hint/.test(css),
    false,
    "CSS cbt-peek-gesture-hint harus sudah dihapus dari src/index.css"
  );
});

test("CBT Header View Modals: CSS index.css memuat styling cbt-header-btn-quick-view dan cbt-soal-sheet-modal", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.match(
    css,
    /\.cbt-header-btn-quick-view/,
    "src/index.css harus memuat class styling .cbt-header-btn-quick-view"
  );
  assert.match(
    css,
    /\.cbt-soal-sheet-modal/,
    "src/index.css harus memuat class styling .cbt-soal-sheet-modal"
  );
});
