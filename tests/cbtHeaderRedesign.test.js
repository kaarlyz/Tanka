const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("CBT Header Redesign: ExamCbtTab merender label 'Selesai' ringkas di mobile & 'Selesai Latihan/Ujian' di desktop", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtTabPath), "ExamCbtTab.tsx harus ada");

  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Verifikasi tombol Selesai memiliki label ringkas khusus mobile dan lengkap di desktop
  assert.match(
    content,
    /<span className=["']cbt-mobile-only["']>Selesai<\/span>/,
    "ExamCbtTab harus menyertakan label 'Selesai' untuk tampilan mobile"
  );
  assert.match(
    content,
    /<span className=["']cbt-desktop-only["']>\{studyMode === ["']drill["'] \? ["']Selesai Latihan["'] : ["']Selesai Ujian["']\}<\/span>/,
    "ExamCbtTab harus mempertahankan label lengkap 'Selesai Latihan' / 'Selesai Ujian' di desktop"
  );

  // 2. Verifikasi icon Check dan LayoutGrid berukuran proporsional
  assert.match(
    content,
    /<Check\s+size=\{14\}\s*\/>/,
    "Tombol submit harus menggunakan icon Check berukuran 14"
  );
  assert.match(
    content,
    /<LayoutGrid\s+size=\{13\}\s*\/>/,
    "Tombol palette harus menggunakan icon LayoutGrid berukuran 13"
  );
});

test("CBT Header Redesign: CSS .cbt-runner-header mengunci layout floating slim bar single-row tanpa overflow", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");

  const css = fs.readFileSync(cssPath, "utf-8");

  // 1. Verifikasi container header mobile: floating/shelf bar styling
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?(?:background-color:\s*rgba\(24,\s*34,\s*31,\s*0\.94\)|background:\s*#18221f)\s*!important;/,
    "Header CBT mobile harus memiliki latar gelap"
  );
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?(?:backdrop-filter:\s*blur\(12px\)|border-bottom:\s*2px\s*solid)/,
    "Header CBT mobile harus memiliki visual boundary styling"
  );
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?(?:border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.08\)|border:\s*none)\s*!important;/,
    "Header CBT mobile harus memiliki border styling valid"
  );
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?border-radius:\s*(?:10px|0\s+0\s+14px\s+14px)\s*!important;/,
    "Header CBT mobile harus memiliki border-radius valid"
  );
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?padding:\s*(?:8px\s*12px|10px\s*14px)\s*!important;/,
    "Header CBT mobile harus memiliki padding slim"
  );
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?flex-wrap:\s*nowrap\s*!important;[\s\S]*?overflow:\s*hidden\s*!important;/,
    "Header CBT mobile harus terkunci nowrap dan overflow hidden agar nol overflow"
  );

  // 2. Verifikasi utilitas visibility cbt-mobile-only
  assert.match(
    css,
    /\.cbt-mobile-only\s*\{[\s\S]*?display:\s*none\s*!important;/,
    "cbt-mobile-only harus disembunyikan di desktop"
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*768px\)\s*\{[\s\S]*?\.cbt-mobile-only\s*\{[\s\S]*?display:\s*inline-flex\s*!important;/,
    "cbt-mobile-only harus aktif (inline-flex) di media query mobile"
  );
});

test("CBT Header Redesign: Timer pill terpusat dan memiliki styling monospaced hijau lime presisi", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  // 1. Centered wrap di mobile
  assert.match(
    css,
    /\.cbt-runner-timer-wrap\s*\{[\s\S]*?display:\s*flex\s*!important;[\s\S]*?justify-content:\s*center\s*!important;/,
    "Timer wrap harus terpusat horizontal di header mobile"
  );

  // 2. Timer pill pill-shaped styling
  assert.match(
    css,
    /\.cbt-header-timer-pill\s*\{[\s\S]*?border-radius:\s*9999px\s*!important;/,
    "Timer pill harus memiliki border-radius 9999px (capsule pill)"
  );
  assert.match(
    css,
    /\.cbt-header-timer-pill\s*\{[\s\S]*?background-color:\s*rgba\(200,\s*240,\s*100,\s*0\.12\)\s*!important;/,
    "Timer pill harus menggunakan latar hijau lime transparan rgba(200, 240, 100, 0.12)"
  );

  // 3. Monospace font & color
  assert.match(
    css,
    /\.cbt-timer-digits\s*\{[\s\S]*?font-family:\s*['"]DM Mono['"],\s*monospace\s*!important;[\s\S]*?font-size:\s*13\.5px\s*!important;[\s\S]*?color:\s*#c8f064\s*!important;/,
    "Angka timer harus monospaced 'DM Mono', ukuran 13.5px, warna hijau lime #c8f064"
  );
});

test("CBT Header Redesign: Ergonomi kartu soal & opsi pilihan ganda di viewport 360px-390px", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  // 1. Spacing kartu soal di bawah header
  assert.match(
    css,
    /\.cbt-pane\s*\{[\s\S]*?margin-top:\s*(?:4px|14px)\s*!important;/,
    "Kartu soal CBT harus memiliki margin-top di mobile"
  );

  // 2. Padding nyaman untuk touch target opsi pilihan ganda
  assert.match(
    css,
    /\.cbt-option-btn\s*\{[\s\S]*?padding:\s*12px\s*14px\s*!important;[\s\S]*?border-radius:\s*10px\s*!important;/,
    "Tombol opsi pilihan ganda harus memiliki padding 12px 14px dan border-radius 10px di mobile"
  );

  // 3. Sticky action footer floating glass
  assert.match(
    css,
    /\.cbt-action-footer\s*\{[\s\S]*?background:\s*rgba\(255,\s*255,\s*255,\s*(?:0\.95|0\.96)\)\s*!important;[\s\S]*?backdrop-filter:\s*blur\((?:8|10)px\)\s*!important;[\s\S]*?border:\s*1px\s*solid\s*(?:#e2e8f0|#dce2d6)\s*!important;/,
    "Footer navigasi bawah harus memiliki latar blur dan border halus"
  );

  // 4. Verifikasi styling opsi terpilih di ExamCbtTab.tsx
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");
  assert.match(
    content,
    /border\s*=\s*isSelected\s*\?\s*["']1\.5px solid #16a34a["']/,
    "Opsi terpilih harus memiliki border 1.5px solid #16a34a"
  );
  assert.match(
    content,
    /bg\s*=\s*isSelected\s*\?\s*["']#f0fdf4["']/,
    "Opsi terpilih harus memiliki background lembut #f0fdf4"
  );
  assert.match(
    content,
    /badgeBg\s*=\s*isSelected\s*\?\s*["']#16a34a["']/,
    "Badge huruf opsi terpilih harus berwarna hijau segar #16a34a"
  );
});
