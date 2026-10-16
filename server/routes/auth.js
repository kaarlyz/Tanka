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
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (clientId && clientSecret) {
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;
        res.writeHead(302, { Location: googleAuthUrl });
        res.end();
        return true;
      }

      res.writeHead(302, { Location: "/api/auth/google/mock-consent" });
      res.end();
      return true;
    } catch (err) {
      console.error("[auth-google-login] error:", err);
      return sendJSON(res, { error: "Gagal memproses inisiasi login Google" }, 500);
    }
  }

  if (pathname === "/api/auth/google/mock-consent" && req.method === "GET") {
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login dengan Google - Tanka</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f0f4f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { background: #ffffff; width: 100%; max-width: 440px; border-radius: 24px; padding: 32px 28px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); text-align: left; }
    .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .google-logo { width: 32px; height: 32px; }
    h1 { font-size: 20px; font-weight: 600; color: #1f1f1f; margin-bottom: 6px; }
    p.sub { font-size: 13.5px; color: #444746; margin-bottom: 20px; }
    .account-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .account-btn { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border: 1.5px solid #e0e3e7; border-radius: 12px; background: #ffffff; cursor: pointer; text-align: left; transition: all 0.15s ease; text-decoration: none; color: inherit; }
    .account-btn:hover { background-color: #f8fafc; border-color: #4285F4; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #ffffff; flex-shrink: 0; }
    .acc-name { font-size: 13.5px; font-weight: 600; color: #1f1f1f; }
    .acc-email { font-size: 12px; color: #5f6368; }
    .dev-badge { display: inline-block; font-size: 11px; background: #e8f0fe; color: #1a73e8; padding: 2px 8px; border-radius: 100px; font-weight: 600; margin-bottom: 14px; }
    .custom-form { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 4px; }
    .custom-form h3 { font-size: 12.5px; font-weight: 600; color: #444746; margin-bottom: 8px; }
    .input-box { width: 100%; padding: 9px 12px; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 13px; margin-bottom: 8px; outline: none; }
    .input-box:focus { border-color: #1a73e8; }
    .submit-btn { width: 100%; background: #1a73e8; color: #fff; border: none; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
    .submit-btn:hover { background: #1557b0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg class="google-logo" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
    </div>
    <span class="dev-badge">Simulasi Akun Google OAuth 2.0</span>
    <h1>Pilih akun</h1>
    <p class="sub">untuk melanjutkan ke <strong>Tanka</strong></p>

    <div class="account-list">
      <a class="account-btn" href="/api/auth/google/callback?code=mock_code_eka&email=eka.pratama%40gmail.com&name=Eka+Pratama&googleId=gid_eka_10928374">
        <div class="avatar" style="background: #1a73e8;">E</div>
        <div>
          <div class="acc-name">Eka Pratama</div>
          <div class="acc-email">eka.pratama@gmail.com</div>
        </div>
      </a>
      <a class="account-btn" href="/api/auth/google/callback?code=mock_code_siswa&email=siswa.cerdas%40gmail.com&name=Siswa+Cerdas&googleId=gid_siswa_20938475">
        <div class="avatar" style="background: #0d652d;">S</div>
        <div>
          <div class="acc-name">Siswa Cerdas</div>
          <div class="acc-email">siswa.cerdas@gmail.com</div>
        </div>
      </a>
    </div>

    <form class="custom-form" action="/api/auth/google/callback" method="GET">
      <input type="hidden" name="code" value="mock_code_custom" />
      <h3>Atau gunakan akun lain:</h3>
      <input type="text" name="name" class="input-box" placeholder="Nama Lengkap" required />
      <input type="email" name="email" class="input-box" placeholder="alamat.email@gmail.com" required />
      <button type="submit" class="submit-btn">Lanjutkan dengan Akun Ini</button>
    </form>
  </div>
</body>
</html>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return true;
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
        email = (parsedUrl.searchParams.get("email") || (code.includes("eka") ? "eka.pratama@gmail.com" : "siswa.cerdas@gmail.com")).trim().toLowerCase();
        name = (parsedUrl.searchParams.get("name") || email.split("@")[0]).trim();
        googleId = (parsedUrl.searchParams.get("googleId") || ("gid_" + crypto.createHash("md5").update(email).digest("hex").slice(0, 12))).trim();
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

module.exports = {
  handleAuthRoutes,
  createSessionToken,
  hashPassword,
  normalizePhone,
  formatSafeUser
};
