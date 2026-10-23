const test = require("node:test");
const assert = require("node:assert/strict");
const { db, runMigrations } = require("../server/db");
const { handleAuthRoutes, createSessionToken } = require("../server/routes/auth");
const { handleUsersRoutes } = require("../server/routes/users");
const { handleDocumentsRoutes } = require("../server/routes/documents");

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
