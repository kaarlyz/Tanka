# TASK-CBT-MOBILE-ERGONOMICS-CLEANUP-054: Comprehensive Mobile CBT UI/UX Cleanup & Ergonomics Hardening

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/components/layout/MobileBottomNav.tsx`
  - `src/components/layout/TopBar.tsx`
  - `src/App.tsx`
  - `src/index.css`
  - `tests/cbtMobileErgonomics.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Root Cause Analysis (Temuan Empiris Audit Screenshot)

Berdasarkan audit 2 tangkapan layar mobile aktual pada `192.168.1.4:3001` (`img_184382cd11ab.jpg` dan `img_74af3aa8cc3f.jpg`), ditemukan 6 cacat UI/UX parah:

### Cacat 1: Modal Bottom Sheet Wacana Tertimpa Bottom Navigation Bar (Gambar 1)
- **Penyebab:** Pada mode mobile, modal wacana (`isWacanaModalOpen`) memiliki `z-index: 99999`, tetapi `.mobile-bottom-nav` di `index.css` menggunakan `position: fixed !important; z-index: 2000 !important`. Bottom nav tetap muncul di atas viewport paling bawah dan memotong teks wacana baris terakhir ("2050 sampah plastik...").
- **Dampak Fatal:** Bottom navigation bar 6 tab tetap aktif saat ujian berjalan. Pengguna yang jarinya terpeleset menekan "Beranda" atau "Materi" langsung keluar dari ujian dan kehilangan progres.
- **Solusi:** 
  1. Saat mode `runner` di CBT sedang aktif (`isExamActive` / `mode === 'runner'`), **sembunyikan total `MobileBottomNav`** (`display: none`), atau kunci navigasi dengan konfirmasi modal.
  2. Berikan `padding-bottom: calc(24px + env(safe-area-inset-bottom, 16px))` pada sheet wacana agar teks paling bawah tidak pernah terpotong. Tambahkan handle drag/pill visual di atas modal (`width: 36px; height: 4px; border-radius: 999px; background: #cbd5e1`).

### Cacat 2: Konflik Timer Ganda (Dual Conflicting Timers) (Gambar 2)
- **Penyebab:** 
  - `TopBar` merender timer Pomodoro global yang diam di `10:00`.
  - Header gelap CBT merender timer ujian riil yang berjalan (`01:09`).
- **Dampak:** Pengguna bingung melihat dua timer berbeda di layar yang sama.
- **Solusi:** Di `TopBar`, jika sedang berada di tab `cbt` dan ujian sedang berjalan, sembunyikan timer Pomodoro bawaan TopBar atau sinkronkan hanya ada **1 timer tunggal** di layar.

### Cacat 3: Judul Header Tidak Sinkron (Mismatched Header Context) (Gambar 2)
- **Penyebab:** `TopBar` menampilkan tulisan `"Pilih Materi"` (karena tidak ada `activeDocTitle` terpilih di tab CBT), padahal pengguna sedang aktif mengerjakan *"Bahasa Indonesia (Paket 1) SMA Wajib Pusmendik"*.
- **Solusi:** Jika `activeTab === 'cbt'`, `TopBar` menampilkan judul paket ujian aktif (`currentPackage?.subtes_or_mapel` atau `"Simulasi Ujian CBT"`), bukan fallback palsu `"Pilih Materi"`.

### Cacat 4: Pemborosan Ruang Vertikal Hero Banner Gelap & Tombol Terpotong (Gambar 2)
- **Penyebab:** Header gelap CBT merender card tebal yang memakan ~40% tinggi layar ponsel. Deretan tombol aksi di dalam header gelap (`Aa 15px`, `Sembunyikan Wacana`, `Daftar Soal (0/20)`, `Selesai Latihan`) disusun secara `flex; flex-wrap: nowrap`, menyebabkan tombol `Selesai Latihan` terpotong di tepi kanan layar (`Selesa... Latiha...`).
- **Solusi:**
  1. Di layar ponsel (`< 768px`), buat header CBT menjadi compact bar slim (`max-height: 52px`).
  2. Hapus tombol redundan `Sembunyikan Wacana` di header ponsel (karena di mobile wacana sudah dibuka via modal sheet terpisah).
  3. Ganti tombol `Aa 15px` yang membocorkan unit CSS menjadi tombol ringkas `Aa`.
  4. Tombol `Daftar Soal` dibuat ringkas: icon grid + badge `0/20`.

