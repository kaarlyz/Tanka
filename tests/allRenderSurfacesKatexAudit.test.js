const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const katex = require("katex");

let normalizeMathExpression;
let healControlCharsToLatex;
let sanitizeMathMarkdown;

test.before(async () => {
  const mathMod = await import("../src/utils/mathNormalizer.ts");
  normalizeMathExpression = mathMod.normalizeMathExpression;
  healControlCharsToLatex = mathMod.healControlCharsToLatex;

  const diagMod = await import("../src/utils/diagramNormalizer.ts");
  sanitizeMathMarkdown = diagMod.sanitizeMathMarkdown;
});

// Helper emulator render mirroring cleanAndRenderCbtContent
function renderMathSnippet(content) {
  let str = normalizeMathExpression(content);

  const blockMathList = [];
  str = str.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`);
  str = str.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    blockMathList.push(math);
    return `@@@TEST_BLOCK_${blockMathList.length - 1}@@@`;
  });

  const inlineMathList = [];
  str = str.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`);
  str = str.replace(/(?<!\$)\$(?!\$)((?:[^\$\n]|\n(?!\s*\n))+?)(?<!\$)\$(?!\$)/g, (_, math) => {
    inlineMathList.push(math);
    return `@@@TEST_INLINE_${inlineMathList.length - 1}@@@`;
  });

  str = str.replace(/@@@TEST_BLOCK_(\d+)@@@/g, (_, idx) => {
    const raw = blockMathList[Number(idx)];
    return `<div class="katex-display-wrapper">${katex.renderToString(raw.trim(), { displayMode: true, throwOnError: false })}</div>`;
  });

  str = str.replace(/@@@TEST_INLINE_(\d+)@@@/g, (_, idx) => {
    const raw = inlineMathList[Number(idx)];
    return katex.renderToString(raw.trim(), { displayMode: false, throwOnError: false });
  });

  return str;
}

test("Audit ExamCbtTab.tsx: Modal Diagnostik AI Nara Autopsy wajib render KaTeX", () => {
  const filePath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(filePath), "ExamCbtTab.tsx harus ada");
  const content = fs.readFileSync(filePath, "utf-8");

  // it.pertanyaanRingkas
  assert.match(
    content,
    /<CbtContentRenderer\s+inline\s+content=\{it\.pertanyaanRingkas\}\s*\/>/,
    "it.pertanyaanRingkas harus dibungkus <CbtContentRenderer inline content={it.pertanyaanRingkas} />"
  );

  // it.buktiTeks
  assert.match(
    content,
    /<CbtContentRenderer\s+inline\s+content=\{it\.buktiTeks\}\s*\/>/,
    "it.buktiTeks harus dibungkus <CbtContentRenderer inline content={it.buktiTeks} />"
  );

  // it.analisisJebakan
  assert.match(
    content,
    /<CbtContentRenderer\s+inline\s+content=\{it\.analisisJebakan\}\s*\/>/,
    "it.analisisJebakan harus dibungkus <CbtContentRenderer inline content={it.analisisJebakan} />"
  );

  // diagnosticData.executiveSummary
  assert.match(
    content,
    /<CbtContentRenderer\s+content=\{diagnosticData\.executiveSummary\}\s*\/>/,
    "diagnosticData.executiveSummary harus dibungkus <CbtContentRenderer content={diagnosticData.executiveSummary} />"
  );

  // wp.gejala
  assert.match(
    content,
    /<CbtContentRenderer\s+inline\s+content=\{wp\.gejala\}\s*\/>/,
    "wp.gejala harus dibungkus <CbtContentRenderer inline content={wp.gejala} />"
  );

  // wp.tipsCepat
  assert.match(
    content,
    /<CbtContentRenderer\s+inline\s+content=\{wp\.tipsCepat\}\s*\/>/,
    "wp.tipsCepat harus dibungkus <CbtContentRenderer inline content={wp.tipsCepat} />"
  );
});

test("Audit ExamCbtTab.tsx: Ringkasan soal di tabel review dan drill mode wajib render KaTeX", () => {
  const filePath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  // Ringkasan soal di baris tabel review (filteredBreakdown)
  assert.match(
    content,
    /<CbtContentRenderer\s+inline\s+content=\{item\.soal\}\s*\/>/,
    "Ringkasan soal di tabel review wajib menggunakan <CbtContentRenderer inline content={item.soal} />"
  );

  // Kartu drill mode evaluasi kunci jawaban
  assert.match(
    content,
    /<CbtContentRenderer\s+inline\s+content=\{currentItem\.kunci_jawaban_text\s*\|\|\s*`\(\$\{currentItem\.kunci_jawaban\.toUpperCase\(\)\}\)`\}\s*\/>/,
    "Drill mode kunci jawaban wajib menggunakan CbtContentRenderer"
  );
});

