/**
 * Upload Deduplication Tests — Tanka
 *
 * Verifies:
 * 1. extract_text.py uses deterministic sha256 content hashing for image naming
 * 2. In-flight upload deduplication (status = 'processing') returns in-flight doc reference without creating new rows
 * 3. Completed upload deduplication (status = 'completed') returns cached doc reference
 */

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { db } = require("../server/db");
const { handleDocumentsRoutes } = require("../server/routes/documents");

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

test("Deduplication: extract_text.py uses deterministic content hash for image naming", () => {
  const extractScriptPath = path.join(__dirname, "..", "extract_text.py");
  const scriptContent = fs.readFileSync(extractScriptPath, "utf8");

  assert.ok(
    scriptContent.includes("hashlib.sha256"),
    "extract_text.py harus menggunakan hashlib.sha256"
  );
  assert.ok(
    /pdf_\{doc_hash\}_img-/.test(scriptContent),
    "extract_text.py harus menamai gambar dengan pola pdf_{doc_hash}_img-{img_idx:03d}.png"
  );
  assert.ok(
    !scriptContent.includes("{doc_base}_img-"),
    "extract_text.py tidak boleh lagi menggunakan doc_base yang berbasis nama file dinamis"
  );

  const tmpDir = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "tanka-dedup-"));
  try {
    const dummyContent = Buffer.from("%PDF-1.4\n%DUMMY BINARY CONTENT FOR HASH TEST\n%%EOF");
    const file1 = path.join(tmpDir, "upload_1792838521753_t4zu.pdf");
    const file2 = path.join(tmpDir, "upload_1792838552017_pt2n.pdf");
    fs.writeFileSync(file1, dummyContent);
    fs.writeFileSync(file2, dummyContent);

    const pyCode = `
import hashlib, os
for path in ['${file1}', '${file2}']:
    with open(path, 'rb') as f:
        doc_hash = hashlib.sha256(f.read()).hexdigest()[:16]
        img_name = f"pdf_{doc_hash}_img-001.png"
        print(img_name)
`;
    const output = execFileSync("python3", ["-c", pyCode], { encoding: "utf8" }).trim().split("\n");
    assert.equal(output.length, 2);
    assert.equal(output[0], output[1], "Kedua file identik harus menghasilkan image filename yang 100% sama persis");
    assert.ok(output[0].startsWith("pdf_"), "Image filename harus berawalan pdf_");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("Deduplication: upload berkas saat status 'processing' mengembalikan in-flight doc tanpa baris baru", async () => {
  const testText = "Naskah soal ujian in-flight deduplication test materi fisika kuantum.";
  const testHash = crypto.createHash("sha256").update(testText.trim()).digest("hex");
  const inFlightId = "doc_inflight_" + Date.now();
  const createdAt = Date.now();

  db.prepare("INSERT INTO documents (id, title, content, status, content_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
    inFlightId,
    "Ujian Fisika Kuantum",
    testText,
    "processing",
    testHash,
    createdAt
  );

  const countBefore = db.prepare("SELECT COUNT(*) as count FROM documents").get().count;

  const body = {
    title: "Ujian Fisika Kuantum Re-upload",
    files: [{ fileName: "fisika_reupload.txt", fileData: b64(testText) }]
  };
  const mock = makeMock(body);
  await handleDocumentsRoutes({ method: "POST" }, mock.res, "/api/documents/upload", mock.helpers);
  const { status, data } = mock.result();

  const countAfter = db.prepare("SELECT COUNT(*) as count FROM documents").get().count;

  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.equal(data.id, inFlightId, "Harus mengembalikan id dokumen in-flight yang sedang diproses");
  assert.equal(data.status, "processing", "Status dokumen harus processing");
  assert.equal(data.inFlight, true, "Harus ditandai inFlight=true");
  assert.equal(data.message, "Dokumen ini sedang diproses di latar belakang.");
  assert.equal(countAfter, countBefore, "Tidak boleh membuat baris baru di tabel documents saat berkas sedang in-flight");

  cleanupDoc(inFlightId);
});

test("Deduplication: upload berkas saat status 'completed' mengembalikan cache dokumen tanpa baris baru", async () => {
  const testText = "Materi kimia asam basa untuk pengujian completed cache deduplication.";
  const testHash = crypto.createHash("sha256").update(testText.trim()).digest("hex");
  const completedId = "doc_completed_" + Date.now();
  const createdAt = Date.now();

  db.prepare("INSERT INTO documents (id, title, content, status, content_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
    completedId,
    "Materi Asam Basa",
    testText,
    "completed",
    testHash,
    createdAt
  );

  const countBefore = db.prepare("SELECT COUNT(*) as count FROM documents").get().count;

  const body = {
    title: "Materi Asam Basa Upload Ulang",
    files: [{ fileName: "kimia_reupload.txt", fileData: b64(testText) }]
  };
  const mock = makeMock(body);
  await handleDocumentsRoutes({ method: "POST" }, mock.res, "/api/documents/upload", mock.helpers);
  const { status, data } = mock.result();

  const countAfter = db.prepare("SELECT COUNT(*) as count FROM documents").get().count;

  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.equal(data.id, completedId, "Harus mengembalikan id dokumen completed dari cache");
  assert.equal(data.status, "completed", "Status dokumen harus completed");
  assert.equal(data.cached, true, "Harus ditandai cached=true");
  assert.equal(countAfter, countBefore, "Tidak boleh membuat baris baru di tabel documents saat cache completed tersedia");

  cleanupDoc(completedId);
});
