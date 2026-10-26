const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { db, runMigrations, cleanOrphanedRecords } = require("../server/db");
const { handleExamBankRoutes } = require("../server/routes/examBank");

test("CBT Drill Persistence: Schema & Orphan Cleanup Verification", () => {
  const memDb = new DatabaseSync(":memory:");
  runMigrations(memDb);

  // 1. Table exists
  const tables = memDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='exam_bank_submissions'").all();
  assert.equal(tables.length, 1, "Tabel exam_bank_submissions harus terdaftar di skema");

  // 2. Indexes exist
  const indexes = memDb.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_exam_bank_submissions%'").all().map(i => i.name);
  assert.ok(indexes.includes("idx_exam_bank_submissions_user"), "Indeks user_id harus ada");
  assert.ok(indexes.includes("idx_exam_bank_submissions_pkg"), "Indeks package_id harus ada");
  assert.ok(indexes.includes("idx_exam_bank_submissions_created"), "Indeks created_at harus ada");

  // 3. cleanOrphanedRecords handles orphan submissions
  memDb.prepare(`
    INSERT INTO exam_bank_packages (
      id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions, created_at, updated_at
    ) VALUES ('pkg_valid', 'ai_drill', 'SMA', 'wajib', 'Bahasa Inggris', 'Paket Drill 1', 1, 1000, 1000);
  `).run();

  memDb.prepare(`
    INSERT INTO exam_bank_packages (
      id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions, created_at, updated_at
    ) VALUES ('pkg_orphan', 'ai_drill', 'SMA', 'wajib', 'Bahasa Inggris', 'Paket Drill 2', 1, 1000, 1000);
  `).run();

  memDb.prepare(`
    INSERT INTO exam_bank_submissions (
      id, user_id, package_id, package_title, total_questions, answered_count, correct_count, score_percent, estimated_irt, created_at
    ) VALUES ('sub_valid', 'anon', 'pkg_valid', 'Bahasa Inggris Drill 1', 1, 1, 1, 100, 855, 1000);
  `).run();

  memDb.prepare(`
    INSERT INTO exam_bank_submissions (
      id, user_id, package_id, package_title, total_questions, answered_count, correct_count, score_percent, estimated_irt, created_at
    ) VALUES ('sub_orphan', 'anon', 'pkg_orphan', 'Bahasa Inggris Drill 2', 1, 1, 0, 0, 250, 1000);
  `).run();

  memDb.exec("PRAGMA foreign_keys = OFF;");
  memDb.prepare("DELETE FROM exam_bank_packages WHERE id = 'pkg_orphan'").run();
  memDb.exec("PRAGMA foreign_keys = ON;");

  cleanOrphanedRecords(memDb);

  const remainingSubs = memDb.prepare("SELECT id FROM exam_bank_submissions").all();
  assert.equal(remainingSubs.length, 1);
  assert.equal(remainingSubs[0].id, "sub_valid");
});

