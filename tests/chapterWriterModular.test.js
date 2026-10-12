const test = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { runMigrations } = require("../server/db");
const {
  autoRepairOutlineCoverage,
  syncChapterPlansToDb,
  generateModularCurriculumModule,
  generateChapterModular,
  validateCurriculumCoverage
} = require("../server/services/curriculumPipeline");

function createTestDatabase() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE document_segments (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      segment_index INTEGER NOT NULL,
      source_type TEXT NOT NULL,
      raw_text TEXT NOT NULL,
      normalized_text TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE document_concepts (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      name TEXT NOT NULL,
      definition TEXT NOT NULL,
      prerequisites TEXT,
      origin TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
  runMigrations(db);
  return db;
}

test("Auto-Repair Coverage: menyelamatkan konsep wajib yang tercecer (Audit Case: Hambatan Ideologis & Adat Istiadat)", () => {
  const outline = {
    title: "Perubahan Sosial",
    executiveSummary: "Dinamika perubahan masyarakat.",
    concepts: [
      { id: "c1", name: "Pendidikan Maju", is_required: true },
      { id: "c2", name: "Toleransi", is_required: true },
      { id: "c3", name: "Sikap Tradisional", is_required: true },
      { id: "c4", name: "Hambatan Ideologis", is_required: true },
      { id: "c5", name: "Adat Istiadat", is_required: true }
    ],
    chapters: [
      {
        chapterNumber: 1,
        chapterTitle: "Faktor Pendorong",
        keyConceptIds: ["c1", "c2"]
      },
      {
        chapterNumber: 2,
        chapterTitle: "Faktor Penghambat Awal",
        keyConceptIds: ["c3"]
      }
    ]
  };

  // Sebelum auto-repair, c4 dan c5 hilang (NEEDS_REVISION)
  const initialValidation = validateCurriculumCoverage(outline.concepts, outline.chapters);
  assert.equal(initialValidation.isValid, false);
  assert.equal(initialValidation.status, "NEEDS_REVISION");
  assert.deepEqual(initialValidation.unmappedRequiredConceptIds.sort(), ["c4", "c5"]);

  // Jalankan auto-repair
  const repaired = autoRepairOutlineCoverage(outline);

  // Setelah auto-repair, bab penyelamat ditambahkan dan coverage 100% PASS
  const afterValidation = validateCurriculumCoverage(repaired.concepts, repaired.chapters);
  assert.equal(afterValidation.isValid, true);
  assert.equal(afterValidation.status, "PASS");
  assert.equal(afterValidation.unmappedRequiredConceptIds.length, 0);

  // Verifikasi bab tambahan memuat c4 dan c5
  const addedChapter = repaired.chapters.find((ch) => ch.keyConceptIds.includes("c4") && ch.keyConceptIds.includes("c5"));
  assert.ok(addedChapter, "Bab penyelamat wajib memuat konsep c4 dan c5");
});

test("Auto-Repair Coverage: membersihkan ID konsep fiktif dari chapter plans", () => {
  const outline = {
    title: "Biologi Sel",
    concepts: [
      { id: "c1", name: "Mitokondria", is_required: true }
    ],
    chapters: [
      {
        chapterNumber: 1,
        chapterTitle: "Organel",
        keyConceptIds: ["c1", "fake_concept_99"]
      }
    ]
  };

  const repaired = autoRepairOutlineCoverage(outline);
  assert.deepEqual(repaired.chapters[0].keyConceptIds, ["c1"]);
});

test("Auto-Repair Coverage: memecah bab overload (lebih dari 4 konsep) menjadi sub-bab berimbang", () => {
  const concepts = [
    { id: "c1", name: "Konsep 1", is_required: 1 },
    { id: "c2", name: "Konsep 2", is_required: 1 },
    { id: "c3", name: "Konsep 3", is_required: 1 },
    { id: "c4", name: "Konsep 4", is_required: 1 },
    { id: "c5", name: "Konsep 5", is_required: 1 },
    { id: "c6", name: "Konsep 6", is_required: 1 },
    { id: "c7", name: "Konsep 7", is_required: 1 },
    { id: "c8", name: "Konsep 8", is_required: 1 }
  ];

  const outline = {
    title: "Materi Overload",
    concepts,
    chapters: [
      {
        chapterNumber: 1,
        chapterTitle: "Bab Raksasa Monolitik",
        pertanyaanPemantik: "Mengapa semua ditumpuk?",
        targetGoal: "Pahami 8 konsep sekaligus",
        keyConceptIds: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"]
      }
    ]
  };

  const repaired = autoRepairOutlineCoverage(outline);
  assert.equal(repaired.chapters.length, 2, "Harus dipecah menjadi 2 bab berimbang");
  assert.equal(repaired.chapters[0].keyConceptIds.length, 4);
  assert.equal(repaired.chapters[1].keyConceptIds.length, 4);
  assert.equal(repaired.chapters[0].chapterNumber, 1);
  assert.equal(repaired.chapters[1].chapterNumber, 2);

  const val = validateCurriculumCoverage(repaired.concepts, repaired.chapters);
  assert.equal(val.isValid, true);
});

test("Sync Chapter Plans: menyimpan rencana bab ke SQLite dengan status 'planned'", () => {
  const db = createTestDatabase();
  const docId = "doc_test_101";

  db.prepare(`
    INSERT INTO documents (id, title, content, summary, created_at)
    VALUES (?, 'Topik Uji', 'Konten', 'Ringkasan', 1000)
  `).run(docId);

  const chapters = [
    {
      chapterNumber: 1,
      chapterTitle: "Bab 1: Fondasi",
      pertanyaanPemantik: "Mengapa penting?",
      targetGoal: "Memahami dasar",
      keyConceptIds: ["c1", "c2"]
    },
    {
      chapterNumber: 2,
      chapterTitle: "Bab 2: Mekanisme",
      pertanyaanPemantik: "Bagaimana caranya?",
      targetGoal: "Menganalisis",
      keyConceptIds: ["c3"]
    }
  ];

  syncChapterPlansToDb(db, docId, chapters);

  const rows = db.prepare("SELECT * FROM chapter_plans WHERE doc_id = ? ORDER BY chapter_number ASC").all(docId);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].status, "planned");
  assert.equal(rows[0].chapter_number, 1);
  assert.equal(rows[0].title, "Bab 1: Fondasi");
  assert.deepEqual(JSON.parse(rows[0].key_concept_ids), ["c1", "c2"]);
  assert.equal(rows[1].chapter_number, 2);
  assert.equal(rows[1].status, "planned");
});

