const test = require("node:test");
const assert = require("node:assert/strict");
const {
  safeJsonParse,
  preprocessLatexJson,
  healControlCharsToLatex,
  repairTruncatedJsonArray
} = require("../server/utils/jsonParser");

test("jsonParser: preprocessLatexJson protects LaTeX commands from becoming JSON control chars", () => {
  // Unescaped \frac in JSON string would normally parse \f as formfeed (\u000c)
  const rawWithLatex = '{"formula": "\\frac{2}{3}", "note": "\\beta dan \\times dan \\right"}';
  const preprocessed = preprocessLatexJson(rawWithLatex);
  
  // Backslashes should be doubled before JSON.parse
  const parsed = JSON.parse(preprocessed);
  assert.equal(parsed.formula, "\\frac{2}{3}");
  assert.equal(parsed.note, "\\beta dan \\times dan \\right");
  // Ensure no control characters
  assert.ok(!parsed.formula.includes("\u000c"));
  assert.ok(!parsed.note.includes("\u0008"));
});

test("jsonParser: preprocessLatexJson does not double-escape already escaped backslashes", () => {
  const alreadyEscaped = '{"formula": "\\\\frac{1}{2}"}';
  const preprocessed = preprocessLatexJson(alreadyEscaped);
  assert.equal(preprocessed, alreadyEscaped);
  const parsed = JSON.parse(preprocessed);
  assert.equal(parsed.formula, "\\frac{1}{2}");
});

test("jsonParser: healControlCharsToLatex restores formfeed and backspace to LaTeX commands", () => {
  // Simulated DB corruption: $27^{\u000crac{2}{3}}$
  const corrupted = "$27^{\u000crac{2}{3}}$ dan \\u0008egin";
  const healed = healControlCharsToLatex(corrupted);
  assert.equal(healed, "$27^{\\frac{2}{3}}$ dan \\u0008egin".replace(/\u000c/g, "\\f"));
  
  const backspaceCorrupted = "\u0008egin{aligned} ... \u0008eta";
  const healedBack = healControlCharsToLatex(backspaceCorrupted);
  assert.equal(healedBack, "\\begin{aligned} ... \\beta");
});

test("jsonParser: repairTruncatedJsonArray recovers completed items from truncated array", () => {
  const truncated = `[
    {
      "id": 1,
      "question": "Berapakah nilai 2^3?",
      "options": ["6", "8", "9", "4"],
      "correctIndex": 1
    },
    {
      "id": 2,
      "question": "Berapakah nilai 3^2?",
      "options": ["6", "8", "9", "4"],
      "correctIndex": 2
    },
    {
      "id": 3,
      "question": "Soal terpotong di tengah jalan...`;

  const repaired = repairTruncatedJsonArray(truncated);
  assert.ok(repaired !== null);
  const parsed = JSON.parse(repaired);
  assert.equal(Array.isArray(parsed), true);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].id, 1);
  assert.equal(parsed[1].id, 2);
});

test("jsonParser: safeJsonParse handles truncated array and LaTeX control chars end-to-end", () => {
  const truncatedWithLatex = `[
    {
      "id": 1,
      "question": "Sederhanakan \\frac{a^2}{a}",
      "options": ["a", "1", "a^2", "0"],
      "correctIndex": 0
    },
    {
      "id": 2,
      "question": "Terpotong`;

  const parsed = safeJsonParse(truncatedWithLatex);
  assert.ok(Array.isArray(parsed));
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, 1);
  assert.equal(parsed[0].question, "Sederhanakan \\frac{a^2}{a}");
  assert.ok(!parsed[0].question.includes("\u000c"));
});
