const test = require("node:test");
const assert = require("node:assert/strict");
const { db, runMigrations } = require("../server/db");
const { handleAuthRoutes, createSessionToken, normalizePhone } = require("../server/routes/auth");

function createMockHelpers(body = {}, headers = {}, query = {}) {
  let responseStatus = 200;
  let responseData = null;
  let responseHeaders = {};

  const res = {
    headersSent: false,
    writeHead: (status, hdrs = {}) => {
      responseStatus = status;
      responseHeaders = { ...responseHeaders, ...hdrs };
    },
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

  const req = {
    method: "POST",
    headers,
    url: "/api/auth" + (Object.keys(query).length > 0 ? "?" + new URLSearchParams(query).toString() : "")
  };

  return {
    req,
    res,
    helpers,
    getResult: () => ({ status: responseStatus, data: responseData, headers: responseHeaders })
  };
}

test("Auth Sessions: Schema & Table Migration Check", () => {
  runMigrations(db);

  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  assert.ok(tables.includes("user_sessions"), "Tabel user_sessions harus ada");
  assert.ok(tables.includes("auth_verifications"), "Tabel auth_verifications harus ada");

  const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  assert.ok(userCols.includes("phone"), "users harus memiliki kolom phone");
  assert.ok(userCols.includes("auth_provider"), "users harus memiliki kolom auth_provider");
  assert.ok(userCols.includes("is_verified"), "users harus memiliki kolom is_verified");
  assert.ok(userCols.includes("google_id"), "users harus memiliki kolom google_id");
});

test("Auth Sessions: Register & Login return valid session token stored in DB", async () => {
  const username = `sess_user_${Date.now()}`;
  const password = "sessionPassword123";

  // 1. Register
  const regMock = createMockHelpers({ username, password, name: "Sess Tester" });
  regMock.req.method = "POST";
  await handleAuthRoutes(regMock.req, regMock.res, "/api/auth/register", regMock.helpers);
  const regRes = regMock.getResult();

  assert.equal(regRes.status, 200);
  assert.ok(regRes.data.success);
  assert.ok(regRes.data.token, "Register harus mengembalikan session token");
  assert.ok(regRes.data.token.startsWith("tksess_"));

  // Check token in DB
  const tokenInDb = db.prepare("SELECT * FROM user_sessions WHERE token = ?").get(regRes.data.token);
  assert.ok(tokenInDb, "Token harus tersimpan di user_sessions");
  assert.equal(tokenInDb.user_id, regRes.data.user.id);

  // 2. Login
  const loginMock = createMockHelpers({ username, password });
  loginMock.req.method = "POST";
  await handleAuthRoutes(loginMock.req, loginMock.res, "/api/auth/login", loginMock.helpers);
  const loginRes = loginMock.getResult();

  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.data.token, "Login harus mengembalikan session token");
});

test("Auth Sessions: GET /api/auth/session validasi session token & expired token", async () => {
  const username = `verify_sess_${Date.now()}`;
  const password = "sessionPassword123";

  const regMock = createMockHelpers({ username, password });
  regMock.req.method = "POST";
  await handleAuthRoutes(regMock.req, regMock.res, "/api/auth/register", regMock.helpers);
  const regRes = regMock.getResult();
  const token = regRes.data.token;

  // 1. Valid session with Bearer header
  const sessMock = createMockHelpers({}, { authorization: `Bearer ${token}` });
  sessMock.req.method = "GET";
  await handleAuthRoutes(sessMock.req, sessMock.res, "/api/auth/session", sessMock.helpers);
  const sessRes = sessMock.getResult();

  assert.equal(sessRes.status, 200);
  assert.ok(sessRes.data.success);
  assert.equal(sessRes.data.user.username, username);
  assert.equal(sessRes.data.token, token);

  // 2. Invalid session token
  const invalidMock = createMockHelpers({}, { authorization: "Bearer invalid_token_123" });
  invalidMock.req.method = "GET";
  await handleAuthRoutes(invalidMock.req, invalidMock.res, "/api/auth/session", invalidMock.helpers);
  assert.equal(invalidMock.getResult().status, 401);

  // 3. Expired session token
  const expiredToken = "tksess_expired_" + Date.now();
  db.prepare("INSERT INTO user_sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
    expiredToken,
    regRes.data.user.id,
    Date.now() - 1000,
    Date.now() - 2000
  );

  const expMock = createMockHelpers({}, { authorization: `Bearer ${expiredToken}` });
  expMock.req.method = "GET";
  await handleAuthRoutes(expMock.req, expMock.res, "/api/auth/session", expMock.helpers);
  assert.equal(expMock.getResult().status, 401);
});

