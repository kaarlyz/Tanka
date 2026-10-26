# TASK-CBT-STATEMENT-TABLE-MOBILE-CARD-TRANSFORMATION-065: Responsive Statement Matrix Card Ergonomics for Mobile CBT

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/cbtStatementCardErgonomics.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & Root Cause Analysis

Pengguna menyampaikan komplain visual:
> *"bagian yg tabel" ui ny kek gini dimobile. jelek bngt masa teksnya gitu, gabisa dibaca"*

### Temuan Empiris dari Screenshot (`img_9bd3a3e21d7c.jpg`):
1. **Model Tabel Desktop Dipaksakan ke Layar HP 360px-390px:**
   Di `ExamCbtTab.tsx` baris 2628:
   Tipe soal pernyataan (*Benar/Salah* atau *Sesuai/Tidak Sesuai*) dirender menggunakan elemen `<table>` dengan kolom kaku:
   - Kolom No: `width: 36px`
   - Kolom Pernyataan: sisa ruang
   - Kolom Benar: `width: 95px`
   - Kolom Salah: `width: 95px`
2. **Teks Terjepit Sempit Ekstrem (Severe Vertical Crushing):**
   - Di layar mobile selebar 360px–390px:
     Lebar layar = ~360px.
     Dikurangi tombol Benar (95px) + tombol Salah (95px) + nomor (36px) + margin/padding (40px) = **Sisa ruang teks pernyataan HANYA ~90-100px!**
   - Teks kalimat panjang (*"Alih fungsi lahan pertanian menjadi pemukiman berdampak langsung..."*) terkompresi secara brutal menjadi 1-2 kata per baris (*"Alih\nfungsi\nlahan\npertanian\n..."*), menghasilkan baris tinggi yang jelek, berjejal, dan tidak manusiawi untuk dibaca.
3. **Standar Desain Modern (Card-Based Transformation on Mobile):**
   Pada tampilan mobile (< 768px), format tabel matriks wajib bertransformasi menjadi **Kartu Pernyataan Mandiri (Card-based Layout)**:
   - Teks pernyataan menempati **lebar 100% penuh** di bagian atas kartu sehingga mengalir alami (*natural paragraph reading*).
   - Tombol pilihan Benar / Salah ditempatkan di bagian bawah kartu dalam bentuk segmented pill / switch button horizontal yang simetris dan mudah dijangkau jempol (*touch target 44px+*).

---

## 2. Spesifikasi Implementasi

### A. Transformasi Responsive Statement Table ke Kartu Mandiri di Mobile (`src/components/tabs/ExamCbtTab.tsx`)
Bungkus rendering soal tipe pernyataan dengan arsitektur responsif:
1. **Mode Desktop (`min-width: 769px`):** Tetap gunakan tabel matriks `<table>` dengan kolom rapi karena ruang layar desktop lega (1080px–1920px).
2. **Mode Mobile (`max-width: 768px` via CSS class `.cbt-stmt-mobile-cards`):**
   Render sebagai daftar kartu pernyataan yang bersih dan luas:
   ```tsx
   <div className="cbt-stmt-mobile-list cbt-mobile-only" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
     {currentItem.options.map((opt, rIdx) => {
       const stmtId = opt.id.toLowerCase();
       const userMap = parseStatementAnswers(currentVal);
       const userChoice = userMap[stmtId];
       const keyMap = parseStatementAnswers(currentItem.kunci_jawaban);
       const keyChoice = keyMap[stmtId];
       const isRowCorrect = Boolean(userChoice && keyChoice && userChoice === keyChoice);
       const isRowWrong = Boolean(userChoice && keyChoice && userChoice !== keyChoice);

       return (
         <div
           key={opt.id}
           className="cbt-stmt-card"
           style={{
             backgroundColor: "#ffffff",
             border: `1.5px solid ${userChoice ? (userChoice === valCol1 ? "#16a34a" : "#dc2626") : "#dce2d6"}`,
             borderRadius: 12,
             padding: "14px 16px",
             display: "flex",
             flexDirection: "column",
             gap: 12,
             boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
           }}
         >
           {/* Header Kartu: Badge Nomor & Status Jawaban */}
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <span style={{ fontSize: 11.5, fontWeight: 800, color: "#166534", backgroundColor: "#f0fdf4", padding: "3px 9px", borderRadius: 6 }}>
               Pernyataan {rIdx + 1}
             </span>
             {userChoice && (
               <span style={{ fontSize: 11, fontWeight: 700, color: userChoice === valCol1 ? "#15803d" : "#b91c1c" }}>
                 Dipilih: {userChoice.toUpperCase()}
               </span>
             )}
           </div>

           {/* Isi Teks Pernyataan: 100% Lebar Penuh, Nyaman Dibaca */}
           <div style={{ fontSize: 14, lineHeight: 1.65, color: "#1f2937", textAlign: "left" }}>
             <CbtContentRenderer
               content={opt.text}
               onImageClick={(src, alt) => setZoomImage({ src, title: alt || `Diagram Pernyataan ${opt.id.toUpperCase()}` })}
             />
             {opt.img && ( ... )}
           </div>

           {/* Bar Tombol Pilihan (Benar / Salah) Luas di Bawah */}
           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
             <motion.button
               type="button"
               whileTap={{ scale: 0.95 }}
               onClick={() => handleSelectStatementRow(opt.id, valCol1)}
               style={{
                 padding: "10px 12px",
                 borderRadius: 8,
                 border: userChoice === valCol1 ? "2px solid #16a34a" : "1.5px solid #cbd5e1",
                 backgroundColor: userChoice === valCol1 ? "#16a34a" : "#f8fafc",
                 color: userChoice === valCol1 ? "#ffffff" : "#1e293b",
                 fontWeight: 800,
                 fontSize: 13,
                 cursor: "pointer",
                 display: "inline-flex",
                 alignItems: "center",
                 justifyContent: "center",
                 gap: 6,
                 minHeight: 44
               }}
             >
               {userChoice === valCol1 && <Check size={15} strokeWidth={3} />}
               <span>{stmtLabels[0]}</span>
             </motion.button>

             <motion.button
               type="button"
               whileTap={{ scale: 0.95 }}
               onClick={() => handleSelectStatementRow(opt.id, valCol2)}
               style={{
                 padding: "10px 12px",
                 borderRadius: 8,
                 border: userChoice === valCol2 ? "2px solid #dc2626" : "1.5px solid #cbd5e1",
                 backgroundColor: userChoice === valCol2 ? "#dc2626" : "#f8fafc",
                 color: userChoice === valCol2 ? "#ffffff" : "#1e293b",
                 fontWeight: 800,
                 fontSize: 13,
                 cursor: "pointer",
                 display: "inline-flex",
                 alignItems: "center",
                 justifyContent: "center",
                 gap: 6,
                 minHeight: 44
               }}
             >
               {userChoice === valCol2 && <Check size={15} strokeWidth={3} />}
               <span>{stmtLabels[1]}</span>
             </motion.button>
           </div>
         </div>
       );
     })}
   </div>
   ```

