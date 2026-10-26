# TASK-RESTORE-BOTTOM-NAV-WITH-CBT-DOCK-STACK-060: Restore MobileBottomNav with Clean Stacked CBT Action Dock

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/App.tsx`
  - `src/components/layout/MobileBottomNav.tsx`
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/cbtBottomNavStack.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & User Decision
Pada perbaikan TASK-054 sebelumnya, `MobileBottomNav` (bilah tab Beranda, CBT, Materi, Nara AI, Latihan, Bank Salah) disembunyikan saat ujian berlangsung (`!isCbtRunning`).
Pengguna meminta dengan tegas:
> **"Kembalikan bilah navigasi utama (Beranda, CBT, Materi, dll) di paling bawah, tombol navigasi soal (Sebelumnya/Berikutnya) ditaruh di atasnya persis."**

Jika pengguna menekan tombol tab lain saat ujian sedang berlangsung, tampilkan dialog konfirmasi pencegah kehilangan data (*"Ujian sedang berlangsung. Yakin ingin meninggalkan halaman ujian?"*).

---

## 2. Spesifikasi Implementasi

### A. Kembalikan `MobileBottomNav` di `src/App.tsx`
1. Hapus pengondisian `{!isCbtRunning && <MobileBottomNav ... />}`.
2. Render `<MobileBottomNav ... />` secara konsisten:
   ```tsx
   <MobileBottomNav
     activeTab={activeTab}
     setActiveTab={(newTab) => {
       if (activeTab === "cbt" && isCbtRunning && newTab !== "cbt") {
         if (window.confirm("Ujian sedang berlangsung. Yakin ingin meninggalkan sesi latihan? Progres jawaban tetap tersimpan di sesi ini.")) {
           setActiveTab(newTab);
         }
         return;
       }
       setActiveTab(newTab);
     }}
     setIsMobileDrawerOpen={setIsMobileDrawerOpen}
     isAiPanelOpen={isAiPanelOpen}
     setIsAiPanelOpen={setIsAiPanelOpen}
     mistakes={mistakes}
   />
   ```

### B. Susun Penumpukan Vertikal Rapi di Mobile (`src/index.css`)
Bilah navigasi utama bertumpuk rapi di paling bawah, tombol soal duduk persis di atasnya:
1. `MobileBottomNav`:
   - Tinggi: `calc(58px + env(safe-area-inset-bottom, 0px))`.
   - `position: fixed; bottom: 0; left: 0; right: 0; z-index: 2000;`.
2. `cbt-action-footer` (tombol Sebelumnya, Ragu-Ragu, Berikutnya):
   - Duduk persis di atas `MobileBottomNav`:
     ```css
     .cbt-action-footer {
       position: fixed !important;
       bottom: calc(66px + env(safe-area-inset-bottom, 0px)) !important; /* Pas di atas tab bar 58px */
       left: 10px !important;
       right: 10px !important;
       z-index: 1500 !important;
       background: rgba(255, 255, 255, 0.96) !important;
       backdrop-filter: blur(10px) !important;
       -webkit-backdrop-filter: blur(10px) !important;
       border: 1px solid #dce2d6 !important;
       border-radius: 12px !important;
       padding: 8px 12px !important;
       box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08) !important;
     }
     ```
3. Kompensasi Ruang Bawah Kontainer Soal (`.cbt-runner-container`):
   - Berikan ruang bernafas yang cukup agar pilihan jawaban paling bawah tidak tertutup:
     ```css
     .cbt-runner-container {
       padding-bottom: calc(140px + env(safe-area-inset-bottom, 20px)) !important;
     }
     ```

### C. Unit Test (`tests/cbtBottomNavStack.test.js`)
Buat test suite yang memverifikasi:
1. `MobileBottomNav` tetap dirender pada DOM saat CBT runner aktif.
2. Navigasi keluar dari CBT memicu proteksi konfirmasi sesi aktif.
3. Posisi `cbt-action-footer` berada di atas `MobileBottomNav` (`bottom: calc(66px + ...)`).

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (185+ passing).
2. `npm run build` -> Vite build passing (0 error).
3. Screenshot mobile (390x844) membuktikan susunan rapi bertumpuk (soal di atas, tombol Sebelumnya/Berikutnya di tengah, bilah tab Beranda/CBT/Materi di paling dasar) di `.agents/evidence/TASK-060-mobile-cbt-bottom-nav-stack.png`.
