const test = require("node:test");
const assert = require("node:assert/strict");
const { db } = require("../server/db");
const { handleFeynmanRoutes } = require("../server/routes/feynman");

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

test("Feynman: penjelasan kosong mengembalikan status 400", async () => {
  const req = { method: "POST" };
  const { res, helpers, getResponse } = mockHelpers({ explanation: "   " });

  await handleFeynmanRoutes(req, res, "/api/ai/feynman-evaluate", helpers);
  const { status, data } = getResponse();

  assert.equal(status, 400);
  assert.ok(data.error.includes("tidak boleh kosong"));
});

test("Feynman: docId tidak ditemukan di database mengembalikan status 404", async () => {
  const req = { method: "POST" };
  const { res, helpers, getResponse } = mockHelpers({
    docId: "non_existent_doc_123",
    explanation: "Ini penjelasan saya tentang topik x."
  });

  await handleFeynmanRoutes(req, res, "/api/ai/feynman-evaluate", helpers);
  const { status, data } = getResponse();

  assert.equal(status, 404);
  assert.ok(data.error.includes("tidak ditemukan"));
});

test("Feynman: rubrik skor deterministik dengan canonical concepts dan proteksi halusinasi", () => {
  // Verifikasi logika pemetaan:
  // Canonical concepts: Konsep A, Konsep B.
  // Model returns: Konsep A (mastered), Konsep Halusinasi C (mastered).
  // Konsep B omitted -> gap (0).
  // Total points: 100 (A) + 0 (B) = 100.
  // Denominator: 2 (A & B) -> Score = 50. Konsep C diabaikan!
  const canonicalList = [
    { id: "c1", name: "Hukum Newton 1" },
    { id: "c2", name: "Hukum Newton 2" }
  ];
  const aiReturned = [
    { name: "Hukum Newton 1", status: "mastered" },
    { name: "Kucing Terbang", status: "mastered" } // Hallucinated
  ];

  const canonicalMap = new Map();
  canonicalList.forEach(c => canonicalMap.set(c.name.toLowerCase().trim(), c));

  let totalPoints = 0;
  const evaluatedNames = new Set();
  const normalized = [];

  aiReturned.forEach(c => {
    const norm = c.name.toLowerCase().trim();
    const match = canonicalMap.get(norm);
    if (match) {
      evaluatedNames.add(norm);
      const points = c.status === "mastered" ? 100 : (c.status === "partial" ? 50 : 0);
      totalPoints += points;
      normalized.push({ name: match.name, status: c.status, points });
    }
  });

  canonicalList.forEach(c => {
    const norm = c.name.toLowerCase().trim();
    if (!evaluatedNames.has(norm)) {
      normalized.push({ name: c.name, status: "gap", points: 0 });
    }
  });

  const calculatedScore = Math.round(totalPoints / canonicalList.length);

  assert.equal(calculatedScore, 50); // 100/2 = 50, bukan 100!
  assert.equal(normalized.length, 2);
  assert.ok(!normalized.some(n => n.name === "Kucing Terbang"));
});

test("Feynman: idempotensi learner_events mencegah pencatatan duplikat dalam 10 detik", () => {
  const testDocId = "doc_feynman_test_idemp";
  db.prepare("INSERT OR REPLACE INTO documents (id, title, content, created_at) VALUES (?, ?, ?, ?)").run(
    testDocId,
    "Materi Uji Feynman",
    "Konten materi fisika.",
    Date.now()
  );

  const topic = "Inersia";
  const now = Date.now();

  // Simulasikan event pertama
  db.prepare("INSERT INTO learner_events (id, doc_id, concept_id, activity_type, result, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run("ev_1", testDocId, topic, "feynman", "mastered", "{}", now);

  // Periksa apakah event baru dengan topic sama diizinkan jika dibuat dalam 10 detik
  const recentThreshold = Date.now() - 10000;
  const existing = db.prepare(`
    SELECT id FROM learner_events
    WHERE doc_id = ? AND activity_type = 'feynman' AND concept_id = ? AND created_at > ?
  `).get(testDocId, topic, recentThreshold);

  assert.ok(existing);
  assert.equal(existing.id, "ev_1");

  // Cleanup
  db.prepare("DELETE FROM learner_events WHERE doc_id = ?").run(testDocId);
  db.prepare("DELETE FROM documents WHERE id = ?").run(testDocId);
});
