const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Polish Chat Scroll FAB: TanyaNaraPanel memiliki tombol 'Pesan Terbaru' dinaikkan ke bottom >= 110 & padding diperbesar", () => {
  const panelPath = path.join(__dirname, "../src/components/modals/TanyaNaraPanel.tsx");
  assert.ok(fs.existsSync(panelPath), "TanyaNaraPanel.tsx harus ada");

  const content = fs.readFileSync(panelPath, "utf-8");

  // 1. Verifikasi tombol chat-scroll-bottom-fab memiliki bottom >= 110 (115)
  assert.match(
    content,
    /bottom:\s*(?:115|120)/,
    "FAB harus diposisikan di bottom: 115px agar tidak bertabrakan dengan prompt chips"
  );

  // 2. Verifikasi padding diperbesar (8px 18px)
  assert.match(
    content,
    /padding:\s*["']8px 18px["']/,
    "FAB harus memiliki padding 8px 18px"
  );

  // 3. Verifikasi fontSize diperbesar (13) & bold (800)
  assert.match(
    content,
    /fontSize:\s*13/,
    "FAB harus memiliki fontSize 13"
  );
  assert.match(
    content,
    /fontWeight:\s*800/,
    "FAB harus memiliki fontWeight 800"
  );

  // 4. Verifikasi icon ArrowDown size 15
  assert.match(
    content,
    /<ArrowDown[^>]*size=\{15\}/,
    "FAB harus menggunakan icon ArrowDown berukuran 15"
  );

  // 5. Verifikasi zIndex dinaikkan (70)
  assert.match(
    content,
    /zIndex:\s*70/,
    "FAB harus memiliki zIndex 70 agar di atas prompt chips"
  );
});

test("CBT Layout Cleanup: ExamCbtTab & index.css bersih dari artefak cbt-sticky-question-dock", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const cssPath = path.join(__dirname, "../src/index.css");

  assert.ok(fs.existsSync(cbtTabPath), "ExamCbtTab.tsx harus ada");
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");

  const cbtContent = fs.readFileSync(cbtTabPath, "utf-8");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  // 1. Verifikasi ketiadaan cbt-sticky-question-dock dan cbt-question-sentinel di ExamCbtTab
  assert.doesNotMatch(
    cbtContent,
    /cbt-sticky-question-dock/,
    "ExamCbtTab tidak boleh memuat class cbt-sticky-question-dock"
  );
  assert.doesNotMatch(
    cbtContent,
    /cbt-question-sentinel/,
    "ExamCbtTab tidak boleh memuat class cbt-question-sentinel"
  );
  assert.doesNotMatch(
    cbtContent,
    /cbt-quick-peek/,
    "ExamCbtTab tidak boleh memuat artefak cbt-quick-peek"
  );

  // 2. Verifikasi ketiadaan observer dan state snapper
  assert.doesNotMatch(
    cbtContent,
    /questionSentinelRef/,
    "ExamCbtTab tidak boleh memiliki questionSentinelRef"
  );
  assert.doesNotMatch(
    cbtContent,
    /isQuestionScrolledPast/,
    "ExamCbtTab tidak boleh memiliki state isQuestionScrolledPast"
  );
  assert.doesNotMatch(
    cbtContent,
    /isQuestionPeekOpen/,
    "ExamCbtTab tidak boleh memiliki state isQuestionPeekOpen"
  );

  // 3. Verifikasi CSS bersih dari cbt-sticky-question-dock
  assert.doesNotMatch(
    cssContent,
    /\.cbt-sticky-question-dock/,
    "src/index.css tidak boleh memuat selector .cbt-sticky-question-dock"
  );
  assert.doesNotMatch(
    cssContent,
    /\.cbt-quick-peek-popover/,
    "src/index.css tidak boleh memuat selector .cbt-quick-peek-popover"
  );
});
