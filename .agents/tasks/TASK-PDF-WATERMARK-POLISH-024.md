# TASK: TASK-PDF-WATERMARK-POLISH-024
## MODE: HYBRID
## SURFACE ARCHETYPE: Print Stylesheet & Visual Diagram Normalization

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/index.css`
  - `src/components/common/DiagramRenderer.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Lanjutan penyempurnaan PDF hasil audit visual mandiri (`verified_page-02.png` & `verified_page-05.png`):
1. **Watermark / Footer Collision**:
   Pada Page 5, baris terakhir rumus matematika (`Langkah 1: ... -4a - a^2 = -12`) masih menabrak garis pemisah footer running text.
   *Akar Masalah:* `body::after` dengan `position: fixed` diletakkan di `bottom: 4mm` di dalam content box. Seharusnya diposisikan di area margin bawah negatif (`bottom: -15mm`) dengan `@page { margin-bottom: 25mm; }` sehingga ada buffer 10mm mutlak antara baris teks terakhir dan footer watermark.
2. **Double Bullet & Mangled Tree Diagram (Page 2)**:
   Diagram hierarki bilangan menampilkan `• ├──` (bullet ganda dengan karakter branch ASCII) dan kotak kosong di atasnya akibat `parseAsciiTree` keliru mendeteksi spasi indentasi sebagai pohon 2-pilar.
3. **Leaked Technical Jargon ("Notasi KaTeX") di Header Tabel (Page 5)**:
   Header kolom tabel matematika bertuliskan `Notasi KaTeX`. Wajib diganti menjadi istilah editorial baku `Notasi Simbol` / `Notasi Matematis`.

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

### A. Perbarui `src/index.css` (@media print)
1. **Margin Halaman & Running Footer Negatif**:
   ```css
   @media print {
     @page {
       size: A4 portrait;
       margin-top: 16mm;
       margin-left: 16mm;
       margin-right: 16mm;
       margin-bottom: 25mm;
     }

     /* Running Footer ditempatkan di dalam zona aman margin bawah */
     body::after {
       content: "tanka. • Catatan Studi Mandiri Terpadu • Format Dokumen Resmi";
       position: fixed;
       bottom: -16mm;
       left: 0;
       right: 0;
       font-size: 7.5pt;
       font-weight: 700;
       color: #8c9892 !important;
       font-family: 'DM Mono', monospace !important;
       letter-spacing: 0.6px;
       border-top: 1px solid #dce2d8 !important;
       padding-top: 3.5mm;
       text-align: right;
       z-index: 9999;
       pointer-events: none !important;
       background: transparent !important;
     }
   ```
2. **Proteksi Blok Contoh Soal (Worked Example)**:
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
     .nara-md-response tr,
     .markdown-body ol,
     .markdown-body ul {
       break-inside: avoid !important;
       page-break-inside: avoid !important;
     }
   ```

### B. Perbarui `src/components/common/DiagramRenderer.tsx`
1. **Bersihkan Karakter Branch dari Bullet Item**:
   Pada render pohon (baris ~644):
   Bersihkan karakter kotak dari teks item:
   ```tsx
   const cleanItem = item.replace(/^[┌└├│─┬┴┼\s\-_=]+/g, "").trim();
   ```
   Gunakan `<MathView text={cleanItem} />` agar tidak memunculkan `• ├──`.
2. **Proteksi Single-Column Tree di `parseAsciiTree`**:
   Jika baris mengandung karakter pohon `/[┌└├│─]/` tetapi tidak memiliki dua kolom nyata (spasi hanya indentasi), jangan dipotong menjadi 2 pilar kosong:
   ```ts
   if (clean.some(l => /^\s*[┌└├│─]/.test(l)) && !clean.some(l => /\S\s{6,}\S/.test(l))) {
     return null; // biarkan fallback ke clean sequential nodes yang rapi
   }
   ```
3. **Filter Header Tabel "Notasi KaTeX"**:
   Pada `renderVisualDiagramOrPre` atau saat merender `th`, ganti teks "KaTeX" menjadi "Simbol":
   ```ts
   // Sanitasi istilah KaTeX pada konten teks
   ```

---

## 3. ACCEPTANCE CRITERIA
- [x] Running footer watermark diposisikan di zona aman margin (`bottom: -16mm` / adjusted ke `bottom: 3mm` margin-bottom 20mm di 025): ZERO collision dengan teks atau rumus di seluruh halaman.
- [x] Diagram hierarki di Page 2 tidak lagi menampilkan `• ├──` (bullet ganda dengan karakter branch).
- [x] Header tabel bersih dari jargon "KaTeX" (berganti menjadi "Notasi Simbol").
- [x] `npm run build` sukses.
- [x] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [x] DILARANG melakukan `git push` ke remote GitHub.
