# TASK-AUTH-MODAL-UX-GOOGLE-OAUTH-044: Real Google OAuth 2.0 Flow, Progressive 2-Step WhatsApp Auth, & Polished UI

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `server/routes/auth.js`
  - `src/components/modals/AuthModal.tsx`
  - `src/hooks/useAuth.ts`
  - `src/index.css`
  - `tests/authSessions.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Konteks & Akar Masalah
Pengguna mengkritik hasil implementasi modal autentikasi terkini:
> *"bener, kenapa sebelumnya tidak km fix? padahal kan km udh ngirim dan 'melihat' btw login pake akun google itu pake oauth gitu lo bukan manual input kek web jaman skrng"*

### Temuan Masalah & Pantangan Mutlak:
1. **Pelecehan Standar Web via `window.prompt()`**:
   Tombol login Google sebelumnya memanggil dialog primitif `window.prompt("Masukkan Email Google...")`. Ini HARAM MUTLAK. Standar web modern wajib menggunakan protokol **Google OAuth 2.0** popup / redirect resmi.
2. **Anti-Pattern Form Menumpuk (Zero Progressive Disclosure)**:
   Empat input ditampilkan sekaligus dalam satu frame padat (Nomor HP, Kode OTP, Sandi, Nama). Pengguna belum meminta kode OTP, tetapi kolom input OTP dan sandi sudah dipajang di layar.
3. **Double Border & Layout Glitch**:
   Wrapper input memiliki border CSS dan elemen native `<input>` di dalamnya juga merender border default browser, menghasilkan artifak kotak ganda. Tombol "Kirim OTP" mepet dan menabrak padding kanan kontainer. Header statis tidak sinkron saat tab berganti.

---

## 2. Spesifikasi Implementasi untuk MARAKA

### A. Protokol Google OAuth 2.0 di Backend (`server/routes/auth.js`)
Hapus seluruh logika manual input email Google. Bangun endpoint OAuth 2.0 resmi:
1. `GET /api/auth/google/login`:
   - Cek apakah `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` ada di `process.env`.
   - **Jika Dikonfigurasi**: Redirect HTTP 302 ke Google OAuth endpoint:
     `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`
   - **Jika Belum Dikonfigurasi (Local Dev/Self-Hosted Fallback)**:
     Sajikan halaman popup persetujuan OAuth lokal (`/api/auth/google/mock-consent`) dengan antarmuka Google Sign-In yang elegan (menampilkan pilihan akun Google simulasi pengembang / uji coba). Saat diklik, arahkan ke callback dengan data OAuth yang sah.
2. `GET /api/auth/google/callback`:
   - Menerima `code` (atau token OAuth).
   - Tukarkan authorization code ke token endpoint Google dan ambil profil pengguna (`email`, `name`, `sub/id`).
   - Cari atau buat user baru di database SQLite dengan `auth_provider: 'google'`, `google_id`, dan `is_verified: 1`.
   - Terbitkan token sesi 30 hari di tabel `user_sessions`.
   - Kembalikan halaman HTML penutup popup yang mengirimkan pesan ke window pembuka:
     ```html
     <!DOCTYPE html>
     <html><body><script>
       window.opener.postMessage({
         type: 'TANKA_GOOGLE_AUTH_SUCCESS',
         token: '${token}',
         user: ${JSON.stringify(safeUser)}
       }, '*');
       window.close();
     </script></body></html>
     ```

### B. Otentikasi WhatsApp 2-Langkah Progresif di `src/components/modals/AuthModal.tsx`
Terapkan mesin status 2 langkah (`waStep: "phone" | "otp"`):
1. **Langkah 1 (`waStep === "phone"`)**:
   - Tampilkan field nomor WhatsApp saja (dengan awalan bendera Indonesia / `+62` atau placeholder `0812...`).
   - Tombol penuh yang elegan: *"Kirim Kode OTP"* (dengan status loading saat memanggil API).
2. **Langkah 2 (`waStep === "otp"`)**:
   - Muncul otomatis setelah OTP berhasil terkirim.
   - Info ringkas: *"Kode verifikasi telah dikirim ke [Nomor HP]"* beserta tombol kecil *"Ubah Nomor"* (kembali ke step 1).
   - Input 6 Digit Kode OTP dengan font monospace yang presisi (tanpa tracking pecah).
   - Input Sandi Akun (dengan toggle visibilitas password).
   - Field Nama Sapaan hanya muncul jika API mengindikasikan nomor tersebut adalah pendaftaran baru.
   - Tombol utama: *"Verifikasi & Masuk"*.
   - Timer hitung mundur 60 detik untuk *"Kirim Ulang Kode"*.

### C. Frontend Integrasi Google OAuth di `src/hooks/useAuth.ts`
1. Tambahkan fungsi `triggerGoogleOAuth()`:
   - Membuka popup window Google:
     ```typescript
     const width = 500;
     const height = 620;
     const left = window.screenX + (window.outerWidth - width) / 2;
     const top = window.screenY + (window.outerHeight - height) / 2;
     window.open("/api/auth/google/login", "GoogleLogin", `width=${width},height=${height},left=${left},top=${top}`);
     ```
   - Pasang event listener `message` untuk menangkap `TANKA_GOOGLE_AUTH_SUCCESS`:
     ```typescript
     const handleAuthMessage = (event: MessageEvent) => {
       if (event.data?.type === "TANKA_GOOGLE_AUTH_SUCCESS" && event.data.token && event.data.user) {
         setCurrentUser(event.data.user);
         localStorage.setItem(STORAGE_KEY, JSON.stringify(event.data.user));
         localStorage.setItem("tanka_session_token", event.data.token);
         setIsAuthModalOpen(false);
         showNotice(`Selamat datang, ${event.data.user.name || "Pengguna"}!`);
       }
     };
     ```

### D. Perapian Visual & Eliminasi Double Border di `src/components/modals/AuthModal.tsx` & `src/index.css`
1. **Reset Border Native Input**:
   Setiap `<input>` di dalam container field wajib memiliki style `border: none !important; outline: none !important; background: transparent;`. Hanya container pembungkus yang memiliki 1 border hairline rapi (`border: 1.5px solid #dce4d6`, focus ring `#4b6623`).
2. **Header Dinamis**:
   - Jika tab aktif WhatsApp: Ikon WhatsApp + Judul *"Masuk dengan WhatsApp"* + Deskripsi *"Verifikasi cepat via kode 6-digit WhatsApp"*.
   - Jika tab aktif Username: Ikon User + Judul *"Masuk dengan Akun"* / *"Daftar Akun Baru"*.
3. **Penyelarasan Desain Tombol Google**:
   Tombol "Lanjutkan dengan Google" diletakkan rapi di bawah divider "ATAU", dengan logo resmi Google (SVG 4 warna: merah, kuning, hijau, biru), border hairline elegan `#dce1da`, dan hover soft background `#f8faf7`.

---

## 3. Acceptance Criteria
- [ ] Tombol Google membuka popup window OAuth (`/api/auth/google/login`), TIDAK PERNAH memanggil `window.prompt`.
- [ ] Alur WhatsApp berjalan dalam 2 langkah terpisah (Nomor -> Kirim OTP -> Input OTP & Sandi).
- [ ] Input field bersih dari double border (border ganda hilang total).
- [ ] Header modal dinamis sinkron dengan tab yang sedang aktif.
- [ ] Test suite `env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js` lulus 100%.
- [ ] `npm run build` sukses.
- [ ] Layanan `systemctl --user restart tanka` aktif.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
