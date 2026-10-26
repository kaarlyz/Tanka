const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { db, runMigrations, cleanOrphanedRecords } = require("../server/db");
const { handleExamBankRoutes, getDeduplicatedSoalText } = require("../server/routes/examBank");

// Mock helper to collect JSON responses
function createMockHelpers(overrides = {}) {
  return {
    sendJSON: (res, data, status = 200) => {
      res.status = status;
      res.data = data;
      return true;
    },
    getBody: async (req) => req.body || {},
    getUserId: (req) => {
      const fromHeader = req.headers && (req.headers["x-user-id"] || req.headers["x-session-id"]);
      if (fromHeader) return fromHeader;
      try {
        const urlObj = new URL(req.url, "http://localhost");
        return urlObj.searchParams.get("userId") || "anon";
      } catch {
        return "anon";
      }
    },
    getSessionUser: (req) => {
      if (req.user) return req.user;
      return null;
    },
    ...overrides
  };
}

test("CBT Cloud Session Sync: Schema & Table Migration Check", () => {
  const memDb = new DatabaseSync(":memory:");
  runMigrations(memDb);

  const tables = memDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'cbt_active_sessions'").all();
  assert.equal(tables.length, 1, "Tabel cbt_active_sessions wajib terbuat di database");

  const columns = memDb.prepare("PRAGMA table_info(cbt_active_sessions)").all();
  const colNames = columns.map(c => c.name);

  assert.ok(colNames.includes("user_id"), "Kolom user_id harus ada");
  assert.ok(colNames.includes("package_id"), "Kolom package_id harus ada");
  assert.ok(colNames.includes("current_index"), "Kolom current_index harus ada");
  assert.ok(colNames.includes("answers_json"), "Kolom answers_json harus ada");
  assert.ok(colNames.includes("doubtful_json"), "Kolom doubtful_json harus ada");
  assert.ok(colNames.includes("drill_checked_json"), "Kolom drill_checked_json harus ada");
  assert.ok(colNames.includes("time_left"), "Kolom time_left harus ada");
  assert.ok(colNames.includes("study_mode"), "Kolom study_mode harus ada");
  assert.ok(colNames.includes("updated_at"), "Kolom updated_at harus ada");

  const indexes = memDb.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name = 'idx_cbt_active_sessions_pkg'").all();
  assert.equal(indexes.length, 1, "Indeks idx_cbt_active_sessions_pkg wajib terpasang");
});

