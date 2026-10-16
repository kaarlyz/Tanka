const crypto = require("crypto");
const { db } = require("../db");

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function normalizePhone(phone) {
  let p = (phone || "").replace(/[^\d+]/g, "").trim();
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "62" + p.slice(1);
  return p;
}

function createSessionToken(userId, days = 30) {
  const token = "tksess_" + crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
  db.prepare("INSERT INTO user_sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
    token,
    userId,
    expiresAt,
    Date.now()
  );
  return { token, expiresAt };
}

function formatSafeUser(user) {
  let activeDays = [];
  try {
    activeDays = JSON.parse(user.active_days_json || "[]");
  } catch {}
  const curDay = (new Date().getDay() + 6) % 7;
  if (!activeDays.includes(curDay)) activeDays.push(curDay);

  return {
    id: user.id,
    username: user.username,
    name: user.name || user.username,
    phone: user.phone || null,
    auth_provider: user.auth_provider || "local",
    is_verified: Boolean(user.is_verified),
    google_id: user.google_id || null,
    bio: user.bio || "",
    school_class: user.school_class || "Kelas XII",
    avatar_color: user.avatar_color || "#10b981",
    target_weekly_days: user.target_weekly_days || 5,
    streak_count: user.streak_count || 1,
    active_days_this_week: activeDays,
    total_study_minutes: user.total_study_minutes || 0,
    quizzes_completed: user.quizzes_completed || 0,
    quiz_correct_count: user.quiz_correct_count || 0,
    xp: user.xp || 100,
    level: Math.floor((user.xp || 100) / 100),
    created_at: user.created_at
  };
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
      if (password.length < 8) {
        return sendJSON(res, { error: "Password minimal 8 karakter demi keamanan akun" }, 400);
      }

      const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
      if (existing) {
        return sendJSON(res, { error: "Username sudah digunakan, silakan pilih yang lain" }, 409);
      }

      const id = "usr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      const passwordHash = hashPassword(password);
      const now = Date.now();

      db.prepare("INSERT INTO users (id, username, password_hash, name, auth_provider, is_verified, created_at) VALUES (?, ?, ?, ?, 'local', 1, ?)").run(
        id,
        username,
        passwordHash,
        name,
        now
      );

      const { token } = createSessionToken(id);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

      return sendJSON(res, {
        success: true,
        token,
        user: formatSafeUser(user)
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

      const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
      if (!user) {
        return sendJSON(res, { error: "Username atau password salah" }, 401);
      }

      const inputHash = hashPassword(password);
      if (user.password_hash !== inputHash) {
        return sendJSON(res, { error: "Username atau password salah" }, 401);
      }

      const { token } = createSessionToken(user.id);

      return sendJSON(res, {
        success: true,
        token,
        user: formatSafeUser(user)
      });
    } catch (err) {
      console.error("[auth-login] error:", err);
      return sendJSON(res, { error: "Gagal masuk ke akun" }, 500);
    }
  }

  if (pathname === "/api/auth/session" && req.method === "GET") {
    try {
      const authHeader = req.headers["authorization"] || "";
      let token = "";
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }
      if (!token) {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        token = parsedUrl.searchParams.get("token") || "";
      }

      if (!token) {
        return sendJSON(res, { error: "Token sesi tidak ditemukan" }, 401);
      }

      const session = db.prepare("SELECT * FROM user_sessions WHERE token = ? AND expires_at > ?").get(token, Date.now());
      if (!session) {
        return sendJSON(res, { error: "Sesi tidak valid atau telah berakhir" }, 401);
      }

      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.user_id);
      if (!user) {
        return sendJSON(res, { error: "Pengguna tidak ditemukan" }, 404);
      }

      return sendJSON(res, {
        success: true,
        token: session.token,
        user: formatSafeUser(user)
      });
    } catch (err) {
      console.error("[auth-session] error:", err);
      return sendJSON(res, { error: "Gagal memverifikasi sesi" }, 500);
    }
  }

  if (pathname === "/api/auth/logout" && req.method === "POST") {
    try {
      let body = {};
      try { body = await getBody(req); } catch {}
      const authHeader = req.headers["authorization"] || "";
      let token = body.token || "";
      if (!token && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7).trim();
      }
      if (!token) {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        token = parsedUrl.searchParams.get("token") || "";
      }

      if (token) {
        db.prepare("DELETE FROM user_sessions WHERE token = ?").run(token);
      }

      return sendJSON(res, { success: true, message: "Berhasil keluar" });
    } catch (err) {
      console.error("[auth-logout] error:", err);
      return sendJSON(res, { error: "Gagal memproses logout" }, 500);
    }
  }

  if (pathname === "/api/auth/whatsapp/send-otp" && req.method === "POST") {
    try {
      const body = await getBody(req);
      const rawPhone = (body.phone || "").trim();
      const normPhone = normalizePhone(rawPhone);

      if (!normPhone || normPhone.length < 9 || normPhone.length > 16 || !/^\d+$/.test(normPhone)) {
        return sendJSON(res, { error: "Nomor WhatsApp tidak valid (contoh: 08123456789)" }, 400);
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const id = "vrf_" + Date.now() + "_" + crypto.randomBytes(4).toString("hex");

      db.prepare("DELETE FROM auth_verifications WHERE phone = ?").run(normPhone);
      db.prepare("INSERT INTO auth_verifications (id, phone, code, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, 0, ?)").run(
        id,
        normPhone,
        code,
        expiresAt,
        Date.now()
      );

      console.log(`[auth-whatsapp] OTP sent to ${normPhone}: ${code}`);

      return sendJSON(res, {
        success: true,
        message: "Kode OTP berhasil dikirim ke nomor WhatsApp Anda",
        phone: normPhone,
        debugCode: code
      });
    } catch (err) {
      console.error("[auth-whatsapp-send] error:", err);
      return sendJSON(res, { error: "Gagal mengirim kode verifikasi WhatsApp" }, 500);
    }
  }

  if (pathname === "/api/auth/whatsapp/verify" && req.method === "POST") {
    try {
      const body = await getBody(req);
      const normPhone = normalizePhone(body.phone || "");
      const code = (body.code || "").trim();
      const password = (body.password || "").trim();
      const name = (body.name || "").trim();

      if (!normPhone || !code) {
        return sendJSON(res, { error: "Nomor WhatsApp dan kode verifikasi wajib diisi" }, 400);
      }

      const verification = db.prepare("SELECT * FROM auth_verifications WHERE phone = ? ORDER BY created_at DESC LIMIT 1").get(normPhone);
      if (!verification || verification.code !== code || verification.expires_at < Date.now()) {
        if (verification) {
          db.prepare("UPDATE auth_verifications SET attempts = attempts + 1 WHERE id = ?").run(verification.id);
        }
        return sendJSON(res, { error: "Kode verifikasi salah atau telah kadaluarsa" }, 400);
      }

      let user = db.prepare("SELECT * FROM users WHERE phone = ?").get(normPhone);

      if (user) {
        if (password && user.password_hash !== hashPassword(password)) {
          return sendJSON(res, { error: "Sandi akun tidak sesuai" }, 401);
        }
        if (!user.is_verified) {
          db.prepare("UPDATE users SET is_verified = 1 WHERE id = ?").run(user.id);
          user.is_verified = 1;
        }
      } else {
        if (!password) {
          return sendJSON(res, { error: "Sandi wajib diisi untuk pendaftaran akun baru" }, 400);
        }
        if (password.length < 8) {
          return sendJSON(res, { error: "Password minimal 8 karakter demi keamanan akun" }, 400);
        }

        const id = "usr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
        const baseUsername = "wa_" + normPhone.slice(-6);
        let username = baseUsername;
        const exists = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
        if (exists) {
          username = baseUsername + "_" + Math.random().toString(36).slice(2, 6);
        }

        const displayName = name || ("Pengguna " + normPhone.slice(-4));
        const passwordHash = hashPassword(password);
        const now = Date.now();

        db.prepare(`
          INSERT INTO users (id, username, password_hash, name, phone, auth_provider, is_verified, created_at)
          VALUES (?, ?, ?, ?, ?, 'whatsapp', 1, ?)
        `).run(id, username, passwordHash, displayName, normPhone, now);

        user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      }

      db.prepare("DELETE FROM auth_verifications WHERE phone = ?").run(normPhone);

      const { token } = createSessionToken(user.id);

      return sendJSON(res, {
        success: true,
        token,
        user: formatSafeUser(user)
      });
    } catch (err) {
      console.error("[auth-whatsapp-verify] error:", err);
      return sendJSON(res, { error: "Gagal memverifikasi akun WhatsApp" }, 500);
    }
  }

  if (pathname === "/api/auth/google" && req.method === "POST") {
    try {
      const body = await getBody(req);
      const email = (body.email || "").trim().toLowerCase();
      const googleId = (body.googleId || body.google_id || "").trim();
      const name = (body.name || "").trim();

      if (!email && !googleId) {
        return sendJSON(res, { error: "Email atau Google ID wajib diberikan" }, 400);
      }

      let user = null;
      if (googleId) {
        user = db.prepare("SELECT * FROM users WHERE google_id = ?").get(googleId);
      }
      if (!user && email) {
        user = db.prepare("SELECT * FROM users WHERE username = ?").get(email);
      }

      if (!user) {
        const id = "usr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
        const emailPrefix = email ? email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase() : "g_" + (googleId || "").slice(-6);
        let username = emailPrefix || ("g_" + Math.random().toString(36).slice(2, 8));
        const exists = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
        if (exists) {
          username = username + "_" + Math.random().toString(36).slice(2, 5);
        }

        const displayName = name || (email ? email.split("@")[0] : "Google User");
        const passwordHash = "oauth_google_" + crypto.randomBytes(16).toString("hex");
        const now = Date.now();

        db.prepare(`
          INSERT INTO users (id, username, password_hash, name, google_id, auth_provider, is_verified, created_at)
          VALUES (?, ?, ?, ?, ?, 'google', 1, ?)
        `).run(id, username, passwordHash, displayName, googleId || null, now);

        user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      } else {
        if (googleId && !user.google_id) {
          db.prepare("UPDATE users SET google_id = ?, is_verified = 1 WHERE id = ?").run(googleId, user.id);
          user.google_id = googleId;
          user.is_verified = 1;
        }
      }

      const { token } = createSessionToken(user.id);

      return sendJSON(res, {
        success: true,
        token,
        user: formatSafeUser(user)
      });
    } catch (err) {
      console.error("[auth-google] error:", err);
      return sendJSON(res, { error: "Gagal login dengan akun Google" }, 500);
    }
  }

  return false;
}

module.exports = {
  handleAuthRoutes,
  createSessionToken,
  hashPassword,
  normalizePhone,
  formatSafeUser
};
