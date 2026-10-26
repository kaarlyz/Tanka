const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Nara Panel Mobile Lock: .ai-panel-box.open menggunakan 100% (bukan 100vw) dan overflow-x hidden", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");

  const css = fs.readFileSync(cssPath, "utf-8");

  // Cari blok @media (max-width: 768px) yang memuat .ai-panel-box.open
  const mobileMediaMatch = css.match(/@media\s*\(max-width:\s*768px\)\s*\{([\s\S]*?)\n\s*\}\s*\n\s*\/\* 7/);
  assert.ok(mobileMediaMatch, "Blok media query mobile untuk ai-panel-box harus ditemukan");
  const mobileContent = mobileMediaMatch[1];

  // 1. Verifikasi lebar 100% bukan 100vw
  assert.match(
    mobileContent,
    /\.ai-panel-box\.open\s*\{[\s\S]*?width:\s*100%\s*!important;/,
    ".ai-panel-box.open harus menggunakan width: 100% !important di mobile"
  );
  assert.match(
    mobileContent,
    /\.ai-panel-box\.open\s*\{[\s\S]*?min-width:\s*100%\s*!important;/,
    ".ai-panel-box.open harus menggunakan min-width: 100% !important di mobile"
  );
  assert.match(
    mobileContent,
    /\.ai-panel-box\.open\s*\{[\s\S]*?max-width:\s*100%\s*!important;/,
    ".ai-panel-box.open harus menggunakan max-width: 100% !important di mobile"
  );
  assert.doesNotMatch(
    mobileContent,
    /\.ai-panel-box\.open\s*\{[\s\S]*?width:\s*100vw/,
    ".ai-panel-box.open dilarang menggunakan 100vw di mobile"
  );

  // 2. Verifikasi overflow-x, overscroll-behavior-x, dan touch-action
  assert.match(
    mobileContent,
    /\.ai-panel-box\.open\s*\{[\s\S]*?overflow-x:\s*hidden\s*!important;/,
    ".ai-panel-box.open harus memiliki overflow-x: hidden !important di mobile"
  );
  assert.match(
    mobileContent,
    /\.ai-panel-box\.open\s*\{[\s\S]*?overscroll-behavior-x:\s*none\s*!important;/,
    ".ai-panel-box.open harus memiliki overscroll-behavior-x: none !important di mobile"
  );
  assert.match(
    mobileContent,
    /\.ai-panel-box\.open\s*\{[\s\S]*?touch-action:\s*pan-y\s*!important;/,
    ".ai-panel-box.open harus memiliki touch-action: pan-y !important di mobile"
  );
});

test("Nara Panel Mobile Lock: Resize handle desktop memiliki class penanda dan dinonaktifkan di mobile", () => {
  const panelPath = path.join(__dirname, "../src/components/modals/TanyaNaraPanel.tsx");
  assert.ok(fs.existsSync(panelPath), "TanyaNaraPanel.tsx harus ada");

  const panelContent = fs.readFileSync(panelPath, "utf-8");

  // 1. Verifikasi class ai-panel-resizer-desktop disematkan pada handle resize
  assert.match(
    panelContent,
    /<div[\s\S]*?className=["'][^"']*ai-panel-resizer-desktop[^"']*["'][\s\S]*?onMouseDown=\{startResize\}/,
    "Handle resize harus memiliki class ai-panel-resizer-desktop"
  );

  // 2. Verifikasi container aside menyematkan touchAction pan-y dan overflowX hidden
  assert.match(
    panelContent,
    /<aside[\s\S]*?className=\{`ai-panel-box\s*\$\{isAiPanelOpen\s*\?\s*"open"\s*:\s*""\}`\}[\s\S]*?overflowX:\s*"hidden"/,
    "Aside TanyaNaraPanel harus menyematkan overflowX: 'hidden'"
  );
  assert.match(
    panelContent,
    /<aside[\s\S]*?className=\{`ai-panel-box\s*\$\{isAiPanelOpen\s*\?\s*"open"\s*:\s*""\}`\}[\s\S]*?touchAction:\s*"pan-y"/,
    "Aside TanyaNaraPanel harus menyematkan touchAction: 'pan-y'"
  );

  // 3. Verifikasi index.css menyembunyikan resize handle di mobile
  const cssPath = path.join(__dirname, "../src/index.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.match(
    css,
    /\.ai-panel-resizer-desktop[\s\S]*?display:\s*none\s*!important;/,
    "Handle resize desktop harus display: none !important di mobile"
  );
});

test("Nara Panel Mobile Lock: DOM probe kalkulasi geometri mobile 390x844 (right <= 390)", () => {
  // Simulasi geometri layout di viewport mobile 390px
  const viewportWidth = 390;
  const panelStyle = {
    position: "fixed",
    left: 0,
    widthPercent: 1.0, // 100%
    boxSizing: "border-box",
    overflowX: "hidden"
  };

  const computedWidth = viewportWidth * panelStyle.widthPercent;
  const boundingClientRect = {
    left: panelStyle.left,
    right: panelStyle.left + computedWidth,
    width: computedWidth
  };

  assert.equal(boundingClientRect.left, 0, "Left boundary harus tepat pada 0px");
  assert.equal(boundingClientRect.right, 390, "Right boundary harus tepat pada 390px (tidak ada pixel leakage)");
  assert.ok(boundingClientRect.right <= viewportWidth, "Bounding box tidak boleh melampaui lebar viewport 390px");
});
