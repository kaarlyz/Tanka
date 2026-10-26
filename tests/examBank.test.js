const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { db, runMigrations, cleanOrphanedRecords } = require("../server/db");

test("Exam Bank: Schema & Tables Migration Check", () => {
  const memDb = new DatabaseSync(":memory:");
  runMigrations(memDb);

  const tables = memDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'exam_bank%'").all();
  const tableNames = tables.map(t => t.name);
  assert.ok(tableNames.includes("exam_bank_packages"), "Tabel exam_bank_packages harus ada");
  assert.ok(tableNames.includes("exam_bank_items"), "Tabel exam_bank_items harus ada");
  assert.ok(tableNames.includes("exam_bank_submissions"), "Tabel exam_bank_submissions harus ada");

  const indexes = memDb.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_exam_bank%'").all();
  const indexNames = indexes.map(i => i.name);
  assert.ok(indexNames.includes("idx_exam_bank_items_pkg"));
  assert.ok(indexNames.includes("idx_exam_bank_items_pkg_nomor"));
  assert.ok(indexNames.includes("idx_exam_bank_packages_source"));
  assert.ok(indexNames.includes("idx_exam_bank_submissions_user"));
  assert.ok(indexNames.includes("idx_exam_bank_submissions_pkg"));
});

test("Exam Bank: Clean Orphaned Records Handles Exam Bank", () => {
  const memDb = new DatabaseSync(":memory:");
  runMigrations(memDb);

  // Insert packages
  memDb.prepare(`
    INSERT INTO exam_bank_packages (
      id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions, created_at, updated_at
    ) VALUES ('test_pkg_keep', 'pusmendik_tka', 'sma', 'wajib', 'Matematika', 'Paket 1', 1, 1000, 1000);
  `).run();

  memDb.prepare(`
    INSERT INTO exam_bank_packages (
      id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions, created_at, updated_at
    ) VALUES ('test_pkg_delete', 'pusmendik_tka', 'sma', 'wajib', 'Matematika', 'Paket 2', 1, 1000, 1000);
  `).run();

  // Insert items
  memDb.prepare(`
    INSERT INTO exam_bank_items (
      id, package_id, source, jenjang, subtes_or_mapel, paket, nomor, tipe_soal, soal, kunci_jawaban, created_at
    ) VALUES ('item_keep_01', 'test_pkg_keep', 'pusmendik_tka', 'sma', 'Matematika', 'Paket 1', 1, 'pilihan_ganda', 'Soal 1', 'a', 1000);
  `).run();

  memDb.prepare(`
    INSERT INTO exam_bank_items (
      id, package_id, source, jenjang, subtes_or_mapel, paket, nomor, tipe_soal, soal, kunci_jawaban, created_at
    ) VALUES ('item_orphan_01', 'test_pkg_delete', 'pusmendik_tka', 'sma', 'Matematika', 'Paket 2', 1, 'pilihan_ganda', 'Soal 2', 'b', 1000);
  `).run();

  // Insert submissions
  memDb.prepare(`
    INSERT INTO exam_bank_submissions (
      id, user_id, package_id, package_title, total_questions, answered_count, correct_count, score_percent, estimated_irt, created_at
    ) VALUES ('sub_keep_01', 'anon', 'test_pkg_keep', 'Matematika Paket 1', 1, 1, 1, 100, 855, 1000);
  `).run();

  memDb.prepare(`
    INSERT INTO exam_bank_submissions (
      id, user_id, package_id, package_title, total_questions, answered_count, correct_count, score_percent, estimated_irt, created_at
    ) VALUES ('sub_orphan_01', 'anon', 'test_pkg_delete', 'Matematika Paket 2', 1, 1, 0, 0, 250, 1000);
  `).run();

  // Turn off foreign_keys temporarily to delete package and create an orphan item
  memDb.exec("PRAGMA foreign_keys = OFF;");
  memDb.prepare("DELETE FROM exam_bank_packages WHERE id = 'test_pkg_delete'").run();
  memDb.exec("PRAGMA foreign_keys = ON;");

  cleanOrphanedRecords(memDb);

  const remaining = memDb.prepare("SELECT id FROM exam_bank_items").all();
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, "item_keep_01");

  const remainingSubs = memDb.prepare("SELECT id FROM exam_bank_submissions").all();
  assert.equal(remainingSubs.length, 1);
  assert.equal(remainingSubs[0].id, "sub_keep_01");
});

