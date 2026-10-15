# TASK: TASK-TABLE-MOBILE-ASCII-CANVAS-029
## MODE: HYBRID
## SURFACE ARCHETYPE: Mobile Table Ergonomics & 2D Concept Canvas

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/index.css`
  - `src/components/common/DiagramRenderer.tsx`
  - `src/components/tabs/MaterialTab.tsx`
  - `src/components/tabs/SummaryTab.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pengguna melaporkan:
> *"coba cek yg bagian" tabel msih ad beberapa format gabagus dmn kek huruf yg beruntun kebawah (untuk tampilan mobile) dan jg kek format yang ga kerender dan msih pake format ascii"*

### Dua Temuan Cacat Riil (Bukti Audit CDP & Vision):
1. **Huruf Beruntun ke Bawah pada Layar Mobile (390px)**:
   - Tabel sebelumnya menggunakan `width: 100%` tanpa `min-width` dan tanpa `white-space: nowrap` pada `th`.
   - Pada layar HP (334px kontainer), kolom header dipaksa mengecil hingga lebar 57px–69px, sementara cell mewarisi `word-break: break-word`.
   - Akibatnya kata terpecah per huruf secara vertikal: *"Notasi Himpun / an Semest / a"*, *"Simb / ol Stan / dar"*, *"Bilanga / n Asli"*.
2. **Diagram ASCII yang Terpotong / Tidak Kerender**:
   - Fungsi `parseAsciiTree` di `DiagramRenderer.tsx` memotong diagram 2D berbasis indeks kolom karakter (`slice(0, splitIdx)`).
   - Akibatnya diagram pohon dan box drawing (`┌──┴──┐`, `├──`, `└──`) terbelah menjadi fragmen teks rusak: `┌────────┴─────`, `│   │`, `└── Bila`.
   - Blok diagram lainnya masih muncul sebagai blok terminal teks gelap mentah.

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

### A. Perbaiki CSS Tabel di `src/index.css`
Tambahkan aturan komprehensif untuk `.table-scroll-wrapper` dan `.book-reader table`:
```css
.table-scroll-wrapper {
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch !important;
  max-width: 100% !important;
  margin: 18px 0 !important;
  border-radius: 8px !important;
}

.table-scroll-wrapper table,
.book-reader table {
  min-width: 500px !important;
  width: 100% !important;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  border: 1px solid #dbe2d8 !important;
  border-radius: 8px !important;
  font-size: 13px !important;
}

.table-scroll-wrapper th,
.book-reader th {
  background: #f3f7f0 !important;
  color: #1a2721 !important;
  font-weight: 700 !important;
  padding: 10px 14px !important;
  border-bottom: 1px solid #dbe2d8 !important;
  text-align: left !important;
  white-space: nowrap !important; /* Mencegah huruf beruntun ke bawah */
  min-width: 100px !important;
}

.table-scroll-wrapper td,
.book-reader td {
  padding: 10px 14px !important;
  border-bottom: 1px solid #edf1ea !important;
  color: #283731 !important;
  line-height: 1.55 !important;
  word-break: normal !important; /* Mencegah huruf beruntun ke bawah */
  overflow-wrap: break-word !important;
  min-width: 90px !important;
}
```

### B. Perbarui `src/components/common/DiagramRenderer.tsx`
1. **Ganti Pemotongan Kolom Rusak dengan 2D Concept Canvas**:
   Pada `renderVisualDiagramOrPre`:
   Ketika mendeteksi karakter box drawing (`/[┌└├│─┬┴┼┐┘┤┴┬│─]|\+[-=]{2,}/`):
   Rendernya di dalam kartu kanvas diagram 2D berlabel editorial:
   ```tsx
   // Pattern 7: 2D Spatial Concept Tree & Architecture Canvas
   const hasBoxChars = /[┌└├│─┬┴┼┐┘┤┴┬│─]|\+[-=]{2,}/.test(text);
   if (hasBoxChars) {
     return (
       <div
         className="visual-diagram-card visual-ascii-canvas"
         style={{
           margin: "18px 0",
           backgroundColor: "#f9faf7",
           border: "1px solid #dce2da",
           borderRadius: 8,
           overflow: "hidden",
           boxShadow: "0 1px 4px rgba(24, 34, 31, 0.03)"
         }}
       >
         <div
           style={{
             display: "flex",
             alignItems: "center",
             justifyContent: "space-between",
             padding: "8px 14px",
             backgroundColor: "#f0f4ee",
             borderBottom: "1px solid #dce2da",
             fontSize: 11,
             fontWeight: 800,
             color: "#3d541b",
             fontFamily: "'DM Mono', monospace",
             letterSpacing: "0.05em"
           }}
         >
           <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
             <Network size={13} color="#4b6623" />
             <span>BAGAN ALUR & PETA STRUKTUR KONSEP</span>
           </div>
           <span style={{ fontSize: 10, color: "#7a8a82", fontWeight: 600 }}>Geser horizontal di HP ↔</span>
         </div>
         <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", padding: "14px 16px" }}>
           <pre
             style={{
               margin: 0,
               padding: 0,
               fontFamily: "'DM Mono', 'Fira Code', monospace",
               fontSize: 12.5,
               lineHeight: 1.55,
               color: "#18221f",
               backgroundColor: "transparent",
               border: "none",
               whiteSpace: "pre"
             }}
           >
             {sanitizeKaTeXText(rawText)}
           </pre>
         </div>
       </div>
     );
   }
   ```
2. **Dukung Flowchart Berpanah**:
   Jika mengandung panah (`-->`, `==>`, `->`, `◄`, `►`), tetap gunakan pemetaan pill sequential yang sudah ada.

### C. Konsistensi Wrapper Tabel di `SummaryTab.tsx`
Pastikan kontainer tabel di `SummaryTab.tsx` menggunakan kelas `.table-scroll-wrapper` agar mewarisi `min-width: 500px` dan `white-space: nowrap` yang sama.

---

## 3. ACCEPTANCE CRITERIA
- [ ] Header dan cell tabel di layar mobile 390px tidak lagi memecah kata per huruf secara vertikal.
- [ ] Tabel memiliki `min-width: 500px` dan dapat digeser secara horizontal dengan mulus pada perangkat sentuh.
- [ ] Diagram ASCII hierarkis / 2D tidak lagi terbelah menjadi fragmen rusak (`┌────────┴─────`, `│ │`).
- [ ] Seluruh diagram ter-render rapi di dalam kartu *BAGAN ALUR & PETA STRUKTUR KONSEP* dengan scroll horizontal di HP.
- [ ] `npm run build` sukses.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
