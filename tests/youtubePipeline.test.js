const test = require("node:test");
const assert = require("node:assert/strict");
const { db } = require("../server/db");
const { handleDocumentsRoutes } = require("../server/routes/documents");

function mockHelpers(body = {}) {
  let responseData = null;
  let responseStatus = 200;

  const res = {
    headersSent: false,
    writeHead: (status) => { responseStatus = status; },
    end: (content) => {
      try { responseData = JSON.parse(content); } catch { responseData = content; }
    }
  };

  const helpers = {
    sendJSON: (res, data, statusCode = 200) => {
      responseStatus = statusCode;
      responseData = data;
      return true;
    },
    getBody: async () => body
  };

  return { res, helpers, getResponse: () => ({ status: responseStatus, data: responseData }) };
}

test("YouTube Pipeline: URL kosong mengembalikan 400", async () => {
  const req = { method: "POST" };
  const { res, helpers, getResponse } = mockHelpers({ url: "" });

  await handleDocumentsRoutes(req, res, "/api/documents/youtube", helpers);
  const { status, data } = getResponse();

  assert.equal(status, 400);
  assert.ok(data.error.includes("wajib diisi"));
});

test("YouTube Pipeline: dokumen mencatat status dan skema konsep kanonikal", () => {
  const docId = `doc_test_yt_${Date.now()}`;
  const now = Date.now();

  db.prepare(`
    INSERT INTO documents (id, title, content, status, created_at)
    VALUES (?, 'Video Fisika', 'Isi Transkrip...', 'processing', ?)
  `).run(docId, now);

  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
  assert.equal(doc.status, "processing");

  // Simpan konsep dengan kolom lengkap
  db.prepare(`
    INSERT INTO document_concepts (
      id, doc_id, name, definition, prerequisites, origin, created_at, category, is_required, evidence_quote, segment_id, updated_at
    ) VALUES (?, ?, 'Hukum Newton I', 'Inersia benda', '[]', 'youtube', ?, 'core', 1, 'benda diam tetap diam', 'seg_1', ?)
  `).run(`c_${docId}_1`, docId, now, now);

  const concept = db.prepare("SELECT * FROM document_concepts WHERE doc_id = ?").get(docId);
  assert.equal(concept.name, "Hukum Newton I");
  assert.equal(concept.is_required, 1);
  assert.equal(concept.evidence_quote, "benda diam tetap diam");
  assert.equal(concept.category, "core");

  // Update status ke completed
  db.prepare("UPDATE documents SET status = 'completed' WHERE id = ?").run(docId);
  const updatedDoc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
  assert.equal(updatedDoc.status, "completed");
});

test("Documents: DELETE /api/documents/:id menghapus seluruh data anak termasuk learner_events", async () => {
  const docId = `doc_del_cascade_${Date.now()}`;
  db.prepare("INSERT INTO documents (id, title, content, created_at) VALUES (?, ?, ?, ?)").run(docId, "Doc Test", "Text", Date.now());
  db.prepare("INSERT INTO learner_events (id, doc_id, activity_type, result, created_at) VALUES (?, ?, ?, ?, ?)").run("ev_del_1", docId, "quiz", "mastered", Date.now());
  db.prepare("INSERT INTO chapter_plans (id, doc_id, chapter_number, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run("ch_del_1", docId, 1, "Bab 1", Date.now(), Date.now());

  const req = { method: "DELETE" };
  const { res, helpers, getResponse } = mockHelpers({});
  await handleDocumentsRoutes(req, res, `/api/documents/${docId}`, helpers);

  const { status, data } = getResponse();
  assert.equal(status, 200);
  assert.equal(data.success, true);

  assert.equal(db.prepare("SELECT * FROM documents WHERE id = ?").get(docId), undefined);
  assert.equal(db.prepare("SELECT * FROM learner_events WHERE doc_id = ?").get(docId), undefined);
  assert.equal(db.prepare("SELECT * FROM chapter_plans WHERE doc_id = ?").get(docId), undefined);
});

test("Topic Pathway: document_concepts schema memuat kolom lengkap (category, is_required, evidence_quote, segment_id)", () => {
  // Verify the full concept schema used by topics.js is compatible with downstream coverage validation
  const docId = `doc_topic_schema_${Date.now()}`;
  const now = Date.now();

  db.prepare("INSERT INTO documents (id, title, content, status, created_at) VALUES (?, ?, ?, 'completed', ?)")
    .run(docId, "Ekonomi: Elastisitas", "Materi Elastisitas Permintaan dan Penawaran.", now);

  db.prepare(`
    INSERT INTO document_concepts (id, doc_id, name, definition, prerequisites, origin, created_at, category, is_required, evidence_quote, segment_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `${docId}_c1`, docId, "Elastisitas Permintaan",
    "Ukuran sensitivitas jumlah permintaan terhadap perubahan harga.",
    JSON.stringify({ rumus: "Ed = (%ΔQ)/(%ΔP)", prasyarat: [] }),
    "source", now, "core", 1, "sensitivitas permintaan terhadap harga", "S1", now
  );

  const concept = db.prepare("SELECT * FROM document_concepts WHERE doc_id = ?").get(docId);
  assert.ok(concept, "Konsep harus tersimpan");
  assert.equal(concept.category, "core");
  assert.equal(concept.is_required, 1);
  assert.ok(concept.evidence_quote.length > 0, "evidence_quote harus terisi");
  assert.equal(concept.segment_id, "S1");
  assert.ok(concept.updated_at > 0, "updated_at harus terisi");

  // Cleanup
  db.prepare("DELETE FROM document_concepts WHERE doc_id = ?").run(docId);
  db.prepare("DELETE FROM documents WHERE id = ?").run(docId);
});
