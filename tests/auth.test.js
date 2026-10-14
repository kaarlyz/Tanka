const test = require("node:test");
const assert = require("node:assert/strict");
const { db } = require("../server/db");
const { handleAuthRoutes } = require("../server/routes/auth");

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
    getBody: async () => body
  };

  return {
    res,
    helpers,
    getResult: () => ({ status: responseStatus, data: responseData })
  };
}

test("Auth Route: register dengan password < 8 karakter ditolak dengan status 400", async () => {
  const shortPassMock = createMockHelpers({
    username: "user_test_pass",
    password: "1234567" // 7 karakter
  });

  await handleAuthRoutes({ method: "POST" }, shortPassMock.res, "/api/auth/register", shortPassMock.helpers);
  const result = shortPassMock.getResult();

  assert.equal(result.status, 400);
  assert.equal(result.data.error, "Password minimal 8 karakter demi keamanan akun");
});

test("Auth Route: register dengan field kosong ditolak dengan status 400", async () => {
  const emptyMock = createMockHelpers({
    username: "",
    password: ""
  });

  await handleAuthRoutes({ method: "POST" }, emptyMock.res, "/api/auth/register", emptyMock.helpers);
  const result = emptyMock.getResult();

  assert.equal(result.status, 400);
  assert.equal(result.data.error, "Username dan password wajib diisi");
});

test("Auth Route: register dengan username < 3 karakter ditolak dengan status 400", async () => {
  const shortUserMock = createMockHelpers({
    username: "ab",
    password: "password123"
  });

  await handleAuthRoutes({ method: "POST" }, shortUserMock.res, "/api/auth/register", shortUserMock.helpers);
  const result = shortUserMock.getResult();

  assert.equal(result.status, 400);
  assert.equal(result.data.error, "Username minimal 3 karakter");
});

test("Auth Route: register dengan password >= 8 karakter berhasil dan login valid", async () => {
  const testUsername = `user_${Date.now()}`;
  const testPassword = "securePassword123";

  // 1. Register valid
  const registerMock = createMockHelpers({
    username: testUsername,
    password: testPassword,
    name: "Tester"
  });

  await handleAuthRoutes({ method: "POST" }, registerMock.res, "/api/auth/register", registerMock.helpers);
  const regResult = registerMock.getResult();

  assert.equal(regResult.status, 200);
  assert.ok(regResult.data.success);
  assert.equal(regResult.data.user.username, testUsername);

  // 2. Login valid
  const loginMock = createMockHelpers({
    username: testUsername,
    password: testPassword
  });

  await handleAuthRoutes({ method: "POST" }, loginMock.res, "/api/auth/login", loginMock.helpers);
  const loginResult = loginMock.getResult();

  assert.equal(loginResult.status, 200);
  assert.ok(loginResult.data.success);
  assert.equal(loginResult.data.user.username, testUsername);

  // 3. Login invalid password
  const wrongLoginMock = createMockHelpers({
    username: testUsername,
    password: "wrongPassword"
  });

  await handleAuthRoutes({ method: "POST" }, wrongLoginMock.res, "/api/auth/login", wrongLoginMock.helpers);
  const wrongResult = wrongLoginMock.getResult();

  assert.equal(wrongResult.status, 401);
  assert.equal(wrongResult.data.error, "Username atau password salah");
});
