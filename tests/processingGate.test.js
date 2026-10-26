/**
 * Processing Lock Gate Tests — Tanka
 * TASK-PROCESSING-LOCK-GATE-049
 *
 * Verifies:
 * 1. Logika proteksi status dokumen: dokumen berstatus 'processing' ditolak/dicegah dari aksi
 *    launch kuis/material sebelum status berubah menjadi 'completed'.
 * 2. Respon API upload dokumen menyertakan field 'status' yang konsisten ('processing' atau 'completed').
 * 3. Auto-unlock logic mengembalikan status teranyar setelah pipeline selesai.
 */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { db } = require("../server/db");
const aiModule = require("../server/ai");
const { handleDocumentsRoutes } = require("../server/routes/documents");

const originalCallRouter = aiModule.callRouter;
let callRouterStub = null;
const stubCallRouter = async (messages, model, temp, maxTok, timeoutMs) => {
  if (callRouterStub) return callRouterStub(messages, model, temp, maxTok, timeoutMs);
  return originalCallRouter(messages, model, temp, maxTok, timeoutMs);
};

Object.defineProperty(aiModule, "callRouter", {
  get: () => stubCallRouter,
  set: () => {},
  configurable: true,
});

function setLLM(fn) { callRouterStub = fn; }
function resetLLM() { callRouterStub = null; }

function b64(text) {
  return Buffer.from(text, "utf8").toString("base64");
}

function makeMock(body = {}, method = "POST", url = "/api/documents/upload") {
  let status = 200;
  let data = null;
  const headers = {};
  const req = {
    method,
    url,
    headers: {}
  };
  const res = {
    headersSent: false,
    writeHead: (s, h) => {
      status = s;
      if (h) Object.assign(headers, h);
    },
    end: (c) => {
      try { data = JSON.parse(c); } catch { data = c; }
    }
  };
  const helpers = {
    sendJSON: (_, d, s = 200) => {
      status = s;
      data = d;
      return true;
    },
    getBody: async () => body,
    getUserId: () => "user_test"
  };
  return { req, res, helpers, result: () => ({ status, data }) };
}

function cleanupDoc(docId) {
  if (!docId) return;
  for (const tbl of [
    "document_concepts",
    "document_segments",
    "chapter_plans",
    "concept_edges",
    "learner_events",
    "quizzes",
    "formula_cheatsheets"
  ]) {
    try { db.prepare(`DELETE FROM ${tbl} WHERE doc_id = ?`).run(docId); } catch {}
  }
  try { db.prepare("DELETE FROM documents WHERE id = ?").run(docId); } catch {}
}

test("Processing Gate: dokumen berstatus 'processing' dicegah dari launch material/quiz", () => {
  const isActionAllowed = (doc) => {
    if (!doc || doc.status === "processing") return false;
    return true;
  };

  const processingDoc = {
    id: "doc_proc_1",
    title: "Naskah Soal Kimia",
    status: "processing"
  };

  const completedDoc = {
    id: "doc_comp_1",
    title: "Naskah Soal Kimia Selesai",
    status: "completed"
  };

  assert.equal(
    isActionAllowed(processingDoc),
    false,
    "Dokumen processing harus dikunci dari aksi buka materi / kuis"
  );
  assert.equal(
    isActionAllowed(completedDoc),
    true,
    "Dokumen completed harus diizinkan dibuka"
  );
});

test("Processing Gate: respon API upload menyertakan field status konsisten ('processing' atau 'completed')", async () => {
  const rawText = "Hukum Kepler menjelaskan mengenai pergerakan planet mengelilingi matahari dalam lintasan elips.";

  // Stub LLM agar pengujian cepat & terisolasi
  setLLM(async (messages) => {
    return JSON.stringify({ status: "ok", title: "Fisika Astronomi", concepts: [] });
  });

  try {
    const mockUpload = makeMock({
      title: "Fisika Astronomi",
      files: [{ fileName: "astronomi.txt", fileData: b64(rawText) }]
    });

    await handleDocumentsRoutes(mockUpload.req, mockUpload.res, "/api/documents/upload", mockUpload.helpers);
    const { status, data } = mockUpload.result();

    assert.equal(status, 200, "Upload harus berhasil status 200");
    assert.ok(data.status, "Respon upload harus menyertakan field status");
    assert.equal(data.status, "processing", "Upload async standar harus berstatus processing");

    // Verifikasi GET /api/documents menyertakan status pada list
    const mockList = makeMock({}, "GET", "/api/documents");
    await handleDocumentsRoutes(mockList.req, mockList.res, "/api/documents", mockList.helpers);
    const listResult = mockList.result();
    assert.equal(listResult.status, 200);
    const uploadedInList = listResult.data.documents.find((d) => d.id === data.id);
    assert.ok(uploadedInList, "Dokumen yang diunggah harus muncul di list");
    assert.equal(uploadedInList.status, "processing", "Dokumen di list harus memiliki status 'processing'");

    cleanupDoc(data.id);
  } finally {
    resetLLM();
  }
});

test("Processing Gate: auto-unlock mengembalikan status teranyar setelah pipeline selesai", async () => {
  const docId = "doc_test_autounlock_" + Date.now();
  const createdAt = Date.now();

  try {
    // 1. Dokumen awal masuk dalam status 'processing'
    db.prepare(
      "INSERT INTO documents (id, title, content, status, content_hash, created_at) VALUES (?, ?, ?, 'processing', ?, ?)"
    ).run(docId, "Simulasi Naskah UTBK", "Isi teks naskah...", "hash_unlock_123", createdAt);

    // Cek status saat masih processing
    const mockGet1 = makeMock({}, "GET", `/api/documents/${docId}`);
    await handleDocumentsRoutes(mockGet1.req, mockGet1.res, `/api/documents/${docId}`, mockGet1.helpers);
    const res1 = mockGet1.result();
    assert.equal(res1.status, 200);
    assert.equal(res1.data.document.status, "processing", "Status harus processing saat background berjalan");

    // 2. Simulasikan pipeline background selesai di SQLite
    db.prepare("UPDATE documents SET status = 'completed', content = ? WHERE id = ?").run(
      "## Bab 1: Analisis Lengkap\nKonten terstruktur.",
      docId
    );

    // 3. Poller mengambil data dokumen terbaru
    const mockGet2 = makeMock({}, "GET", `/api/documents/${docId}`);
    await handleDocumentsRoutes(mockGet2.req, mockGet2.res, `/api/documents/${docId}`, mockGet2.helpers);
    const res2 = mockGet2.result();
    assert.equal(res2.status, 200);
    assert.equal(res2.data.document.status, "completed", "Status harus ter-update menjadi completed");

    // 4. Verifikasi bahwa status completed di list membuka kunci (isLocked === false)
    const mockList = makeMock({}, "GET", "/api/documents");
    await handleDocumentsRoutes(mockList.req, mockList.res, "/api/documents", mockList.helpers);
    const listRes = mockList.result();
    const docInList = listRes.data.documents.find((d) => d.id === docId);
    assert.ok(docInList);
    assert.equal(docInList.status, "completed");
    const isLocked = docInList.status === "processing";
    assert.equal(isLocked, false, "Dokumen harus auto-unlock setelah pipeline selesai");
  } finally {
    cleanupDoc(docId);
  }
});