test("CBT Cloud Session Sync: Endpoints GET/POST/DELETE simpan & pulihkan sesi antar perangkat", async () => {
  const helpers = createMockHelpers();
  const testUserId = "user_device_sync_001";
  const testPkgId = "pkg_sync_cross_device";

  // Setup paket dummy dan butir soal di DB
  const now = Date.now();
  db.prepare(`
    INSERT OR REPLACE INTO exam_bank_packages (
      id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions, created_at, updated_at
    ) VALUES (?, 'pusmendik_tka', 'SMA', 'wajib', 'Bahasa Indonesia', 'Paket Simulasi Sync', 2, ?, ?)
  `).run(testPkgId, now, now);

  db.prepare(`
    INSERT OR REPLACE INTO exam_bank_items (
      id, package_id, source, jenjang, subtes_or_mapel, paket, nomor, tipe_soal, bacaan, soal, options_json, kunci_jawaban, created_at
    ) VALUES (?, ?, 'pusmendik_tka', 'SMA', 'Bahasa Indonesia', 'Paket Simulasi Sync', 1, 'pilihan_ganda', 'Wacana Utama', 'Soal 1', '["A","B"]', 'a', ?)
  `).run(`${testPkgId}_1`, testPkgId, now);

  db.prepare(`
    INSERT OR REPLACE INTO exam_bank_items (
      id, package_id, source, jenjang, subtes_or_mapel, paket, nomor, tipe_soal, bacaan, soal, options_json, kunci_jawaban, created_at
    ) VALUES (?, ?, 'pusmendik_tka', 'SMA', 'Bahasa Indonesia', 'Paket Simulasi Sync', 2, 'pilihan_ganda', 'Wacana Utama', 'Soal 2', '["A","B"]', 'b', ?)
  `).run(`${testPkgId}_2`, testPkgId, now);

  // 1. Simpan sesi aktif dari Device A (HP) via POST /api/exam-bank/session
  {
    const req = {
      method: "POST",
      url: "http://localhost/api/exam-bank/session",
      headers: { "x-user-id": testUserId },
      body: {
        userId: testUserId,
        packageId: testPkgId,
        currentIndex: 1,
        answers: { "1": "a" },
        doubtful: { "1": false, "2": true },
        drillChecked: {},
        timeLeft: 1450,
        studyMode: "exam"
      }
    };
    const res = {};
    const handled = await handleExamBankRoutes(req, res, "/api/exam-bank/session", helpers);
    assert.ok(handled, "POST /api/exam-bank/session harus ditangani");
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
  }

  // 2. Pulihkan sesi aktif dari Device B (Laptop) via GET /api/exam-bank/session
  {
    const req = {
      method: "GET",
      url: `http://localhost/api/exam-bank/session?userId=${testUserId}`,
      headers: { "x-user-id": testUserId }
    };
    const res = {};
    const handled = await handleExamBankRoutes(req, res, "/api/exam-bank/session", helpers);
    assert.ok(handled, "GET /api/exam-bank/session harus ditangani");
    assert.equal(res.status, 200);
    assert.ok(res.data.session, "Sesi aktif harus dikembalikan");
    assert.equal(res.data.session.userId, testUserId);
    assert.equal(res.data.session.packageId, testPkgId);
    assert.equal(res.data.session.currentIndex, 1);
    assert.deepEqual(res.data.session.answers, { "1": "a" });
    assert.equal(res.data.session.doubtful["2"], true);
    assert.equal(res.data.session.timeLeft, 1450);
    assert.equal(res.data.session.studyMode, "exam");
    assert.ok(res.data.session.package, "Metadata paket harus disertakan");
    assert.equal(res.data.session.package.id, testPkgId);
    assert.equal(res.data.session.items.length, 2, "Dua butir soal harus disertakan");
  }

  // 3. Update progres sesi (upsert) dari Device B
  {
    const req = {
      method: "POST",
      url: "http://localhost/api/exam-bank/session",
      headers: { "x-user-id": testUserId },
      body: {
        userId: testUserId,
        packageId: testPkgId,
        currentIndex: 2,
        answers: { "1": "a", "2": "b" },
        doubtful: {},
        drillChecked: { "1": true },
        timeLeft: 1100,
        studyMode: "drill"
      }
    };
    const res = {};
    await handleExamBankRoutes(req, res, "/api/exam-bank/session", helpers);
    assert.equal(res.status, 200);
  }

  // Verifikasi hasil upsert
  {
    const req = {
      method: "GET",
      url: `http://localhost/api/exam-bank/session?userId=${testUserId}`,
      headers: { "x-user-id": testUserId }
    };
    const res = {};
    await handleExamBankRoutes(req, res, "/api/exam-bank/session", helpers);
    assert.equal(res.data.session.currentIndex, 2);
    assert.deepEqual(res.data.session.answers, { "1": "a", "2": "b" });
    assert.equal(res.data.session.studyMode, "drill");
    assert.equal(res.data.session.timeLeft, 1100);
  }

  // 4. Hapus sesi aktif via DELETE /api/exam-bank/session
  {
    const req = {
      method: "DELETE",
      url: `http://localhost/api/exam-bank/session?userId=${testUserId}`,
      headers: { "x-user-id": testUserId }
    };
    const res = {};
    const handled = await handleExamBankRoutes(req, res, "/api/exam-bank/session", helpers);
    assert.ok(handled);
    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
  }

  // Verifikasi sesi kosong setelah DELETE
  {
    const req = {
      method: "GET",
      url: `http://localhost/api/exam-bank/session?userId=${testUserId}`,
      headers: { "x-user-id": testUserId }
    };
    const res = {};
    await handleExamBankRoutes(req, res, "/api/exam-bank/session", helpers);
    assert.equal(res.status, 200);
    assert.equal(res.data.session, null, "Sesi harus bernilai null setelah dihapus");
  }

  // Cleanup
  db.prepare("DELETE FROM exam_bank_items WHERE package_id = ?").run(testPkgId);
  db.prepare("DELETE FROM exam_bank_packages WHERE id = ?").run(testPkgId);
  db.prepare("DELETE FROM cbt_active_sessions WHERE user_id = ?").run(testUserId);
});

