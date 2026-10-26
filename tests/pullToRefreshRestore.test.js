const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Restore Chrome Pull-to-Refresh: html, body mengizinkan pull-to-refresh dengan overscroll-behavior-y auto", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");

  const css = fs.readFileSync(cssPath, "utf-8");

  // 1. html, body TIDAK BOLEH memiliki overscroll-behavior: none atau overscroll-behavior-y: none
  assert.doesNotMatch(
    css,
    /html,\s*body\s*\{[^}]*overscroll-behavior(?:-y)?:\s*none\s*!important;/,
    "html, body dilarang memuat overscroll-behavior: none !important agar Chrome pull-to-refresh tidak mati"
  );

  // 2. html, body harus memiliki overscroll-behavior-y: auto !important
  assert.match(
    css,
    /html,\s*body\s*\{[^}]*overscroll-behavior-y:\s*auto\s*!important;/,
    "html, body harus menyetel overscroll-behavior-y: auto !important untuk gestur native pull-to-refresh"
  );

  // 3. html, body harus mengunci geser horizontal dengan overscroll-behavior-x: none !important
  assert.match(
    css,
    /html,\s*body\s*\{[^}]*overscroll-behavior-x:\s*none\s*!important;/,
    "html, body harus menyetel overscroll-behavior-x: none !important untuk mengunci geser horizontal"
  );

  // 4. .app-shell tidak boleh memblokir overscroll vertikal
  assert.doesNotMatch(
    css,
    /\.app-shell\s*\{[^}]*overscroll-behavior:\s*none\s*!important;/,
    ".app-shell dilarang memuat overscroll-behavior: none !important"
  );
  assert.match(
    css,
    /\.app-shell\s*\{[^}]*overscroll-behavior-x:\s*none\s*!important;/,
    ".app-shell harus mempertahankan overscroll-behavior-x: none !important"
  );

  // 5. Kunci overscroll HANYA saat modal/panel terbuka (.ai-panel-box.open)
  assert.match(
    css,
    /\.ai-panel-box\.open\s*\{[^}]*overscroll-behavior:\s*none\s*!important;/,
    ".ai-panel-box.open harus tetap mengunci overscroll dengan overscroll-behavior: none !important"
  );
  assert.match(
    css,
    /\.ai-panel-box\.open\s*\{[^}]*overscroll-behavior-x:\s*none\s*!important;/,
    ".ai-panel-box.open harus mempertahankan overscroll-behavior-x: none !important"
  );
});
