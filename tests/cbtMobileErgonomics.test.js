const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("CBT Mobile Ergonomics: ExamCbtTab mendefinisikan dan memanggil onRunnerStateChange", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtTabPath), "ExamCbtTab.tsx harus ada");

  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Verifikasi props definition
  assert.match(
    content,
    /onRunnerStateChange\?: \((isRunning: boolean|.*)\) => void/,
    "ExamCbtTabProps harus memuat callback onRunnerStateChange"
  );

  // 2. Verifikasi pemanggilan onRunnerStateChange via useEffect
  assert.match(
    content,
    /onRunnerStateChange\?\.\(isRunning,\s*pkgTitle\)/,
    "ExamCbtTab harus menyinkronkan status runner dan judul paket via onRunnerStateChange"
  );

  // 3. Verifikasi exit handler (Kembali / selector)
  assert.match(
    content,
    /setMode\("selector"\)/,
    "ExamCbtTab harus mendukung tombol kembali ke mode selector"
  );
});

test("CBT Mobile Ergonomics: Modal wacana memiliki drag handle pill & safe area padding", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // Verifikasi drag handle pill
  assert.match(
    content,
    /width:\s*36,\s*height:\s*4,\s*borderRadius:\s*999,\s*backgroundColor:\s*["']#cbd5e1["']/,
    "Modal wacana sheet harus memiliki drag handle pill visual (#cbd5e1)"
  );

  // Verifikasi safe area padding bottom
  assert.match(
    content,
    /padding:\s*["']16px 18px calc\(24px \+ env\(safe-area-inset-bottom, 16px\)\) 18px["']/,
    "Modal wacana sheet harus memiliki safe area padding-bottom dinamis"
  );
});

test("CBT Mobile Ergonomics: Tombol wacana menggunakan icon SVG BookOpen tanpa emoji OS mentah", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // Verifikasi tidak ada emoji 📖 di tombol wacana
  assert.doesNotMatch(
    content,
    /📖\s*Buka Wacana/,
    "Tombol wacana tidak boleh menggunakan emoji mentah 📖"
  );

  // Verifikasi penggunaan BookOpen size={13} dan label Wacana
  assert.match(
    content,
    /<BookOpen\s+size=\{13\}\s*\/>\s*<span>Wacana<\/span>/,
    "Tombol wacana harus menggunakan icon SVG BookOpen size={13} dan label Wacana"
  );
});

test("CBT Mobile Ergonomics: MobileBottomNav tersembunyi saat sesi ujian CBT aktif di App.tsx", () => {
  const appPath = path.join(__dirname, "../src/App.tsx");
  assert.ok(fs.existsSync(appPath), "App.tsx harus ada");

  const content = fs.readFileSync(appPath, "utf-8");

  // State isCbtRunning dan callback
  assert.match(
    content,
    /const \[isCbtRunning,\s*setIsCbtRunning\] = useState\(false\);/,
    "App.tsx harus mengelola state isCbtRunning"
  );
  assert.match(
    content,
    /onRunnerStateChange=\{handleCbtRunnerStateChange\}/,
    "App.tsx harus meneruskan handleCbtRunnerStateChange ke ExamCbtTab"
  );

  // Rendering MobileBottomNav (Updated by TASK-060: MobileBottomNav tetap dirender dengan proteksi sesi aktif)
  assert.match(
    content,
    /<MobileBottomNav[\s\S]*?activeTab=\{activeTab\}/,
    "App.tsx harus merender MobileBottomNav"
  );
});

test("CBT Mobile Ergonomics: TopBar menyinkronkan judul paket CBT dan menyembunyikan timer Pomodoro saat ujian CBT aktif", () => {
  const topBarPath = path.join(__dirname, "../src/components/layout/TopBar.tsx");
  assert.ok(fs.existsSync(topBarPath), "TopBar.tsx harus ada");

  const content = fs.readFileSync(topBarPath, "utf-8");

  // Verifikasi sinkronisasi judul di TopBar
  assert.match(
    content,
    /activeTab\s*===\s*["']cbt["']\s*\?\s*\(cbtPackageTitle\s*\|\|\s*["']Simulasi Ujian CBT["']\)/,
    "TopBar harus menampilkan cbtPackageTitle saat activeTab === 'cbt', bukan fallback Pilih Materi"
  );

  // Verifikasi penyembunyian timer Pomodoro saat ujian CBT aktif
  assert.match(
    content,
    /!\(activeTab\s*===\s*["']cbt["']\s*&&\s*isCbtRunning\)\s*&&\s*\(/,
    "TopBar harus menyembunyikan timer Pomodoro saat tab CBT dan ujian berjalan"
  );
});

test("CBT Mobile Ergonomics: Header gelap CBT mobile compact & tombol Selesai tidak terpotong", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");

  const css = fs.readFileSync(cssPath, "utf-8");

  // Compact header height
  assert.match(
    css,
    /\.cbt-runner-header\s*\{[\s\S]*?max-height:\s*52px\s*!important;/,
    "Header CBT mobile harus memiliki max-height 52px"
  );

  // Sembunyikan wacana redundan di mobile
  assert.match(
    css,
    /\.cbt-desktop-only\s*\{[\s\S]*?display:\s*none\s*!important;/,
    "Element berkelas cbt-desktop-only harus disembunyikan di layar mobile"
  );

  // Tombol selesai tidak wrapping/terpotong
  assert.match(
    css,
    /\.cbt-header-btn-submit\s*\{[\s\S]*?white-space:\s*nowrap\s*!important;[\s\S]*?flex-shrink:\s*0\s*!important;/,
    "Tombol selesai di header mobile harus white-space: nowrap dan flex-shrink: 0"
  );

  // Serta verifikasi kontras badge Drill Mandiri di ExamCbtTab.tsx
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const cbtTabContent = fs.readFileSync(cbtTabPath, "utf-8");
  assert.match(
    cbtTabContent,
    /color:\s*studyMode\s*===\s*["']drill["']\s*\?\s*["']#a7f3d0["']/,
    "Badge Drill Mandiri harus menggunakan teks kontras tinggi #a7f3d0"
  );
  assert.match(
    cbtTabContent,
    /border:\s*studyMode\s*===\s*["']drill["']\s*\?\s*["']1px solid rgba\(16, 185, 129, 0.4\)["']/,
    "Badge Drill Mandiri harus menggunakan border 1px solid rgba(16, 185, 129, 0.4)"
  );
});