test("Auth Sessions: POST /api/auth/logout menghapus token dari database", async () => {
  const username = `logout_user_${Date.now()}`;
  const password = "sessionPassword123";

  const regMock = createMockHelpers({ username, password });
  regMock.req.method = "POST";
  await handleAuthRoutes(regMock.req, regMock.res, "/api/auth/register", regMock.helpers);
  const token = regMock.getResult().data.token;

  // Verify token exists
  assert.ok(db.prepare("SELECT * FROM user_sessions WHERE token = ?").get(token));

  // Logout
  const logoutMock = createMockHelpers({ token });
  logoutMock.req.method = "POST";
  await handleAuthRoutes(logoutMock.req, logoutMock.res, "/api/auth/logout", logoutMock.helpers);
  const logoutRes = logoutMock.getResult();

  assert.equal(logoutRes.status, 200);
  assert.ok(logoutRes.data.success);

  // Verify token is deleted
  assert.equal(db.prepare("SELECT * FROM user_sessions WHERE token = ?").get(token), undefined);
});

test("Auth WhatsApp: normalizePhone mengonversi 08xxx ke 628xxx", () => {
  assert.equal(normalizePhone("08123456789"), "628123456789");
  assert.equal(normalizePhone("+628123456789"), "628123456789");
  assert.equal(normalizePhone("62812-3456-789"), "628123456789");
});

