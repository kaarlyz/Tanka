# TASK-QUIZ-MATERIAL-DROPDOWN-BORDER-FIX-046: Eliminate Double Border on Quiz Material Switchers

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/index.css`
  - `src/components/tabs/QuizTab.tsx`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Konteks & Akar Masalah
Pengguna menegur tampilan border pada dropdown pemilihan materi di menu Latihan Kuis:
> *"pada bagian latihan kuis untuk border yg bagian pilih materi itu gabagus (duplikat) perbaikin itu"*

### Investigasi Auditor (AURA):
1. **Penyebab Double Border**:
   Pada `src/index.css` baris 2654-2660, terdapat aturan global:
   ```css
   select:not(.clean-input):not(.auth-input):not(.no-border) {
     border: 1px solid #ccd6c8 !important;
     box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.03) !important;
   }
   ```
   Aturan `!important` ini menimpa style inline `border: "none"` pada elemen `<select>` di `QuizTab.tsx`.
2. **Akibat Visual**:
   - Kontainer luar (`.quiz-doc-select-container` pada layar setup kuis dan `.quiz-quick-switcher-compact` pada bilah atas kuis) merender border `1px solid #dce2da`.
   - Elemen native `<select>` di dalamnya (`.quiz-doc-select` dan `.quiz-material-dropdown-select`) juga merender border `1px solid #ccd6c8` dan inset box-shadow.
   - Hasilnya terjadi artifak *kotak ganda* (border ganda bertumpuk / duplikat) yang kaku dan tidak rapi.

---

## 2. Spesifikasi Implementasi untuk MARAKA

### A. Reset CSS di `src/index.css`
1. Update selector pengecualian global di `src/index.css`:
   Tambahkan `:not(.quiz-doc-select):not(.quiz-material-dropdown-select)` pada aturan input & select (sekitar baris 2654 dan 2662):
   ```css
   input:not([type="checkbox"]):not([type="radio"]):not(.clean-input):not(.auth-input):not(.no-border),
   textarea:not(.clean-input):not(.auth-input):not(.no-border),
   select:not(.clean-input):not(.auth-input):not(.no-border):not(.quiz-doc-select):not(.quiz-material-dropdown-select) {
     ...
   }
   ```
2. Tambahkan aturan reset tegas dan styling estetis untuk dropdown materi kuis di `src/index.css` (sekitar baris 3145):
   ```css
   .quiz-material-dropdown-select,
   .quiz-doc-select {
     border: none !important;
     outline: none !important;
     box-shadow: none !important;
     background-color: transparent !important;
     -webkit-appearance: none;
     -moz-appearance: none;
     appearance: none;
     text-overflow: ellipsis;
     white-space: nowrap;
     overflow: hidden;
   }

   .quiz-doc-select-container {
     position: relative;
     background-color: #fafbf8;
     border: 1.5px solid #dce4d6 !important;
     border-radius: 10px;
     padding: 2px 10px;
     transition: border-color 0.15s ease, box-shadow 0.15s ease;
   }

   .quiz-doc-select-container:focus-within {
     border-color: #4b6623 !important;
     box-shadow: 0 0 0 3px rgba(75, 102, 35, 0.12) !important;
   }

   .quiz-quick-switcher-compact {
     border: 1.5px solid #dce4d6 !important;
     border-radius: 8px;
     transition: border-color 0.15s ease, box-shadow 0.15s ease;
   }

   .quiz-quick-switcher-compact:focus-within {
     border-color: #4b6623 !important;
     box-shadow: 0 0 0 2px rgba(75, 102, 35, 0.12) !important;
   }
   ```

### B. Harmonisasi Komponen di `src/components/tabs/QuizTab.tsx`
1. Pada elemen `<select className="quiz-material-dropdown-select" ...>` (sekitar baris 370), tambahkan class `clean-input no-border`.
2. Pada elemen `<select className="quiz-doc-select" ...>` (sekitar baris 768), tambahkan class `clean-input no-border`.
3. Pastikan tidak ada border atau box-shadow yang tersisa pada elemen `<select>`. Hanya kontainer pembungkus yang memiliki 1 border hairline rapi (`border: 1.5px solid #dce4d6`).

---

## 3. Acceptance Criteria
- [ ] Elemen `<select>` pada shortcut materi kuis bersih total dari border dan box-shadow native (border: 0 / none).
- [ ] Hanya 1 border tunggal yang tampil pada kontainer `.quiz-doc-select-container` dan `.quiz-quick-switcher-compact`.
- [ ] Focus-within pada kontainer menghasilkan ring hairline hijau `#4b6623` yang halus.
- [ ] `env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js` lulus 100%.
- [ ] `npm run build` sukses tanpa error TypeScript / CSS.
- [ ] Layanan `systemctl --user restart tanka` aktif.
- [ ] DILARANG melakukan `git push`.
