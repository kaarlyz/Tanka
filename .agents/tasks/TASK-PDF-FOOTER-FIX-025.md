# TASK: TASK-PDF-FOOTER-FIX-025
## MODE: HYBRID
## SURFACE ARCHETYPE: Print Stylesheet Coordinate Alignment

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target File: `src/index.css`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pada audit visual `final_page-02.png` & `final_page-05.png`:
Nilai koordinat negatif `bottom: -16mm` pada `body::after` menyebabkan mesin cetak Skia/Chromium membungkus (wrap-around) teks footer ke area atas halaman (menimpa card header di top-right).
Karena `break-inside: avoid` pada tabel, list, dan blok rumus sudah berhasil menciptakan margin kosong yang luas di dasar halaman, koordinat footer wajib dikembalikan ke koordinat positif yang aman (`bottom: 3mm`, `left: 16mm`, `right: 16mm`) dengan `margin-bottom: 20mm` pada `@page`.

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

Di `src/index.css` pada blok `@media print`:
1. **Atur `@page`**:
   ```css
   @page {
     size: A4 portrait;
     margin-top: 16mm;
     margin-left: 16mm;
     margin-right: 16mm;
     margin-bottom: 20mm;
   }
   ```
2. **Koreksi `body::after`**:
   ```css
   body::after {
     content: "tanka. • Catatan Studi Mandiri Terpadu • Format Dokumen Resmi";
     position: fixed;
     bottom: 3mm;
     left: 16mm;
     right: 16mm;
     font-size: 7.5pt;
     font-weight: 700;
     color: #8c9892 !important;
     font-family: 'DM Mono', monospace !important;
     letter-spacing: 0.6px;
     border-top: 1px solid #dce2d8 !important;
     padding-top: 2.5mm;
     text-align: right;
     z-index: 9999;
     pointer-events: none !important;
     background: transparent !important;
   }
   ```

---

## 3. ACCEPTANCE CRITERIA
- [x] Footer watermark berada di bawah halaman (`bottom: 3mm`) dengan batas margin `left: 16mm, right: 16mm`.
- [x] Teks footer TIDAK PERNAH membungkus ke area atas halaman (Page 2 dan Page 5 bersih di area atas).
- [x] Tidak ada tabrakan antara teks rumus/tabel dengan footer.
- [x] `npm run build` sukses.
- [x] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [x] DILARANG melakukan `git push` ke remote GitHub.