test("Auth WhatsApp: flow send-otp dan verify pendaftaran & login berhasil", async () => {
  const phone = "08" + Math.floor(100000000 + Math.random() * 900000000);
  const normPhone = "62" + phone.slice(1);
  const password = "passwordWa123";

  // 1. Send OTP
  const sendMock = createMockHelpers({ phone });
  sendMock.req.method = "POST";
  await handleAuthRoutes(sendMock.req, sendMock.res, "/api/auth/whatsapp/send-otp", sendMock.helpers);
  const sendRes = sendMock.getResult();

  assert.equal(sendRes.status, 200);
  assert.ok(sendRes.data.success);
  assert.ok(sendRes.data.debugCode);
  assert.equal(sendRes.data.isNewUser, true, "Panggilan pertama untuk nomor baru harus mengembalikan isNewUser = true");
  const otpCode = sendRes.data.debugCode;

  // 2. Verify with wrong code -> 400
  const wrongMock = createMockHelpers({ phone, code: "000000", password });
  wrongMock.req.method = "POST";
  await handleAuthRoutes(wrongMock.req, wrongMock.res, "/api/auth/whatsapp/verify", wrongMock.helpers);
  assert.equal(wrongMock.getResult().status, 400);

  // 3. Verify with correct code -> Creates new user & session
  const verifyMock = createMockHelpers({ phone, code: otpCode, password, name: "Budi Santoso" });
  verifyMock.req.method = "POST";
  await handleAuthRoutes(verifyMock.req, verifyMock.res, "/api/auth/whatsapp/verify", verifyMock.helpers);
  const verifyRes = verifyMock.getResult();

  assert.equal(verifyRes.status, 200);
  assert.ok(verifyRes.data.success);
  assert.ok(verifyRes.data.token);
  assert.equal(verifyRes.data.user.phone, normPhone);
  assert.equal(verifyRes.data.user.auth_provider, "whatsapp");
  assert.equal(verifyRes.data.user.is_verified, true);
  assert.equal(verifyRes.data.user.name, "Budi Santoso");

  // 4. Send OTP again for existing user login
  const sendAgainMock = createMockHelpers({ phone });
  sendAgainMock.req.method = "POST";
  await handleAuthRoutes(sendAgainMock.req, sendAgainMock.res, "/api/auth/whatsapp/send-otp", sendAgainMock.helpers);
  const sendAgainRes = sendAgainMock.getResult();
  assert.equal(sendAgainRes.data.isNewUser, false, "Nomor yang sudah terdaftar harus mengembalikan isNewUser = false");
  const newOtp = sendAgainRes.data.debugCode;

  // 5. Verify existing user with wrong password -> 401
  const wrongPassMock = createMockHelpers({ phone, code: newOtp, password: "wrongPassword" });
  wrongPassMock.req.method = "POST";
  await handleAuthRoutes(wrongPassMock.req, wrongPassMock.res, "/api/auth/whatsapp/verify", wrongPassMock.helpers);
  assert.equal(wrongPassMock.getResult().status, 401);

  // 6. Verify existing user with correct password -> 200
  const correctLoginMock = createMockHelpers({ phone, code: newOtp, password });
  correctLoginMock.req.method = "POST";
  await handleAuthRoutes(correctLoginMock.req, correctLoginMock.res, "/api/auth/whatsapp/verify", correctLoginMock.helpers);
  const correctLoginRes = correctLoginMock.getResult();
  assert.equal(correctLoginRes.status, 200);
  assert.ok(correctLoginRes.data.token);
  assert.equal(correctLoginRes.data.user.id, verifyRes.data.user.id);
});

test("Auth Google: POST /api/auth/google membuat akun baru dan menghasilkan session token", async () => {
  const googleId = "gid_" + Date.now();
  const email = `student_${Date.now()}@gmail.com`;

  const googleMock = createMockHelpers({
    email,
    name: "Siswa Google",
    googleId
  });
  googleMock.req.method = "POST";
  await handleAuthRoutes(googleMock.req, googleMock.res, "/api/auth/google", googleMock.helpers);
  const gRes = googleMock.getResult();

  assert.equal(gRes.status, 200);
  assert.ok(gRes.data.success);
  assert.ok(gRes.data.token);
  assert.equal(gRes.data.user.auth_provider, "google");
  assert.equal(gRes.data.user.google_id, googleId);
  assert.equal(gRes.data.user.is_verified, true);

  // Session token must be valid via GET /api/auth/session
  const sessMock = createMockHelpers({}, { authorization: "Bearer " + gRes.data.token });
  sessMock.req.method = "GET";
  await handleAuthRoutes(sessMock.req, sessMock.res, "/api/auth/session", sessMock.helpers);
  assert.equal(sessMock.getResult().status, 200);
  assert.equal(sessMock.getResult().data.user.id, gRes.data.user.id);
});

