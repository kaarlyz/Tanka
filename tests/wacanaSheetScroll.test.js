const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Wacana Sheet Scroll: ExamCbtTab mengimpor useDragControls dan mengonfigurasi dragListener={false}", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtTabPath), "ExamCbtTab.tsx harus ada");

  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Verifikasi import useDragControls dari motion/react
  assert.match(
    content,
    /import\s+\{[^}]*useDragControls[^}]*\}\s+from\s+["']motion\/react["']/,
    "ExamCbtTab harus mengimpor useDragControls dari motion/react"
  );

  // 2. Verifikasi inisialisasi useDragControls
  assert.match(
    content,
    /const\s+dragControls\s*=\s*useDragControls\(\);/,
    "ExamCbtTab harus memanggil useDragControls()"
  );

  // 3. Verifikasi dragControls dan dragListener={false} pada modal container
  assert.match(
    content,
    /<motion\.div[\s\S]*?dragControls=\{dragControls\}[\s\S]*?dragListener=\{false\}/,
    "Sheet modal wacana harus dipasangi dragControls dan dragListener={false}"
  );
});

test("Wacana Sheet Scroll: Kontainer wacana memiliki area scroll mandiri dengan overflowY auto & touch-action pan-y", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // Verifikasi adanya elemen cbt-wacana-scroll-content
  assert.match(
    content,
    /className=["']cbt-wacana-scroll-content["']/,
    "Harus ada elemen dengan className cbt-wacana-scroll-content"
  );

  // Verifikasi styling scroll terisolasi
  assert.match(
    content,
    /overflowY:\s*["']auto["']/,
    "cbt-wacana-scroll-content harus memiliki overflowY: auto"
  );

  assert.match(
    content,
    /WebkitOverflowScrolling:\s*["']touch["']/,
    "cbt-wacana-scroll-content harus memiliki WebkitOverflowScrolling: touch"
  );

  assert.match(
    content,
    /touchAction:\s*["']pan-y["']/,
    "cbt-wacana-scroll-content harus memiliki touchAction: pan-y"
  );
});

test("Wacana Sheet Scroll: Drag gesture terisolasi pada area Header & Drag Handle Pill", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // Verifikasi onPointerDown memicu dragControls.start(e)
  assert.match(
    content,
    /onPointerDown=\{\(e\)\s*=>\s*dragControls\.start\(e\)\}/,
    "Header modal wacana harus mengikat onPointerDown ke dragControls.start(e)"
  );

  // Verifikasi header zone memiliki touchAction: "none" dan cursor: "grab"
  assert.match(
    content,
    /cursor:\s*["']grab["'][\s\S]*?touchAction:\s*["']none["']/,
    "Header drag zone harus memiliki cursor grab dan touchAction none"
  );

  // Verifikasi tombol close tidak memicu drag via stopPropagation
  assert.match(
    content,
    /onPointerDown=\{\(e\)\s*=>\s*e\.stopPropagation\(\)\}[\s\S]*?setIsWacanaModalOpen\(false\)/,
    "Tombol close wacana harus menghentikan propagasi pointerDown agar tidak memicu drag gesture"
  );
});

test("Wacana Sheet Scroll: CSS index.css mendefinisikan cbt-wacana-scroll-content dengan smooth touch scroll", () => {
  const cssPath = path.join(__dirname, "../src/index.css");
  assert.ok(fs.existsSync(cssPath), "index.css harus ada");

  const css = fs.readFileSync(cssPath, "utf-8");

  assert.match(
    css,
    /\.cbt-wacana-scroll-content\s*\{[\s\S]*?overflow-y:\s*auto;[\s\S]*?-webkit-overflow-scrolling:\s*touch;[\s\S]*?touch-action:\s*pan-y;/s,
    "index.css harus mendefinisikan aturan scroll mandiri pada .cbt-wacana-scroll-content"
  );
});
