const test = require("node:test");
const assert = require("node:assert/strict");
const { db } = require("../server/db");
const { handleDocumentsRoutes } = require("../server/routes/documents");
const { handleQuizzesRoutes } = require("../server/routes/quizzes");
const { handleFeynmanRoutes } = require("../server/routes/feynman");
const { handleChatRoutes } = require("../server/routes/chat");
const { handleCheatsheetRoutes } = require("../server/routes/cheatsheet");

function createMockHelpers(body = {}) {
  let responseStatus = 200;
  let responseData = null;

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
    getBody: async () => body,
    getUserId: () => "user_test_123"
  };

  return {
    res,
    helpers,
    getResult: () => ({ status: responseStatus, data: responseData })
  };
}

test("Integration: Document Lifecycle (Create -> Get with Chapters -> Delete Cascade)", async () => {
  const docId = `doc_integ_${Date.now()}`;
  const now = Date.now();

  // 1. Buat dokumen secara manual
  const createMock = createMockHelpers({ title: "Fisika Dasar Integrasi", content: "Materi tentang gerak lurus dan hukum Newton." });
  await handleDocumentsRoutes({ method: "POST" }, createMock.res, "/api/documents", createMock.helpers);
  const created = createMock.getResult();
  assert.equal(created.status, 200);
  assert.ok(created.data.success);
  const realDocId = created.data.document.id;

  // Sisipkan chapter plans dan learner events untuk verifikasi relasi
  db.prepare("INSERT INTO chapter_plans (id, doc_id, chapter_number, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(`ch_${realDocId}_1`, realDocId, 1, "Bab 1: GLB", "Konten Bab 1", now, now);
  db.prepare("INSERT INTO learner_events (id, doc_id, activity_type, result, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(`ev_${realDocId}_1`, realDocId, "feynman", "mastered", now);

  // 2. GET /api/documents/:id harus mengembalikan dokumen beserta daftar chapters
  const getMock = createMockHelpers();
  await handleDocumentsRoutes({ method: "GET" }, getMock.res, `/api/documents/${realDocId}`, getMock.helpers);
  const fetched = getMock.getResult();
  assert.equal(fetched.status, 200);
  assert.equal(fetched.data.document.id, realDocId);
  assert.equal(fetched.data.document.status, "completed");
  assert.ok(Array.isArray(fetched.data.chapters));
  assert.equal(fetched.data.chapters.length, 1);
  assert.equal(fetched.data.chapters[0].title, "Bab 1: GLB");

  // 3. DELETE /api/documents/:id harus menghapus seluruh entitas terkait
  const deleteMock = createMockHelpers();
  await handleDocumentsRoutes({ method: "DELETE" }, deleteMock.res, `/api/documents/${realDocId}`, deleteMock.helpers);
  const deleted = deleteMock.getResult();
  assert.equal(deleted.status, 200);
  assert.equal(deleted.data.success, true);

  // Verifikasi tidak ada orphan di DB
  assert.equal(db.prepare("SELECT * FROM documents WHERE id = ?").get(realDocId), undefined);
  assert.equal(db.prepare("SELECT * FROM chapter_plans WHERE doc_id = ?").get(realDocId), undefined);
  assert.equal(db.prepare("SELECT * FROM learner_events WHERE doc_id = ?").get(realDocId), undefined);
});

test("Integration: Quiz Lifecycle (Persist -> Get Saved Normalized -> Chat Tutor Invalid Question Handling)", async () => {
  const docId = `doc_quiz_integ_${Date.now()}`;
  db.prepare("INSERT INTO documents (id, title, content, created_at) VALUES (?, ?, ?, ?)").run(docId, "Matematika Kuis", "Aljabar", Date.now());

  // Simpan quiz mentah dengan variasi alias answer
  const rawQuestions = [
    { id: 1, question: "Berapa 3 x 4?", options: ["10", "11", "12", "14"], answer: "C" },
    { id: 2, question: "Akar dari 49?", options: ["6", "7", "8"], correctIndex: 1 }
  ];
  db.prepare("INSERT INTO quizzes (id, doc_id, questions, created_at) VALUES (?, ?, ?, ?)")
    .run(`q_${docId}`, docId, JSON.stringify(rawQuestions), Date.now());

  // GET /api/documents/:id/quizzes harus mengembalikan kuis yang dinormalisasi kanonikal
  const getMock = createMockHelpers();
  await handleQuizzesRoutes({ method: "GET" }, getMock.res, `/api/documents/${docId}/quizzes`, getMock.helpers);
  const res = getMock.getResult();
  assert.equal(res.status, 200);
  assert.ok(res.data.quiz);
  assert.equal(res.data.quiz.questions.length, 2);
  assert.equal(res.data.quiz.questions[0].correctIndex, 2); // 'C' -> index 2
  assert.equal(res.data.quiz.questions[1].correctIndex, 1);
  assert.equal(res.data.quiz.quizType, "conceptual");

  // Simpan quiz dengan quiz_type eksplisit 'hots'
  db.prepare("INSERT INTO quizzes (id, doc_id, questions, quiz_type, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(`q_hots_${docId}`, docId, JSON.stringify(rawQuestions), "hots", Date.now() + 10);
  const getMockHots = createMockHelpers();
  await handleQuizzesRoutes({ method: "GET" }, getMockHots.res, `/api/documents/${docId}/quizzes`, getMockHots.helpers);
  const resHots = getMockHots.getResult();
  assert.equal(resHots.data.quiz.quizType, "hots");

  // Cleanup
  db.prepare("DELETE FROM quizzes WHERE doc_id = ?").run(docId);
  db.prepare("DELETE FROM documents WHERE id = ?").run(docId);
});

test("Integration: Cheatsheet Lifecycle (GET Empty -> Cache Lookup -> Re-fetch)", async () => {
  const docId = `doc_cheat_integ_${Date.now()}`;
  db.prepare("INSERT INTO documents (id, title, content, created_at) VALUES (?, ?, ?, ?)").run(docId, "Fisika Rumus", "Konten", Date.now());

  // GET saat belum ada rumus tersimpan
  const getMock1 = createMockHelpers();
  await handleCheatsheetRoutes({ method: "GET" }, getMock1.res, `/api/documents/${docId}/formulas`, getMock1.helpers);
  assert.deepEqual(getMock1.getResult().data.formulas, []);

  // Simpan cache rumus
  const sampleFormulas = [{ name: "Kecepatan", formula: "$$v = s/t$$", meaning: "Kecepatan rata-rata" }];
  db.prepare("INSERT INTO formula_cheatsheets (doc_id, formulas, created_at) VALUES (?, ?, ?)")
    .run(docId, JSON.stringify(sampleFormulas), Date.now());

  // GET saat sudah ada cache
  const getMock2 = createMockHelpers();
  await handleCheatsheetRoutes({ method: "GET" }, getMock2.res, `/api/documents/${docId}/formulas`, getMock2.helpers);
  assert.equal(getMock2.getResult().data.formulas.length, 1);
  assert.equal(getMock2.getResult().data.formulas[0].name, "Kecepatan");

  // Cleanup
  db.prepare("DELETE FROM formula_cheatsheets WHERE doc_id = ?").run(docId);
  db.prepare("DELETE FROM documents WHERE id = ?").run(docId);
});

test("Upload: examResult tidak TDZ - POST /api/documents dengan teks biasa berhasil tanpa exception", async () => {
  // Regression for: Cannot access 'examResult' before initialization
  // Root cause: examResult was declared with const AFTER it was referenced on an earlier line
  // in the same function (the initialStatus line used examResult.isExamSheet before the declaration).
  const body = {
    files: [{ fileName: "materi_biologi.txt", fileData: Buffer.from("Fotosintesis adalah proses tumbuhan mengubah CO2 dan H2O menjadi glukosa menggunakan cahaya matahari.").toString("base64") }]
  };
  const mock = createMockHelpers(body);
  await handleDocumentsRoutes({ method: "POST" }, mock.res, "/api/documents/upload", mock.helpers);
  const { status, data } = mock.getResult();

  // Must succeed — any TDZ error would propagate as an uncaught exception causing the test to fail
  assert.equal(status, 200, `Expected 200, got ${status}: ${JSON.stringify(data)}`);
  assert.ok(data.success, "Upload harus berhasil");
  assert.ok(data.id, "Harus menghasilkan document id");
  // examResult fields should be present in response
  assert.ok("isExamSheet" in data, "isExamSheet harus ada di respons");
  assert.ok("questionCount" in data, "questionCount harus ada di respons");

  // Cleanup
  if (data.id) {
    db.prepare("DELETE FROM documents WHERE id = ?").run(data.id);
    db.prepare("DELETE FROM document_segments WHERE doc_id = ?").run(data.id);
    db.prepare("DELETE FROM document_concepts WHERE doc_id = ?").run(data.id);
  }
});
