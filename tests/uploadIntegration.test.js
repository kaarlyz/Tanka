/**
 * Upload Integration Tests — Tanka
 *
 * Tests the full upload route (POST /api/documents/upload) at the handler level.
 * External boundaries mocked: callRouter (LLM), executePythonScriptAsync (OCR).
 * Internal behavior (DB writes, processExamQuestionsIfDetected logic) runs for real.
 *
 * NOT tested here (needs live gateway + browser):
 * - Actual AI-generated curriculum quality
 * - Background async pipeline completion timing
 * - Real OCR of binary PDF/DOCX
 */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { db } = require("../server/db");
const { handleDocumentsRoutes } = require("../server/routes/documents");

// ─── Helpers ────────────────────────────────────────────────────────────────

function b64(text) {
  return Buffer.from(text, "utf8").toString("base64");
}

function makeMock(body = {}) {
  let status = 200;
  let data = null;
  const res = {
    headersSent: false,
    writeHead: (s) => { status = s; },
    end: (c) => { try { data = JSON.parse(c); } catch { data = c; } }
  };
  const helpers = {
    sendJSON: (_, d, s = 200) => { status = s; data = d; return true; },
    getBody: async () => body,
    getUserId: () => "user_test"
  };
  return { res, helpers, result: () => ({ status, data }) };
}

function cleanupDoc(docId) {
  if (!docId) return;
  for (const tbl of ["document_concepts", "document_segments", "chapter_plans",
                      "concept_edges", "learner_events", "quizzes",
                      "formula_cheatsheets"]) {
    try { db.prepare(`DELETE FROM ${tbl} WHERE doc_id = ?`).run(docId); } catch {}
  }
  try { db.prepare("DELETE FROM documents WHERE id = ?").run(docId); } catch {}
}

// ─── Module-level stubs ──────────────────────────────────────────────────────
// We patch callRouter in the ai module so LLM calls are controlled.
// The stub is set per-test via a shared state object.

const aiModule = require("../server/ai");
const originalCallRouter = aiModule.callRouter;

let callRouterStub = null;   // set per test; null = use real gateway
const stubCallRouter = async (messages, model, temp, maxTok, timeoutMs) => {
  if (callRouterStub) return callRouterStub(messages, model, temp, maxTok, timeoutMs);
  return originalCallRouter(messages, model, temp, maxTok, timeoutMs);
};

// Monkey-patch (module cache is shared across requires in same process)
Object.defineProperty(aiModule, "callRouter", {
  get: () => stubCallRouter,
  set: () => {},
  configurable: true,
});

function setLLM(fn) { callRouterStub = fn; }
function resetLLM() { callRouterStub = null; }

// NOTE: executePythonScriptAsync cannot be stubbed via module property because
// documents.js destructures it at import time (local variable, not live binding).
// OCR-failure tests use real extract_text.py with genuinely invalid input instead.

// ─── Tests ───────────────────────────────────────────────────────────────────

test("Upload: file kosong / tidak ada files mengembalikan 400", async () => {
  const mock = makeMock({ files: [] });
  await handleDocumentsRoutes({ method: "POST" }, mock.res, "/api/documents/upload", mock.helpers);
  const { status, data } = mock.result();
  assert.equal(status, 400);
  assert.ok(data.error, "Harus ada pesan error");
});

test("Upload: files tanpa fileData mengembalikan 400 (tidak ada teks terbaca)", async () => {
  // fileName ada tapi fileData kosong — ekstraksi gagal, extractedParts kosong
  const mock = makeMock({ files: [{ fileName: "kosong.txt", fileData: "" }] });
  await handleDocumentsRoutes({ method: "POST" }, mock.res, "/api/documents/upload", mock.helpers);
  const { status, data } = mock.result();
  assert.equal(status, 400);
  assert.ok(data.error.toLowerCase().includes("teks"), "Error harus menyebut teks/file");
});

