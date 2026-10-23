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

function findOrCreateGoogleUser({ email, googleId, name }) {
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
  return user;
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

      const existingUser = db.prepare("SELECT id FROM users WHERE phone = ?").get(normPhone);
      const isNewUser = !existingUser;

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
        isNewUser,
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

  if (pathname === "/api/auth/google/login" && req.method === "GET") {
    try {
      const host = req.headers.host || "localhost:3000";
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${protocol}://${host}/api/auth/google/callback`;
      const clientId = process.env.GOOGLE_CLIENT_ID;

      if (clientId) {
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account`;
        res.writeHead(302, { Location: googleAuthUrl });
        res.end();
        return true;
      }

      if (req.headers && req.headers.accept && req.headers.accept.includes("application/json")) {
        return sendJSON(res, {
          error: "Integrasi Google Sign-In belum dikonfigurasi. Atur GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di file .env."
        }, 400);
      }

      const errMsg = "GOOGLE_CLIENT_ID belum dikonfigurasi di server";
      const infoMsg = "Integrasi Google Sign-In belum dikonfigurasi. Atur GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di file .env.";
      const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Konfigurasi Google Auth Dibutuhkan</title>
</head>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#f0f4f9;">
  <div style="text-align:center; padding:28px; background:#fff; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.08); max-width:380px;">
    <div style="font-size:24px; margin-bottom:8px;">⚠️</div>
    <h2 style="font-size:16px; font-weight:700; color:#b91c1c; margin:0 0 8px;">Konfigurasi Belum Lengkap</h2>
    <p style="font-size:13px; color:#444746; margin:0 0 16px; line-height:1.5;">${infoMsg}</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: 'TANKA_GOOGLE_AUTH_ERROR',
        error: ${JSON.stringify(errMsg)}
      }, '*');
    }
    setTimeout(function() { window.close(); }, 600);
  </script>
</body>
</html>`;
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return true;
    } catch (err) {
      console.error("[auth-google-login] error:", err);
      return sendJSON(res, { error: "Gagal memproses inisiasi login Google" }, 500);
    }
  }

  if (pathname === "/api/auth/google/callback" && req.method === "GET") {
    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost:3000"}`);
      const code = parsedUrl.searchParams.get("code") || "";
      const host = req.headers.host || "localhost:3000";
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${protocol}://${host}/api/auth/google/callback`;

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      let email = "";
      let name = "";
      let googleId = "";

      if (clientId && clientSecret && code && !code.startsWith("mock_")) {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code"
          })
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
          throw new Error(tokenData.error_description || "Gagal menukar kode otorisasi Google");
        }

        const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const profile = await userRes.json();
        email = (profile.email || "").trim().toLowerCase();
        name = (profile.name || profile.given_name || (email ? email.split("@")[0] : "Google User")).trim();
        googleId = (profile.sub || "").trim();
      } else {
        email = (parsedUrl.searchParams.get("email") || "").trim().toLowerCase();
        name = (parsedUrl.searchParams.get("name") || (email ? email.split("@")[0] : "")).trim();
        googleId = (parsedUrl.searchParams.get("googleId") || (email ? "gid_" + crypto.createHash("md5").update(email).digest("hex").slice(0, 12) : "")).trim();
      }

      if (!email && !googleId) {
        throw new Error("Data pengguna Google tidak lengkap");
      }

      const user = findOrCreateGoogleUser({ email, googleId, name });
      const { token } = createSessionToken(user.id);
      const safeUser = formatSafeUser(user);

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Otentikasi Berhasil</title>
</head>
<body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#f0f4f9;">
  <div style="text-align:center; padding:28px; background:#fff; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.08); max-width:320px;">
    <div style="font-size:24px; margin-bottom:8px;">✅</div>
    <h2 style="font-size:16px; font-weight:700; color:#18211e; margin:0 0 6px;">Login Berhasil</h2>
    <p style="font-size:13px; color:#5f6368; margin:0;">Mengalihkan ke Tanka...</p>
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: 'TANKA_GOOGLE_AUTH_SUCCESS',
        token: ${JSON.stringify(token)},
        user: ${JSON.stringify(safeUser)}
      }, '*');
    }
    setTimeout(function() { window.close(); }, 350);
  </script>
</body>
</html>`;
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return true;
    } catch (err) {
      console.error("[auth-google-callback] error:", err);
      const errMsg = err.message || "Gagal memproses otentikasi Google";
      const html = `<!DOCTYPE html>
<html><body>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: 'TANKA_GOOGLE_AUTH_ERROR',
        error: ${JSON.stringify(errMsg)}
      }, '*');
    }
    setTimeout(function() { window.close(); }, 800);
  </script>
  <p style="font-family:sans-serif; text-align:center; margin-top:20px; color:#b91c1c;">${errMsg}. Jendela akan tertutup otomatis.</p>
</body></html>`;
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return true;
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

      const user = findOrCreateGoogleUser({ email, googleId, name });
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

function getSessionUser(req, dbInstance = db) {
  if (!req) return null;
  const headers = req.headers || {};
  const authHeader = headers["authorization"] || headers["Authorization"] || "";
  let token = "";
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }
  if (!token && req.url) {
    try {
      const parsedUrl = new URL(req.url, "http://localhost");
      token = parsedUrl.searchParams.get("token") || "";
    } catch {}
  }
  if (!token) return null;

  try {
    const session = dbInstance.prepare("SELECT * FROM user_sessions WHERE token = ? AND expires_at > ?").get(token, Date.now());
    if (!session) return null;
    return dbInstance.prepare("SELECT * FROM users WHERE id = ?").get(session.user_id) || null;
  } catch (err) {
    console.error("[getSessionUser] error:", err);
    return null;
  }
}

module.exports = {
  handleAuthRoutes,
  createSessionToken,
  hashPassword,
  normalizePhone,
  formatSafeUser,
  getSessionUser
};
