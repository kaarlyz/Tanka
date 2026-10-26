# TASK-CBT-HARDWARE-BACK-BUTTON-MODAL-INTEGRATION-070: Native Mobile Back Button / Gesture to Dismiss Open CBT Sheets & Modals Without Route Reload

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/hooks/useAppRoute.ts`
  - `tests/cbtHardwareBackButton.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & UX Objective

Pengguna menyampaikan kebutuhan navigasi native Android/iOS:
> *"btw bisa ga pas muncul panel yg soal kan muncul kita mau back pake tombol kembali nah itu ga langsung ke reload atau kembali tapi ya menghilangkan panel itu gitu, ribet jg mencet tombol atau tap layar"*

### Analisis Teknis & Masalah Saat Ini:
1. Ketika modal sheet (seperti popup **Soal**, popup **Wacana**, drawer **Daftar Soal**, atau **Zoom Gambar**) sedang terbuka di layar:
   - Pengguna menekan tombol navigasi "Kembali" fisik / gesture usap tepi layar kiri (*swipe-from-left back gesture* Android / iOS).
2. Peramban mobile langsung menjalankan event bawaan `popstate` pada histori URL window.
   - Karena modal tidak menyuntikkan *virtual history state*, peramban mengira pengguna ingin berpindah rute web (misal kembali ke `/home` atau keluar web).
   - Akibatnya: sesi halaman reload / keluar dari sesi ujian atau layar berpindah tab, bukannya menutup modal yang sedang terbuka!
3. Pengguna merasa frustrasi karena harus repot menekan tombol silang `✕` kecil atau mengetuk backdrop.

---

## 2. Spesifikasi Implementasi (Standar PWA Native Android/iOS Back Stack)

Integrasikan **Virtual History State Stack** (`window.history.pushState` + `popstate` handler) pada setiap modal interaktif di CBT:

### A. Pola History State Sync untuk Modal CBT (`src/components/tabs/ExamCbtTab.tsx`)
1. Tentukan modal yang aktif:
   - `isSoalModalOpen`
   - `isWacanaModalOpen`
   - `isPaletteOpen`
   - `zoomImage`
2. Kaitan Efek History (`useEffect`):
   Setiap kali salah satu modal tersebut dibuka (`true`):
   ```tsx
   useEffect(() => {
     const hasOpenModal = isSoalModalOpen || isWacanaModalOpen || isPaletteOpen || Boolean(zoomImage);
     if (!hasOpenModal) return;

     // 1. Dorong state palsu ke histori window agar tombol Back HP tertahan di sini
     const modalId = isSoalModalOpen ? "soal" : isWacanaModalOpen ? "wacana" : isPaletteOpen ? "palette" : "zoom";
     const statePayload = { tanka_modal: modalId, timestamp: Date.now() };
     window.history.pushState(statePayload, "");

     // 2. Tangkap event 'popstate' (ketika user menekan tombol Back HP atau swipe tepi layar)
     const handlePopState = (e: PopStateEvent) => {
       // Tutup modal yang sedang terbuka secara anggun
       if (isSoalModalOpen) setIsSoalModalOpen(false);
       if (isWacanaModalOpen) setIsWacanaModalOpen(false);
       if (isPaletteOpen) setIsPaletteOpen(false);
       if (zoomImage) setZoomImage(null);
     };

     window.addEventListener("popstate", handlePopState);

     return () => {
       window.removeEventListener("popstate", handlePopState);
     };
   }, [isSoalModalOpen, isWacanaModalOpen, isPaletteOpen, zoomImage]);
   ```
3. Penutupan Normal (Klik Silang `✕` atau Tap Backdrop):
   Ketika pengguna menutup modal secara manual via klik tombol `✕` atau backdrop:
   Periksa apakah state histori terakhir adalah modal kita. Jika ya, panggil `window.history.back()` agar history stack kembali bersih dan tidak meninggalkan "state hantu".

### B. Proteksi di `src/hooks/useAppRoute.ts`
Pastikan `useAppRoute` mengabaikan event `popstate` jika `e.state?.tanka_modal` terdeteksi (sehingga rute tab utama tidak berpindah ke `/home` saat modal ditutup).

### C. Unit Test (`tests/cbtHardwareBackButton.test.js`)
Buat test suite yang memverifikasi:
1. Membuka modal Soal / Wacana mendorong virtual history state (`pushState`).
2. Menembakkan event `popstate` menutup modal yang bersangkutan tanpa mengubah `activeTab`.
3. Menutup modal via tombol `✕` membersihkan history stack.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (210+ passing).
2. `npm run build` -> Vite build passing (0 error).
3. Uji runtime browser simulasi `window.history.back()` menutup modal sheet dengan sempurna.

---

## 4. Execution Evidence & Status
- **Status**: `VERIFIED`
- **Executor**: MARAKA (`maraka`)
- **Auditor**: AURA (`gikano`)
- **Files Modified**:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/hooks/useAppRoute.ts`
  - `tests/cbtHardwareBackButton.test.js`
- **Verification Summary**:
  - `npm test`: 214 tests pass cleanly (214/214).
  - `npm run build`: Vite build passes with 0 error.
  - Virtual History stack synced for `isSoalModalOpen`, `isWacanaModalOpen`, `isPaletteOpen`, and `zoomImage`.
  - Manual close invokes `window.history.back()` to avoid ghost history entries.
  - `useAppRoute` ignores `e.state?.tanka_modal` to prevent route reload / tab flip.
