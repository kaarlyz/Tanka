# TASK-TACTILE-SPRING-MOTION-PHYSICS-056: High-Fidelity Spring Physics Animations & Sheet Gestures in CBT Runner

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/tactileSpringMotion.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka
- Status: VERIFIED
- Verification Level: Full (Unit Tests + Vite Build + Headless Browser DOM Probing + Vision Analysis)

---

## 1. Problem Statement & UX Objective
Interaksi pada modul CBT saat ini terasa kaku (*instant/rigid/static*):
1. **Modal Wacana Muncul Kaku:** Modal wacana hanya muncul dengan animasi CSS `slideInUp 0.2s` biasa tanpa bobot inersia (*inertia/spring mass*).
2. **Opsi Pilihan Ganda Statis Saat Ditekan:** Saat pengguna memilih jawaban A-E, tidak ada respon haptik/visual mikro (*press scale-down & spring release*).
3. **Tombol Kontrol Header & Navigasi Kaku:** Tombol kembali, palette, dan footer navigasi tidak memiliki feedback fisika (*tactile spring*).

Pengguna menginginkan pengalaman interaksi yang halus dengan sensasi fisika nyata (*spring physics*, 60–120 FPS mobile GPU-accelerated).

---

## 2. Spesifikasi Implementasi (Acuan Framer Motion Skill & Spring Physics)

Gunakan `motion/react` (sudah terpasang di Tanka) untuk menyematkan fisika pegas nyata:

### A. Modal Bottom Sheet Wacana: Fluid Spring & Drag-to-Dismiss (`ExamCbtTab.tsx`)
1. Ganti wrapper modal wacana dan sheet-nya menggunakan `motion.div` dan `AnimatePresence`:
   ```tsx
   <AnimatePresence>
     {isWacanaModalOpen && hasBacaan && (
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 0.2 }}
         style={{
           position: "fixed",
           inset: 0,
           backgroundColor: "rgba(10, 15, 13, 0.7)",
           backdropFilter: "blur(8px)",
           zIndex: 100000,
           display: "flex",
           alignItems: "flex-end",
           justifyContent: "center"
         }}
         onClick={() => setIsWacanaModalOpen(false)}
       >
         <motion.div
           initial={{ y: "100%", scale: 0.98 }}
           animate={{ y: 0, scale: 1 }}
           exit={{ y: "100%", scale: 0.98 }}
           transition={{
             type: "spring",
             stiffness: 280,
             damping: 26,
             mass: 0.6
           }}
           drag="y"
           dragConstraints={{ top: 0 }}
           dragElastic={0.2}
           onDragEnd={(_, info) => {
             if (info.offset.y > 100 || info.velocity.y > 400) {
               setIsWacanaModalOpen(false);
             }
           }}
           className="cbt-wacana-sheet-motion"
           onClick={(e) => e.stopPropagation()}
         >
           {/* Drag handle pill */}
           <div style={{ width: 40, height: 4.5, borderRadius: 999, backgroundColor: "#cbd5e1", margin: "0 auto 14px auto" }} />
           {/* Konten wacana */}
         </motion.div>
       </motion.div>
     )}
   </AnimatePresence>
   ```

### B. Tactile Spring Feedback pada Tombol Opsi Jawaban (A s/d E)
1. Bungkus opsi pilihan ganda atau tombol opsi dengan komponen bertipe motion:
   ```tsx
   <motion.button
     whileTap={{ scale: 0.975 }}
     transition={{ type: "spring", stiffness: 450, damping: 25, mass: 0.4 }}
     className={`cbt-option-btn ${isSelected ? "selected" : ""}`}
     onClick={() => handleSelectOption(optKey)}
   >
     ...
   </motion.button>
   ```
2. Saat opsi dipilih, berikan micro-pop pada badge huruf (A, B, C...):
   ```tsx
   <motion.span
     animate={isSelected ? { scale: [1, 1.15, 1] } : { scale: 1 }}
     transition={{ type: "spring", stiffness: 500, damping: 20 }}
   >
     {letter}
   </motion.span>
   ```

### C. Tactile Feedback pada Kontrol Header & Navigasi Bawah
1. Tombol `Buka Wacana` (`cbt-mobile-read-btn`):
   `whileTap={{ scale: 0.93 }}` dengan spring `stiffness: 400, damping: 25`.
