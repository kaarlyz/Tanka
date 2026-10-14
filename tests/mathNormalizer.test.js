const test = require("node:test");
const assert = require("node:assert/strict");

let normalizeMathExpression;

test.before(async () => {
  const mod = await import("../src/utils/mathNormalizer.ts");
  normalizeMathExpression = mod.normalizeMathExpression;
});

test("Math Normalizer: menangani input kosong atau invalid", () => {
  assert.equal(normalizeMathExpression(""), "");
  assert.equal(normalizeMathExpression(null), "");
  assert.equal(normalizeMathExpression(undefined), "");
  assert.equal(normalizeMathExpression("Teks biasa tanpa matematika"), "Teks biasa tanpa matematika");
});

test("Math Normalizer: mengubah delimiter \\( dan \\) menjadi inline $", () => {
  const input = "Rumus energi kinetik adalah \\(E_k = \\frac{1}{2}mv^2\\) dalam fisika.";
  const expected = "Rumus energi kinetik adalah $E_k = \\frac{1}{2}mv^2$ dalam fisika.";
  assert.equal(normalizeMathExpression(input), expected);

  const multiple = "\\(a\\) ditambah \\(b\\) sama dengan \\(c\\)";
  assert.equal(normalizeMathExpression(multiple), "$a$ ditambah $b$ sama dengan $c$");
});

test("Math Normalizer: mengubah delimiter \\[ dan \\] menjadi block $$", () => {
  const input = "Rumus kuadratik:\n\\[ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\]";
  const expected = "Rumus kuadratik:\n$$\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$";
  assert.equal(normalizeMathExpression(input), expected);

  const multiline = "\\[\ny = mx + c\n\\]";
  assert.equal(normalizeMathExpression(multiline), "$$\ny = mx + c\n$$");
});

test("Math Normalizer: mendeteksi dan membungkus lingkungan \\begin{aligned} yang tidak dibungkus $$", () => {
  const input = "Sistem persamaan:\n\\begin{aligned}\n2x + y &= 5 \\\\\nx - y &= 1\n\\end{aligned}";
  const expected = "Sistem persamaan:\n$$\n\\begin{aligned}\n2x + y &= 5 \\\\\nx - y &= 1\n\\end{aligned}\n$$";
  assert.equal(normalizeMathExpression(input), expected);

  // Jangan membungkus ulang jika sudah berada dalam $$
  const alreadyWrapped = "$$\n\\begin{aligned}\nx &= 1\n\\end{aligned}\n$$";
  assert.equal(normalizeMathExpression(alreadyWrapped), alreadyWrapped);
});

test("Math Normalizer: membungkus varian lingkungan cases, matrix, pmatrix, bmatrix", () => {
  const casesInput = "\\begin{cases}\nx, & x > 0 \\\\\n-x, & x \\le 0\n\\end{cases}";
  const expectedCases = "$$\n\\begin{cases}\nx, & x > 0 \\\\\n-x, & x \\le 0\n\\end{cases}\n$$";
  assert.equal(normalizeMathExpression(casesInput), expectedCases);

  const matrixInput = "\\begin{pmatrix}\n1 & 0 \\\\\n0 & 1\n\\end{pmatrix}";
  const expectedMatrix = "$$\n\\begin{pmatrix}\n1 & 0 \\\\\n0 & 1\n\\end{pmatrix}\n$$";
  assert.equal(normalizeMathExpression(matrixInput), expectedMatrix);
});

test("Math Normalizer: proteksi pipa tabel | di dalam $...$ dan $$...$$ agar GFM tidak pecah", () => {
  const tableInput = `| Konsep | Rumus | Keterangan |
| --- | --- | --- |
| Nilai Mutlak | $|x| = x$ jika $x \\ge 0$ | Definisi |
| Determinan | $$ |A| = ad - bc $$ | Ordo 2x2 |`;

  const output = normalizeMathExpression(tableInput);

  // Pipa di dalam $...$ dan $$...$$ harus berubah menjadi \\vert
  assert.ok(output.includes("$\\vert x\\vert  = x$"));
  assert.ok(output.includes("$$ \\vert A\\vert  = ad - bc $$"));

  // Pipa pemisah kolom tabel markdown di luar math harus tetap utuh
  assert.ok(output.includes("| Konsep | Rumus | Keterangan |"));
  assert.ok(output.includes("| --- | --- | --- |"));
});

test("Math Normalizer: normalisasi baris baru di dalam inline math $...$", () => {
  const input = "Fungsi kuadrat $f(x) =\n2x^2 + 4x\n- 5$ memiliki titik puncak.";
  const expected = "Fungsi kuadrat $f(x) = 2x^2 + 4x - 5$ memiliki titik puncak.";
  assert.equal(normalizeMathExpression(input), expected);

  // Baris baru di dalam block math $$...$$ harus tetap dipertahankan
  const blockInput = "$$\n\\begin{aligned}\nx &= 1 \\\\\ny &= 2\n\\end{aligned}\n$$";
  assert.equal(normalizeMathExpression(blockInput), blockInput);
});
