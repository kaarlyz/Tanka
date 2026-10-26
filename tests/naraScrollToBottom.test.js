const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const panelPath = path.join(__dirname, "../src/components/modals/TanyaNaraPanel.tsx");
const cssPath = path.join(__dirname, "../src/index.css");

test("Nara Scroll-to-Bottom: Tombol muncul saat distanceFromBottom > 140", () => {
  assert.ok(fs.existsSync(panelPath), "TanyaNaraPanel.tsx harus ada");
  const panelContent = fs.readFileSync(panelPath, "utf-8");

  // 1. Verifikasi state showScrollBottomBtn
  assert.match(
    panelContent,
    /const\s*\[showScrollBottomBtn,\s*setShowScrollBottomBtn\]\s*=\s*useState\(false\);/,
    "TanyaNaraPanel harus mendefinisikan state showScrollBottomBtn"
  );

  // 2. Verifikasi threshold distanceFromBottom > 140 pada listener scroll
  assert.match(
    panelContent,
    /distanceFromBottom\s*>\s*140/,
    "handleChatScroll harus memeriksa distanceFromBottom > 140"
  );

  // 3. Verifikasi handleChatScroll di-bind ke onScroll chatWindowRef
  assert.match(
    panelContent,
    /onScroll=\{handleChatScroll\}/,
    ".chat-window-box harus memiliki event handler onScroll={handleChatScroll}"
  );

  // 4. Simulasi logika perhitungan jarak scroll
  const calcDistanceFromBottom = (scrollHeight, scrollTop, clientHeight) => {
    return scrollHeight - scrollTop - clientHeight;
  };
  assert.equal(calcDistanceFromBottom(1000, 800, 150) > 140, false); // 50 <= 140
  assert.equal(calcDistanceFromBottom(1000, 500, 150) > 140, true); // 350 > 140
});

test("Nara Scroll-to-Bottom: Klik tombol scroll-to-bottom memicu scrollTo ke scrollHeight", () => {
  const panelContent = fs.readFileSync(panelPath, "utf-8");

  // 1. Memastikan tombol memiliki class chat-scroll-bottom-fab dan teks 'Pesan Terbaru'
  assert.match(
    panelContent,
    /className=["'][^"']*chat-scroll-bottom-fab[^"']*["']/,
    "Tombol scroll harus memiliki class chat-scroll-bottom-fab"
  );
  assert.match(
    panelContent,
    /<ArrowDown\s+size=\{(?:14|15)\}/,
    "Tombol scroll harus memuat icon ArrowDown"
  );
  assert.match(
    panelContent,
    /<span>Pesan Terbaru<\/span>/,
    "Tombol scroll harus memiliki teks 'Pesan Terbaru'"
  );

  // 2. Memastikan onClick memanggil scrollTo dengan { top: el.scrollHeight, behavior: 'smooth' }
  assert.match(
    panelContent,
    /el\.scrollTo\(\{\s*top:\s*el\.scrollHeight,\s*behavior:\s*["']smooth["']\s*\}\)/,
    "Klik tombol harus mengeksekusi scrollTo ke scrollHeight dengan smooth behavior"
  );
});

test("Nara Typing Indicator: Merender 3 dot bergelombang dengan animasi motion", () => {
  const panelContent = fs.readFileSync(panelPath, "utf-8");

  // 1. Memastikan indikator dibungkus class nara-typing-indicator
  assert.match(
    panelContent,
    /className=["'][^"']*nara-typing-indicator[^"']*["']/,
    "Indikator typing harus memiliki class nara-typing-indicator"
  );

  // 2. Memastikan iterasi 3 dot bergelombang
  assert.match(
    panelContent,
    /\[0,\s*1,\s*2\]\.map\(\(dot\)\s*=>/,
    "Indikator typing harus memetakan 3 dot ([0, 1, 2])"
  );

  // 3. Memastikan animasi y: [0, -5, 0] dengan repeat Infinity dan stagger delay
  assert.match(
    panelContent,
    /animate=\{\{\s*y:\s*\[0,\s*-5,\s*0\]\s*\}\}/,
    "Dot harus memiliki keyframe animasi loncat y: [0, -5, 0]"
  );
  assert.match(
    panelContent,
    /repeat:\s*Infinity/,
    "Animasi loncat dot harus berulang terus-menerus (repeat: Infinity)"
  );
  assert.match(
    panelContent,
    /delay:\s*dot\s*\*\s*0\.15/,
    "Stagger delay animasi dot harus dot * 0.15"
  );
});

test("Nara Chat Bubble: Menggunakan motion wrapper spring", () => {
  const panelContent = fs.readFileSync(panelPath, "utf-8");

  // 1. Memastikan ChatMessageItem menggunakan motion.div dengan class chat-bubble-wrapper
  assert.match(
    panelContent,
    /<motion\.div[\s\S]*?className=["'][^"']*chat-bubble-wrapper[^"']*["']/,
    "ChatMessageItem harus membungkus bubble dengan motion.div berkelas chat-bubble-wrapper"
  );

  // 2. Memastikan parameter spring physics terpasang
  assert.match(
    panelContent,
    /type:\s*["']spring["']/,
    "Bubble motion harus menggunakan tipe transisi spring"
  );
  assert.match(
    panelContent,
    /stiffness:\s*400/,
    "Spring stiffness bubble harus 400"
  );
  assert.match(
    panelContent,
    /damping:\s*28/,
    "Spring damping bubble harus 28"
  );
  assert.match(
    panelContent,
    /mass:\s*0\.5/,
    "Spring mass bubble harus 0.5"
  );
});

test("Nara Overscroll Rubber-Band Lock: overscroll-behavior: none terpasang di root CSS mobile", () => {
  assert.ok(fs.existsSync(cssPath), "src/index.css harus ada");
  const css = fs.readFileSync(cssPath, "utf-8");

  // 1. Verifikasi html, body di mobile menggunakan width 100% dan overscroll-behavior: none
  assert.match(
    css,
    /html,\s*body\s*\{[\s\S]*?width:\s*100%\s*!important;[\s\S]*?overscroll-behavior:\s*none\s*!important;/,
    "html, body mobile harus memiliki width: 100% dan overscroll-behavior: none !important"
  );

  // 2. Verifikasi .app-shell mobile menggunakan width 100% dan overscroll-behavior: none
  assert.match(
    css,
    /\.app-shell\s*\{[\s\S]*?width:\s*100%\s*!important;[\s\S]*?overscroll-behavior:\s*none\s*!important;/,
    ".app-shell mobile harus memiliki width: 100% dan overscroll-behavior: none !important"
  );

  // 3. Verifikasi .ai-panel-box.open mobile memiliki overscroll-behavior: none
  assert.match(
    css,
    /\.ai-panel-box\.open\s*\{[\s\S]*?overscroll-behavior:\s*none\s*!important;/,
    ".ai-panel-box.open mobile harus memiliki overscroll-behavior: none !important"
  );

  // 4. Verifikasi .chat-window-box memiliki touch-action: pan-y dan overscroll-behavior: contain
  assert.match(
    css,
    /\.chat-window-box[\s\S]*?overscroll-behavior:\s*contain\s*!important;[\s\S]*?touch-action:\s*pan-y\s*!important;/,
    ".chat-window-box mobile harus memiliki overscroll-behavior: contain dan touch-action: pan-y"
  );
});