test("CBT Cloud Session Sync: Sesi aktif terhapus bersih saat ujian di-submit", async () => {
  const helpers = createMockHelpers();
  const testUserId = "user_submit_cleanup_002";
  const testPkgId = "pkg_submit_cleanup_002";
  const now = Date.now();

  db.prepare(`
    INSERT OR REPLACE INTO exam_bank_packages (
      id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions, created_at, updated_at
    ) VALUES (?, 'pusmendik_tka', 'SMA', 'wajib', 'Sosiologi', 'Paket Cleanup', 1, ?, ?)
  `).run(testPkgId, now, now);

  db.prepare(`
    INSERT OR REPLACE INTO exam_bank_items (
      id, package_id, source, jenjang, subtes_or_mapel, paket, nomor, tipe_soal, soal, options_json, kunci_jawaban, created_at
    ) VALUES (?, ?, 'pusmendik_tka', 'SMA', 'Sosiologi', 'Paket Cleanup', 1, 'pilihan_ganda', 'Soal 1', '["A","B"]', 'a', ?)
  `).run(`${testPkgId}_1`, testPkgId, now);

  // Buat sesi aktif terlebih dahulu
  db.prepare(`
    INSERT OR REPLACE INTO cbt_active_sessions (
      user_id, package_id, current_index, answers_json, time_left, study_mode, updated_at
    ) VALUES (?, ?, 0, '{"1":"a"}', 1800, 'exam', ?)
  `).run(testUserId, testPkgId, now);

  // Submit ujian via POST /api/exam-bank/packages/:id/submit
  const req = {
    method: "POST",
    url: `http://localhost/api/exam-bank/packages/${testPkgId}/submit`,
    headers: { "x-user-id": testUserId },
    body: {
      userId: testUserId,
      answers: { "1": "a" },
      time_spent_seconds: 300
    }
  };
  const res = {};
  const handled = await handleExamBankRoutes(req, res, `/api/exam-bank/packages/${testPkgId}/submit`, helpers);
  assert.ok(handled);
  assert.equal(res.status, 200);
  assert.equal(res.data.correct, 1);

  // Verifikasi record di cbt_active_sessions otomatis terhapus
  const row = db.prepare("SELECT * FROM cbt_active_sessions WHERE user_id = ?").get(testUserId);
  assert.equal(row, undefined, "Sesi aktif cbt_active_sessions harus terhapus bersih setelah submit");

  // Cleanup
  db.prepare("DELETE FROM exam_bank_items WHERE package_id = ?").run(testPkgId);
  db.prepare("DELETE FROM exam_bank_packages WHERE id = ?").run(testPkgId);
});