2. Tombol Navigasi `Berikutnya` & `Sebelumnya`:
   `whileTap={{ scale: 0.95 }}`.
3. Tombol Header `Daftar Soal`, `Aa`, `Selesai`:
   `whileTap={{ scale: 0.94 }}`.

### D. Safe Guardrails & Accessibility
1. Selalu patuhi `useReducedMotion()`: jika pengguna mengaktifkan preferensi reduced motion di OS-nya, hilangkan animasi translasi dan gunakan transisi opacity instan.
2. GPU hardware layers: Animasi HANYA menyentuh properti GPU `transform` (`y`, `scale`) dan `opacity`. Jangan menyentuh `height` atau `top` agar FPS stabil di 60–120 FPS.

### E. Unit Test (`tests/tactileSpringMotion.test.js`)
Buat test suite yang memverifikasi:
1. Modal wacana menggunakan `AnimatePresence` dan `motion.div` dengan parameter spring physics (`type: "spring"`).
2. Opsi pilihan ganda dan tombol wacana memiliki tactile spring feedback (`whileTap`).
3. Pengujian fallback untuk `useReducedMotion`.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (175+ passing).
2. `npm run build` -> Vite build passing (0 error).
3. Screenshot/video verifikasi spring sheet di `.agents/evidence/TASK-056-mobile-cbt-spring-wacana.png`.

---

## 4. Execution & Verification Report

### Implementation Summary
1. **Modal Wacana Spring Physics & Gestures (`ExamCbtTab.tsx`):**
   - Wrapper diintegrasikan dengan `AnimatePresence` dan backdrop `motion.div` (`duration: 0.2`, `opacity: 0 -> 1`).
   - Bottom sheet menggunakan `motion.div` dengan physical spring (`stiffness: 280`, `damping: 26`, `mass: 0.6`).
   - Drag gesture `drag="y"`, `dragConstraints={{ top: 0 }}`, `dragElastic={0.2}`, dan dismiss threshold `offset.y > 100 || velocity.y > 400`.
   - Tetap mempertahankan visual drag handle pill (`#cbd5e1`) dan padding safe-area bottom dinamis.
2. **Tactile Spring Feedback Opsi Jawaban (A s/d E):**
   - Opsi jawaban dibungkus `motion.button` dengan `whileTap={{ scale: 0.96 }}` dan spring physics (`stiffness: 450, damping: 25, mass: 0.4`).
   - Badge huruf A-E diberi micro-pop animation via `motion.span` saat `isSelected` (`scale: [1, 1.15, 1]`, spring `stiffness: 500, damping: 20`).
   - `touch-action: manipulation` disematkan untuk menghilangkan 300ms delay di browser mobile.
3. **Tactile Feedback Kontrol Header & Navigasi Bawah:**
   - Tombol Buka Wacana (`.cbt-mobile-read-btn`): `whileTap={{ scale: 0.93 }}` (`stiffness: 400, damping: 25`).
   - Tombol Header Kembali, Font Aa, Daftar Soal, Selesai: `whileTap={{ scale: 0.94 }}` (`stiffness: 400, damping: 25`).
   - Tombol Navigasi Bawah (Sebelumnya, Ragu-Ragu, Berikutnya, Selesai): `whileTap={{ scale: 0.95 }}` (`stiffness: 400, damping: 25`).
4. **Guardrails & Accessibility:**
   - `useReducedMotion()` dipatuhi secara ketat di semua elemen: menonaktifkan translasi / scale transforms dan menggunakan transisi opacity instan saat preferensi reduced motion aktif di OS.
   - Hanya memanipulasi properti GPU transform (`y`, `scale`) dan `opacity` demi stabilitas 60–120 FPS.

### Test Results
- `npm test`: **177/177 passing** (0 failures).
- `node --test tests/tactileSpringMotion.test.js`: **4/4 passing** (0 failures).
- `npm run build`: Vite build sukses dalam **520ms** tanpa warning/error TypeScript.
- DOM Probing: Evaluasi `getBoundingClientRect().right > viewportWidth` menghasilkan **0 overflow elements** baik di mobile (390x844) maupun desktop (1920x1080).
- Evidence Artifact: `.agents/evidence/TASK-056-mobile-cbt-spring-wacana.png` (verifikasi visual modal sheet wacana + dark blur backdrop + drag handle).
