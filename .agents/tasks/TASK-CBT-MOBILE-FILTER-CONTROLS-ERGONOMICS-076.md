# TASK-CBT-MOBILE-FILTER-CONTROLS-ERGONOMICS-076: Mobile Grid & Horizontal Scroll Ergonomics for CBT Category & Subject Filters

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/cbtMobileFiltersErgonomics.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & User Direction

Pengguna menyampaikan:
> *"btw unntuk bagian grid di phone atau mobile, itu oerbagusin dari bagian panel yg mencakup isinya [ sma wajib, sma pilihan, utbk snbt dll,,] itu perbaikin gridnya biar ga asal berantakan and then bagian yanng mencakup dibawahnya dibawah bar search seperti [semua mapel, bahasa inggris, bahasa indonesia dll,, ] itu juga perbaikin. Buat eksperience design dan ui ux yg bagus ya. dan gausah pake mode visual. screenshot aja sama aku"*

### Cacat UI/UX Saat Ini di Layar Mobile (`< 768px`):
1. **Segmented Control Kategori Pecah Berantakan (`flex-wrap: wrap`)**:
   - Di `ExamCbtTab.tsx`:
     Tab `[ SMA Wajib, SMA Pilihan, UTBK SNBT, AI Drill, Riwayat ]` diletakkan dalam kontainer `display: flex; flex-wrap: wrap`.
     Di layar sempit ponsel (360px - 390px), tombol-tombol tab ini terpecah menjadi 2 atau 3 baris yang tidak rata (misal baris 1 ada 2 tombol, baris 2 ada 2 tombol, baris 3 tersisa 1 tombol melebar sendirian). Tampilannya compang-camping dan terasa rapuh/asal-asalan.
2. **Subject Pills Filter Menumpuk Mengotori Layar**:
   - Di bawah search bar, pills `[ Semua Mapel, Bahasa Indonesia, Matematika, Sosiologi, Ekonomi, Geografi, dll. ]` juga memakai `flex-wrap: wrap`.
   - Di HP, puluhan pill ini menciptakan "dinding tombol" setinggi 150px-200px yang mendorong konten utama jauh ke bawah, menghalangi pandangan pengguna.
3. **Pencarian / Search Bar Terjepit**:
   - Search bar berada di samping segmented control tanpa hirarki yang jelas di mobile.

---

## 2. Spesifikasi Implementasi

### A. Format Segmented Control Kategori di Mobile (`.cbt-category-segmented`)
Gunakan pola **Modern Native App Segmented Carousel / Horizontal Touch Bar** (seperti Apple Settings / Spotify Pills / YouTube Chips):
1. **Desktop (`>= 768px`)**:
   - Tetap segmented bar horizontal rapi dengan background `#e8ede4`, border `#dce2d6`, dan tombol bersebelahan.
2. **Mobile (`< 768px`)**:
   - Jadikan **Horizontal Touch-Scroll Rail**:
     - `display: flex; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch;`
     - Padding container: `4px 6px`.
     - `gap: 6px`.
     - Masing-masing tab button memiliki `flex: 0 0 auto`, `white-space: nowrap`, `padding: 8px 14px`, `min-height: 42px`, border-radius `10px`.
     - Tab aktif: background `#18221f`, color `#c8f064`, badge `#23342e` border `#334840` teks `#c8f064` (kontras solid khas Tanka).
     - Tab inaktif: background `#ffffff`, color `#526350`, border `1px solid #dce2d6`.
   - **Hasil**: Tidak ada lagi tombol yang jatuh ke baris kedua atau melompat berantakan. Mengalir halus dengan sentuhan swipe horizontal native.

### B. Baris Pencarian Mobile (`.cbt-search-bar-wrap`)
- Di mobile, letakkan search bar di baris tersendiri dengan lebar penuh (`width: 100%`), tinggi input 44px (`min-height: 44px`), border-radius 12px, dengan ikon pencarian yang lega.