### B. Styling CSS & Breakpoint Rules (`src/index.css`)
```css
/* Tampilkan table hanya di desktop, dan tampilkan cards hanya di mobile */
@media (max-width: 768px) {
  .cbt-stmt-desktop-table {
    display: none !important;
  }
  .cbt-stmt-mobile-list {
    display: flex !important;
  }
}
@media (min-width: 769px) {
  .cbt-stmt-desktop-table {
    display: block !important;
  }
  .cbt-stmt-mobile-list {
    display: none !important;
  }
}
```

### C. Unit Test (`tests/cbtStatementCardErgonomics.test.js`)
Buat test suite yang memverifikasi:
1. Pada viewport mobile (< 768px), `ExamCbtTab` merender kartu pernyataan `.cbt-stmt-card` dengan lebar teks 100% penuh.
2. Tombol Benar dan Salah di mobile tersusun secara grid horizontal di bawah teks pernyataan.
3. Status jawaban tersinkronisasi sempurna dengan state `currentVal`.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (195+ passing).
2. `npm run build` -> Vite build passing (0 error).
3. Screenshot mobile (390x844) membuktikan kartu pernyataan terbaca utuh dan luas di `.agents/evidence/TASK-065-mobile-cbt-statement-card.png`.

---

## 4. Execution Evidence & Verification Results
- Status: `VERIFIED`
- Executor: MARAKA (`maraka`)
- Changes:
  1. `src/components/tabs/ExamCbtTab.tsx`:
     - Added `.cbt-stmt-desktop-table` wrapper for desktop `<table>`.
     - Added `.cbt-stmt-mobile-list` rendering `.cbt-stmt-card` with full 100% width text block via `CbtContentRenderer`.
     - Action buttons styled as thumb-friendly 2-column grid (`repeat(2, minmax(0, 1fr))`, `minHeight: 44px`) with check icons and responsive selection state.
  2. `src/index.css`:
     - Added display rules for `.cbt-stmt-desktop-table` (desktop block, mobile none).
     - Added display rules for `.cbt-stmt-mobile-list` (desktop none, mobile flex).
     - Added `.cbt-stmt-card-actions` grid layout rules.
  3. `tests/cbtStatementCardErgonomics.test.js`:
     - 4 unit tests verifying desktop/mobile separation, 100% width text, touch targets, and CSS media queries.
  4. Evidence Artifacts:
     - `.agents/evidence/TASK-065-mobile-cbt-statement-card.png`: Mobile 390x844 screenshot with DOM probe 0 horizontal overflow elements.
- Test Suite: 209/209 passing.
- Build: Vite production build passed cleanly.
