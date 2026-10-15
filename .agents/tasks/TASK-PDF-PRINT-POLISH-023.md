# TASK: TASK-PDF-PRINT-POLISH-023
## MODE: HYBRID (VISUAL_PRODUCT & STYLESHEET ARCHITECTURE)
## SURFACE ARCHETYPE: Editorial PDF Export & Print Stylesheet

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/index.css`
  - `src/components/tabs/MaterialTab.tsx`
  - `src/App.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pengguna melaporkan:
> *"boleh coba cek pdf yg di generate tankanya dmn kaya ad dua perihal yaitu watermarknya kurang bagus, dan bagian nav itu masih masuk, dan ad beberapa format yg kek teks yg ketimpa dan tidak kerender sepenuhnya di pdf"*

### Hasil Audit Empiris (CDP Print to PDF & Vision Inspection):
1. **Navigasi Bocor ke Halaman Cetak (Page 1)**:
   - Kontainer tab mode belajar di `App.tsx` (`.mode-tabs`: `Materi 01`, `Rangkuman AI`, `Flashcards 00`, dll) tidak disembunyikan dalam `@media print`.
   - Kontainer `.material-mode-switcher` di `MaterialTab.tsx` tidak disembunyikan (tombolnya hilang tetapi kontainer kotaknya tetap tercetak sebagai kotak kosong berborder).
2. **Watermark Kurang Bagus & Menabrak Teks (Page 2, 5, 6)**:
   - `body::after` memakai `position: fixed; bottom: 6mm` dengan teks mentah polos tanpa garis pemisah.
   - Karena ketiadaan buffer proteksi `break-inside: avoid` pada tabel dan blok latihan, teks baris terakhir dan baris tabel di bagian bawah halaman tertimpa langsung oleh watermark.
3. **Format Teks Ketimpa, Judul Dobel & Terpotong**:
   - **Judul Ganda**: Di `MaterialTab.tsx`, header cetak menampilkan `<h1>{activeDocTitle}</h1>`, tetapi di badan markdown judul `# Judul Dokumen` tidak terhapus (karena regex `replace(/^#\s+[^\n]+\n+/, "")` gagal mencocokkan jika diawali blockquote YouTube `> 📺 ...`).
   - **Word-spacing Blowout**: Di `src/index.css`, aturan `.markdown-body { text-align: justify !important; }` menyebabkan kata-kata pada judul meregang aneh (`Matematika    Fundamental:    Mengenal`).
   - **Bab Terpotong di Dasar Halaman**: Judul bab baru (`## Bab 2`, `## Bab 3`, dll) muncul di baris paling bawah halaman tanpa jeda halaman bersih.

---

## 2. SPESIFIKASI IMPLEMENTASI

### A. Perbarui `src/App.tsx`
Tambahkan kelas `.print-hidden` pada kontainer `.mode-tabs` (baris ~875):
```tsx
            {activeTab !== "home" && (
              <div
                className="mode-tabs print-hidden"
                role="tablist"
                aria-label="Mode belajar"
```

### B. Perbarui `src/components/tabs/MaterialTab.tsx`
1. Berikan kelas `.print-hidden` pada bar mode switcher (baris ~751):
   ```tsx
   <div className="material-mode-switcher print-hidden" ...>
   ```
2. Hapus judul ganda di dokumen cetak:
   Gunakan regex multiline `m` agar judul level 1 `# ` terhapus meskipun didahului oleh kutipan referensi YouTube:
   ```tsx
   const printContent = React.useMemo(() => {
     const raw = formattedContent || activeDocContent || "";
     return raw.replace(/^#\s+[^\n]+(?:\n|$)/m, "");
   }, [formattedContent, activeDocContent]);
   ```
   Dan gunakan `content={printContent}` pada `<MemoizedMarkdownBody>` di dalam `.print-full-document` (baris ~1373).

### C. Revamp Lengkap `@media print` di `src/index.css`
Perbaiki blok `@media print` (baris ~2162 s/d ~2420):

1. **Aturan `@page` & Margin Bebas Tabrakan**:
   ```css
   @media print {
     @page {
       size: A4 portrait;
       margin: 16mm 16mm 22mm 16mm;
     }

     html, body {
       width: 100% !important;
       margin: 0 !important;
       padding: 0 !important;
       background: #ffffff !important;
       color: #17201d !important;
       font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif !important;
     }
   ```

