const test = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { runMigrations } = require("../server/db");
const {
  buildOrInferConceptEdges,
  buildMindMapTreeFromCanonicalGraph,
  syncConceptEdgesToDb,
  getConceptGraphForDocument
} = require("../server/services/conceptGraphService");

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
      created_at INTEGER NOT NULL,
      category TEXT DEFAULT 'core',
      is_required INTEGER DEFAULT 1,
      evidence_quote TEXT DEFAULT '',
      segment_id TEXT DEFAULT '',
      updated_at INTEGER DEFAULT 0
    );
  `);
  runMigrations(db);
  return db;
}

test("Concept Graph: inferensi edges dari prasyarat dan bab tanpa self-loop", () => {
  const concepts = [
    { id: "c1", name: "Difusi", definition: "Penyebaran budaya" },
    { id: "c2", name: "Inovasi", definition: "Penemuan baru", prasyarat: ["c1"] },
    { id: "c3", name: "Perubahan Sosial", definition: "Dinamika struktur", prasyarat: ["c2"] }
  ];

  const chapters = [
    { chapterNumber: 1, chapterTitle: "Proses Awal", keyConceptIds: ["c1", "c2"] },
    { chapterNumber: 2, chapterTitle: "Dinamika", keyConceptIds: ["c3"] }
  ];

  const rawEdges = [
    { sourceId: "c1", targetId: "c3", relationLabel: "mendorong", relationType: "causal_positive" },
    { sourceId: "c1", targetId: "c1", relationLabel: "loop", relationType: "association" }, // self-loop (harus dibuang)
    { sourceId: "c1", targetId: "c99", relationLabel: "fake", relationType: "association" } // target fiktif (harus dibuang)
  ];

  const edges = buildOrInferConceptEdges(concepts, chapters, rawEdges);

  // Verifikasi self-loop dan node fiktif disaring
  assert.equal(edges.some(e => e.sourceId === e.targetId), false, "Self-loop wajib disaring");
  assert.equal(edges.some(e => e.targetId === "c99"), false, "Target fiktif wajib disaring");

  // Verifikasi edge eksplisit c1 -> c3 terpasang
  const explicitEdge = edges.find(e => e.sourceId === "c1" && e.targetId === "c3");
  assert.ok(explicitEdge);
  assert.equal(explicitEdge.relationLabel, "mendorong");
  assert.equal(explicitEdge.relationType, "causal_positive");

  // Verifikasi edge prasyarat c1 -> c2 dan c2 -> c3 terinferensi
  const prereq1 = edges.find(e => e.sourceId === "c1" && e.targetId === "c2");
  assert.ok(prereq1);
  assert.equal(prereq1.relationType, "prerequisite");
  assert.equal(prereq1.relationLabel, "prasyarat bagi");

  const prereq2 = edges.find(e => e.sourceId === "c2" && e.targetId === "c3");
  assert.ok(prereq2);
  assert.equal(prereq2.relationType, "prerequisite");
});

test("Concept Graph: membangun MindMapTree dari basis data kanonikal", () => {
  const docTitle = "Sosiologi Perubahan";
  const concepts = [
    { id: "c1", name: "Difusi", definition: "Penyebaran unsur budaya", evidence_quote: "penyebaran kebudayaan" },
    { id: "c2", name: "Inovasi", definition: "Pembaruan teknologi" }
  ];

  const chapters = [
    { chapter_number: 1, title: "Bab 1: Proses Perubahan", key_concept_ids: JSON.stringify(["c1", "c2"]), target_goal: "Memahami difusi" }
  ];

  const edges = [
    { sourceId: "c1", targetId: "c2", relationLabel: "mempercepat", relationType: "causal_positive" }
  ];

  const tree = buildMindMapTreeFromCanonicalGraph(docTitle, concepts, chapters, edges);

  assert.equal(tree.id, "root");
  assert.equal(tree.title, docTitle);
  assert.equal(tree.children.length, 1);

  const stage = tree.children[0];
  assert.equal(stage.id, "stage_1");
  assert.equal(stage.stageNumber, 1);
  assert.equal(stage.children.length, 2);

  const concept1Node = stage.children[0];
  assert.equal(concept1Node.id, "concept_c1");
  assert.equal(concept1Node.title, "Difusi");
  assert.equal(concept1Node.desc, "Penyebaran unsur budaya");

  // Konsep 1 memiliki sub-simpul edge ke Konsep 2 dan simpul bukti kutipan
  const edgeChild = concept1Node.children.find(c => c.title.includes("mempercepat: Inovasi"));
  assert.ok(edgeChild, "Harus memuat edge berlabel menghubungkan ke Inovasi");

  const evidenceChild = concept1Node.children.find(c => c.title.includes("penyebaran kebudayaan"));
  assert.ok(evidenceChild, "Harus memuat bukti kutipan sumber");
});

test("Concept Graph: integrasi database SQLite getConceptGraphForDocument", () => {
  const db = createTestDatabase();
  const docId = "doc_graph_test";

  // 1. Dokumen tidak ditemukan -> return null
  assert.equal(getConceptGraphForDocument(db, "non_existent"), null);

  // 2. Masukkan dokumen, konsep, dan rencana bab
  db.prepare(`
    INSERT INTO documents (id, title, content, summary, created_at)
    VALUES (?, 'Topik Graf', 'Isi', 'Ringkasan', 1000)
  `).run(docId);

  db.prepare(`
    INSERT INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, created_at, category, is_required, evidence_quote)
    VALUES 
      ('c1', ?, 'Pendidikan', 'Pengembangan nalar', '[]', 'source', 1000, 'core', 1, 'sekolah dan kurikulum'),
      ('c2', ?, 'Toleransi', 'Keterbukaan sosial', '["c1"]', 'source', 1000, 'core', 1, '')
  `).run(docId, docId);

  db.prepare(`
    INSERT INTO chapter_plans (id, doc_id, chapter_number, title, key_concept_ids, created_at, updated_at)
    VALUES ('cp_1', ?, 1, 'Bab 1: Faktor Pendorong', '["c1", "c2"]', 1000, 1000)
  `).run(docId);

  // 3. Ambil graf dokumen
  const graphResult = getConceptGraphForDocument(db, docId);

  assert.ok(graphResult);
  assert.equal(graphResult.success, true);
  assert.equal(graphResult.docId, docId);
  assert.equal(graphResult.nodeCount, 2);
  assert.ok(graphResult.edgeCount >= 1, "Edge harus terinferensi dan tersimpan otomatis ke DB");
  assert.equal(graphResult.chapterCount, 1);

  // Verifikasi tree MindMapTree valid dan memiliki 1 stage dengan 2 konsep
  assert.ok(graphResult.tree);
  assert.equal(graphResult.tree.children.length, 1);
  assert.equal(graphResult.tree.children[0].children.length, 2);

  // Verifikasi tabel concept_edges di SQLite terisi otomatis
  const savedEdges = db.prepare("SELECT * FROM concept_edges WHERE doc_id = ?").all(docId);
  assert.ok(savedEdges.length >= 1);
  assert.equal(savedEdges[0].source_id, "c1");
  assert.equal(savedEdges[0].target_id, "c2");
});
