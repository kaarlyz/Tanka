const test = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { runMigrations, cleanOrphanedRecords } = require("../server/db");
const { validateDocumentCoverageFromDb } = require("../server/services/coverageValidator");

function createLegacyDatabase() {
  const memDb = new DatabaseSync(":memory:");
  // Skema legacy Tanka persis sebelum Langkah 1 (tanpa chapter_plans, tanpa concept_edges, dan document_concepts versi lama)
  memDb.exec(`
    CREATE TABLE documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE flashcards (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      difficulty TEXT DEFAULT 'new',
      review_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE chat_messages (
      id TEXT PRIMARY KEY,
      doc_id TEXT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT,
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
  return memDb;
}

test("DB Migration: migrasi menambahkan kolom baru pada document_concepts dengan aman", () => {
  const db = createLegacyDatabase();

  // Masukkan data sebelum migrasi
  db.prepare(`
    INSERT INTO documents (id, title, content, summary, created_at)
    VALUES ('doc_1', 'Sosiologi Perubahan', 'Konten awal...', 'Ringkasan', 1000)
  `).run();

  db.prepare(`
    INSERT INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, created_at)
    VALUES ('doc_1_c1', 'doc_1', 'Difusi', 'Penyebaran budaya', '{}', 'source', 1000)
  `).run();

  // Jalankan migrasi
  runMigrations(db);

  // Verifikasi kolom baru terpasang
  const columns = db.prepare("PRAGMA table_info(document_concepts)").all().map(c => c.name);
  assert.ok(columns.includes("category"));
  assert.ok(columns.includes("is_required"));
  assert.ok(columns.includes("evidence_quote"));
  assert.ok(columns.includes("segment_id"));
  assert.ok(columns.includes("updated_at"));

  // Verifikasi data lama tetap utuh dan mendapatkan default values
  const row = db.prepare("SELECT * FROM document_concepts WHERE id = 'doc_1_c1'").get();
  assert.equal(row.name, "Difusi");
  assert.equal(row.category, "core");
  assert.equal(row.is_required, 1);
  assert.equal(row.evidence_quote, "");
  assert.equal(row.segment_id, "");
  assert.equal(row.updated_at, 0);
});

test("DB Migration: migrasi menambahkan quiz_type pada quizzes dengan aman", () => {
  const db = createLegacyDatabase();
  db.exec(`
    CREATE TABLE quizzes (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      questions TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    INSERT INTO quizzes (id, doc_id, questions, created_at)
    VALUES ('q_legacy', 'doc_1', '[]', 1000);
  `);

  runMigrations(db);

  const columns = db.prepare("PRAGMA table_info(quizzes)").all().map(c => c.name);
  assert.ok(columns.includes("quiz_type"));

  const row = db.prepare("SELECT * FROM quizzes WHERE id = 'q_legacy'").get();
  assert.equal(row.quiz_type, "conceptual");
});

test("DB Migration: tabel chapter_plans dan concept_edges terbuat dengan indeks dan constraint", () => {
  const db = createLegacyDatabase();
  runMigrations(db);

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  assert.ok(tables.includes("chapter_plans"));
  assert.ok(tables.includes("concept_edges"));

  // Verifikasi kolom chapter_plans
  const cpCols = db.prepare("PRAGMA table_info(chapter_plans)").all().map(c => c.name);
  assert.ok(cpCols.includes("id"));
  assert.ok(cpCols.includes("doc_id"));
  assert.ok(cpCols.includes("chapter_number"));
  assert.ok(cpCols.includes("title"));
  assert.ok(cpCols.includes("trigger_question"));
  assert.ok(cpCols.includes("target_goal"));
  assert.ok(cpCols.includes("key_concept_ids"));
  assert.ok(cpCols.includes("content"));
  assert.ok(cpCols.includes("status"));
  assert.ok(cpCols.includes("created_at"));
  assert.ok(cpCols.includes("updated_at"));

  // Verifikasi kolom concept_edges
  const edgeCols = db.prepare("PRAGMA table_info(concept_edges)").all().map(c => c.name);
  assert.ok(edgeCols.includes("id"));
  assert.ok(edgeCols.includes("doc_id"));
  assert.ok(edgeCols.includes("source_id"));
  assert.ok(edgeCols.includes("target_id"));
  assert.ok(edgeCols.includes("relation_label"));
  assert.ok(edgeCols.includes("relation_type"));
  assert.ok(edgeCols.includes("evidence_quote"));
  assert.ok(edgeCols.includes("created_at"));

  // Verifikasi constraint UNIQUE(doc_id, chapter_number)
  db.prepare(`
    INSERT INTO chapter_plans (id, doc_id, chapter_number, title, key_concept_ids, created_at, updated_at)
    VALUES ('cp_1', 'doc_test', 1, 'Bab 1', '["c1"]', 1000, 1000)
  `).run();

  // Insert duplikat bab 1 untuk dokumen yang sama harus melempar UNIQUE constraint error
  assert.throws(() => {
    db.prepare(`
      INSERT INTO chapter_plans (id, doc_id, chapter_number, title, key_concept_ids, created_at, updated_at)
      VALUES ('cp_dup', 'doc_test', 1, 'Bab 1 Duplikat', '["c1"]', 1001, 1001)
    `).run();
  }, /UNIQUE constraint failed/);

  // Tapi bab 1 untuk dokumen BERBEDA harus diizinkan
  assert.doesNotThrow(() => {
    db.prepare(`
      INSERT INTO chapter_plans (id, doc_id, chapter_number, title, key_concept_ids, created_at, updated_at)
      VALUES ('cp_other_doc', 'doc_other', 1, 'Bab 1 Dokumen Lain', '["c1"]', 1000, 1000)
    `).run();
  });
});

test("DB Migration: idempotensi migrasi (dijalankan berulang kali tanpa error)", () => {
  const db = createLegacyDatabase();

  // Jalankan migrasi 3 kali berturut-turut
  assert.doesNotThrow(() => {
    runMigrations(db);
    runMigrations(db);
    runMigrations(db);
  });

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  assert.ok(tables.includes("chapter_plans"));
  assert.ok(tables.includes("concept_edges"));
});

test("DB Coverage Validation: dokumen lama yang belum memiliki chapter plans", () => {
  const db = createLegacyDatabase();
  runMigrations(db);

  db.prepare(`
    INSERT INTO documents (id, title, content, summary, created_at)
    VALUES ('legacy_doc', 'Materi Legacy', 'Isi lama...', 'Ringkasan', 1000)
  `).run();

  db.prepare(`
    INSERT INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, is_required, created_at)
    VALUES 
      ('legacy_doc_c1', 'legacy_doc', 'Konsep 1', 'Def 1', '{}', 'source', 1, 1000),
      ('legacy_doc_c2', 'legacy_doc', 'Konsep 2', 'Def 2', '{}', 'source', 1, 1000)
  `).run();

  // Validasi dokumen lama langsung dari DB
  const result = validateDocumentCoverageFromDb(db, "legacy_doc");

  assert.equal(result.isValid, false);
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.summary.totalChapters, 0);
  assert.equal(result.summary.unmappedRequiredCount, 2);
  assert.deepEqual(result.unmappedRequiredConceptIds.sort(), ["legacy_doc_c1", "legacy_doc_c2"]);
  assert.ok(result.issues.some(i => i.code === "EMPTY_CHAPTERS"));
});

test("DB Coverage Validation: dokumen dengan chapter plans lengkap lolos validasi DB", () => {
  const db = createLegacyDatabase();
  runMigrations(db);

  db.prepare(`
    INSERT INTO documents (id, title, content, summary, created_at)
    VALUES ('modern_doc', 'Materi Baru Terstruktur', 'Isi bab...', 'Ringkasan', 1000)
  `).run();

  db.prepare(`
    INSERT INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, is_required, created_at)
    VALUES 
      ('modern_doc_c1', 'modern_doc', 'Difusi', 'Penyebaran', '{}', 'source', 1, 1000),
      ('modern_doc_c2', 'modern_doc', 'Inovasi', 'Penemuan baru', '{}', 'source', 1, 1000)
  `).run();

  db.prepare(`
    INSERT INTO chapter_plans (id, doc_id, chapter_number, title, key_concept_ids, created_at, updated_at)
    VALUES 
      ('cp_1', 'modern_doc', 1, 'Bab 1 Difusi', '["c1"]', 1000, 1000),
      ('cp_2', 'modern_doc', 2, 'Bab 2 Inovasi', '["c2"]', 1000, 1000)
  `).run();

  const result = validateDocumentCoverageFromDb(db, "modern_doc");

  assert.equal(result.isValid, true);
  assert.equal(result.status, "PASS");
  assert.equal(result.summary.totalChapters, 2);
  assert.equal(result.summary.mappedRequiredCount, 2);
  assert.equal(result.summary.unmappedRequiredCount, 0);
});

test("DB Coverage Validation: dokumen tanpa konsep di DB", () => {
  const db = createLegacyDatabase();
  runMigrations(db);

  db.prepare(`
    INSERT INTO documents (id, title, content, summary, created_at)
    VALUES ('empty_doc', 'Materi Kosong', '...', '...', 1000)
  `).run();

  const result = validateDocumentCoverageFromDb(db, "empty_doc");

  assert.equal(result.isValid, false);
  assert.equal(result.status, "BLOCKED");
  assert.ok(result.issues.some(i => i.code === "EMPTY_CONCEPTS"));
});

test("DB Cleanup: cleanOrphanedRecords membersihkan data anak yatim termasuk learner_events", () => {
  const db = createLegacyDatabase();
  runMigrations(db);

  // Buat learner_events tabel jika belum ada
  db.exec(`
    CREATE TABLE IF NOT EXISTS learner_events (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Sisipkan event untuk doc yang tidak ada di tabel documents
  db.prepare("INSERT INTO learner_events (id, doc_id, activity_type, result, created_at) VALUES ('ev_orphan', 'ghost_doc', 'feynman', 'gap', 1000)").run();

  assert.ok(db.prepare("SELECT * FROM learner_events WHERE id = 'ev_orphan'").get());

  cleanOrphanedRecords(db);

  assert.equal(db.prepare("SELECT * FROM learner_events WHERE id = 'ev_orphan'").get(), undefined);
});
