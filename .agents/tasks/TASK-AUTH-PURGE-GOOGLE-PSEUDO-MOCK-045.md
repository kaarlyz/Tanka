# TASK-AUTH-PURGE-GOOGLE-PSEUDO-MOCK-045: Purge Pseudo Mock-Consent & Wire Direct Google OAuth 2.0

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `server/routes/auth.js`
  - `tests/authSessions.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Konteks & Teguran Eka
Pengguna menegur keras tampilan simulasi tiruan Google:
> *"itu pas dipake mau akun google beneran kenapa kek cm simulasi? kan memang udh ad yg dari google, lu ngapain buat pseudo nya"*

### Masalah:
MARAKA membuat endpoint `/api/auth/google/mock-consent` yang merender halaman HTML buatan sendiri berisi akun tiruan ("Eka Pratama", "Siswa Cerdas"). Ini adalah pseudo-mockup murahan yang merusak pengalaman pengguna dan memalsukan alur asli Google.

---

## 2. Spesifikasi Teknis untuk MARAKA

### A. Hapus Total Halaman Pseudo Mock-Consent di `server/routes/auth.js`
1. **Hapus Endpoint**: Hapus seluruh blok `if (pathname === "/api/auth/google/mock-consent")` beserta template HTML 80 baris tiruan Google.
2. **Kunci Endpoint `/api/auth/google/login` Langsung ke Google**:
   - Ambil `clientId = process.env.GOOGLE_CLIENT_ID` dan `clientSecret = process.env.GOOGLE_CLIENT_SECRET`.
   - Ambil `redirectUri = process.env.GOOGLE_REDIRECT_URI || `${protocol}://${host}/api/auth/google/callback``.
   - Jika `clientId`:
     Redirect HTTP 302 langsung ke server otentikasi resmi Google:
     `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account`
   - Jika `clientId` belum diatur di `.env`:
     Jangan render halaman akun tiruan. Kirimkan respons JSON 400 atau halaman penutup popup elegan dengan pesan:
     `"Integrasi Google Sign-In belum dikonfigurasi. Atur GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di file .env."`
     dan panggil `window.opener.postMessage({ type: 'TANKA_GOOGLE_AUTH_ERROR', error: 'GOOGLE_CLIENT_ID belum dikonfigurasi di server' }, '*'); window.close();`

### B. Update Unit Test di `tests/authSessions.test.js`
1. Perbarui tes flow Google OAuth:
   - Tes redirect 302 langsung ke `https://accounts.google.com/o/oauth2/v2/auth` dengan `GOOGLE_CLIENT_ID`.
   - Tes penanganan error saat `GOOGLE_CLIENT_ID` tidak ada (tidak boleh redirect ke mock-consent).
   - Hapus ekspektasi teks `"Simulasi Akun Google OAuth 2.0"`.

---

## 3. Acceptance Criteria
- [x] Rute `/api/auth/google/mock-consent` dan HTML pseudo Google terhapus 100%.
- [x] Tombol Google redirect langsung ke `accounts.google.com`.
- [x] Saat kredensial kosong, tampil error konfigurasi yang jujur via postMessage dan popup menutup, tanpa pseudo akun palsu.
- [x] `env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js` lulus 100%.
- [x] `npm run build` sukses.
- [x] `systemctl --user restart tanka` aktif.
- [x] DILARANG melakukan `git push`.
