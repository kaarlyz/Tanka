const test = require("node:test");
const assert = require("node:assert/strict");
const { db, runMigrations } = require("../server/db");
const { handleAuthRoutes, createSessionToken } = require("../server/routes/auth");
const { handleUsersRoutes } = require("../server/routes/users");
const { handleDocumentsRoutes } = require("../server/routes/documents");
const { handleMistakesRoutes } = require("../server/routes/mistakes");
const { handleChatRoutes } = require("../server/routes/chat");
const { handleRoomsRoutes } = require("../server/routes/rooms");
const { handleFlashcardsRoutes } = require("../server/routes/flashcards");

function createMock(method, path, body = {}, headers = {}) {
  let status = 200;
  let data = null;
  const res = {
    headersSent: false,
    writeHead: (st) => { status = st; },
    end: (content) => {
      try { data = JSON.parse(content); } catch { data = content; }
    }
  };
  const helpers = {
    sendJSON: (r, payload, st = 200) => {
      status = st;
      data = payload;
      return true;
    },
    getBody: async () => body
  };
  const req = {
    method,
    url: path,
    headers: { ...headers }
  };
  return { req, res, helpers, getResult: () => ({ status, data }) };
}

test("Security: PATCH /api/users/profile tanpa token ditolak 401", async () => {
  runMigrations(db);
  const mock = createMock("PATCH", "/api/users/profile", { id: "usr_victim_1", name: "Hacked" });
  await handleUsersRoutes(mock.req, mock.res, "/api/users/profile", mock.helpers);
  const res = mock.getResult();

  assert.equal(res.status, 401);
  assert.match(res.data.error, /autentikasi/i);
});

test("Security: PATCH /api/users/profile dengan token beda user ditolak 403 (IDOR prevention)", async () => {
  runMigrations(db);

  // Buat 2 user
  const victimId = `usr_victim_${Date.now()}`;
  const attackerId = `usr_attacker_${Date.now()}`;
  const now = Date.now();

  db.prepare("INSERT INTO users (id, username, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)").run(
    victimId, `victim_${Date.now()}`, "hash1", "Victim Name", now
  );
  db.prepare("INSERT INTO users (id, username, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)").run(
    attackerId, `attacker_${Date.now()}`, "hash2", "Attacker Name", now
  );

  // Attacker punya valid token
  const { token: attackerToken } = createSessionToken(attackerId);

  // Attacker mencoba patch profile victim
  const mock = createMock(
    "PATCH",
    "/api/users/profile",
    { id: victimId, name: "Victim Defaced!" },
    { authorization: `Bearer ${attackerToken}` }
  );
  await handleUsersRoutes(mock.req, mock.res, "/api/users/profile", mock.helpers);
  const res = mock.getResult();

  assert.equal(res.status, 403);
  assert.match(res.data.error, /akses ditolak/i);

  // Verifikasi data victim tidak berubah
  const victimRow = db.prepare("SELECT name FROM users WHERE id = ?").get(victimId);
  assert.equal(victimRow.name, "Victim Name");
});

test("Security: PATCH /api/users/profile dengan valid token user sendiri sukses 200", async () => {
  runMigrations(db);

  const userId = `usr_legit_${Date.now()}`;
  const now = Date.now();
  db.prepare("INSERT INTO users (id, username, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)").run(
    userId, `legit_${Date.now()}`, "hash3", "Original Name", now
  );

  const { token } = createSessionToken(userId);

  const mock = createMock(
    "PATCH",
    "/api/users/profile",
    { id: userId, name: "Legit Updated Name", bio: "Belajar tekun" },
    { authorization: `Bearer ${token}` }
  );
  await handleUsersRoutes(mock.req, mock.res, "/api/users/profile", mock.helpers);
  const res = mock.getResult();

  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.user.name, "Legit Updated Name");

  const row = db.prepare("SELECT name, bio FROM users WHERE id = ?").get(userId);
  assert.equal(row.name, "Legit Updated Name");
  assert.equal(row.bio, "Belajar tekun");
});

