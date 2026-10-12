const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isConceptRequired,
  parseConceptIds,
  validateCurriculumCoverage
} = require("../server/services/coverageValidator");

test("Coverage Validator: semua konsep wajib terpetakan sempurna (PASS)", () => {
  const concepts = [
    { id: "c1", name: "Difusi Kebudayaan", origin: "source", is_required: 1 },
    { id: "c2", name: "Pendidikan Maju", origin: "source", is_required: true },
    { id: "c3", name: "Sikap Tradisional", origin: "source", category: "core" }
  ];

  const chapters = [
    { chapterNumber: 1, chapterTitle: "Fondasi & Proses", keyConceptIds: ["c1", "c2"] },
    { chapterNumber: 2, chapterTitle: "Faktor Penghambat", keyConceptIds: ["c3"] }
  ];

  const result = validateCurriculumCoverage(concepts, chapters);

  assert.equal(result.isValid, true);
  assert.equal(result.status, "PASS");
  assert.equal(result.summary.totalConcepts, 3);
  assert.equal(result.summary.requiredConceptsCount, 3);
  assert.equal(result.summary.mappedRequiredCount, 3);
  assert.equal(result.summary.unmappedRequiredCount, 0);
  assert.equal(result.unmappedRequiredConceptIds.length, 0);
  assert.equal(result.invalidConceptReferences.length, 0);
  assert.equal(result.duplicateMappings.length, 0);
  assert.equal(result.coverageMatrix.length, 3);
  assert.equal(result.coverageMatrix.every(c => c.isCovered), true);
  assert.ok(result.semanticDisclaimer.length > 0);
});

test("Coverage Validator: satu atau lebih konsep wajib tidak terpetakan (NEEDS_REVISION)", () => {
  const concepts = [
    { id: "c1", name: "Hambatan Ideologis", is_required: true },
    { id: "c2", name: "Adat Istiadat", is_required: true },
    { id: "c3", name: "Isolasi Geografis", is_required: true }
  ];

  // Hanya c3 yang masuk ke bab
  const chapters = [
    { chapterNumber: 1, chapterTitle: "Hambatan Fisik", keyConceptIds: ["c3"] }
  ];

  const result = validateCurriculumCoverage(concepts, chapters);

  assert.equal(result.isValid, false);
  assert.equal(result.status, "NEEDS_REVISION");
  assert.equal(result.summary.mappedRequiredCount, 1);
  assert.equal(result.summary.unmappedRequiredCount, 2);
  assert.deepEqual(result.unmappedRequiredConceptIds.sort(), ["c1", "c2"]);
  
  const missingIssues = result.issues.filter(i => i.code === "MISSING_REQUIRED_CONCEPT");
  assert.equal(missingIssues.length, 2);
});

test("Coverage Validator: ID konsep tidak dikenal direferensikan oleh bab (INVALID_CONCEPT_REFERENCE)", () => {
  const concepts = [
    { id: "c1", name: "Akulturasi", is_required: true }
  ];

  const chapters = [
    { chapterNumber: 1, chapterTitle: "Proses Sosial", keyConceptIds: ["c1", "c99_unknown"] }
  ];

  const result = validateCurriculumCoverage(concepts, chapters);

  assert.equal(result.isValid, false);
  assert.equal(result.status, "NEEDS_REVISION");
  assert.equal(result.summary.invalidReferenceCount, 1);
  assert.equal(result.invalidConceptReferences[0].invalidId, "c99_unknown");
  assert.equal(result.invalidConceptReferences[0].chapterNumber, 1);
});

