# TASK-POLISH-CHAT-SCROLL-FAB-AND-CBT-LAYOUT-CLEANUP-067: Enhance Scroll Bottom FAB Positioning in Tanya Nara & Purge Unwanted CBT Layout Mutation

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/modals/TanyaNaraPanel.tsx`
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/polishLayoutFab.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & Root Cause Analysis

Pengguna menyampaikan dua koreksi langsung:
1. **"Tombol 'Pesan Terbaru' dibesarin sedikit dan diatasin lagi, dia nabrak sama yang template pesan itu"**
   - Di `TanyaNaraPanel.tsx` baris 1199:
     Tombol `.chat-scroll-bottom-fab` diberi `bottom: 74px`.
     Sementara di bawahnya terdapat bilah prompt chips (template pesan seperti *"Bahas soal ini"*, *"Beri contoh lain"*) yang berada di atas input bar.
     Tinggi `bottom: 74px` membuat tombol floating panah bawah tersebut bertabrakan (*overlapping / colliding*) dengan deretan chip template pesan.
   - Ukuran tombol juga terlalu kecil dan kurang mencolok di layar HP.
   - Solusi:
     - Naikkan posisinya ke `bottom: 120px` (atau `bottom: 110px`) agar melayang bersih di atas area prompt chips dan input bar tanpa bersinggungan.
     - Perbesar ukurannya sedikit: `padding: 8px 18px`, `font-size: 13px`, `icon size={15}`, border radius `9999px` agar lebih mantap ditekan jempol.

2. **"Ini kenapa begini layoutnya berubah aneh" (Di Screenshot CBT):**
   - Di `ExamCbtTab.tsx`, implementasi fitur *Sticky Question Snapper* sebelumnya menyisipkan bar melayang baru (`.cbt-sticky-question-dock`) dengan margin negatif `margin: 0 -14px 12px -14px` dan lebar `calc(100% + 28px)` di tengah-tengah kartu soal, serta label badge "No 1" ganda.
   - Hal ini membuat tampilan atas soal tampak rusak, ganda, dan canggung (muncul bar putih bertumpuk aneh di antara nomor soal dan kartu pernyataan).
   - Pengguna menolak layout yang berubah aneh tersebut.
   - Solusi:
     - **Bersihkan / Rollback mutasi aneh tersebut**: Hapus elemen sticky dock aneh yang memotong kartu soal di tengah jalan (`cbt-sticky-question-dock`, `questionSentinelRef`, dan `isQuestionScrolledPast`).
     - Kembalikan layout kartu soal yang bersih, natural, dan utuh:
       Header hitam di atas ➔ Kartu Soal putih bersih membentang rapi ➔ Teks soal di atas ➔ Kartu pernyataan Benar/Salah yang luas di bawah ➔ Floating action footer di dasar layar.

---

## 2. Spesifikasi Implementasi

### A. Perbesar & Geser ke Atas Tombol "Pesan Terbaru" (`src/components/modals/TanyaNaraPanel.tsx`)
1. Di `TanyaNaraPanel.tsx`:
   ```tsx
   <motion.button
     type="button"
     initial={{ opacity: 0, y: 10, scale: 0.85, x: "-50%" }}
     animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
     exit={{ opacity: 0, y: 10, scale: 0.85, x: "-50%" }}
     whileTap={{ scale: 0.93 }}
     transition={{ type: "spring", stiffness: 350, damping: 25 }}
     onClick={() => {
       const el = chatWindowRef.current;
       if (el) {
         el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
         setShowScrollBottomBtn(false);
       }
     }}
     className="chat-scroll-bottom-fab"
     style={{
       position: "absolute",
       bottom: 115, // Dinaikkan dari 74px ke 115px agar tidak nabrak template prompt chips
       left: "50%",
       transform: "translateX(-50%)",
       backgroundColor: "#18221f",
       color: "#c8f064",
       border: "1.5px solid rgba(200, 240, 100, 0.45)",
       borderRadius: 9999,
       padding: "8px 18px", // Diperbesar
       display: "inline-flex",
       alignItems: "center",
       gap: 7,
       fontSize: 13, // Diperbesar
       fontWeight: 800,
       boxShadow: "0 6px 20px rgba(0, 0, 0, 0.28)",
       cursor: "pointer",
       zIndex: 70, // Lebih tinggi dari prompt chips
       touchAction: "manipulation",
     }}
   >
     <ArrowDown size={15} color="#c8f064" strokeWidth={2.5} />
     <span>Pesan Terbaru</span>
   </motion.button>
   ```

### B. Bersihkan Layout CBT dari Mutasi Snapper Aneh (`src/components/tabs/ExamCbtTab.tsx`)
1. Hapus elemen `cbt-sticky-question-dock`, `cbt-question-sentinel`, dan popover `cbt-quick-peek` dari `ExamCbtTab.tsx`.
2. Bersihkan state `isQuestionScrolledPast`, `isQuestionPeekOpen`, dan observer terkait.
3. Pastikan alur kartu soal kembali rapi dan solid:
   - Header Nomor Soal (`Soal Nomor X (dari Y butir)`) + Tombol `Wacana`.
   - Teks Soal (`CbtContentRenderer content={currentItem.soal}`).
   - Opsi pilihan ganda atau Kartu Pernyataan Benar/Salah (`.cbt-stmt-card`) yang luas dan bersih.
   - Floating circular FAB Nara AI di kanan bawah.
   - Bilah aksi soal (Sebelumnya / Berikutnya) melayang rapi di atas bilah tab navigasi utama.

### C. Unit Test (`tests/polishLayoutFab.test.js`)
Buat test suite yang memverifikasi:
1. `TanyaNaraPanel` memiliki tombol "Pesan Terbaru" dengan posisi `bottom >= 110` dan padding yang diperbesar.
2. `ExamCbtTab` bersih dari artefak `cbt-sticky-question-dock` dan layout soal mengalir natural.

---

## 3. Verification Protocol
1. `npm test` passing (200+ passing).
2. `npm run build` passing (0 error).
3. Screenshot mobile (390x844) membuktikan layout CBT kembali bersih dan tombol chat melayang di atas chip di `.agents/evidence/TASK-067-cbt-clean-layout-and-fab.png`.

---

## 4. Execution Evidence & Verification Results
- **Status**: `VERIFIED`
- **Files Modified**:
  - `src/components/modals/TanyaNaraPanel.tsx`: FAB dinaikkan ke `bottom: 115`, padding `8px 18px`, font 13px bold 800, icon `ArrowDown` size 15 strokeWidth 2.5, zIndex 70.
  - `src/components/tabs/ExamCbtTab.tsx`: Rollback total artefak snapper (`cbt-sticky-question-dock`, `questionSentinelRef`, `quickPeekRef`, `isQuestionScrolledPast`, `isQuestionPeekOpen`, dan observer). Layout soal kembali mengalir natural.
  - `src/index.css`: Dihapus selector `.cbt-sticky-question-dock` dan `.cbt-quick-peek-popover`.
  - `tests/polishLayoutFab.test.js`: Suite test baru verifikasi FAB position/dimensions & layout CBT bersih.
  - `tests/naraScrollToBottom.test.js`: Toleransi regex icon ArrowDown size 14/15.
- **Verification Commands & Results**:
  - `npm test`: 207 passing, 0 failing.
  - `npm run build`: Vite build sukses dalam 396ms tanpa error.
  - DOM Probe runtime: 0 elemen horizontal overflow (`overflowCount: 0`).
  - Geometri FAB runtime: `fabBottomAboveChipsTop: 20.8125px` (melayang bersih di atas prompt chips tanpa tabrakan).
  - Screenshot visual verification: `.agents/evidence/TASK-067-cbt-clean-layout-and-fab.png` diperiksa dengan `vision_analyze` (Lolos audit ergonomi).
