# TASK-CBT-LONG-PRESS-QUESTION-PEEK-GESTURE-068: Haptic Long-Press / Hold Gesture Question Peek Bubble in Mobile CBT Runner

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/cbtLongPressQuestionPeek.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & UX Objective

Pengguna memilih Solusi 3 (Gesture-based / Long-Press):
> *"ketiga menarik"* (Sentuh & tahan / Long-press untuk intip pertanyaan tanpa tombol tambahan dan tanpa merusak layout).

### Tantangan & Kebutuhan Ergonomi:
1. Saat pengguna berada di dasar layar membaca pilihan jawaban (opsi D/E atau kartu pernyataan Benar/Salah), teks soal di atas tertutup.
2. Pengguna tidak ingin ada bar tambahan atau tombol baru yang memenuhi layar.
3. Kebutuhan: **Haptic Long-Press Question Peek**:
   - Pengguna cukup menyentuh dan menahan jarinya selama **~260ms (0.26 detik)** di area opsi jawaban, kartu pernyataan, atau kanvas kosong di sekitarnya.
   - Seketika melayang sebuah gelembung/kartu mengambang halus (*floating question peek card*) di atas jari:
     - Header: Ikon `HelpCircle` + `Pertanyaan No. X` (hijau lime).
     - Teks: Bunyi pertanyaan lengkap secara tajam dan jelas.
   - **Feedback Fisik**: Begitu jari diangkat (*touchEnd / pointerUp*), kartu intip langsung menghilang secara instan dan mulus (*spring fade-out*).
   - **Anti-Accidental-Selection**: Sentuhan tahan selama 260ms untuk mengintip soal **TIDAK MEMILIH OPSI JAWABAN**. Pemilihan opsi hanya terjadi pada tap/klik cepat biasa.
   - Dilengkapi hint mikro halus di bagian bawah opsi: *"💡 Tip: Tahan (tekan lama) opsi untuk mengintip soal"*.

---

## 2. Spesifikasi Implementasi

### A. Long-Press Hook & Floating Peek Portal (`src/components/tabs/ExamCbtTab.tsx`)
1. State & Ref Pengatur Gestur:
   ```tsx
   const [isPeekActive, setIsPeekActive] = useState(false);
   const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
   const isLongPressTriggeredRef = useRef(false);

   const handlePointerDownPeek = useCallback(() => {
     isLongPressTriggeredRef.current = false;
     if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
     longPressTimerRef.current = setTimeout(() => {
       isLongPressTriggeredRef.current = true;
       setIsPeekActive(true);
       if (typeof navigator !== "undefined" && navigator.vibrate) {
         try { navigator.vibrate(25); } catch {} // Feedback haptik getar mikro 25ms
       }
     }, 260); // 260ms threshold
   }, []);

   const handlePointerUpPeek = useCallback(() => {
     if (longPressTimerRef.current) {
       clearTimeout(longPressTimerRef.current);
       longPressTimerRef.current = null;
     }
     setIsPeekActive(false);
   }, []);
   ```

2. Pasang Listener pada Opsi Jawaban:
   - Pada `<motion.button className="cbt-option-btn ...">` dan kartu pernyataan `.cbt-stmt-card`:
     ```tsx
     onPointerDown={handlePointerDownPeek}
     onPointerUp={handlePointerUpPeek}
     onPointerCancel={handlePointerUpPeek}
     onPointerLeave={handlePointerUpPeek}
     onClick={(e) => {
       // Cegah pemilihan opsi jika user sedang melakukan long-press peek
       if (isLongPressTriggeredRef.current) {
         e.preventDefault();
         e.stopPropagation();
         return;
       }
       handleSelectOption(optKey);
     }}
     ```