test("Exam Bank: Database Integrity & Coverage Verification (tanka.sqlite)", () => {
  const diskDbPath = path.join(__dirname, "..", "tanka.sqlite");
  if (!fs.existsSync(diskDbPath)) {
    return; // Skip if db not created yet in isolated test env
  }

  const diskDb = new DatabaseSync(diskDbPath);
  const pkgRows = diskDb.prepare("SELECT source, count(*) as cnt FROM exam_bank_packages GROUP BY source").all();
  assert.ok(pkgRows.length > 0, "exam_bank_packages harus memiliki baris");

  const sources = pkgRows.map(r => r.source);
  assert.ok(sources.includes("pusmendik_tka"), "Pusmendik packages harus terdaftar");
  assert.ok(sources.includes("stekom_utbk"), "Stekom packages harus terdaftar");

  // Zero missing answer keys
  const missingKeys = diskDb.prepare("SELECT count(*) as cnt FROM exam_bank_items WHERE kunci_jawaban IS NULL OR kunci_jawaban = ''").get();
  assert.equal(missingKeys.cnt, 0, "Kunci jawaban resmi harus 100% ada tanpa null/kosong");

  // Zero missing diagram assets
  const publicDir = path.join(__dirname, "..", "public");
  const items = diskDb.prepare("SELECT id, soal_img, options_json, bacaan, soal FROM exam_bank_items").all();
  let checkedAssets = 0;
  for (const item of items) {
    if (item.soal_img && item.soal_img.startsWith("/cbt_images/")) {
      const diskPath = path.join(publicDir, item.soal_img.replace(/^\//, ""));
      assert.ok(fs.existsSync(diskPath) && fs.statSync(diskPath).size > 0, `Diagram ${item.soal_img} untuk item ${item.id} harus ada di disk`);
      checkedAssets++;
    }
  }
  assert.ok(checkedAssets > 0, "Harus ada aset diagram yang terverifikasi");
});

test("Exam Bank: normalizeAnswer, isAnswerCorrect & calculateEstimatedIRT unit tests", () => {
  const { normalizeAnswer, isAnswerCorrect, calculateEstimatedIRT } = require("../server/routes/examBank");

  assert.equal(normalizeAnswer("A"), "a");
  assert.equal(normalizeAnswer("a; d"), "a;d");
  assert.equal(normalizeAnswer("d; a"), "a;d");
  assert.equal(normalizeAnswer("a,d"), "a;d");
  assert.equal(normalizeAnswer(""), "");
  assert.equal(normalizeAnswer(null), "");

  // Complex statements (pernyataan)
  assert.equal(normalizeAnswer("a:benar;b:salah;c:benar"), "a:benar;b:salah;c:benar");
  assert.equal(normalizeAnswer("b:salah; a:benar; c:benar"), "a:benar;b:salah;c:benar");
  assert.equal(normalizeAnswer("a : benar; b : salah"), "a:benar;b:salah");
  assert.equal(normalizeAnswer("A:BENAR;B:SALAH;C:BENAR"), "a:benar;b:salah;c:benar");

  // isAnswerCorrect checks
  assert.equal(isAnswerCorrect("a", "a", "pilihan_ganda"), true);
  assert.equal(isAnswerCorrect("b", "a", "pilihan_ganda"), false);
  assert.equal(isAnswerCorrect("c;d", "c;d", "pilihan_ganda_kompleks"), true);
  assert.equal(isAnswerCorrect("d;c", "c;d", "pilihan_ganda_kompleks"), true);
  assert.equal(isAnswerCorrect("C; D", "c;d", "pilihan_ganda_kompleks"), true);
  assert.equal(isAnswerCorrect("c", "c;d", "pilihan_ganda_kompleks"), false);
  assert.equal(isAnswerCorrect("a:benar;b:salah;c:benar", "a:benar;b:salah;c:benar", "pernyataan"), true);
  assert.equal(isAnswerCorrect("b:salah;c:benar;a:benar", "a:benar;b:salah;c:benar", "pernyataan"), true);
  assert.equal(isAnswerCorrect("a:benar;b:benar;c:benar", "a:benar;b:salah;c:benar", "pernyataan"), false);
  assert.equal(isAnswerCorrect("a:salah;b:benar;c:benar", "a:salah;b:benar", "pernyataan"), true);

  assert.equal(calculateEstimatedIRT(0, 40), 250);
  assert.equal(calculateEstimatedIRT(40, 40), 855);
  assert.equal(calculateEstimatedIRT(42, 46), 790);
});

test("Exam Bank: REST API Routes (Packages, Get One, Submit)", async () => {
  const { handleExamBankRoutes } = require("../server/routes/examBank");

  const mockSendJSON = (res, data, status = 200) => {
    res.status = status;
    res.data = data;
    return true;
  };

  // Setup test package & items in db
  db.prepare(`
    INSERT OR REPLACE INTO exam_bank_packages (
      id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions, created_at, updated_at
    ) VALUES ('test_pkg_api', 'pusmendik_tka', 'sma', 'wajib', 'Matematika', 'Paket 1', 2, 1000, 1000);
  `).run();

  db.prepare(`
    INSERT OR REPLACE INTO exam_bank_items (
      id, package_id, source, jenjang, subtes_or_mapel, paket, nomor, tipe_soal, bacaan, soal, soal_img, options_json, kunci_jawaban, kunci_jawaban_text, created_at
    ) VALUES (
      'test_pkg_api_01', 'test_pkg_api', 'pusmendik_tka', 'sma', 'Matematika', 'Paket 1', 1, 'pilihan_ganda', 'Stimulus 1', 'Hitung 1+1', '', '[{"id":"a","text":"1"},{"id":"b","text":"2"}]', 'b', '(B)', 1000
    );
  `).run();

  db.prepare(`
    INSERT OR REPLACE INTO exam_bank_items (
      id, package_id, source, jenjang, subtes_or_mapel, paket, nomor, tipe_soal, bacaan, soal, soal_img, options_json, kunci_jawaban, kunci_jawaban_text, created_at
    ) VALUES (
      'test_pkg_api_02', 'test_pkg_api', 'pusmendik_tka', 'sma', 'Matematika', 'Paket 1', 2, 'pilihan_ganda', '', 'Pilih benar', '', '[{"id":"a","text":"A"},{"id":"c","text":"C"}]', 'a;c', '(A;C)', 1000
    );
  `).run();

  // Test 1: GET /api/exam-bank/packages
  {
    const req = { method: "GET", url: "http://localhost/api/exam-bank/packages" };
    const res = {};
    const handled = await handleExamBankRoutes(req, res, "/api/exam-bank/packages", {
      sendJSON: mockSendJSON,
      getBody: async () => ({})
    });
    assert.ok(handled, "Route GET /api/exam-bank/packages harus ditangani");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data), "Hasil packages harus berupa array");
    const found = res.data.find(p => p.id === "test_pkg_api");
    assert.ok(found, "Paket test_pkg_api harus ada di list");
    assert.equal(found.subtes_or_mapel, "Matematika");
  }

  // Test 2: GET /api/exam-bank/packages/:id
  {
    const req = { method: "GET", url: "http://localhost/api/exam-bank/packages/test_pkg_api" };
    const res = {};
    const handled = await handleExamBankRoutes(req, res, "/api/exam-bank/packages/test_pkg_api", {
      sendJSON: mockSendJSON,
      getBody: async () => ({})
    });
    assert.ok(handled);
    assert.equal(res.status, 200);
    assert.equal(res.data.package.id, "test_pkg_api");
    assert.equal(res.data.items.length, 2);
    assert.equal(res.data.items[0].nomor, 1);
    assert.equal(res.data.items[0].options.length, 2);
    assert.equal(res.data.items[0].kunci_jawaban, "b");
  }

  // Test 3: POST /api/exam-bank/packages/:id/submit
  {
    const req = { method: "POST", url: "http://localhost/api/exam-bank/packages/test_pkg_api/submit" };
    const res = {};
    const handled = await handleExamBankRoutes(req, res, "/api/exam-bank/packages/test_pkg_api/submit", {
      sendJSON: mockSendJSON,
      getBody: async () => ({
        answers: { "1": "b", "2": "c;a" },
        time_spent_seconds: 120
      })
    });
    assert.ok(handled);
    assert.equal(res.status, 200);
    assert.equal(res.data.total, 2);
    assert.equal(res.data.answered, 2);
    assert.equal(res.data.correct, 2);
    assert.equal(res.data.score_percent, 100);
    assert.ok(res.data.estimated_irt >= 700);
    assert.equal(res.data.breakdown.length, 2);
    assert.equal(res.data.breakdown[0].is_correct, true);
    assert.equal(res.data.breakdown[1].is_correct, true);
    assert.ok(res.data.submission_id, "Submit harus mengembalikan submission_id");

    // Verifikasi tersimpan di tabel exam_bank_submissions
    const subRecord = db.prepare("SELECT * FROM exam_bank_submissions WHERE id = ?").get(res.data.submission_id);
    assert.ok(subRecord, "Data submission harus tersimpan di exam_bank_submissions");
    assert.equal(subRecord.package_id, "test_pkg_api");
    assert.equal(subRecord.correct_count, 2);

    // Verifikasi learner_events tercatat
    const event = db.prepare("SELECT * FROM learner_events WHERE doc_id = ? ORDER BY created_at DESC LIMIT 1").get("test_pkg_api");
    assert.ok(event, "Event learner_events harus tercatat");
  }

  // Test 3b: POST submit with wrong answer to test mistake_notebook recording
  {
    const req = { method: "POST", url: "http://localhost/api/exam-bank/packages/test_pkg_api/submit" };
    const res = {};
    const handled = await handleExamBankRoutes(req, res, "/api/exam-bank/packages/test_pkg_api/submit", {
      sendJSON: mockSendJSON,
      getBody: async () => ({
        answers: { "1": "a", "2": "b" },
        study_mode: "drill"
      })
    });
    assert.ok(handled);
    assert.equal(res.status, 200);
    assert.equal(res.data.correct, 0);

    // Verifikasi mistake tersimpan di mistake_notebook
    const mistakes = db.prepare("SELECT * FROM mistake_notebook WHERE doc_id = ?").all("test_pkg_api");
    assert.ok(mistakes.length > 0, "Mistake notebook harus menyimpan butir yang salah");
  }

  // Test 4: GET /api/exam-bank/submissions
  {
    const req = { method: "GET", url: "http://localhost/api/exam-bank/submissions?packageId=test_pkg_api" };
    const res = {};
    const handled = await handleExamBankRoutes(req, res, "/api/exam-bank/submissions", {
      sendJSON: mockSendJSON,
      getBody: async () => ({})
    });
    assert.ok(handled);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.submissions), "submissions harus berupa array");
    assert.ok(res.data.submissions.length >= 2, "Harus ada minimal 2 riwayat submission");
    assert.equal(res.data.submissions[0].packageId, "test_pkg_api");
  }

  // Cleanup test artifacts so they do not pollute live database
  db.prepare("DELETE FROM exam_bank_submissions WHERE package_id = 'test_pkg_api';").run();
  db.prepare("DELETE FROM mistake_notebook WHERE doc_id = 'test_pkg_api';").run();
  db.prepare("DELETE FROM learner_events WHERE doc_id = 'test_pkg_api';").run();
  db.prepare("DELETE FROM exam_bank_items WHERE package_id = 'test_pkg_api';").run();
  db.prepare("DELETE FROM exam_bank_packages WHERE id = 'test_pkg_api';").run();
});