### Cacat 5: Redundansi Tombol Buka/Tutup Wacana
- **Penyebab:** Di header ada tombol `Sembunyikan Wacana`, tapi di nomor soal ada tombol `📖 Buka Wacana` dengan emoji OS kasar.
- **Solusi:** Hapus emoji OS `📖`, ganti dengan icon vector SVG Lucide `BookOpen size={13}`. Pada mobile, hanya sediakan satu tombol jelas: tombol `Buka Wacana` di bar nomor soal.

### Cacat 6: Kontras Warna Lemah pada Badge "Drill Mandiri"
- **Penyebab:** Teks hijau tua pada latar belakang hijau lumut gelap tidak terbaca di bawah pencahayaan redup/terang (gagal WCAG).
- **Solusi:** Gunakan warna teks kontras tinggi `#a7f3d0` pada background `rgba(16, 185, 129, 0.2)` dengan border `1px solid rgba(16, 185, 129, 0.4)`.

---

## 2. Spesifikasi Implementasi

### A. Komunikasi State Runner ke Root App (`src/App.tsx` & `src/components/tabs/ExamCbtTab.tsx`)
1. Di `ExamCbtTabProps`, tambahkan callback `onRunnerStateChange?: (isRunning: boolean) => void`.
2. Saat CBT masuk ke `mode === "runner"`, panggil `onRunnerStateChange(true)`. Saat kembali ke `selector` atau `review`, panggil `onRunnerStateChange(false)`.
3. Di `App.tsx`:
   - Jika `isCbtRunning === true`, sembunyikan `MobileBottomNav` secara kondisional (`{!isCbtRunning && <MobileBottomNav ... />}`).
   - Pass judul paket CBT aktif ke `TopBar` agar judul di atas tidak bertuliskan `"Pilih Materi"`.

### B. Perbaikan Modal Wacana Mobile Sheet (`src/components/tabs/ExamCbtTab.tsx`)
1. Tambahkan drag handle pill di puncak kartu sheet modal wacana:
   ```tsx
   <div style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: "#cbd5e1", margin: "0 auto 12px auto" }} />
   ```
2. Pastikan `padding-bottom` pada sheet modal memperhitungkan safe area:
   `padding: "16px 18px calc(24px + env(safe-area-inset-bottom, 16px)) 18px"`
3. Hapus emoji `📖` dari tombol wacana nomor soal: gunakan `<BookOpen size={13} /> <span>Wacana</span>`.

### C. Compact Header CBT Mobile
1. Pada tampilan mobile (`window.innerWidth < 768` atau class CSS `.cbt-runner-header`):
   - Jangan tampilkan tombol `Sembunyikan Wacana` di header (hanya relevan di split pane desktop).
   - Label font: `Aa` (tanpa kata `px`).
   - Tombol `Daftar Soal`: Icon Grid + `(0/20)`.
   - Tombol `Selesai`: Tetap terlihat utuh tanpa clipping horisontal.
   - Sembunyikan timer Pomodoro `TopBar` saat sedang di mode ujian CBT untuk mencegah kebingungan timer ganda.

### D. Unit Test (`tests/cbtMobileErgonomics.test.js`)
Buat test suite yang memverifikasi:
1. `ExamCbtTab` memanggil `onRunnerStateChange` dengan tepat saat start dan exit ujian.
2. Modal wacana memiliki drag handle dan safe area padding.
3. Tombol wacana menggunakan icon SVG tanpa emoji mentah OS.
4. Mobile bottom nav tersembunyi saat sesi ujian aktif.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (150+ passing).
2. `npm run build` -> Vite build passing (0 error).