test("KaTeX Normalizer Payload Ekstrem: Matriks inline tidak terpotong regex auto-wrap", () => {
  const payload = "Translasi kurva parabola dengan matriks translasi $T = \\begin{pmatrix} 30 \\\\ 4 \\end{pmatrix}$ menentukan posisi puncak baru.";
  const normalized = normalizeMathExpression(payload);

  // Pastikan tetap inline math $...$ dan tidak diubah jadi block $$
  assert.ok(normalized.includes("$T = \\begin{pmatrix} 30 \\\\ 4 \\end{pmatrix}$"));
  assert.ok(!normalized.includes("$$\nT ="));

  // Render HTML KaTeX tanpa throw error
  const html = renderMathSnippet(normalized);
  assert.ok(html.includes("katex"));
  assert.ok(html.includes("30"));
  assert.ok(html.includes("4"));
});

test("KaTeX Normalizer Payload Ekstrem: Naked matrix environments dibungkus $$ tanpa newline liar", () => {
  const matrixEnv = "\\begin{bmatrix}\n1 & 2 & 3 \\\\\n4 & 5 & 6\n\\end{bmatrix}";
  const normalized = normalizeMathExpression(matrixEnv);
  assert.equal(normalized, `$$\n${matrixEnv}\n$$`);

  const html = renderMathSnippet(normalized);
  assert.ok(html.includes("katex-display"));
});

test("KaTeX Normalizer Payload Ekstrem: Pecahan bertingkat kompleks", () => {
  const payload = "Nilai dari $\\frac{\\frac{x^2 - 1}{x + 1}}{\\frac{x - 1}{2x + 4}}$ untuk $x \\neq 1$.";
  const normalized = normalizeMathExpression(payload);
  const html = renderMathSnippet(normalized);

  assert.ok(html.includes("katex"));
  assert.ok(html.includes("katex-html"));
  assert.ok(!html.includes("$"));
});

test("KaTeX Normalizer Payload Ekstrem: Akar kuadrat bersarang", () => {
  const payload = "Solusi persamaan: $x = \\sqrt{2 + \\sqrt{2 + \\sqrt{2 + \\dots}}}$";
  const normalized = normalizeMathExpression(payload);
  const html = renderMathSnippet(normalized);

  assert.ok(html.includes("katex"));
  assert.ok(html.includes("sqrt"));
});

test("KaTeX Normalizer Payload Ekstrem: Translasi kurva dan fungsi invers", () => {
  const payload = "Jika $f(x) = \\frac{2x + 3}{x - 5}$, maka fungsi inversnya $f^{-1}(x) = \\frac{5x + 3}{x - 2}$. Bayangan oleh translasi $T = \\begin{pmatrix} -2 \\\\ 3 \\end{pmatrix}$ adalah $y - 3 = f^{-1}(x + 2)$.";
  const normalized = normalizeMathExpression(payload);
  const html = renderMathSnippet(normalized);

  assert.ok(html.includes("f^{-1}"));
  assert.ok(html.includes("katex"));
  assert.ok(!html.includes("NaN"));
});

test("KaTeX Normalizer: Operator relasi dan simbol logika", () => {
  const payload = "Pernyataan bernilai benar jika $x \\le 5 \\iff x < 5 \\lor x = 5$ dan $p \\implies q \\to r$.";
  const normalized = normalizeMathExpression(payload);
  const html = renderMathSnippet(normalized);

  assert.ok(html.includes("katex"));
  assert.ok(html.includes("katex-html"));
  assert.ok(!html.includes("$"));
});

test("KaTeX Normalizer: Double-escaped backslashes dari JSON response AI", () => {
  const aiJsonSnippet = "Hasil: \\\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\\\end{pmatrix} dengan \\\\le dan \\\\ge dan \\\\frac{1}{2}";
  const normalized = normalizeMathExpression(aiJsonSnippet);

  assert.ok(normalized.includes("\\begin{pmatrix}"));
  assert.ok(normalized.includes("\\end{pmatrix}"));
  assert.ok(normalized.includes("\\le"));
  assert.ok(normalized.includes("\\ge"));
  assert.ok(normalized.includes("\\frac{1}{2}"));
});

test("KaTeX Normalizer: Single variable math ($c$, $x$, $y$, $a$) terlindungi dari escape currency", () => {
  const payload = "Konstanta $c$ bernilai positif, variabel $x$ dan $y$ adalah koordinat, serta parameter $a$ menentukan lebar parabola.";
  const normalized = normalizeMathExpression(payload);

  assert.ok(normalized.includes("$c$"));
  assert.ok(normalized.includes("$x$"));
  assert.ok(normalized.includes("$y$"));
  assert.ok(normalized.includes("$a$"));
  assert.ok(!normalized.includes("\\$c"));
  assert.ok(!normalized.includes("\\$x"));
});
