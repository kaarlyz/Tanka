# TASK-WACANA-SHEET-SCROLL-GESTURE-FIX-057: Decouple Drag-to-Dismiss Gesture from Content Scroll in Wacana Bottom Sheet

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/wacanaSheetScroll.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Root Cause Analysis (Temuan Empiris)

### Penyebab Teks Wacana Tidak Bisa Di-scroll
1. Di `ExamCbtTab.tsx` baris 3408:
   `drag={shouldReduceMotion ? false : "y"}` diletakkan langsung pada kontainer induk sheet `.cbt-wacana-sheet-motion`, yang juga memiliki `overflowY: "auto"`.
2. Pada browser mobile (khususnya WebKit dan Chrome Android):
   Ketika event pointer menangkap `drag="y"`, Framer Motion / Motion membajak seluruh pergerakan sentuhan vertikal (`touch-action: pan-y` / pointer stream).
   Akibatnya:
   - Setiap kali jari pengguna mengusap layar untuk membaca teks wacana ke bawah, gestur tersebut **dianggap sebagai upaya menggeser seluruh modal (drag modal)**, bukan scroll konten di dalam kotak!
   - Kotak wacana menjadi macet, terkunci kaku, dan teks panjang tidak dapat digulir sama sekali.

---

## 2. Spesifikasi Implementasi (Standar Industri Mobile Bottom Sheet)

Pisahkan zona sentuh gestur drag dengan zona konten pembaca teks:

### A. Pola Drag Controls Mandiri (`useDragControls`)
1. Di `ExamCbtTab.tsx`, impor `useDragControls` dari `motion/react`:
   ```tsx
   import { motion, AnimatePresence, useReducedMotion, useDragControls } from "motion/react";
   ```
2. Inisialisasi:
   ```tsx
   const dragControls = useDragControls();
   ```
3. Pasang `dragListener={false}` pada motion container:
   ```tsx
   <motion.div
     drag={shouldReduceMotion ? false : "y"}
     dragControls={dragControls}
     dragListener={false}
     dragConstraints={{ top: 0 }}
     dragElastic={0.2}
     onDragEnd={(_, info) => {
       if (info.offset.y > 100 || info.velocity.y > 400) {
         setIsWacanaModalOpen(false);
       }
     }}
     className="cbt-wacana-sheet-motion cbt-wacana-sheet-modal"
     ...
   >
   ```
4. Pasang pemicu drag **HANYA** pada area Header & Drag Handle Pill:
   ```tsx
   {/* Header Drag Zone */}
   <div
     onPointerDown={(e) => dragControls.start(e)}
     style={{
       cursor: "grab",
       touchAction: "none",
       paddingBottom: 8,
       borderBottom: "1px solid #e2e8e0",
       marginBottom: 12
     }}
   >
     {/* Drag Handle Pill */}
     <div style={{ width: 38, height: 4.5, borderRadius: 999, backgroundColor: "#cbd5e1", margin: "0 auto 12px auto" }} />
     
     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
       ...
     </div>
   </div>
   ```

### B. Isolasi Scroll Area Teks Wacana
1. Bungkus teks wacana ke dalam kontainer scroll mandiri:
   ```tsx
   {/* Scrollable Content Area */}
   <div
     className="cbt-wacana-scroll-content"
     style={{
       flex: 1,
       overflowY: "auto",
       WebkitOverflowScrolling: "touch",
       touchAction: "pan-y",
       overscrollBehavior: "contain",
       paddingRight: 4
     }}
   >
     <div style={{ fontSize: fontSizeLevel, lineHeight: 1.8, color: "#1e293b" }}>
       <CbtContentRenderer content={currentItem.bacaan} ... />
     </div>
     {currentItem.soal_img && ( ... )}
   </div>
   ```
2. Pastikan `cbt-wacana-scroll-content` memiliki `touch-action: pan-y; -webkit-overflow-scrolling: touch;` murni tanpa intervensi event drag.

### C. Unit Test (`tests/wacanaSheetScroll.test.js`)
Buat test suite yang memverifikasi:
1. `ExamCbtTab.tsx` mengonfigurasi `useDragControls` dan `dragListener={false}` agar gestur drag tidak membajak scroll isi wacana.
2. Terdapat kontainer scroll mandiri dengan `overflowY: "auto"` dan `-webkit-overflow-scrolling: "touch"`.
3. Drag area terisolasi pada header handle modal.

---

## 3. Verification Protocol
1. `npm test` passing (180+ passing).
2. `npm run build` passing.
3. DOM probe verifikasi scroll: elemen wacana memiliki `scrollHeight > clientHeight` dan dapat di-scroll tanpa trigger drag dismiss.

---

## 4. Execution & Verification Report
- Status: `VERIFIED`
- Executor: MARAKA (`maraka`)
- Changes:
  1. `src/components/tabs/ExamCbtTab.tsx`:
     - Diimpor `useDragControls` dari `motion/react`.
     - Inisialisasi `const dragControls = useDragControls()`.
     - Pasang `dragControls={dragControls}` dan `dragListener={false}` pada modal sheet container.
     - Isolasi gesture drag hanya pada container Header & Drag Handle Pill (`onPointerDown={(e) => dragControls.start(e)}`, `cursor: "grab"`, `touchAction: "none"`).
     - Tombol close diisolasi via `onPointerDown={(e) => e.stopPropagation()}` agar tidak memicu drag.
     - Konten stimulus wacana dibungkus ke dalam `.cbt-wacana-scroll-content` dengan `overflowY: "auto"`, `WebkitOverflowScrolling: "touch"`, `touchAction: "pan-y"`, `overscrollBehavior: "contain"`.
  2. `src/index.css`:
     - Ditambahkan deklarasi `.cbt-wacana-scroll-content` dengan `overflow-y: auto`, `-webkit-overflow-scrolling: touch`, `touch-action: pan-y`, `overscroll-behavior: contain`.
  3. `tests/wacanaSheetScroll.test.js`:
     - Dibuat 4 unit test untuk memverifikasi decoupling drag controls, scroll content container, header grab pointer isolation, dan CSS rules.
- Test Results:
  - `npm test`: 181 passing (0 failed).
  - `npm run build`: Vite build sukses (603ms).
- Empirical DOM Probe & UI Verification:
  - Viewport 390x844 (Mobile): `modalFound`: true, `scrollAreaFound`: true, `scrollHeight`: 1161px, `clientHeight`: 587px, `isScrollable`: true, `scrollAfter`: 150px, horizontal leaks: 0.
  - Viewport 1920x1080 (Desktop): horizontal leaks: 0.
  - Evidence Artifacts:
    - `.agents/evidence/TASK-057-mobile-cbt-wacana-sheet-390x844.png`
    - `.agents/evidence/TASK-057-mobile-cbt-wacana-sheet-scrolled.png`
    - `.agents/evidence/TASK-057-desktop-cbt-runner-1920x1080.png`
