# TASK-CBT-STICKY-QUESTION-SNAPPER-066: Floating Sticky Question Snapper & 1-Tap Quick Peek for Mobile CBT Runner

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/cbtQuestionSnapper.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & UX Objective

Pengguna mengidentifikasi titik lelah ergonomi terbesar saat ujian di HP:
> *"menurutmu gmn ya solusi yg bagus, ini experience user. dimana misal kita liat pilgan, lalu pen liat soal juga gitu kek secara cpt jdi kek gaperlu scrool gitu atau scrool lalu mencet tombol"*

### Analisis Kebutuhan:
1. Saat menggulir ke bawah untuk memilih opsi A-E atau tabel pernyataan Benar/Salah, teks pertanyaan di atas hilang dari layar (*pushed off-screen*).
2. Pengguna harus mengulang siklus scroll atas ➔ baca soal ➔ scroll bawah ➔ pilih opsi berkali-kali.
3. Kebutuhan: **Sticky Question Snapper (Kapsul Pertanyaan Menempel)**:
   - Ketika teks soal utama di-scroll melewati batas atas viewport, sebuah kapsul pertanyaan ramping (*compact question bar*) otomatis meluncur halus dan menempel di bawah header hitam.
   - Menampilkan teks pertanyaan (1–2 baris elipsis yang tajam) sehingga saat jari berada di opsi D atau E di dasar layar, mata tetap bisa membaca pertanyaannya tanpa perlu scroll balik ke atas.
   - **1-Tap Quick Peek**: Kapsul bisa diketuk untuk membuka popover teks lengkap jika pertanyaannya sangat panjang, dan menutup sendiri saat opsi disentuh.

---

## 2. Spesifikasi Implementasi

### A. Komponen Sticky Question Snapper (`src/components/tabs/ExamCbtTab.tsx`)
1. Ref & Sentinel Intersection Observer:
   - Pasang `<div ref={questionSentinelRef} className="cbt-question-sentinel" />` tepat di bawah teks soal utama.
   - Gunakan state `isQuestionScrolledPast: boolean`:
     - `true` saat teks soal utama tergulir ke atas keluar dari viewport.
     - `false` saat pengguna kembali ke posisi paling atas.
2. Render Snapper Bar dengan `AnimatePresence` & `motion.div`:
   ```tsx
   <AnimatePresence>
     {isQuestionScrolledPast && (
       <motion.div
         initial={{ y: -20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         exit={{ y: -20, opacity: 0 }}
         transition={{ type: "spring", stiffness: 400, damping: 28 }}
         className="cbt-sticky-question-dock cbt-mobile-only"
         onClick={() => setIsQuestionPeekOpen(!isQuestionPeekOpen)}
         style={{
           position: "sticky",
           top: 48, // Tepat menempel di bawah .cbt-runner-header
           zIndex: 110,
           backgroundColor: "#ffffff",
           border: "1px solid #dce2d6",
           borderLeft: "4px solid #16a34a",
           borderRadius: "0 0 10px 10px",
           boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
           padding: "8px 12px",
           margin: "0 -14px 12px -14px",
           cursor: "pointer",
           display: "flex",
           alignItems: "center",
           justifyContent: "space-between",
           gap: 8,
         }}
       >
         <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden", flex: 1 }}>
           <span style={{ fontSize: 11, fontWeight: 800, color: "#166534", backgroundColor: "#f0fdf4", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>
             No {currentItem.nomor}
           </span>
           <span
             style={{
               fontSize: 12.5,
               fontWeight: 700,
               color: "#18221f",
               whiteSpace: "nowrap",
               overflow: "hidden",
               textOverflow: "ellipsis",
               lineHeight: 1.3
             }}
           >
             {cleanPlainText(currentItem.soal)}
           </span>
         </div>
         <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#64748b", fontSize: 11, flexShrink: 0 }}>
           <Eye size={13} color="#16a34a" />
           <span>{isQuestionPeekOpen ? "Tutup" : "Intip"}</span>
         </div>
       </motion.div>
     )}
   </AnimatePresence>
   ```

### B. Popover Quick Peek Saat Diketuk
1. Jika `isQuestionPeekOpen === true`:
   Tampilkan lembar popover halus melayang berisi teks pertanyaan lengkap:
   ```tsx
   <motion.div
     initial={{ opacity: 0, scale: 0.96 }}
     animate={{ opacity: 1, scale: 1 }}
     exit={{ opacity: 0, scale: 0.96 }}
     style={{
       backgroundColor: "#ffffff",
       border: "1.5px solid #16a34a",
       borderRadius: 10,
       padding: "12px 14px",
       boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
       marginBottom: 12,
       fontSize: 13.5,
       lineHeight: 1.6,
       color: "#18221f"
     }}
   >
     <CbtContentRenderer content={currentItem.soal} />
   </motion.div>
   ```
2. Saat pengguna memilih opsi jawaban A–E atau mengklik luar, `setIsQuestionPeekOpen(false)` otomatis menutup popover agar tidak menghalangi pilihan.

### C. Styling Responsif CSS (`src/index.css`)
```css
@media (max-width: 768px) {
  .cbt-sticky-question-dock {
    display: flex !important;
  }
}
@media (min-width: 769px) {
  .cbt-sticky-question-dock {
    display: none !important;
  }
}
```

### D. Unit Test (`tests/cbtQuestionSnapper.test.js`)
Buat test suite yang memverifikasi:
1. `questionSentinelRef` dan komponen `cbt-sticky-question-dock` terpasang di `ExamCbtTab.tsx`.
2. Snapper bar menampilkan nomor soal dan teks soal ringkas.
3. Fitur intip cepat (Quick Peek toggle) membuka dan menutup popover teks lengkap.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (195+ passing).
2. `npm run build` -> Vite build passing (0 error).
3. Screenshot mobile (390x844) saat di-scroll ke opsi bawah membuktikan snapper bar menempel di `.agents/evidence/TASK-066-mobile-cbt-question-snapper.png`.