2. **Sembunyikan Seluruh Elemen Navigasi, Chrome, dan Tombol**:
   ```css
     .sidebar-shell,
     .figma-sidebar,
     .sidebar-drawer,
     .ai-panel-box,
     .ai-panel-backdrop,
     .lesson-footer-bar,
     .topbar-bar,
     .tab-bar-container,
     .mode-tabs,
     .main-nav,
     .material-mode-switcher,
     .material-header-panel,
     .learning-stats-bar,
     .material-hub-card,
     .saved-modules-card,
     .desktop-only,
     .mobile-only,
     .drawer-overlay,
     .mobile-bottom-nav,
     .sticky-reader-toolbar,
     .metrics-grid,
     .mindmap-toolbar,
     button,
     .formula-actions,
     .print-hidden,
     [role="dialog"],
     .modal-scale-in,
     .modal-overlay,
     .modal-backdrop,
     .formula-drawer-box,
     .tab-pane-animate > div:first-child:not(.print-full-document) {
       display: none !important;
     }
   ```

3. **Perbaikan Tipografi & Justifikasi (Cegah Teks Renggang / Ketimpa)**:
   ```css
     .markdown-body, .book-reader {
       text-align: left !important;
       font-size: 10.5pt !important;
       line-height: 1.65 !important;
       color: #1a2621 !important;
     }

     .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4,
     .nara-md-response h1, .nara-md-response h2, .nara-md-response h3 {
       text-align: left !important;
       letter-spacing: -0.015em !important;
     }

     /* Bab baru selalu dimulai pada halaman baru secara rapi */
     .markdown-body h2:not(:first-of-type),
     .nara-md-response h2:not(:first-of-type) {
       break-before: page !important;
       page-break-before: always !important;
       margin-top: 0 !important;
       padding-top: 4pt !important;
     }

     .markdown-body h1, .nara-md-response h1 {
       font-size: 18pt !important;
       font-weight: 800 !important;
       color: #111a17 !important;
       border-bottom: 2px solid #18221f !important;
       padding-bottom: 6px !important;
       margin: 16pt 0 10pt !important;
       break-after: avoid !important;
       page-break-after: avoid !important;
     }

     .markdown-body h2, .nara-md-response h2 {
       font-size: 14pt !important;
       font-weight: 800 !important;
       color: #18221f !important;
       border-bottom: 1.5px solid #d0d7cd !important;
       padding-bottom: 4px !important;
       margin: 18pt 0 8pt !important;
       break-after: avoid !important;
       page-break-after: avoid !important;
     }

     .markdown-body h3, .nara-md-response h3 {
       font-size: 11.5pt !important;
       font-weight: 700 !important;
       color: #2b3934 !important;
       margin: 14pt 0 6pt !important;
       break-after: avoid !important;
       page-break-after: avoid !important;
     }

     .markdown-body p, .nara-md-response p {
       font-size: 10pt !important;
       line-height: 1.65 !important;
       color: #24302b !important;
       margin-bottom: 10pt !important;
       orphans: 3 !important;
       widows: 3 !important;
     }
   ```

4. **Proteksi Anti-Potong pada Blok Rumus, Callout & Tabel**:
   ```css
     .visual-diagram-card,
     .visual-flow-step,
     .katex-display,
     .markdown-body pre,
     .nara-md-response pre,
     .markdown-body blockquote,
     .nara-md-response blockquote,
     .markdown-body table,
     .nara-md-response table,
     .markdown-body tr,
     .nara-md-response tr {
       break-inside: avoid !important;
       page-break-inside: avoid !important;
     }
   ```

5. **Watermark / Running Footer Elegan & Bebas Tabrakan**:
   Ganti `body::after` menjadi running footer editorial yang berkelas:
   ```css
     body::after {
       content: "tanka. • Catatan Studi Mandiri Terpadu • Format Dokumen Resmi";
       position: fixed;
       bottom: 4mm;
       left: 16mm;
       right: 16mm;
       font-size: 7.5pt;
       font-weight: 700;
       color: #8c9892 !important;
       font-family: 'DM Mono', monospace !important;
       letter-spacing: 0.6px;
       border-top: 1px solid #dce2d8 !important;
       padding-top: 3mm;
       text-align: right;
       z-index: 9999;
       pointer-events: none !important;
       background: transparent !important;
     }
   ```

---

## 3. ACCEPTANCE CRITERIA
- [x] Navigasi atas (`.mode-tabs`) dan `.material-mode-switcher` 100% hilang dari halaman cetak PDF (Page 1 bersih).
- [x] Judul dokumen tidak tercetak dobel.
- [x] Heading tidak lagi mengalami word-spacing blowout (`text-align: left !important`).
- [x] Setiap bab (`## Bab 2`, `## Bab 3`, dst.) dimulai pada halaman baru secara rapi (`break-before: page`).
- [x] Blok rumus KaTeX, diagram ASCII, dan tabel tidak terbelah jelek atau terpotong di tepi kertas (`break-inside: avoid`).
- [x] Watermark running footer tampil elegan dengan garis pemisah tipis dan tidak menabrak baris teks maupun rumus apa pun.
- [x] `npm run build` sukses.
- [x] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [x] DILARANG melakukan `git push` ke remote GitHub.