test("Coverage Validator: pemetaan duplikat dalam rencana bab (DUPLICATE_CONCEPT_MAPPING)", () => {
  const concepts = [
    { id: "c1", name: "Difusi", is_required: true },
    { id: "c2", name: "Inovasi", is_required: true }
  ];

  // c1 muncul di Bab 1 dan Bab 2
  const chapters = [
    { chapterNumber: 1, chapterTitle: "Pengenalan", keyConceptIds: ["c1"] },
    { chapterNumber: 2, chapterTitle: "Pendalaman", keyConceptIds: ["c1", "c2"] }
  ];

  // Kasus A: Default allowDuplicates = false -> critical failure
  const resultStrict = validateCurriculumCoverage(concepts, chapters, { allowDuplicates: false });
  assert.equal(resultStrict.isValid, false);
  assert.equal(resultStrict.status, "NEEDS_REVISION");
  assert.equal(resultStrict.duplicateMappings.length, 1);
  assert.equal(resultStrict.duplicateMappings[0].conceptId, "c1");
  assert.deepEqual(resultStrict.duplicateMappings[0].chapterNumbers, [1, 2]);

  // Kasus B: allowDuplicates = true -> warning only (isValid tetap true)
  const resultPermissive = validateCurriculumCoverage(concepts, chapters, { allowDuplicates: true });
  assert.equal(resultPermissive.isValid, true);
  assert.equal(resultPermissive.status, "PASS_WITH_WARNINGS");
  assert.equal(resultPermissive.duplicateMappings.length, 1);
});

test("Coverage Validator: dokumen tanpa konsep kanonikal (BLOCKED)", () => {
  const chapters = [
    { chapterNumber: 1, chapterTitle: "Bab Kosong", keyConceptIds: [] }
  ];

  const result = validateCurriculumCoverage([], chapters);

  assert.equal(result.isValid, false);
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.summary.totalConcepts, 0);
  assert.ok(result.issues.some(i => i.code === "EMPTY_CONCEPTS"));
});

test("Coverage Validator: rencana bab kosong (BLOCKED)", () => {
  const concepts = [
    { id: "c1", name: "Konsep A", is_required: true },
    { id: "c2", name: "Konsep B", is_required: true }
  ];

  const result = validateCurriculumCoverage(concepts, []);

  assert.equal(result.isValid, false);
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.summary.totalChapters, 0);
  assert.equal(result.summary.unmappedRequiredCount, 2);
  assert.ok(result.issues.some(i => i.code === "EMPTY_CHAPTERS"));
});

test("Coverage Validator: konsep opsional tidak memblokir coverage (PASS_WITH_WARNINGS)", () => {
  const concepts = [
    { id: "c1", name: "Konsep Inti Wajib", is_required: true, origin: "source" },
    { id: "c2", name: "Contoh QRIS", origin: "ai_enrichment", category: "enrichment" }
  ];

  // Hanya c1 yang dipetakan ke bab, c2 opsional tidak dipetakan
  const chapters = [
    { chapterNumber: 1, chapterTitle: "Bab Inti", keyConceptIds: ["c1"] }
  ];

  const result = validateCurriculumCoverage(concepts, chapters);

  assert.equal(result.isValid, true);
  assert.equal(result.summary.requiredConceptsCount, 1);
  assert.equal(result.summary.optionalConceptsCount, 1);
  assert.equal(result.summary.mappedRequiredCount, 1);
  assert.equal(result.summary.unmappedRequiredCount, 0);
  assert.equal(result.summary.unmappedOptionalCount, 1);
  assert.deepEqual(result.unmappedOptionalConceptIds, ["c2"]);
});

test("Coverage Validator: normalisasi ID dengan prefix docId dan string format JSON", () => {
  const docId = "doc_soc_101";
  const concepts = [
    { id: "doc_soc_101_c1", name: "Evolusi Sosial", is_required: 1 },
    { id: "doc_soc_101_c2", name: "Revolusi Sosial", is_required: 1 }
  ];

  // Chapters menggunakan ID pendek ('c1', 'c2') dan JSON string
  const chapters = [
    {
      chapter_number: 1,
      title: "Pola Perubahan",
      key_concept_ids: JSON.stringify(["c1", "c2"])
    }
  ];

  const result = validateCurriculumCoverage(concepts, chapters, { docId });

  assert.equal(result.isValid, true);
  assert.equal(result.status, "PASS");
  assert.equal(result.summary.mappedRequiredCount, 2);
  assert.equal(result.summary.unmappedRequiredCount, 0);
});
