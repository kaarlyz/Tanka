# TASK-CBT-MOBILE-FULLHEIGHT-SCROLL-UNIFICATION-058: Full-Height Immersive Question Card & Unified Page Scroll in CBT Runner

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/App.tsx`
  - `src/index.css`
  - `tests/cbtFullHeightScroll.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & Root Cause (Temuan Empiris Pengguna)

Pengguna menyampaikan dua keluhan krusial pada pengalaman ujian CBT mobile:
1. **"Yang ke-scroll malah panelnya" (Nested Scroll Trap):**
   - Saat ini terdapat 2 layer scroll bertumpuk:
     - Outer: `.content-scroll` (kontainer halaman utama `App.tsx`) dengan `overflowY: "auto"`.
     - Inner: `.cbt-pane` (kontainer kartu soal di `ExamCbtTab.tsx`) memiliki `maxHeight: calc(100vh - 220px)` dan `overflowY: "auto"`.
   - Ketika pengguna mengusap layar dengan jempol, gesture scroll sering tertangkap oleh inner pane yang sempit atau sebaliknya terjebak di outer container.
2. **"Container yang menampung soal pilgan dll ratain aja sampe bawah, gausah di-cut setengah gitu biar bagus":**
   - Kartu soal (`.cbt-pane`) saat ini terpotong di tengah layar (`minHeight: 380px`, `maxHeight: calc(100vh - 220px)`), menyisakan ruang kosong canggung di bawahnya sebelum floating footer.
   - Pilihan ganda A s/d E dan pertanyaan tampak "terjepit" di dalam kotak kecil terpotong setengah.
   - Pengguna ingin kontainer soal membentang penuh (*full-height/edge-to-edge container* rata sampai bawah mendekati footer navigasi), sehingga seluruh soal dan opsi jawaban menyatu rapi seperti lembar ujian native.

---

## 2. Spesifikasi Implementasi

### A. Ratakan Kontainer Soal Sampai Bawah di Mobile (`src/index.css` & `ExamCbtTab.tsx`)
1. Di `index.css` untuk mobile (`@media (max-width: 768px)`):
   ```css
   /* Hilangkan batasan tinggi sempit & ratakan kartu soal ke bawah */
   .cbt-runner-container {
     display: flex !important;
     flex-direction: column !important;
     min-height: calc(100dvh - 100px) !important;
     padding-bottom: calc(85px + env(safe-area-inset-bottom, 20px)) !important;
   }

   .cbt-pane {
     flex: 1 1 auto !important;
     min-height: auto !important;
     max-height: none !important;
     height: auto !important;
     overflow-y: visible !important;
     border-radius: 14px !important;
     margin-bottom: 0 !important;
     display: flex !important;
     flex-direction: column !important;
     justify-content: flex-start !important;
   }
   ```
2. Di `ExamCbtTab.tsx`:
   - Pada `<section className="cbt-pane">`, pastikan inline style tidak memaksa `maxHeight: calc(100vh - 220px)` saat mode mobile, atau biarkan class CSS `.cbt-pane` menimpa dengan `max-height: none !important; height: auto !important;`.
   - Berikan `flex: 1` pada kartu soal agar secara otomatis mengisi seluruh sisa ruang vertikal hingga ke atas footer navigasi.

### B. Eliminasi Nested Scroll (Scroll Halaman Tunggal)
1. Hilangkan `overflow-y: auto` dari kartu soal `.cbt-pane` pada mobile. Konten soal mengalir secara natural (*natural page flow*).
2. Yang menggulir adalah satu-satunya scroll container halaman (`.content-scroll`).
3. Saat pengguna mengusap layar, seluruh halaman bergerak mulus tanpa efek "panel di dalam panel yang macet".
4. Tombol aksi bawah ("Sebelumnya", "Ragu-Ragu", "Berikutnya") tetap fixed di dasar layar (`.cbt-action-footer`), dengan padding bawah kartu soal yang cukup (`padding-bottom: calc(85px + env(safe-area-inset-bottom, 20px))`) sehingga opsi jawaban terakhir tidak tertutup footer.

### C. Wacana Sheet Modal: Teks Bisa Di-Scroll Bebas (`useDragControls`)
1. Selesaikan perbaikan `useDragControls` dari task 057 pada modal wacana:
   - Pasang `dragListener={false}` pada motion sheet.
   - Drag gestur hanya aktif pada pill handle di atas.
   - Area teks wacana diberi `overflowY: "auto"`, `WebkitOverflowScrolling: "touch"`, `touchAction: "pan-y"`.

### D. Unit Test (`tests/cbtFullHeightScroll.test.js`)
Buat test suite yang memverifikasi:
1. `.cbt-pane` pada mobile memiliki `max-height: none` dan `overflow-y: visible` (tidak ada inner scroll trap).
2. `.cbt-runner-container` membentang mengisi tinggi viewport (`min-height` adaptif).
3. Modal wacana memiliki pemisahan drag listener dan scrollable content.

---

## 3. Verification Protocol
1. `npm test` passing (180+ passing).
2. `npm run build` passing.
3. Screenshot mobile (390x844) membuktikan kartu soal rata sampai bawah tanpa potongan canggung di `.agents/evidence/TASK-058-mobile-cbt-fullheight.png`.

---

## 4. Execution Evidence & Audit Log
- **Status:** `REVIEW_REQUIRED` (Siap Diaudit AURA)
- **Unit Tests:** `tests/cbtFullHeightScroll.test.js` (3 passing), suite global 184/184 passing (`npm test`).
- **Production Build:** `npm run build` passed cleanly (Vite v8.3.2 client build in ~466ms).
- **DOM Probing Check:** Evaluasi runtime DOM `getBoundingClientRect().right > viewportWidth` pada viewport 390x844 menghasilkan **0 elemen overflow**.
- **Visual Evidence:** `.agents/evidence/TASK-058-mobile-cbt-fullheight.png` (kartu soal `.cbt-pane` membentang proporsional ke bawah mendekati footer, tanpa terpotong setengah, opsi A s/d E terbaca utuh).
- **Files Changed:**
  - `src/index.css`
  - `src/components/tabs/ExamCbtTab.tsx`
  - `tests/cbtFullHeightScroll.test.js`
  - `.agents/evidence/TASK-058-mobile-cbt-fullheight.png`
