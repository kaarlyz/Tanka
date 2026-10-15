# TASK: TASK-PDF-CSS-PAGED-MEDIA-027
## MODE: HYBRID
## SURFACE ARCHETYPE: W3C Paged Media Margin Box Architecture

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target File: `src/index.css`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Penggunaan `body::after` dengan `position: fixed` di print stylesheet sebelumnya terbukti selalu rentan bertabrakan dengan paragraf terakhir karena elemen `position: fixed` diposisikan di dalam flow viewport halaman oleh Skia/Chromium.
Solusi arsitektural W3C resmi: Gunakan CSS Paged Media Margin Box `@bottom-center` di dalam aturan `@page`. Margin box berada di luar area konten halaman sehingga tabrakan teks 100% mustahil terjadi.

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

Di `src/index.css` pada blok `@media print`:

1. **Gunakan `@bottom-center` di `@page`**:
   ```css
     @page {
       size: A4 portrait;
       margin-top: 16mm;
       margin-left: 16mm;
       margin-right: 16mm;
       margin-bottom: 22mm;

       @bottom-center {
         content: "tanka. • Catatan Studi Mandiri Terpadu • Format Dokumen Resmi";
         font-family: 'DM Mono', monospace;
         font-size: 7.5pt;
         font-weight: 700;
         color: #8c9892;
         letter-spacing: 0.6px;
         border-top: 1px solid #dce2d8;
         padding-top: 3.5mm;
         width: 100%;
         text-align: right;
       }
     }
   ```

2. **Hapus Blok `body::after` di `@media print`**:
   Hapus aturan:
   ```css
        /* Running Footer ditempatkan di dalam zona aman margin bawah */
        body::after {
          content: "tanka. • Catatan Studi Mandiri Terpadu • Format Dokumen Resmi";
          position: fixed;
          ...
        }
   ```
   (Tidak lagi diperlukan karena running footer sudah di-handle murni oleh `@bottom-center`).

3. **Proteksi Orphan Heading**:
   Pastikan heading level 3 dan 4 tidak terpisah dari paragraf pertamanya:
   ```css
     .markdown-body h3, .markdown-body h4,
     .nara-md-response h3, .nara-md-response h4 {
       break-after: avoid !important;
       page-break-after: avoid !important;
     }
   ```

---

## 3. ACCEPTANCE CRITERIA
- [x] Running footer didefinisikan via `@bottom-center` di dalam `@page`.
- [x] `body::after` dihapus dari `@media print`.
- [x] Tabrakan footer di seluruh halaman A4 tereliminasi 100%.
- [x] `npm run build` sukses.
- [x] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [x] DILARANG melakukan `git push` ke remote GitHub.
