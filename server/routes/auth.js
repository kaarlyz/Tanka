const crypto = require("crypto");
const { db } = require("../db");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function handleAuthRoutes(req, res, pathname, { sendJSON, getBody }) {
  if (pathname === "/api/auth/register" && req.method === "POST") {
    try {
      const body = await getBody(req);
      const username = (body.username || "").trim().toLowerCase();
      const password = (body.password || "").trim();
      const name = (body.name || username).trim();

      if (!username || !password) {
        return sendJSON(res, { error: "Username dan password wajib diisi" }, 400);
      }
      if (username.length < 3) {
        return sendJSON(res, { error: "Username minimal 3 karakter" }, 400);
      }
      if (password.length < 4) {
        return sendJSON(res, { error: "Password minimal 4 karakter" }, 400);
      }

      const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
      if (existing) {
        return sendJSON(res, { error: "Username sudah digunakan, silakan pilih yang lain" }, 409);
      }

      const id = "usr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      const passwordHash = hashPassword(password);
      const now = Date.now();

      db.prepare("INSERT INTO users (id, username, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)").run(
        id,
        username,
        passwordHash,
        name,
        now
      );

      return sendJSON(res, {
        success: true,
        user: { id, username, name }
      });
    } catch (err) {
      console.error("[auth-register] error:", err);
      return sendJSON(res, { error: "Gagal membuat akun" }, 500);
    }
  }

  if (pathname === "/api/auth/login" && req.method === "POST") {
    try {
      const body = await getBody(req);
      const username = (body.username || "").trim().toLowerCase();
      const password = (body.password || "").trim();

      if (!username || !password) {
        return sendJSON(res, { error: "Username dan password wajib diisi" }, 400);
      }

      const user = db.prepare("SELECT id, username, name, password_hash FROM users WHERE username = ?").get(username);
      if (!user) {
        return sendJSON(res, { error: "Username atau password salah" }, 401);
      }

      const inputHash = hashPassword(password);
      if (user.password_hash !== inputHash) {
        return sendJSON(res, { error: "Username atau password salah" }, 401);
      }

      return sendJSON(res, {
        success: true,
        user: { id: user.id, username: user.username, name: user.name }
      });
    } catch (err) {
      console.error("[auth-login] error:", err);
      return sendJSON(res, { error: "Gagal masuk ke akun" }, 500);
    }
  }

  return false;
}

module.exports = { handleAuthRoutes };
