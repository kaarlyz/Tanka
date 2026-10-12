const test = require("node:test");
const assert = require("node:assert/strict");
const { auditChapterQuality, auditDocumentQuality } = require("../server/services/qualityAuditor");

test("Quality Auditor: bab berkualitas tinggi memenuhi seluruh standar pedagogis (PASS)", () => {
  const chapterMarkdown = `
## Bab 1: Dinamika Perubahan Sosial

Bayangkan sebuah sekolah di pelosok yang mulai terkoneksi internet.

### Difusi Kebudayaan
Penjelasan tentang proses penyebaran kebudayaan ke masyarakat luas.
Mekanismenya terjadi melalui kontak langsung dan pertukaran informasi.

> ⚠️ Peringatan Salah Kaprah (Pitfall): Siswa sering menyamakan difusi dengan akulturasi total, padahal difusi hanya penyebaran unsur.

### Cek Pemahaman
Jelaskan mengapa penyebaran internet tidak otomatis mengubah adat istiadat setempat!
  `;

  const concepts = [
    { name: "Difusi Kebudayaan" }
  ];

  const result = auditChapterQuality(chapterMarkdown, concepts, { chapterNumber: 1, title: "Dinamika" });

  assert.equal(result.isValid, true);
  assert.equal(result.status, "PASS");
  assert.ok(result.score >= 90);
  assert.equal(result.dimensions.formatCompliance.status, "PASS");
  assert.equal(result.dimensions.conceptCoverage.status, "PASS");
  assert.equal(result.dimensions.conceptCoverage.missingCount, 0);
});

test("Quality Auditor: deteksi kebocoran soal pilihan ganda di dalam bacaan (MULTIPLE_CHOICE_LEAK)", () => {
  const chapterMarkdown = `
## Bab 2: Evaluasi Teori

Berikut materi tentang evolusi sosial.

Contoh Soal:
Manakah faktor utama difusi?
A. Isolasi geografis
B. Kontak antar budaya
C. Sikap tertutup
D. Homogenitas
E. Keadaan pasif

Kunci Jawaban: B
  `;

  const concepts = [{ name: "Evolusi Sosial" }];

  const result = auditChapterQuality(chapterMarkdown, concepts, { chapterNumber: 2 });

  assert.equal(result.isValid, false);
  assert.equal(result.status, "NEEDS_REVISION");
  assert.equal(result.dimensions.formatCompliance.status, "FAIL");
  assert.ok(result.issues.some(i => i.code === "MULTIPLE_CHOICE_LEAK"));
});

test("Quality Auditor: deteksi konsep kunci yang hilang dari teks bab (CONCEPT_NAME_MISSING)", () => {
  const chapterMarkdown = `
## Bab 3: Faktor Penghambat

Bab ini hanya membahas keterisolasian daerah dan minimnya fasilitas transportasi.
  `;

  const concepts = [
    { name: "Hambatan Ideologis" },
    { name: "Adat Istiadat" }
  ];

  const result = auditChapterQuality(chapterMarkdown, concepts, { chapterNumber: 3 });

  assert.equal(result.isValid, false);
  assert.equal(result.status, "NEEDS_REVISION");
  assert.equal(result.dimensions.conceptCoverage.missingCount, 2);
  assert.deepEqual(result.dimensions.conceptCoverage.missing.sort(), ["Adat Istiadat", "Hambatan Ideologis"]);
});

test("Quality Auditor: bab kosong ditandai BLOCKED", () => {
  const result = auditChapterQuality("", [{ name: "Konsep A" }]);
  assert.equal(result.isValid, false);
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.score, 0);
});

test("Quality Auditor: audit dokumen global memeriksa keutuhan heading bab", () => {
  const docMarkdown = `
# Sosiologi Lengkap

> Ringkasan tesis

---

## Bab 1: Pengenalan
Isi bab 1...

---

## Bab 2: Faktor
Isi bab 2...
  `;

  const chapters = [{ chapterNumber: 1 }, { chapterNumber: 2 }, { chapterNumber: 3 }];
  const result = auditDocumentQuality(docMarkdown, [], chapters);

  // Kurang 1 bab (ditemukan 2, diharapkan 3)
  assert.equal(result.chapterHeadingsFound, 2);
  assert.equal(result.expectedChapters, 3);
  assert.ok(result.issues.some(i => i.code === "INCOMPLETE_CHAPTER_COUNT"));
});