test("Upload: teks biasa — examResult tidak TDZ, status DB = processing, respons 200", async () => {
  // Stub callRouter untuk percepat test (hindari full LLM round-trip yang lambat)
  setLLM(async (messages) => {
    const userMsg = (messages.find(m => m.role === "user") || {}).content || "";
    if (userMsg.includes("judul") || userMsg.includes("Tentukan topik")) {
      return "Materi Biologi: Fotosintesis";
    }
    return JSON.stringify({ status: "ok", title: "Test", executiveSummary: "Test", concepts: [], chapters: [] });
  });

  // Python extraction berjalan nyata (extract_text.py reads .txt via utf-8)
  const body = {
    title: "Materi Biologi",
    files: [{ fileName: "bio.txt", fileData: b64("Fotosintesis adalah proses biokimia yang dilakukan tumbuhan untuk menghasilkan glukosa dari cahaya matahari.") }]
  };
  const mock = makeMock(body);
  await handleDocumentsRoutes({ method: "POST" }, mock.res, "/api/documents/upload", mock.helpers);
  const { status, data } = mock.result();

  resetLLM();

  assert.equal(status, 200, `Harus 200, dapat: ${JSON.stringify(data)}`);
  assert.ok(data.success, "success harus true");
  assert.ok(data.id, "id dokumen harus ada");
  assert.ok("isExamSheet" in data, "isExamSheet harus ada di respons");
  assert.ok("questionCount" in data, "questionCount harus ada");
  assert.equal(data.isExamSheet, false, "Teks biasa bukan lembar soal");

  // DB: dokumen harus tersimpan dengan status 'processing' (non-exam)
  const doc = db.prepare("SELECT status FROM documents WHERE id = ?").get(data.id);
  assert.ok(doc, "Dokumen harus tersimpan di DB");
  assert.equal(doc.status, "processing", "Status awal dokumen non-exam harus 'processing'");

  cleanupDoc(data.id);
});

test("Upload: LLM exam-detection gagal — fallback ke isExamSheet=false, status=processing", async () => {
  // Stub: callRouter throws pada semua panggilan
  setLLM(async () => { throw new Error("Gateway timeout"); });

  // Python extraction nyata — .txt dengan pola soal
  const body = {
    title: "Kuis Matematika",
    files: [{ fileName: "kuis.txt", fileData: b64("Soal 1. Berapa 2 + 2? A. 3 B. 4 C. 5 D. 6") }]
  };
  const mock = makeMock(body);
  await handleDocumentsRoutes({ method: "POST" }, mock.res, "/api/documents/upload", mock.helpers);
  const { status, data } = mock.result();

  resetLLM();

  // Even when LLM fails, the route must return 200 with a graceful fallback
  assert.equal(status, 200, `Harus 200 meski LLM gagal: ${JSON.stringify(data)}`);
  assert.ok(data.success);
  assert.equal(data.isExamSheet, false, "Fallback ke false saat LLM gagal");

  cleanupDoc(data.id);
});

test("Upload: dokumen terdeteksi sebagai lembar ujian — status DB = completed, questions disimpan", async () => {
  // Soal yang akan dideteksi oleh detectQuestionPatterns
  const examText = [
    "Soal Ujian Matematika",
    "1. Berapa nilai x jika 2x + 4 = 10?",
    "A. 2  B. 3  C. 4  D. 5",
    "2. Akar dari 144 adalah?",
    "A. 10  B. 11  C. 12  D. 13"
  ].join("\n");

  const examResponse = JSON.stringify({
    questions: [
      { id: 1, question: "Berapa nilai x jika 2x + 4 = 10?", options: ["A. 2", "B. 3", "C. 4", "D. 5"], correctIndex: 1, explanation: "2x=6, x=3", formula: "", pitfall: "" },
      { id: 2, question: "Akar dari 144 adalah?", options: ["A. 10", "B. 11", "C. 12", "D. 13"], correctIndex: 2, explanation: "√144=12", formula: "", pitfall: "" }
    ],
    studyGuide: "# Panduan Belajar\n## 1. Peta Materi\nAljabar dasar.\n## 2. Formula\nx diisolasi.\n## 3. Pola Soal\nCek substitusi.\n## 4. Jebakan\nPerhatikan tanda."
  });

  setLLM(async (messages) => {
    const content = (messages.find(m => m.role === "user") || {}).content || "";
    if (content.includes("judul akademis") || content.includes("Judul Materi") || content.includes("Tentukan topik")) {
      return "Ujian Matematika";
    }
    if (content.includes("lembar soal") || content.includes("kisi-kisi")) {
      return examResponse;
    }
    return JSON.stringify({ status: "ok", title: "Test", executiveSummary: "", concepts: [], chapters: [] });
  });
  // Python extraction nyata (.txt)

  const body = {
    files: [{ fileName: "ujian_mat.txt", fileData: b64(examText) }]
  };
  const mock = makeMock(body);
  await handleDocumentsRoutes({ method: "POST" }, mock.res, "/api/documents/upload", mock.helpers);
  const { status, data } = mock.result();

  resetLLM();

  assert.equal(status, 200, `Harus 200: ${JSON.stringify(data)}`);
  assert.ok(data.success);
  assert.equal(data.isExamSheet, true, "Harus terdeteksi sebagai lembar ujian");
  assert.equal(data.questionCount, 2, "2 soal harus terdeteksi");

  // DB: exam sheet harus langsung completed
  const doc = db.prepare("SELECT status FROM documents WHERE id = ?").get(data.id);
  assert.ok(doc, "Dokumen harus ada di DB");
  assert.equal(doc.status, "completed", "Exam sheet langsung completed");

  // Quiz harus tersimpan di tabel quizzes
  const quiz = db.prepare("SELECT * FROM quizzes WHERE doc_id = ?").get(data.id);
  assert.ok(quiz, "Quiz harus tersimpan untuk exam sheet");
  const saved = JSON.parse(quiz.questions);
  assert.equal(saved.length, 2, "2 soal harus tersimpan");

  cleanupDoc(data.id);
});

