# TASK: TASK-LANDING-AUTH-GATE-018
## MODE: HYBRID
## SURFACE ARCHETYPE: Auth & Landing Onboarding Flow

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/App.tsx`
  - `src/components/landing/LandingPage.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE
Pemberlakuan alur autentikasi wajib (Auth-Gate) pada Landing Page:
Setiap pengguna yang mengakses Landing Page (`/landing`) dan ingin masuk atau menggunakan fitur Tanka wajib diarahkan untuk membuat akun baru terlebih dahulu (`mode: "register"`). Setelah mendaftar atau masuk, mereka mendapatkan sesi mandiri dengan data yang bersih (fresh session & data isolation).

---

## 2. DETAIL SPESIFIKASI

### A. LandingPage (`src/components/landing/LandingPage.tsx`)
1. **Arahkan Tombol "Masuk" ke Registrasi**:
   Pada topbar navigasi navbar:
   ```tsx
   <button
     className="landing-btn-ghost"
     onClick={() => onOpenAuth("register")}
   >
     Masuk
   </button>
   ```
   (Catatan: Di dalam `AuthModal`, pengguna yang sudah memiliki akun tetap bisa berpindah ke form login melalui link "Sudah punya akun? Masuk di sini").

2. **Intercept Semua Tombol Aksi / Launch**:
   Buat fungsi handler pembungkus:
   ```tsx
   const handleActionLaunch = () => {
     if (currentUser) {
       onLaunchApp();
     } else {
       onOpenAuth("register");
     }
   };
   ```
   Gunakan `handleActionLaunch` pada seluruh pemicu akses aplikasi di Landing Page:
   - Navbar CTA: `<button className="landing-btn-primary" onClick={handleActionLaunch}>Buka Aplikasi</button>`
   - Hero Primary CTA: `<button className="hero-btn-main" onClick={handleActionLaunch}>Mulai Belajar Sekarang — Gratis</button>`
   - Hero Simulator Input: `onKeyDown={(e) => { if (e.key === "Enter") handleActionLaunch(); }}`
   - Hero Simulator Send Button: `<button className="sim-btn-send" onClick={handleActionLaunch}>`
   - Feature Spec Action: `<button className="spec-action-btn" onClick={handleActionLaunch}>Coba Rangkum Video Sekarang</button>`
   - Stepper Action: `<button className="stepper-cta-btn" onClick={handleActionLaunch}>Coba Sekarang Gratis</button>`
   - Bottom CTA Banner: `<button onClick={handleActionLaunch} className="landing-cta-btn">Mulai Belajar Sekarang (Gratis)</button>`

### B. Root App (`src/App.tsx`)
1. **Perketat `onLaunchApp` pada Props `LandingPage`**:
   ```tsx
   <LandingPage
     onLaunchApp={() => {
       if (currentUser) {
         setActiveTab("home");
       } else {
         handleOpenAuth("register");
       }
     }}
     onOpenAuth={handleOpenAuth}
     currentUser={currentUser}
   />
   ```

2. **Auto-Transition saat Pendaftaran / Login Berhasil**:
   Tambahkan effect agar ketika pengunjung di landing page berhasil mendaftar/masuk dan `currentUser` terisi, mereka otomatis dialihkan ke antarmuka aplikasi:
   ```tsx
   useEffect(() => {
     if (currentUser && activeTab === "landing") {
       setActiveTab("home");
     }
   }, [currentUser, activeTab, setActiveTab]);
   ```

3. **Reset Sesi & Data Aktif saat Logout**:
   Perbarui handler logout di `App.tsx` agar membersihkan dokumen aktif dan mengarahkan kembali ke landing:
   ```tsx
   const handleLogoutWithReset = useCallback(() => {
     handleLogout();
     setActiveDocId(null);
     setActiveDocTitle("");
     setActiveDocContent("");
     setActiveDocSummary("");
     setActiveTab("landing");
   }, [handleLogout, setActiveDocId, setActiveDocTitle, setActiveDocContent, setActiveDocSummary, setActiveTab]);
   ```
   Gunakan `handleLogoutWithReset` pada seluruh komponen yang menerima callback `onLogout` (ProfileModal, TopBar, Sidebar).

---

## 3. ACCEPTANCE CRITERIA
- [ ] Klik tombol "Masuk" pada landing page membuka `AuthModal` dengan mode registrasi (`Buat Akun Baru`).
- [ ] Klik "Buka Aplikasi", "Mulai Belajar Sekarang", atau tombol launch lainnya saat belum login membuka `AuthModal` registrasi.
- [ ] Pengguna yang sudah login (`currentUser != null`) langsung masuk ke dashboard (`activeTab = "home"`).
- [ ] Setelah berhasil registrasi dari landing page, pengguna langsung dialihkan ke dashboard dengan profil baru (`currentUser`).
- [ ] Logout membersihkan state dokumen aktif (`activeDocId = null`) dan mengembalikan rute ke `landing`.
- [ ] `npm run build` sukses tanpa error tipe TypeScript.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