test("CBT Drill Persistence: Submit, Mistake Recording, and Submissions List API", async () => {
  const mockSendJSON = (res, data, status = 200) => {
    res.status = status;
    res.data = data;
    return true;
  };

  const testPkgId = "pkg_drill_test_" + Date.now();
  db.prepare(`
    INSERT INTO exam_bank_packages (
      id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions, created_at, updated_at
    ) VALUES (?, 'ai_drill', 'SMA', 'wajib', 'Bahasa Inggris', 'Drill 01', 2, 1000, 1000)
  `).run(testPkgId);

  db.prepare(`
    INSERT INTO exam_bank_items (
      id, package_id, source, jenjang, subtes_or_mapel, paket, nomor, tipe_soal, soal, options_json, kunci_jawaban, kunci_jawaban_text, created_at
    ) VALUES (?, ?, 'ai_drill', 'SMA', 'Bahasa Inggris', 'Drill 01', 1, 'pilihan_ganda', 'What is the main idea?', '[{"id":"a","text":"Option A"},{"id":"b","text":"Option B"}]', 'a', '(A)', 1000)
  `).run(testPkgId + "_i1", testPkgId);

  db.prepare(`
    INSERT INTO exam_bank_items (
      id, package_id, source, jenjang, subtes_or_mapel, paket, nomor, tipe_soal, soal, options_json, kunci_jawaban, kunci_jawaban_text, created_at
    ) VALUES (?, ?, 'ai_drill', 'SMA', 'Bahasa Inggris', 'Drill 01', 2, 'pilihan_ganda', 'Identify tone', '[{"id":"a","text":"Critical"},{"id":"b","text":"Neutral"}]', 'b', '(B)', 1000)
  `).run(testPkgId + "_i2", testPkgId);

  // 1. Submit exam with 1 correct and 1 incorrect answer
  {
    const req = { method: "POST", url: `http://localhost/api/exam-bank/packages/${testPkgId}/submit` };
    const res = {};
    const handled = await handleExamBankRoutes(req, res, `/api/exam-bank/packages/${testPkgId}/submit`, {
      sendJSON: mockSendJSON,
      getBody: async () => ({
        answers: { "1": "a", "2": "a" }, // Q1 correct (a=a), Q2 wrong (user a, key b)
        time_spent_seconds: 60,
        study_mode: "drill",
        userId: "test_user_cbt_085"
      })
    });

    assert.ok(handled);
    assert.equal(res.status, 200);
    assert.equal(res.data.total, 2);
    assert.equal(res.data.correct, 1);
    assert.equal(res.data.score_percent, 50);
    assert.ok(res.data.submission_id, "Submission ID harus dikembalikan");

    // Check submission persisted
    const submission = db.prepare("SELECT * FROM exam_bank_submissions WHERE id = ?").get(res.data.submission_id);
    assert.ok(submission, "Submission harus tersimpan di exam_bank_submissions");
    assert.equal(submission.package_id, testPkgId);
    assert.equal(submission.study_mode, "drill");
    assert.equal(submission.correct_count, 1);

    // Check mistake recorded to mistake_notebook for wrong question Q2
    const mistake = db.prepare("SELECT * FROM mistake_notebook WHERE doc_id = ? AND user_id = ?").get(testPkgId, "test_user_cbt_085");
    assert.ok(mistake, "Butir yang salah harus tercatat di mistake_notebook");
    assert.equal(mistake.question, "Identify tone");
    assert.equal(mistake.correct_index, 1); // b = index 1
    assert.equal(mistake.user_answer_index, 0); // a = index 0

    // Check learner_events recorded
    const event = db.prepare("SELECT * FROM learner_events WHERE doc_id = ? AND user_id = ?").get(testPkgId, "test_user_cbt_085");
    assert.ok(event, "Event learner_events harus tercatat");
    assert.equal(event.activity_type, "exam_drill");
  }

  // 2. Query GET /api/exam-bank/submissions
  {
    const req = { method: "GET", url: `http://localhost/api/exam-bank/submissions?packageId=${testPkgId}&userId=test_user_cbt_085` };
    const res = {};
    const handled = await handleExamBankRoutes(req, res, "/api/exam-bank/submissions", {
      sendJSON: mockSendJSON,
      getBody: async () => ({})
    });

    assert.ok(handled);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.submissions));
    assert.equal(res.data.submissions.length, 1);
    assert.equal(res.data.submissions[0].packageId, testPkgId);
    assert.equal(res.data.submissions[0].studyMode, "drill");
    assert.equal(res.data.submissions[0].scorePercent, 50);
  }

  // Cleanup
  db.prepare("DELETE FROM exam_bank_submissions WHERE package_id = ?").run(testPkgId);
  db.prepare("DELETE FROM mistake_notebook WHERE doc_id = ?").run(testPkgId);
  db.prepare("DELETE FROM learner_events WHERE doc_id = ?").run(testPkgId);
  db.prepare("DELETE FROM exam_bank_items WHERE package_id = ?").run(testPkgId);
  db.prepare("DELETE FROM exam_bank_packages WHERE id = ?").run(testPkgId);
});

test("CBT UI/UX Standard Pusmendik: ExamCbtTab Component Code Verification", () => {
  const cbtTabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const code = fs.readFileSync(cbtTabPath, "utf-8");

  // 1. Radio circle A-E (28px round indicator with letter inside)
  assert.match(
    code,
    /<motion\.span[\s\S]*?borderRadius:\s*["']50%["'][\s\S]*?\{opt\.id\.toUpperCase\(\)\}/,
    "Radio circle bulat A-E harus dirender dengan huruf opsi di dalamnya"
  );

  // 2. Keyboard shortcuts A-E, R, Arrow keys
  assert.match(
    code,
    /window\.addEventListener\(["']keydown["'],\s*handleGlobalKeyDown\)/,
    "Keyboard event listener global harus terpasang saat CBT runner aktif"
  );
  assert.match(
    code,
    /\["a",\s*"b",\s*"c",\s*"d",\s*"e"\]\.includes\(key\)/,
    "Keyboard shortcut A-E harus didukung untuk pemilihan opsi cepat"
  );
  assert.match(
    code,
    /key\s*===\s*["']r["'][\s\S]*?handleToggleDoubtful/,
    "Keyboard shortcut R harus didukung untuk toggle ragu-ragu"
  );

  // 3. Pusmendik color palette (Biru Aktif, Hijau Dijawab, Kuning Ragu-ragu, Abu-abu Belum)
  assert.match(
    code,
    /backgroundColor:\s*["']#16a34a["'][\s\S]*?Dijawab/,
    "Palet Pusmendik: Warna hijau #16a34a untuk status Dijawab"
  );
  assert.match(
    code,
    /backgroundColor:\s*["']#fef08a["'][\s\S]*?Ragu-ragu/,
    "Palet Pusmendik: Warna kuning #fef08a untuk status Ragu-ragu"
  );
  assert.match(
    code,
    /backgroundColor:\s*["']#f1f5f9["'][\s\S]*?Belum/,
    "Palet Pusmendik: Warna abu-abu #f1f5f9 untuk status Belum Dijawab"
  );

  // 4. Riwayat Pengerjaan & AI Drill Filter Integration
  assert.match(
    code,
    /id:\s*["']history["']\s*as\s*const,\s*label:\s*["']Riwayat["']/,
    "Tab Riwayat harus terdaftar di segmented switcher"
  );
  assert.match(
    code,
    /\/api\/exam-bank\/submissions/,
    "ExamCbtTab harus memanggil endpoint /api/exam-bank/submissions"
  );
});
