const test = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const {
  sanitizeFormulaLatex,
  chunkDocumentForFormulas
} = require("../server/services/formulaExtractor");

test("Formula Extractor: sanitasi LaTeX dan pembungkusan tanda dollar", () => {
  // Case A: formula tanpa dollar
  assert.equal(sanitizeFormulaLatex("E = mc^2"), "$$E = mc^2$$");

  // Case B: dollar tidak seimbang
  assert.equal(sanitizeFormulaLatex("$x = 5"), "$x = 5$");

  // Case C: pembersihan kurung kurawal kosong
  assert.equal(sanitizeFormulaLatex("$$a^{} + b$$"), "$$a^ + b$$");
});

test("Formula Extractor: chunking dokumen berdasarkan chapter_plans", () => {
  const memDb = new DatabaseSync(":memory:");
  memDb.exec(`
    CREATE TABLE chapter_plans (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      chapter_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL
    );
  `);

  memDb.prepare(`
    INSERT INTO chapter_plans (id, doc_id, chapter_number, title, content)
    VALUES 
      ('cp_1', 'doc_math', 1, 'Aljabar', 'Rumus diskriminan $$D = b^2 - 4ac$$'),
      ('cp_2', 'doc_math', 2, 'Kalkulus', 'Turunan $$f(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$')
  `).run();

  const doc = { id: "doc_math", content: "Isi dokumen monolitik" };
  const chunks = chunkDocumentForFormulas(doc, memDb);

  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].label, "Bab 1: Aljabar");
  assert.ok(chunks[0].text.includes("diskriminan"));
  assert.equal(chunks[1].label, "Bab 2: Kalkulus");
  assert.ok(chunks[1].text.includes("Turunan"));
});

test("Formula Extractor: chunking dokumen panjang berdasarkan heading markdown", () => {
  const content = `
## Bab 1: Kinematika
Kecepatan $$v = \\frac{s}{t}$$ dan percepatan $$a = \\frac{v}{t}$$.

## Bab 2: Dinamika
Hukum Newton $$F = ma$$ dan gaya gesek $$f = \\mu N$$.

## Bab 3: Gravitasi
Gaya tarik $$F = G \\frac{m_1 m_2}{r^2}$$.
  `.trim();

  const doc = { id: "doc_physics", content };
  const chunks = chunkDocumentForFormulas(doc, null);

  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].label, "Bab 1: Kinematika");
  assert.equal(chunks[1].label, "Bab 2: Dinamika");
  assert.equal(chunks[2].label, "Bab 3: Gravitasi");
});