test("Modular Curriculum Generator: merakit seluruh bab terurut dan mengupdate status 'completed' di DB", async () => {
  const db = createTestDatabase();
  const docId = "doc_mod_202";

  db.prepare(`
    INSERT INTO documents (id, title, content, summary, created_at)
    VALUES (?, 'Sosiologi Modern', 'Teks dasar...', 'Ringkasan tesis...', 1000)
  `).run(docId);

  const outline = {
    title: "Sosiologi Modern",
    executiveSummary: "Memahami dinamika perubahan sosial kontemporer.",
    concepts: [
      { id: "c1", name: "Difusi Digital", is_required: true },
      { id: "c2", name: "Kesenjangan Akses", is_required: true }
    ],
    chapters: [
      {
        chapterNumber: 1,
        chapterTitle: "Arus Informasi Baru",
        pertanyaanPemantik: "Bagaimana gadget mengubah pola belajar?",
        targetGoal: "Memahami penyebaran teknologi",
        keyConceptIds: ["c1"]
      },
      {
        chapterNumber: 2,
        chapterTitle: "Tantangan Kesenjangan",
        pertanyaanPemantik: "Apakah semua orang merasakan dampak yang sama?",
        targetGoal: "Mengidentifikasi faktor penghambat",
        keyConceptIds: ["c2"]
      }
    ]
  };

  const segments = [
    { index: 1, sourceType: "pdf_page", text: "Teknologi digital menyebar cepat namun menyisakan disparitas infrastruktur." }
  ];

  // Jalankan generator modular
  // Menggunakan model atau fallback lokal jika router offline
  const resultMarkdown = await generateModularCurriculumModule(
    outline,
    segments[0].text,
    segments,
    "ag/gemini-3.8-flash-low",
    "SMA",
    db,
    docId
  );

  // Verifikasi struktur markdown akhir
  assert.ok(resultMarkdown.includes("# Sosiologi Modern"));
  assert.ok(resultMarkdown.includes("## Bab 1:"));
  assert.ok(resultMarkdown.includes("## Bab 2:"));
  assert.ok(resultMarkdown.includes("---"));

  // Verifikasi status di SQLite ter-update menjadi 'completed' untuk kedua bab
  const rows = db.prepare("SELECT * FROM chapter_plans WHERE doc_id = ? ORDER BY chapter_number ASC").all(docId);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].status, "completed");
  assert.equal(rows[1].status, "completed");
  assert.ok(rows[0].content.length > 0);
  assert.ok(rows[1].content.length > 0);
});
