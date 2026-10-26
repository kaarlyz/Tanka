const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("CBT Statement Card Ergonomics: ExamCbtTab memisahkan tabel desktop dan kartu mobile", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtTabPath), "ExamCbtTab.tsx harus ada");

  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Verifikasi kontainer tabel desktop memakai kelas cbt-stmt-desktop-table
  assert.match(
    content,
    /className=["']cbt-stmt-desktop-table["']/,
    "ExamCbtTab harus menyertakan kelas cbt-stmt-desktop-table untuk mode desktop"
  );

  // 2. Verifikasi kontainer kartu mobile memakai kelas cbt-stmt-mobile-list
  assert.match(
    content,
    /className=["']cbt-stmt-mobile-list["']/,
    "ExamCbtTab harus menyertakan kelas cbt-stmt-mobile-list untuk mode mobile"
  );

  // 3. Verifikasi kartu pernyataan mandiri dengan kelas cbt-stmt-card
  assert.match(
    content,
    /className=["']cbt-stmt-card["']/,
    "Setiap pernyataan di mobile harus dibungkus kartu mandiri berkelas cbt-stmt-card"
  );
});

test("CBT Statement Card Ergonomics: Kartu mobile memberikan lebar penuh 100% untuk teks pernyataan", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // Verifikasi wrapper teks pernyataan memiliki lebar 100% dan CbtContentRenderer
  assert.match(
    content,
    /<div[^>]*style=\{\{[^}]*width:\s*["']100%["'][^}]*\}\}[^>]*>\s*<CbtContentRenderer/,
    "Teks pernyataan di kartu mobile harus memiliki lebar 100% penuh untuk kenyamanan membaca"
  );
});

test("CBT Statement Card Ergonomics: Tombol pilihan mobile menggunakan grid 1fr 1fr dengan touch target ergonomis minHeight 44px", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // Verifikasi container tombol pilihan menggunakan gridTemplateColumns 1fr 1fr (atau repeat(2, minmax(0, 1fr)))
  assert.match(
    content,
    /gridTemplateColumns:\s*["'](repeat\(2,\s*minmax\(0,\s*1fr\)\)|1fr 1fr)["']/,
    "Tombol Benar/Salah di mobile harus berdampingan dengan grid 1fr 1fr"
  );

  // Verifikasi tombol pilihan memiliki minHeight: 44 untuk thumb-friendly ergonomics
  assert.match(
    content,
    /minHeight:\s*44/,
    "Tombol pilihan pada kartu mobile harus memenuhi touch target minimal 44px"
  );

  // Verifikasi interaktivitas tombol terhubung ke handleSelectStatementRow
  assert.match(
    content,
    /onClick=\{\(\) => handleSelectStatementRow\(opt\.id,\s*valCol1\)\}/,
    "Tombol kolom 1 harus memicu handleSelectStatementRow"
  );
  assert.match(
    content,
    /onClick=\{\(\) => handleSelectStatementRow\(opt\.id,\s*valCol2\)\}/,
    "Tombol kolom 2 harus memicu handleSelectStatementRow"
  );
});

test("CBT Statement Card Ergonomics: Aturan responsif di index.css mengatur display desktop vs mobile", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "index.css harus ada");

  const css = fs.readFileSync(cssPath, "utf-8");

  // Verifikasi deklarasi default / desktop
  assert.match(
    css,
    /\.cbt-stmt-desktop-table\s*\{[^}]*display:\s*block/s,
    "CSS harus menampilkan tabel di desktop"
  );
  assert.match(
    css,
    /\.cbt-stmt-mobile-list\s*\{[^}]*display:\s*none/s,
    "CSS harus menyembunyikan kartu mobile secara default di desktop"
  );

  // Verifikasi breakpoint media query max-width: 768px
  assert.match(
    css,
    /@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*?\.cbt-stmt-desktop-table\s*\{[\s\S]*?display:\s*none[\s\S]*?\.cbt-stmt-mobile-list\s*\{[\s\S]*?display:\s*flex/s,
    "Pada layar mobile (<= 768px), tabel disembunyikan dan kartu mobile ditampilkan (flex)"
  );
});