### C. Subject Filter Pills di Mobile (`.cbt-subject-pills-rail`)
1. **Horizontal Swipeable Chip Rail**:
   - Ubah container subject pills dari `flex-wrap: wrap` menjadi:
     ```css
     .cbt-subject-pills-rail {
       display: flex;
       flex-wrap: nowrap;
       overflow-x: auto;
       gap: 8px;
       padding-bottom: 4px;
       margin-bottom: 16px;
       scrollbar-width: none;
       -webkit-overflow-scrolling: touch;
     }
     .cbt-subject-pills-rail::-webkit-scrollbar {
       display: none;
     }
     ```
2. **Desain Pill Elegan (Khas Tanka)**:
   - Chip aktif: background `#18221f`, border `1px solid #18221f`, color `#ffffff`, font-weight 700.
   - Chip inaktif: background `#ffffff`, border `1px solid #dce2d6`, color `#526350`, hover/touch background `#f4f7f2`.
   - Setiap chip `flex: 0 0 auto`, `white-space: nowrap`, `min-height: 38px`, `padding: 6px 14px`.
3. **Hasil**: Area filter kini hanya memakan 1 baris ramping setinggi ~42px, tidak lagi menumpuk setinggi 200px. Pengguna bisa langsung melihat daftar paket ujian di bawahnya dengan sekali lirikan mata!

### D. CSS Dedicated Classes di `src/index.css`
Tambahkan class helper:
- `.cbt-filter-section`
- `.cbt-category-segmented`
- `.cbt-search-bar-wrap`
- `.cbt-subject-pills-rail`
- `.cbt-subject-chip`
Dengan media queries terisolasi yang menjamin responsive desktop dan mobile tanpa benturan.

### E. Unit Test & Screenshot Probe (`tests/cbtMobileFiltersErgonomics.test.js`)
Buat test suite:
1. Verifikasi kelas `.cbt-category-segmented` dan `.cbt-subject-pills-rail` memiliki style `overflow-x: auto` dan `flex-wrap: nowrap` pada mobile.
2. Verifikasi seluruh touch-target tombol minimal 40px - 44px.
3. DOM probe layout mobile: `overflowingCount: 0`.
4. Simpan screenshot di `.agents/evidence/TASK-076-mobile-cbt-filters.png` dan `.agents/evidence/TASK-076-desktop-cbt-filters.png`.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing.
2. `npm run build` -> Vite build bersih tanpa warning.
3. Screenshot mobile tersimpan di `.agents/evidence/` untuk inspeksi langsung pengguna (tanpa `vision_analyze` AURA sesuai preferensi token).

---

## 4. Execution Evidence & Completion Report
- **Status**: `VERIFIED`
- **Files Changed**:
  - `src/components/tabs/ExamCbtTab.tsx`: Refactor filter panel layout with `.cbt-filter-section`, `.cbt-category-segmented`, `.cbt-category-tab-btn`, `.cbt-search-bar-wrap`, `.cbt-search-input`, `.cbt-subject-pills-rail`, `.cbt-subject-chip`.
  - `src/index.css`: Added responsive horizontal touch-rails (`overflow-x: auto`, `flex-wrap: nowrap`, hidden scrollbars) and Tanka canonical styling (ink `#18221f` + lime `#c8f064`, inaktif clean card `#ffffff` + `#dce2d6`, touch targets `>= 42px`).
  - `tests/cbtMobileFiltersErgonomics.test.js`: Verified DOM structure, CSS declarations, geometry probe (`overflowingCount: 0`), and screenshot evidence presence.
- **Verification Commands**:
  - `node --test tests/cbtMobileFiltersErgonomics.test.js` -> 4/4 passing
  - `npm test` -> 258/258 passing
  - `npm run build` -> Vite build clean (441ms)
- **Artifacts**:
  - Mobile screenshot: `.agents/evidence/TASK-076-mobile-cbt-filters.png` (390x844)
  - Desktop screenshot: `.agents/evidence/TASK-076-desktop-cbt-filters.png` (1920x1080)
  - Geometri mobile probe: `uncontainedOverflowCount: 0`, `rootScrollWidth: 390px`