test("Security: POST /api/users/activity tanpa token atau beda user ditolak", async () => {
  runMigrations(db);

  // Tanpa token -> 401
  const mockNoAuth = createMock("POST", "/api/users/activity", { userId: "usr_any", minutes: 100 });
  await handleUsersRoutes(mockNoAuth.req, mockNoAuth.res, "/api/users/activity", mockNoAuth.helpers);
  assert.equal(mockNoAuth.getResult().status, 401);

  // Beda user -> 403
  const victimId = `usr_vic_act_${Date.now()}`;
  const attackerId = `usr_att_act_${Date.now()}`;
  db.prepare("INSERT INTO users (id, username, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)").run(
    victimId, `vicact_${Date.now()}`, "h", "V", Date.now()
  );
  db.prepare("INSERT INTO users (id, username, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)").run(
    attackerId, `attact_${Date.now()}`, "h", "A", Date.now()
  );

  const { token: attackerToken } = createSessionToken(attackerId);
  const mockIDOR = createMock(
    "POST",
    "/api/users/activity",
    { userId: victimId, minutes: 999 },
    { authorization: `Bearer ${attackerToken}` }
  );
  await handleUsersRoutes(mockIDOR.req, mockIDOR.res, "/api/users/activity", mockIDOR.helpers);
  assert.equal(mockIDOR.getResult().status, 403);
});

test("Security: DELETE /api/documents bulk delete dinonaktifkan (403)", async () => {
  runMigrations(db);
  const mock = createMock("DELETE", "/api/documents");
  await handleDocumentsRoutes(mock.req, mock.res, "/api/documents", mock.helpers);
  const res = mock.getResult();

  assert.equal(res.status, 403);
  assert.match(res.data.error, /dinonaktifkan/i);
});

test("Security: DELETE /api/mistakes/:id milik user lain ditolak 403", async () => {
  runMigrations(db);

  const victimId = `usr_vic_mst_${Date.now()}`;
  const attackerId = `usr_att_mst_${Date.now()}`;
  const mistakeId = `mst_target_${Date.now()}`;

  db.prepare("INSERT INTO users (id, username, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)").run(
    victimId, `vicmst_${Date.now()}`, "h", "Victim", Date.now()
  );
  db.prepare("INSERT INTO users (id, username, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)").run(
    attackerId, `attmst_${Date.now()}`, "h", "Attacker", Date.now()
  );

  db.prepare(`
    INSERT INTO mistake_notebook (id, user_id, doc_id, question, options, correct_index, user_answer_index, created_at, updated_at)
    VALUES (?, ?, 'doc_1', 'Soal 1', '["A","B"]', 0, 1, ?, ?)
  `).run(mistakeId, victimId, Date.now(), Date.now());

  const { token: attackerToken } = createSessionToken(attackerId);

  // Attacker coba hapus mistake victim
  const mock = createMock("DELETE", `/api/mistakes/${mistakeId}`, {}, { authorization: `Bearer ${attackerToken}` });
  await handleMistakesRoutes(mock.req, mock.res, `/api/mistakes/${mistakeId}`, mock.helpers);
  assert.equal(mock.getResult().status, 403);

  // Attacker coba resolve mistake victim
  const mockResolve = createMock("POST", `/api/mistakes/${mistakeId}/resolve`, {}, { authorization: `Bearer ${attackerToken}` });
  await handleMistakesRoutes(mockResolve.req, mockResolve.res, `/api/mistakes/${mistakeId}/resolve`, mockResolve.helpers);
  assert.equal(mockResolve.getResult().status, 403);

  // Pastikan record di DB masih ada dan unresolved
  const row = db.prepare("SELECT resolved FROM mistake_notebook WHERE id = ?").get(mistakeId);
  assert.equal(row.resolved, 0);
});

test("Security: DELETE /api/documents/:id/chat dengan userId target tanpa token ditolak 401", async () => {
  runMigrations(db);

  const victimId = `usr_vic_chat_${Date.now()}`;
  const mock = createMock("DELETE", `/api/documents/global/chat?userId=${victimId}`);
  await handleChatRoutes(mock.req, mock.res, `/api/documents/global/chat`, mock.helpers);
  assert.equal(mock.getResult().status, 401);
});

