# TASK-FLOATING-NARA-FAB-CBT-062: Floating Circular Nara AI FAB & Clean Split Bottom Navigation in CBT Runner

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/cbtNaraFab.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & User Direction
Pengguna menginstruksikan:
> *"mending tanya nara jadiin kaya icon mengambang gitu bulet di kanan bawah"*

### Analisis Desain:
1. Jika "Tanya Nara" dijejalkan sebagai tombol teks di dalam `.cbt-action-footer` (sejajar dengan Sebelumnya, Ragu-Ragu, dan Berikutnya), bilah footer menjadi sesak dengan 4 tombol di layar ponsel yang sempit.
2. Memindahkan "Tanya Nara" menjadi **Floating Action Button (FAB) bulat mengambang di kanan bawah**:
   - Membebaskan bilah bawah: footer hanya fokus pada navigasi soal (`Sebelumnya` dan `Berikutnya`, plus `Ragu-Ragu` saat exam mode).
   - Memberikan identitas kuat pada Nara AI sebagai tutor cerdas yang melayang anggun di atas kanvas ujian (*Linear/Mintlify-grade floating assistant*).
   - Mudah dijangkau jempol kanan pengguna kapan saja (*thumb-zone ergonomics*).

---

## 2. Spesifikasi Implementasi

### A. Komponen Floating Circular FAB "Nara AI" (`ExamCbtTab.tsx`)
1. Buat floating circular FAB bulat di kanan bawah:
   ```tsx
   {/* Floating Circular FAB Tanya Nara AI */}
   <motion.button
     type="button"
     onClick={() => {
       if (!onOpenNara) return;
       const cleanBacaan = currentItem.bacaan
         ? currentItem.bacaan.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300)
         : "";
       const cleanSoal = currentItem.soal.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
       const query = `Halo Nara AI, saya sedang mengerjakan soal ujian ini dan butuh bantuan pemahaman konsep:
Mata Pelajaran: ${currentPackage?.subtes_or_mapel || ""} (${currentPackage?.paket || ""})
Nomor Soal: ${currentItem.nomor}
${cleanBacaan ? `Wacana: "${cleanBacaan}..."\n` : ""}Pertanyaan: "${cleanSoal}"

Tolong berikan petunjuk/clue pemikiran tanpa langsung membocorkan jawaban final.`;
       onOpenNara(query);
     }}
     whileHover={{ scale: 1.08 }}
     whileTap={{ scale: 0.92 }}
     transition={{ type: "spring", stiffness: 400, damping: 25 }}
     className="cbt-nara-floating-fab"
     style={{
       position: "fixed",
       bottom: "calc(132px + env(safe-area-inset-bottom, 0px))", /* Tepat di atas footer soal melayang */
       right: 16,
       width: 48,
       height: 48,
       borderRadius: "50%",
       backgroundColor: "#18221f",
       color: "#c8f064",
       border: "1.5px solid rgba(200, 240, 100, 0.4)",
       boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25), 0 0 12px rgba(200, 240, 100, 0.2)",
       display: "flex",
       alignItems: "center",
       justifyContent: "center",
       cursor: "pointer",
       zIndex: 1600,
       touchAction: "manipulation"
     }}
     title="Tanya Nara AI seputar soal ini"
     aria-label="Tanya Nara AI"
   >
     <Sparkles size={20} color="#c8f064" />
     <span className="cbt-nara-fab-badge" style={{
       position: "absolute",
       top: -4,
       right: -4,
       backgroundColor: "#72a728",
       color: "#ffffff",
       fontSize: 9,
       fontWeight: 800,
       padding: "1px 5px",
       borderRadius: 999,
       letterSpacing: "0.5px"
     }}>AI</span>
   </motion.button>
   ```

### B. Kembalikan Bilah Footer Bawah Rapi & Luas
1. Hapus tombol teks horizontal `cbt-nara-quick-btn` dari dalam `.cbt-action-footer`.
2. Bilah footer sekarang kembali lega dengan susunan simetris:
   - Kiri: `Sebelumnya` (icon `ArrowLeft` + teks).
   - Tengah (saat mode simulasi ujian): `Ragu-Ragu`.
   - Kanan: `Berikutnya` (icon `ArrowRight` + teks) / `Selesai Ujian`.

### C. Styling CSS Responsif (`src/index.css`)
1. Pastikan posisi FAB `.cbt-nara-floating-fab` adaptif:
   - Di mobile: `bottom: calc(130px + env(safe-area-inset-bottom, 0px)); right: 14px; width: 46px; height: 46px;`.
   - Di desktop: `bottom: calc(85px + env(safe-area-inset-bottom, 0px)); right: 24px; width: 50px; height: 50px;`.
   - Tidak menutupi teks soal atau opsi pilihan ganda karena kartu soal sudah memiliki `padding-bottom: calc(140px + safe-area)`.

### D. Unit Test (`tests/cbtNaraFab.test.js`)
Buat test suite yang memverifikasi:
1. Elemen `.cbt-nara-floating-fab` bertipe floating circle (`borderRadius: 50%`) dan posisi `fixed` dirender di DOM saat CBT runner aktif.
2. Mengklik FAB memicu `onOpenNara` dengan payload lengkap nomor soal dan wacana aktif.
3. Footer aksi soal bersih dari tombol teks redundan dan memiliki tombol Sebelumnya/Berikutnya yang luas.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (185+ passing).
2. `npm run build` -> Vite build passing (0 error).
3. Screenshot mobile (390x844) membuktikan FAB mengambang bulat di kanan bawah di `.agents/evidence/TASK-062-mobile-cbt-floating-nara-fab.png`.

---

## 4. Execution Evidence & Verification Results
- **Status:** `VERIFIED`
- **Executor:** MARAKA (`maraka`)
- **Date:** 2026-10-26

### Test & Build Evidence:
1. `npm test`: 193/193 tests passed (0 failed). Suite `tests/cbtNaraFab.test.js` passing 3/3:
   - `CBT Nara FAB: Elemen .cbt-nara-floating-fab bertipe floating circle dan posisi fixed dirender di DOM saat CBT runner aktif` (PASS)
   - `CBT Nara FAB: Mengklik FAB memicu onOpenNara dengan payload lengkap nomor soal dan wacana aktif` (PASS)
   - `CBT Nara FAB: Footer aksi soal bersih dari tombol teks redundan dan memiliki navigasi luas` (PASS)
2. `npm run build`: Vite v8.3.2 build production berhasil 100% tanpa error (`dist/assets/ExamCbtTab-*.js`, `dist/assets/index-*.css`).
3. Browser DOM Probing (`browser_exec`):
   - Viewport: 390x844
   - Horizontal leakage (`right > 390`): 0 elements
   - FAB rect: `{ top: 634, bottom: 680, width: 46, height: 46, right: 362 }`
   - Footer rect: `{ top: 693, bottom: 744, height: 51, width: 342 }`
   - Overlap: `False` (gap aman 13px antara dasar FAB dan puncak footer)
   - Footer single-row: `Sebelumnya` (width: 108px), `Ragu-Ragu` (width: 101px), `Berikutnya` (width: 99px)
4. Visual Artifact:
   - `.agents/evidence/TASK-062-mobile-cbt-floating-nara-fab.png` (terverifikasi via `vision_analyze` — FAB bulat gelap melayang di kanan bawah dengan badge AI & footer bersih bebas tombol desak).

