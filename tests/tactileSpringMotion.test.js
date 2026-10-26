const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Tactile Spring Motion: ExamCbtTab mengimpor motion, AnimatePresence, dan useReducedMotion dari motion/react", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtTabPath), "ExamCbtTab.tsx harus ada");

  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // Verifikasi import
  assert.match(
    content,
    /import\s+\{[^}]*motion[^}]*AnimatePresence[^}]*useReducedMotion[^}]*\}\s+from\s+["']motion\/react["']/,
    "ExamCbtTab harus mengimpor motion, AnimatePresence, dan useReducedMotion dari motion/react"
  );

  // Verifikasi pemanggilan hook
  assert.match(
    content,
    /const\s+shouldReduceMotion\s*=\s*useReducedMotion\(\);/,
    "ExamCbtTab harus memanggil hook useReducedMotion()"
  );
});

test("Tactile Spring Motion: Modal sheet wacana memakai AnimatePresence + motion.div dengan physical spring & drag gesture", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Verifikasi AnimatePresence membungkus modal wacana
  assert.match(
    content,
    /<AnimatePresence>[\s\S]*?\{isWacanaModalOpen\s*&&\s*hasBacaan\s*&&[\s\S]*?<motion\.div[\s\S]*?<\/AnimatePresence>/,
    "Modal wacana harus dibungkus oleh AnimatePresence"
  );

  // 2. Verifikasi parameter spring physics pada sheet
  assert.match(
    content,
    /type:\s*["']spring["']/,
    "Sheet modal harus menggunakan transition type spring"
  );
  assert.match(
    content,
    /stiffness:\s*280/,
    "Spring stiffness wacana sheet harus 280"
  );
  assert.match(
    content,
    /damping:\s*26/,
    "Spring damping wacana sheet harus 26"
  );
  assert.match(
    content,
    /mass:\s*0\.6/,
    "Spring mass wacana sheet harus 0.6"
  );

  // 3. Verifikasi gesture drag-to-dismiss
  assert.match(
    content,
    /drag=\{shouldReduceMotion\s*\?\s*false\s*:\s*["']y["']\}/,
    "Sheet modal wacana harus mendukung drag='y' dengan fallback reduced motion"
  );
  assert.match(
    content,
    /dragConstraints=\{\{\s*top:\s*0\s*\}\}/,
    "Sheet modal wacana harus memiliki dragConstraints top: 0"
  );
  assert.match(
    content,
    /dragElastic=\{0\.2\}/,
    "Sheet modal wacana harus memiliki dragElastic 0.2"
  );
  assert.match(
    content,
    /info\.offset\.y\s*>\s*100\s*\|\|\s*info\.velocity\.y\s*>\s*400/,
    "Sheet modal wacana harus dismiss saat drag melewati ambang batas"
  );
});

test("Tactile Spring Motion: Opsi jawaban pilihan ganda memiliki whileTap spring & micro-pop badge huruf", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Verifikasi motion.button pada opsi pilihan ganda
  assert.match(
    content,
    /<motion\.button[\s\S]*?className=\{`cbt-option-btn[\s\S]*?whileTap=\{shouldReduceMotion\s*\?\s*undefined\s*:\s*\{\s*scale:\s*0\.96\s*\}\}/,
    "Tombol opsi pilihan ganda harus memiliki whileTap={{ scale: 0.96 }} dengan fallback reduced motion"
  );

  // 2. Verifikasi spring parameters pada opsi pilihan ganda
  assert.match(
    content,
    /stiffness:\s*450,\s*damping:\s*25,\s*mass:\s*0\.4/,
    "Spring opsi pilihan ganda harus stiffness: 450, damping: 25, mass: 0.4"
  );

  // 3. Verifikasi micro-pop pada badge huruf
  assert.match(
    content,
    /<motion\.span[\s\S]*?animate=\{isSelected\s*&&\s*!shouldReduceMotion\s*\?\s*\{\s*scale:\s*\[1,\s*1\.15,\s*1\]\s*\}\s*:\s*\{\s*scale:\s*1\s*\}\}/,
    "Badge huruf opsi harus memiliki micro-pop animation [1, 1.15, 1]"
  );
});

test("Tactile Spring Motion: Tombol Buka Wacana, Header Controls, dan Navigasi Bawah memiliki feedback tactile spring", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Tombol Buka Wacana
  assert.match(
    content,
    /<motion\.button[\s\S]*?className=["']cbt-mobile-read-btn["'][\s\S]*?whileTap=\{shouldReduceMotion\s*\?\s*undefined\s*:\s*\{\s*scale:\s*0\.93\s*\}\}/,
    "Tombol wacana mobile harus memiliki whileTap={{ scale: 0.93 }}"
  );

  // 2. Tombol Header (Kembali, Aa, Daftar Soal, Selesai)
  assert.match(
    content,
    /className=["']cbt-header-btn-back["'][\s\S]*?whileTap=\{shouldReduceMotion\s*\?\s*undefined\s*:\s*\{\s*scale:\s*0\.94\s*\}\}/,
    "Tombol header kembali harus memiliki whileTap={{ scale: 0.94 }}"
  );
  assert.match(
    content,
    /className=["']cbt-header-btn-font["'][\s\S]*?whileTap=\{shouldReduceMotion\s*\?\s*undefined\s*:\s*\{\s*scale:\s*0\.94\s*\}\}/,
    "Tombol header Aa harus memiliki whileTap={{ scale: 0.94 }}"
  );
  assert.match(
    content,
    /className=["']cbt-header-btn-palette["'][\s\S]*?whileTap=\{shouldReduceMotion\s*\?\s*undefined\s*:\s*\{\s*scale:\s*0\.94\s*\}\}/,
    "Tombol header daftar soal harus memiliki whileTap={{ scale: 0.94 }}"
  );
  assert.match(
    content,
    /className=["']cbt-header-btn-submit["'][\s\S]*?whileTap=\{shouldReduceMotion\s*\?\s*undefined\s*:\s*\{\s*scale:\s*0\.94\s*\}\}/,
    "Tombol header selesai harus memiliki whileTap={{ scale: 0.94 }}"
  );

  // 3. Tombol Navigasi Bawah
  assert.match(
    content,
    /cbt-action-footer[\s\S]*?Sebelumnya[\s\S]*?scale:\s*0\.95/,
    "Tombol navigasi sebelumnya harus memiliki whileTap scale 0.95"
  );
  assert.match(
    content,
    /cbt-action-footer[\s\S]*?Berikutnya[\s\S]*?scale:\s*0\.95/,
    "Tombol navigasi berikutnya harus memiliki whileTap scale 0.95"
  );
});
