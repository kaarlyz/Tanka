const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("CBT Full-Height & Unified Scroll: .cbt-pane pada mobile menghilangkan batasan tinggi dan inner scroll trap", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");

  const css = fs.readFileSync(cssPath, "utf-8");

  // 1. Verifikasi aturan .cbt-pane di @media (max-width: 768px)
  assert.match(
    css,
    /\.cbt-pane\s*\{[\s\S]*?max-height:\s*none\s*!important;/,
    ".cbt-pane harus memiliki max-height: none !important di mobile"
  );

  assert.match(
    css,
    /\.cbt-pane\s*\{[\s\S]*?min-height:\s*auto\s*!important;/,
    ".cbt-pane harus memiliki min-height: auto !important di mobile"
  );

  assert.match(
    css,
    /\.cbt-pane\s*\{[\s\S]*?height:\s*auto\s*!important;/,
    ".cbt-pane harus memiliki height: auto !important di mobile"
  );

  assert.match(
    css,
    /\.cbt-pane\s*\{[\s\S]*?overflow-y:\s*visible\s*!important;/,
    ".cbt-pane harus memiliki overflow-y: visible !important di mobile (eliminasi nested scroll trap)"
  );

  assert.match(
    css,
    /\.cbt-pane\s*\{[\s\S]*?flex:\s*1\s*1\s*auto\s*!important;/,
    ".cbt-pane harus flex: 1 1 auto !important agar membentang rata ke bawah"
  );

  // 2. Verifikasi ExamCbtTab.tsx mengadopsi flex: 1 pada kartu soal
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtTabPath), "ExamCbtTab.tsx harus ada");

  const cbtContent = fs.readFileSync(cbtTabPath, "utf-8");
  assert.match(
    cbtContent,
    /<section[\s\S]*?className=["']cbt-pane["'][\s\S]*?style=\{\{[\s\S]*?flex:\s*1,/,
    "ExamCbtTab.tsx harus memberikan flex: 1 pada kontainer .cbt-pane"
  );
});

test("CBT Full-Height & Unified Scroll: .cbt-runner-container membentang mengisi tinggi viewport dengan safe area", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.match(
    css,
    /\.cbt-runner-container\s*\{[\s\S]*?min-height:\s*calc\(100dvh\s*-\s*100px\)\s*!important;/,
    ".cbt-runner-container harus memiliki min-height: calc(100dvh - 100px) !important di mobile"
  );

  assert.match(
    css,
    /\.cbt-runner-container\s*\{[\s\S]*?display:\s*flex\s*!important;[\s\S]*?flex-direction:\s*column\s*!important;/,
    ".cbt-runner-container harus display: flex flex-direction: column di mobile"
  );

  assert.match(
    css,
    /\.cbt-runner-container\s*\{[\s\S]*?padding-bottom:\s*calc\((?:85|140)px\s*\+\s*env\(safe-area-inset-bottom,\s*20px\)\)\s*!important;/,
    ".cbt-runner-container harus memiliki safe-area padding bottom yang memadai"
  );
});

test("CBT Full-Height & Unified Scroll: Modal wacana memiliki pemisahan drag gesture dan teks wacana scroll bebas", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Verifikasi dragControls dan dragListener={false}
  assert.match(
    content,
    /dragControls=\{dragControls\}[\s\S]*?dragListener=\{false\}/,
    "Sheet wacana harus mengunci dragListener={false} agar gesture scroll tidak dibajak drag"
  );

  // 2. Verifikasi konten teks wacana scrollable mandiri
  assert.match(
    content,
    /className=["']cbt-wacana-scroll-content["'][\s\S]*?overflowY:\s*["']auto["'][\s\S]*?touchAction:\s*["']pan-y["']/,
    "Area konten wacana harus memiliki overflowY: auto dan touchAction: pan-y"
  );
});
