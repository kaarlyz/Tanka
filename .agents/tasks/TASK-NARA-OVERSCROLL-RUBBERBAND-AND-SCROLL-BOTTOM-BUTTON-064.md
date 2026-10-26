# TASK-NARA-OVERSCROLL-RUBBERBAND-AND-SCROLL-BOTTOM-BUTTON-064: Eliminate Mobile Root Overscroll Churn & Floating Scroll-to-Bottom Arrow Button in Tanya Nara with Fluid Motion Physics & Typing Indicator

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/modals/TanyaNaraPanel.tsx`
  - `src/index.css`
  - `tests/naraScrollToBottom.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka
- Status: VERIFIED

---

## 1. Problem Statement & UX Objective

Pengguna meminta 3 perbaikan nyata pada panel chat Tanya Nara:
1. **"Hilang arah ke kanan pas mentok scroll kencang ke atas" (Root Churn / Momentum Rubber-banding):**
   - Saat pengguna melakukan *fast flick scroll* ke atas atau saat posisi scroll mencapai batas atas (`scrollTop === 0`), browser mobile memicu **Rubber-band momentum bounce**.
   - Di `src/index.css`, `html, body` dan `.app-shell` menggunakan `width: 100vw`, sehingga momentum bounce membocorkan scroll event ke elemen root body di belakang drawer modal, menggeser root viewport ke kanan.
   - Solusi: Ganti `100vw` jadi `100%`, pasang `overscroll-behavior: none !important;` pada `html, body`, `.app-shell`, `.ai-panel-box.open`, dan `touch-action: pan-y !important;` pada `.chat-window-box`.
2. **"Arrow chat di tengah yang kalau chat diatas dan ada chat dibawah bikin langsung kebawah":**
   - Floating pill button beranimasi pegas (*spring physics*) dengan ikon `ArrowDown` di tengah bawah saat pengguna mengusap layar ke atas (`distanceFromBottom > 140`).
   - Sekali klik langsung meluncur mulus ke chat paling bawah via `chatWindowRef.current.scrollTo({ top: el.scrollHeight, behavior: "smooth" })`.
3. **"Animasi pas Nara typing dan animasi motion pas kirim chat bubble":**
   - **Bubble Motion Physics (`ChatMessageItem`):**
     Gunakan `motion.div` dengan spring `{ type: "spring", stiffness: 380, damping: 28, mass: 0.5 }`, entry dari `y: 12, opacity: 0, scale: 0.96` ke `y: 0, opacity: 1, scale: 1`.
   - **Nara Typing Wave Animation (`isChatSending`):**
     Alih-alih teks statis biasa, buat bubble indikator mengetik modern dengan 3 titik bergelombang (*wave pulsing dots*) beranimasi inersia pegas:
     Dot 1, 2, 3 melompat berirama (`y: [0, -5, 0]`, stagger `0.15s`) dengan teks elegan *"Nara sedang meracik jawaban..."*.

---

## 2. Spesifikasi Implementasi

### A. Bubble Motion Physics & Typing Wave (`src/components/modals/TanyaNaraPanel.tsx`)
1. Impor `motion`, `AnimatePresence`, `useReducedMotion` dari `motion/react`.
2. Pada `ChatMessageItem`:
   Bungkus container pesan dengan `motion.div`:
   ```tsx
   <motion.div
     initial={{ opacity: 0, y: 12, scale: 0.97 }}
     animate={{ opacity: 1, y: 0, scale: 1 }}
     transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.5 }}
     className="chat-bubble-wrapper"
     style={{
       display: "flex",
       flexDirection: "column",
       alignItems: isUser ? "flex-end" : "flex-start",
       gap: 3,
       padding: "0 2px"
     }}
   >
   ```
3. Indikator Nara Typing Wave saat `isChatSending === true`:
   ```tsx
   {isChatSending && (
     <motion.div
       initial={{ opacity: 0, y: 8, scale: 0.95 }}
       animate={{ opacity: 1, y: 0, scale: 1 }}
       exit={{ opacity: 0, y: 6, scale: 0.95 }}
       style={{
         display: "inline-flex",
         alignItems: "center",
         gap: 8,
         padding: "8px 14px",
         borderRadius: "16px 16px 16px 4px",
         backgroundColor: "#f0f4ea",
         border: "1px solid #dce4d6",
         width: "fit-content",
         marginBottom: 4
       }}
     >
       <Sparkles size={14} color="#166534" />
       <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
         {[0, 1, 2].map((dot) => (
           <motion.span
             key={dot}
             animate={{ y: [0, -5, 0] }}
             transition={{
               repeat: Infinity,
               duration: 0.6,
               delay: dot * 0.15,
               ease: "easeInOut"
             }}
             style={{
               width: 5,
               height: 5,
               borderRadius: "50%",
               backgroundColor: "#166534",
               display: "inline-block"
             }}
           />
         ))}
       </div>
       <span style={{ fontSize: 11.5, fontWeight: 600, color: "#253b2b" }}>
         Nara sedang berpikir...
       </span>
     </motion.div>
   )}
   ```