3. Gelembung / Kartu Intip Mengambang (`createPortal` ke `document.body`):
   ```tsx
   <AnimatePresence>
     {isPeekActive && (
       <motion.div
         initial={{ opacity: 0, scale: 0.94, y: 10 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         exit={{ opacity: 0, scale: 0.94, y: 6 }}
         transition={{ type: "spring", stiffness: 450, damping: 28 }}
         className="cbt-question-peek-bubble"
         style={{
           position: "fixed",
           top: "14%",
           left: "5%",
           right: "5%",
           width: "90%",
           maxWidth: 480,
           margin: "0 auto",
           backgroundColor: "#18221f",
           color: "#ffffff",
           border: "1.5px solid #c8f064",
           borderRadius: 14,
           padding: "16px 18px",
           boxShadow: "0 12px 36px rgba(0,0,0,0.45), 0 0 20px rgba(200,240,100,0.2)",
           zIndex: 100000,
           pointerEvents: "none", // Agar tidak mengganggu touch up
         }}
       >
         <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
           <HelpCircle size={15} color="#c8f064" />
           <span style={{ fontSize: 11, fontWeight: 800, color: "#c8f064", textTransform: "uppercase", letterSpacing: "0.5px" }}>
             Mengintip Pertanyaan No. {currentItem.nomor}
           </span>
         </div>
         <div style={{ fontSize: 14, lineHeight: 1.6, color: "#f1f5f9", fontWeight: 600 }}>
           <CbtContentRenderer content={currentItem.soal} />
         </div>
         <div style={{ marginTop: 10, fontSize: 10.5, color: "#94a3b8", fontStyle: "italic", textAlign: "right" }}>
           Lepas sentuhan untuk menutup
         </div>
       </motion.div>
     )}
   </AnimatePresence>
   ```

### B. Unit Test (`tests/cbtLongPressQuestionPeek.test.js`)
Buat test suite yang memverifikasi:
1. `handlePointerDownPeek` memicu kemunculan peek bubble setelah delay threshold ~260ms.
2. `handlePointerUpPeek` menyembunyikan peek bubble.
3. Long-press tidak memicu pemilihan opsi jawaban secara tidak sengaja (`isLongPressTriggeredRef` blocking).

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (210+ passing).
2. `npm run build` -> Vite build passing (0 error).
3. Screenshot mobile saat long-press aktif membuktikan gelembung pertanyaan muncul melayang di `.agents/evidence/TASK-068-mobile-cbt-long-press-peek.png`.

---

## 4. Execution Evidence & Verification Results
- **Status**: `VERIFIED`
- **Files Modified**:
  - `src/components/tabs/ExamCbtTab.tsx`:
    - Hook dan state gestur sentuh & tahan: `isPeekActive`, `longPressTimerRef`, `isLongPressTriggeredRef`.
    - Delay threshold 260ms dan getar haptik mikro `navigator.vibrate(25)`.
    - Event listener pointer peek (`onPointerDown`, `onPointerUp`, `onPointerCancel`, `onPointerLeave`) dipasang pada `.cbt-option-btn` dan `.cbt-stmt-card`.
    - Anti-accidental selection logic: memblokir eksekusi `onClick`, `handleSelectOption`, dan `handleSelectStatementRow` saat `isLongPressTriggeredRef.current` aktif.
    - Portal gelembung kartu intip mengambang `.cbt-question-peek-bubble` dengan background solid `#18221f`, border lime `#c8f064`, teks tajam `#f1f5f9`, ikon `HelpCircle`, header `MENGINTIP PERTANYAAN NO. X`, dan label `Lepas sentuhan untuk menutup`.
    - Tip mikro halus `.cbt-peek-gesture-hint` di bawah opsi jawaban (*"💡 Tip: Tahan (tekan lama) opsi untuk mengintip soal"*).
  - `src/index.css`: Aturan `.cbt-question-peek-bubble` (fixed, pointer-events none, solid background, zIndex 100000, teks `#f1f5f9` override untuk anak `.cbt-rendered-content`) dan `.cbt-peek-gesture-hint`.
  - `tests/cbtLongPressQuestionPeek.test.js`: Suite test baru mencakup 6 unit test (struktur state, listener, portal peek card, anti-accidental selection, aturan CSS, dan simulasi state machine gesture).
- **Verification Commands & Results**:
  - `npm test`: 213 passing, 0 failing (seluruh 213 test lolos).
  - `npm run build`: Vite build lolos tanpa error dalam 392ms.
  - DOM Horizontal Overflow Probe: 0 elemen bocor (`overflowing elements: 0` pada mobile 390x844 dan desktop 1920x1080).
  - Visual Audit (`vision_analyze`): `.agents/evidence/TASK-068-mobile-cbt-long-press-peek.png` lolos verifikasi 5 poin (solid dark background, lime border, teks putih tajam kontras tinggi, petunjuk pelepasan, dan anti-tabrakan).