test("Auth Google OAuth 2.0: Flow GET /login langsung ke Google atau kirim postMessage error konfigurasi", async () => {
  const origClientId = process.env.GOOGLE_CLIENT_ID;
  const origClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;

  try {
    // 1. GET /api/auth/google/login tanpa GOOGLE_CLIENT_ID -> status 200 dengan postMessage TANKA_GOOGLE_AUTH_ERROR
    const loginMock = createMockHelpers();
    loginMock.req.method = "GET";
    await handleAuthRoutes(loginMock.req, loginMock.res, "/api/auth/google/login", loginMock.helpers);
    const loginRes = loginMock.getResult();
    assert.equal(loginRes.status, 200);
    assert.notEqual(loginRes.headers.Location, "/api/auth/google/mock-consent");
    assert.ok(typeof loginRes.data === "string");
    assert.ok(loginRes.data.includes("TANKA_GOOGLE_AUTH_ERROR"), "Harus mengirim postMessage TANKA_GOOGLE_AUTH_ERROR");
    assert.ok(loginRes.data.includes("GOOGLE_CLIENT_ID belum dikonfigurasi di server"));

    // Tes respons JSON jika client meminta format JSON
    const jsonMock = createMockHelpers({}, { accept: "application/json" });
    jsonMock.req.method = "GET";
    await handleAuthRoutes(jsonMock.req, jsonMock.res, "/api/auth/google/login", jsonMock.helpers);
    const jsonRes = jsonMock.getResult();
    assert.equal(jsonRes.status, 400);
    assert.ok(jsonRes.data.error.includes("GOOGLE_CLIENT_ID"));

    // 2. GET /api/auth/google/mock-consent harus sudah terhapus total
    const consentMock = createMockHelpers();
    consentMock.req.method = "GET";
    const handled = await handleAuthRoutes(consentMock.req, consentMock.res, "/api/auth/google/mock-consent", consentMock.helpers);
    assert.equal(handled, false, "Rute mock-consent harus dihapus total");

    // 3. GET /api/auth/google/login dengan GOOGLE_CLIENT_ID -> redirect 302 langsung ke accounts.google.com
    process.env.GOOGLE_CLIENT_ID = "test-client-id-123.apps.googleusercontent.com";
    process.env.GOOGLE_CLIENT_SECRET = "test-secret-456";

    const realLoginMock = createMockHelpers();
    realLoginMock.req.method = "GET";
    await handleAuthRoutes(realLoginMock.req, realLoginMock.res, "/api/auth/google/login", realLoginMock.helpers);
    const realLoginRes = realLoginMock.getResult();

    assert.equal(realLoginRes.status, 302);
    assert.ok(realLoginRes.headers.Location.startsWith("https://accounts.google.com/o/oauth2/v2/auth"));
    assert.ok(realLoginRes.headers.Location.includes("client_id=test-client-id-123.apps.googleusercontent.com"));
    assert.ok(realLoginRes.headers.Location.includes("prompt=select_account"));

    // 4. GET /api/auth/google/callback dengan parameter autentikasi -> buat user baru & token sesi
    const mockEmail = `oauth_student_${Date.now()}@gmail.com`;
    const mockName = "OAuth Student";
    const mockGid = `gid_oauth_${Date.now()}`;
    const callbackMock = createMockHelpers();
    callbackMock.req.method = "GET";
    callbackMock.req.url = `/api/auth/google/callback?code=mock_code&email=${encodeURIComponent(mockEmail)}&name=${encodeURIComponent(mockName)}&googleId=${mockGid}`;

    await handleAuthRoutes(callbackMock.req, callbackMock.res, "/api/auth/google/callback", callbackMock.helpers);
    const cbRes = callbackMock.getResult();

    assert.equal(cbRes.status, 200);
    assert.ok(typeof cbRes.data === "string");
    assert.ok(cbRes.data.includes("TANKA_GOOGLE_AUTH_SUCCESS"), "Callback harus mengirim pesan postMessage TANKA_GOOGLE_AUTH_SUCCESS");

    // Verify user is in database
    const userInDb = db.prepare("SELECT * FROM users WHERE google_id = ?").get(mockGid);
    assert.ok(userInDb, "User Google harus tersimpan di basis data SQLite");
    assert.equal(userInDb.auth_provider, "google");
    assert.equal(userInDb.is_verified, 1);
    assert.equal(userInDb.name, mockName);
  } finally {
    if (origClientId) process.env.GOOGLE_CLIENT_ID = origClientId;
    else delete process.env.GOOGLE_CLIENT_ID;
    if (origClientSecret) process.env.GOOGLE_CLIENT_SECRET = origClientSecret;
    else delete process.env.GOOGLE_CLIENT_SECRET;
  }
});