### B. Floating Scroll-to-Bottom Arrow Button
1. Listener scroll pada `.chat-window-box`:
   ```tsx
   const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

   const handleChatScroll = useCallback(() => {
     const el = chatWindowRef.current;
     if (!el) return;
     const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
     setShowScrollBottomBtn(distanceFromBottom > 140);
   }, []);
   ```
2. Render Floating Pill Button melayang di tengah:
   ```tsx
   <AnimatePresence>
     {showScrollBottomBtn && (
       <motion.button
         type="button"
         initial={{ opacity: 0, y: 10, scale: 0.85 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         exit={{ opacity: 0, y: 10, scale: 0.85 }}
         whileTap={{ scale: 0.93 }}
         transition={{ type: "spring", stiffness: 350, damping: 25 }}
         onClick={() => {
           const el = chatWindowRef.current;
           if (el) {
             el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
           }
         }}
         className="chat-scroll-bottom-fab"
         style={{
           position: "absolute",
           bottom: 74,
           left: "50%",
           transform: "translateX(-50%)",
           backgroundColor: "#18221f",
           color: "#c8f064",
           border: "1px solid rgba(200, 240, 100, 0.35)",
           borderRadius: 9999,
           padding: "6px 14px",
           display: "inline-flex",
           alignItems: "center",
           gap: 6,
           fontSize: 12,
           fontWeight: 700,
           boxShadow: "0 4px 16px rgba(0, 0, 0, 0.22)",
           cursor: "pointer",
           zIndex: 50,
           touchAction: "manipulation",
         }}
       >
         <ArrowDown size={14} color="#c8f064" />
         <span>Pesan Terbaru</span>
       </motion.button>
     )}
   </AnimatePresence>
   ```

### C. Eliminasi Root Overscroll Rubber-Band (`src/index.css`)
1. Di `@media (max-width: 768px)`:
   - Ganti `width: 100vw !important` pada `html, body` dan `.app-shell` menjadi `100% !important`.
   - Pasang `overscroll-behavior: none !important;` pada `html, body`, `.app-shell`, `.ai-panel-box.open`.
   - `.chat-window-box`: `overscroll-behavior: contain !important; touch-action: pan-y !important; overflow-x: hidden !important;`.

### D. Unit Test (`tests/naraScrollToBottom.test.js`)
Buat test suite yang memverifikasi:
1. Tombol scroll-to-bottom muncul saat `distanceFromBottom > 140`.
2. Klik tombol scroll-to-bottom memicu `scrollTo` ke `scrollHeight`.
3. Indikator typing merender 3 dot bergelombang dengan animasi motion.
4. Chat bubble item menggunakan motion wrapper spring.
5. `overscroll-behavior: none` terpasang di root CSS mobile.

---

## 3. Verification Protocol
1. `npm test` passing (195+ passing).
2. `npm run build` passing.
3. Screenshot mobile (390x844) membuktikan tombol floating arrow tampil di tengah dan typing indicator aktif di `.agents/evidence/TASK-064-mobile-nara-scroll-bottom-fab.png`.

---

## 4. Execution & Verification Results (MARAKA)

- **Test Suite**: `npm test` passing 209/209 tests (including all 5 tests in `tests/naraScrollToBottom.test.js`).
- **Production Build**: `npm run build` passing cleanly (Vite v8.3.2 client bundle).
- **Runtime Layout & Overscroll Lock**:
  - `src/index.css`: `html, body`, `.app-shell`, and `.ai-panel-box.open` set to `width: 100% !important`, `overscroll-behavior: none !important`.
  - `.chat-window-box`: `touch-action: pan-y !important`, `overscroll-behavior: contain !important`, `overflow-x: hidden !important`.
  - DOM probe at mobile 390x844: `document.documentElement.scrollWidth === 390`, `bodyCanScrollX: false`, `panelCanScrollX: false` (0 horizontal leak/jitter).
- **Floating Scroll-to-Bottom Button**:
  - Floating pill `.chat-scroll-bottom-fab` with `ArrowDown` icon and label "Pesan Terbaru" appears smoothly centered (`left: 50%`, `transform: translateX(-50%)`, `bottom: 74px`) when scrolled up (`distanceFromBottom > 140`).
  - Clicking triggers smooth scroll down (`el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })`).
- **Tactile Motion & Wave Typing Indicator**:
  - `ChatMessageItem` wrapped in `motion.div` with spring physics `{ type: "spring", stiffness: 400, damping: 28, mass: 0.5 }`.
  - Typing wave indicator `.nara-typing-indicator` animates 3 pulsing dots (`y: [0, -5, 0]`, stagger `dot * 0.15`, `repeat: Infinity`) alongside "Nara sedang meracik jawaban...".
- **Visual Evidence**:
  - `.agents/evidence/TASK-064-mobile-nara-scroll-bottom-fab.png` (249,144 bytes, 780x1688 @ 2x) verified with `vision_analyze` (floating button centered above input dock, 0 horizontal overflow).
  - `.agents/evidence/TASK-064-mobile-nara-typing-wave.png` (219,358 bytes) verified with `vision_analyze` (green sparkles icon, 3 pulsing wave dots, and "Nara sedang meracik jawaban...").
