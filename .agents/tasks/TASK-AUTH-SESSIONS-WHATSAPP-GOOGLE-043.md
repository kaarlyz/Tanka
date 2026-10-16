# TASK-AUTH-SESSIONS-WHATSAPP-GOOGLE-043: Database Session Management, WhatsApp OTP Auth, Google Login, & Visual Polish

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `server/db.js`
  - `server/routes/auth.js`
  - `src/hooks/useAuth.ts`
  - `src/components/modals/AuthModal.tsx`
  - `src/components/tabs/MaterialTab.tsx`
  - `tests/authSessions.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Konteks Masalah & Kebutuhan Pengguna
Pengguna menginstruksikan pembenahan menyeluruh pada sistem otentikasi/sesi serta melaporkan cacat visual di tab Materi:
1. **Otentikasi & Sesi Database ("sessionnya perbaikin smua", "auth database, dll")**:
   - Selama ini tidak ada tabel sesi di database (`user_sessions`). Status login hanya disimpan di `localStorage` mentah.
   - Pengguna meminta penambahan login dengan Google ("fitur login, tambahin login dengan google dong") serta login nomor WhatsApp dengan sandi dan verifikasi kode OTP ("atau whatsapp, nomor + sandi + verifikasi kode yg dikirim di whatsapp").
2. **Cacat Visual Tab Materi**:
   - **Kebocoran tag `<br>`**: Pada tabel ringkasan rumus materi (contoh kolom "Komponen Pembentuk"), tag `<br>` tampil mentah sebagai teks literal karena parser Markdown tidak mengkonversi string HTML tag ke elemen React.
   - **Double Border "Pilih Materi"**: Pada bilah floating chapter/materi (`.sticky-reader-toolbar`), kontainer luar memiliki border abu-abu dan tombol dropdown di dalamnya juga memiliki border abu-abu, menghasilkan tampilan kotak ganda konsentris (*duplicate border*).

---

## 2. Spesifikasi Implementasi untuk MARAKA

### A. Migrasi Database `server/db.js`
1. Tambahkan tabel `user_sessions`:
   ```sql
   CREATE TABLE IF NOT EXISTS user_sessions (
     token TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     expires_at INTEGER NOT NULL,
     created_at INTEGER NOT NULL,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   );
   ```
2. Tambahkan tabel `auth_verifications` (untuk OTP WhatsApp):
   ```sql
   CREATE TABLE IF NOT EXISTS auth_verifications (
     id TEXT PRIMARY KEY,
     phone TEXT NOT NULL,
     code TEXT NOT NULL,
     expires_at INTEGER NOT NULL,
     attempts INTEGER DEFAULT 0,
     created_at INTEGER NOT NULL
   );
   ```
3. Tambahkan kolom baru pada tabel `users` di `runMigrations`:
   - `phone TEXT UNIQUE`
   - `auth_provider TEXT DEFAULT 'local'` (contoh: `'local'`, `'whatsapp'`, `'google'`)
   - `is_verified INTEGER DEFAULT 0`
   - `google_id TEXT UNIQUE`

### B. Otentikasi & Sesi di `server/routes/auth.js`
1. **Helper Token Sesi**:
   ```javascript
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
   ```
2. **Perbarui `POST /api/auth/register` & `POST /api/auth/login`**:
   Sertakan pembuatan token sesi di DB dan kembalikan `{ success: true, token, user }`.
3. **Endpoint Validasi Sesi `GET /api/auth/session`**:
   - Membaca header `Authorization: Bearer <token>` atau query `token`.
   - Cek `SELECT * FROM user_sessions WHERE token = ? AND expires_at > ?`.
   - Jika valid, kembalikan data user terbaru lengkap dengan statistik belajar.
4. **Endpoint Keluar Sesi `POST /api/auth/logout`**:
   - Hapus token dari `user_sessions`.
5. **Endpoint WhatsApp OTP**:
   - `POST /api/auth/whatsapp/send-otp`:
     * Terima `phone` (normalisasi `08...` ke `628...`).
     * Buat kode OTP 6 digit acak (misal `123456`).
     * Simpan ke `auth_verifications` (kadaluarsa 5 menit).
     * Kirimkan pesan via gateway/log (pada environment development/lokal, sertakan `debugCode: code` agar dapat langsung diuji).
   - `POST /api/auth/whatsapp/verify`:
     * Terima `{ phone, code, password, name }`.
     * Validasi kode OTP dan masa berlaku.
     * Buat akun baru atau cocokkan akun yang ada dengan sandi.
     * Buat token sesi di DB dan kembalikan `{ success: true, token, user }`.
6. **Endpoint Google Login `POST /api/auth/google`**:
   - Terima `{ email, name, googleId, avatarUrl }`.
   - Cari atau buat user dengan `auth_provider: 'google'`.
   - Buat token sesi di DB dan kembalikan `{ success: true, token, user }`.

### C. Frontend Sesi & Login di `src/hooks/useAuth.ts`
1. Simpan `tanka_session_token` di `localStorage`.
2. Pada inisialisasi / mount:
   Jika ada `tanka_session_token`, panggil `GET /api/auth/session`.
   Jika token valid di DB, set `currentUser`. Jika expired/invalid, bersihkan token.
3. Fungsi `handleLogout`:
   Panggil `POST /api/auth/logout` ke server dan hapus `tanka_session_token`.
4. Tambahkan handler untuk `loginWithWhatsApp(phone, password, code, name)` dan `loginWithGoogle(payload)`.

### D. Tampilan `src/components/modals/AuthModal.tsx`
1. Hadirkan opsi metode login yang bersih:
   - **Tab / Selector Metode**: "Nomor WhatsApp" | "Username Akun".
   - **WhatsApp Tab**: Input Nomor WhatsApp, Input Sandi, Tombol "Kirim Kode Verifikasi", Input 6-Digit Kode OTP WhatsApp.
   - **Tombol Cepat Google**: Tombol "Lanjutkan dengan Google" dengan logo Google yang elegan dan bersih.

### E. Perbaikan Cacat Visual Tab Materi (`src/components/tabs/MaterialTab.tsx`)
1. **Hilangkan Bocoran `<br>`**:
   Pada `td` dan `p` di `markdownComponents`:
   Gunakan helper `renderWithLineBreaks(children)` yang memecah string mengandung `<br>` / `<br/>` / `<br />` menjadi elemen React `<br key={i} />` asli.
2. **Hilangkan Double Border Chapter Toolbar**:
   Pada `.sticky-reader-toolbar`:
   Ubah style tombol `button` pembungkus `Bab X / Y` menjadi seamless tanpa double-border:
   `background: "transparent"`, `border: "1px solid transparent"` (atau `background: "#f4f7ee"`, `border: "none"`), dengan hover halus.

---

## 3. Acceptance Criteria
- [ ] Database memiliki tabel `user_sessions` dan `auth_verifications`, serta kolom baru pada `users`.
- [ ] Session persistence: Refresh browser menjaga status login aktif melalui token sesi di database (`GET /api/auth/session`).
- [ ] Fitur login WhatsApp: Kirim OTP dan Verifikasi OTP + Sandi berhasil menghasilkan sesi valid.
- [ ] Fitur login Google: Endpoint `POST /api/auth/google` berhasil membuat sesi valid.
- [ ] Teks tabel materi tidak lagi memunculkan literal `<br>`, melainkan baris baru rapi.
- [ ] Toolbar pemilih materi/bab tidak lagi memiliki efek double-border konsentris.
- [ ] Test suite `env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js` lulus 100%.
- [ ] `npm run build` sukses.
- [ ] Layanan `systemctl --user restart tanka` aktif.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