test("CBT Deduplication: Helper getDeduplicatedSoalText membersihkan teks wacana duplikat", () => {
  const bacaan = "Revolusi industri 4.0 membawa pergeseran signifikan pada pola ketenagakerjaan dunia modern.";

  // Kasus 1: Soal memuat tag <div class="exam-bacaan"> yang menduplikasi wacana
  const soalWithTag = `<div class="exam-bacaan">${bacaan}</div><p>Berdasarkan informasi di atas, apakah faktor pendorong utama perubahan tersebut?</p>`;
  const cleaned1 = getDeduplicatedSoalText(soalWithTag, bacaan);
  assert.equal(cleaned1, "<p>Berdasarkan informasi di atas, apakah faktor pendorong utama perubahan tersebut?</p>");

  // Kasus 2: Paragraf awal soal duplikat persis dengan bacaan
  const soalWithPara = `<p>Revolusi industri 4.0 membawa pergeseran signifikan pada pola ketenagakerjaan dunia modern.</p><p>Apakah simpulan yang paling tepat dari wacana tersebut?</p>`;
  const cleaned2 = getDeduplicatedSoalText(soalWithPara, bacaan);
  assert.equal(cleaned2, "<p>Apakah simpulan yang paling tepat dari wacana tersebut?</p>");

  // Kasus 3: Soal multiline dengan wacana di baris awal
  const soalMultiline = `Revolusi industri 4.0 membawa pergeseran signifikan pada pola ketenagakerjaan dunia modern.\n\nManakah pernyataan yang tidak sesuai?`;
  const cleaned3 = getDeduplicatedSoalText(soalMultiline, bacaan);
  assert.equal(cleaned3, "Manakah pernyataan yang tidak sesuai?");

  // Kasus 4: Soal mandiri tanpa wacana duplikat tidak boleh dipotong
  const soalPure = "Berapakah nilai elastisitas permintaan pada kondisi ekuilibrium pasar?";
  const cleaned4 = getDeduplicatedSoalText(soalPure, bacaan);
  assert.equal(cleaned4, soalPure);

  // Kasus 5: Bacaan kosong atau null harus mengembalikan soal asli
  assert.equal(getDeduplicatedSoalText(soalPure, null), soalPure);
  assert.equal(getDeduplicatedSoalText(soalPure, ""), soalPure);
  assert.equal(getDeduplicatedSoalText("", bacaan), "");
});

test("CBT Frontend Integration: ExamCbtTab mengintegrasikan auto-save, auto-resume, dan deduplikasi desktop", () => {
  const cbtPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  assert.ok(fs.existsSync(cbtPath), "ExamCbtTab.tsx wajib ada");

  const content = fs.readFileSync(cbtPath, "utf-8");

  // 1. Verifikasi fungsi getDeduplicatedSoalText diekspor dan didefinisikan
  assert.match(content, /export function getDeduplicatedSoalText\(/, "getDeduplicatedSoalText wajib diekspor di ExamCbtTab.tsx");

  // 2. Verifikasi pemanggilan getDeduplicatedSoalText di panel kanan soal saat shouldShowWacana aktif
  assert.match(
    content,
    /content=\{\s*shouldShowWacana\s*\?\s*getDeduplicatedSoalText\(currentItem\.soal,\s*currentItem\.bacaan\)\s*:\s*currentItem\.soal\s*\}/,
    "Panel kanan soal desktop wajib menggunakan getDeduplicatedSoalText saat shouldShowWacana bernilai true"
  );

  // 3. Verifikasi Cloud Auto-Save debounced effect memanggil POST /api/exam-bank/session
  assert.match(content, /fetch\(["']\/api\/exam-bank\/session["'],\s*\{\s*method:\s*["']POST["']/, "ExamCbtTab wajib memuat Cloud Auto-Save effect ke POST /api/exam-bank/session");

  // 4. Verifikasi Cloud Auto-Resume effect pada mount memanggil GET /api/exam-bank/session
  assert.match(content, /\/api\/exam-bank\/session\?userId=/, "ExamCbtTab wajib memuat Cloud Resume effect ke GET /api/exam-bank/session");

  // 5. Verifikasi pembersihan cloud session saat ujian disubmit
  assert.match(content, /fetch\(["']\/api\/exam-bank\/session["'],\s*\{\s*method:\s*["']DELETE["']/, "ExamCbtTab wajib memanggil DELETE /api/exam-bank/session saat handleSubmitExam");
});