test("Security: WhatsApp OTP max 5 attempts lockout (Brute-force protection)", async () => {
  runMigrations(db);

  const phone = `62899${Math.floor(1000000 + Math.random() * 9000000)}`;
  const mockSend = createMock("POST", "/api/auth/whatsapp/send-otp", { phone });
  await handleAuthRoutes(mockSend.req, mockSend.res, "/api/auth/whatsapp/send-otp", mockSend.helpers);
  assert.equal(mockSend.getResult().status, 200);

  // 5x wrong attempts
  for (let i = 0; i < 5; i++) {
    const mockWrong = createMock("POST", "/api/auth/whatsapp/verify", { phone, code: "000000" });
    await handleAuthRoutes(mockWrong.req, mockWrong.res, "/api/auth/whatsapp/verify", mockWrong.helpers);
  }

  // Percobaan ke-6 harus ditolak 429 atau 400 karena terkunci
  const mockLocked = createMock("POST", "/api/auth/whatsapp/verify", { phone, code: "000000" });
  await handleAuthRoutes(mockLocked.req, mockLocked.res, "/api/auth/whatsapp/verify", mockLocked.helpers);
  assert.ok([400, 429].includes(mockLocked.getResult().status));
});

test("Security: POST /api/rooms/:id/start bukan oleh host ditolak 403", async () => {
  runMigrations(db);

  const hostId = `usr_host_${Date.now()}`;
  const imposterId = `usr_imposter_${Date.now()}`;
  const roomId = `room_sec_${Date.now()}`;

  db.prepare("INSERT INTO users (id, username, password_hash, name, created_at) VALUES (?, ?, 'h', 'Host', ?)").run(
    hostId, `host_${Date.now()}`, Date.now()
  );
  db.prepare("INSERT INTO users (id, username, password_hash, name, created_at) VALUES (?, ?, 'h', 'Imposter', ?)").run(
    imposterId, `imposter_${Date.now()}`, Date.now()
  );

  db.prepare(`
    INSERT INTO study_rooms (id, doc_id, title, host_user_id, host_name, status, quiz_count, created_at)
    VALUES (?, 'doc_1', 'Room Test', ?, 'Host', 'waiting', 5, ?)
  `).run(roomId, hostId, Date.now());

  const { token: imposterToken } = createSessionToken(imposterId);

  // Imposter mengirim request start
  const mock = createMock("POST", `/api/rooms/${roomId}/start`, { userId: imposterId }, { authorization: `Bearer ${imposterToken}` });
  await handleRoomsRoutes(mock.req, mock.res, `/api/rooms/${roomId}/start`, mock.helpers);
  assert.equal(mock.getResult().status, 403);
});

test("Security: POST /api/rooms/:id/submit menolak spoofing userId pengguna lain", async () => {
  runMigrations(db);

  const victimId = `usr_vic_submit_${Date.now()}`;
  const attackerId = `usr_att_submit_${Date.now()}`;
  const roomId = `room_sub_${Date.now()}`;

  db.prepare("INSERT INTO users (id, username, password_hash, name, created_at) VALUES (?, ?, 'h', 'Victim', ?)").run(
    victimId, `vic_${Date.now()}`, Date.now()
  );
  db.prepare("INSERT INTO users (id, username, password_hash, name, created_at) VALUES (?, ?, 'h', 'Attacker', ?)").run(
    attackerId, `att_${Date.now()}`, Date.now()
  );

  db.prepare(`
    INSERT INTO study_rooms (id, doc_id, title, host_user_id, host_name, status, quiz_count, created_at)
    VALUES (?, 'doc_1', 'Room Test', 'host_1', 'Host', 'active', 5, ?)
  `).run(roomId, Date.now());

  db.prepare(`
    INSERT INTO room_participants (id, room_id, user_id, user_name, school_class, avatar_color, is_ready, score, correct_answers, total_answered, joined_at)
    VALUES (?, ?, ?, 'Victim', 'XII', '#fff', 1, 0, 0, 0, ?)
  `).run(`rp_${Date.now()}`, roomId, victimId, Date.now());

  const { token: attackerToken } = createSessionToken(attackerId);

  // Attacker mencoba submit jawaban atas nama victimId
  const mock = createMock(
    "POST",
    `/api/rooms/${roomId}/submit`,
    { userId: victimId, score: 100, correctAnswers: 5, totalAnswered: 5 },
    { authorization: `Bearer ${attackerToken}` }
  );
  await handleRoomsRoutes(mock.req, mock.res, `/api/rooms/${roomId}/submit`, mock.helpers);
  assert.equal(mock.getResult().status, 403);
});