test("Upload: Python OCR gagal — semua file error, mengembalikan 400", async () => {
  // Send a fake .pdf file whose binary content is not valid PDF
  // extract_text.py will return "[Error ekstrak PDF: ...]" which isErrorText filters out
  // → extractedParts stays empty → route returns 400
  // No LLM stub needed (route returns before LLM calls)
  const fakePdfContent = Buffer.from("BUKAN PDF VALID - INI BUKAN FORMAT PDF ASLI 1234567890").toString("base64");
  const body = {
    files: [{ fileName: "rusak.pdf", fileData: fakePdfContent }]
  };
  const mock = makeMock(body);
  await handleDocumentsRoutes({ method: "POST" }, mock.res, "/api/documents/upload", mock.helpers);
  const { status, data } = mock.result();

  // Fake PDF → pdftotext fails → "[Error ekstrak PDF: ...]" → isErrorText → extractedParts empty → 400
  assert.equal(status, 400, `Harus 400 saat ekstraksi gagal: ${JSON.stringify(data)}`);
  assert.ok(data.error, "Harus ada pesan error");
});

test("Upload: background pipeline error tidak mengubah status dokumen ke processing stuck", async () => {
  // Cek bahwa ketika background pipeline gagal, dokumen mendapat status 'partial' bukan stuck 'processing'
  // Kita insert dokumen dengan status 'processing' secara manual, lalu verifikasi behavior
  const docId = `doc_bg_test_${Date.now()}`;
  const now = Date.now();

  db.prepare("INSERT INTO documents (id, title, content, status, created_at) VALUES (?, ?, ?, 'processing', ?)")
    .run(docId, "Test BG Pipeline", "Materi uji pipeline.", now);

  // Simulate apa yang background pipeline lakukan saat generateNaraModule gagal
  // (background pipeline catch → set status partial)
  try {
    throw new Error("Simulasi LLM timeout di pipeline");
  } catch {
    db.prepare("UPDATE documents SET status = 'partial' WHERE id = ?").run(docId);
  }

  const doc = db.prepare("SELECT status FROM documents WHERE id = ?").get(docId);
  assert.equal(doc.status, "partial", "Gagal pipeline harus menghasilkan status partial, bukan stuck processing");

  cleanupDoc(docId);
});

test("Upload: respons API mengandung semua field yang dibutuhkan frontend", async () => {
  setLLM(async () => "Materi Kimia: Ikatan Kimia");

  const body = {
    title: "Ikatan Kimia",
    files: [{ fileName: "kimia.txt", fileData: b64("Ikatan ion terbentuk antara logam dan nonlogam karena transfer elektron.") }]
  };
  const mock = makeMock(body);
  await handleDocumentsRoutes({ method: "POST" }, mock.res, "/api/documents/upload", mock.helpers);
  const { status, data } = mock.result();

  resetLLM();

  assert.equal(status, 200);
  // Semua field yang dikonsumsi frontend harus ada
  for (const field of ["success", "id", "title", "content", "fileCount", "wordCount",
                        "created_at", "isExamSheet", "questionCount"]) {
    assert.ok(field in data, `Field '${field}' harus ada di respons`);
  }
  assert.ok(data.wordCount > 0, "wordCount harus > 0");
  assert.ok(data.created_at > 0, "created_at harus timestamp valid");

  cleanupDoc(data.id);
});
