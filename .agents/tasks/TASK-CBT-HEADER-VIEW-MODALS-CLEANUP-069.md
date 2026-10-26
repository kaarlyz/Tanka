# TASK-CBT-HEADER-VIEW-MODALS-CLEANUP-069: Direct Tap Header Buttons for Soal & Wacana Modals (Zero Scroll Dependency & Purge Long-Press)

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/cbtHeaderViewModals.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & User Direction

Pengguna menginstruksikan:
> *"hapus aja fitur itu gaguna, satuin aja wacana atau soal gitu di panel atas jdi kalau scroll dia ga hilang ... tinggal tap tombol"*

### Analisis Kebutuhan Pengguna:
1. **Hapus Total Fitur Gestur Long-Press:**
   - Fitur sentuh & tahan 260ms dihapus karena tidak berguna (*not discoverable, unneeded complexity*).
   - Hapus teks hint tips `💡 Tip: Tahan (tekan lama) opsi untuk mengintip soal`.
   - Hapus portal gelembung `cbt-question-peek-bubble`, state `isPeekActive`, dan timer terkait.
2. **Satukan Akses Wacana & Soal di Panel Atas (Sticky Header):**
   - Header hitam (`.cbt-runner-header`) **selalu menempel di paling atas layar (sticky top)** dan tidak pernah hilang saat halaman digulir.
   - Di header hitam atas, sediakan tombol akses cepat yang bisa langsung **ditekan (1 tap)** kapan saja:
     - **Tombol `[ 📄 Soal ]` (atau `[ ❓ Soal ]`):** Sekali tap, membuka modal/sheet teks soal lengkap nomor aktif.
     - **Tombol `[ 📖 Wacana ]`:** Sekali tap, membuka modal/sheet wacana bacaan terkait (jika soal memiliki wacana bacaan).
3. **Ergonomi Bebas Scroll (Zero Scroll Dependency):**
   - Di mana pun pengguna berada (di bagian paling bawah memilih opsi D/E atau memeriksa kartu pernyataan), pengguna tidak perlu scroll ke atas:
   - Cukup tap tombol `[ Soal ]` atau `[ Wacana ]` di panel hitam yang selalu menempel di atas layar, modal terbuka seketika, dibaca, lalu ditutup.

---

## 2. Spesifikasi Implementasi

### A. Bersihkan Fitur Long-Press (`ExamCbtTab.tsx`)
1. Hapus state `isPeekActive`, `longPressTimerRef`, `isLongPressTriggeredRef`, `handlePointerDownPeek`, `handlePointerUpPeek`.
2. Hapus listener pointer down/up/cancel dari `.cbt-option-btn` dan `.cbt-stmt-card`.
3. Hapus modal portal `.cbt-question-peek-bubble`.
4. Hapus elemen hint tips `.cbt-peek-gesture-hint`.

### B. Pasang Tombol "Soal" & "Wacana" Langsung di Header Hitam Atas (`ExamCbtTab.tsx`)
1. Tambahkan state modal soal:
   ```tsx
   const [isSoalModalOpen, setIsSoalModalOpen] = useState(false);
   ```
2. Di dalam `.cbt-runner-header`:
   Sediakan tombol aksi cepat di samping tombol font/palette:
   ```tsx
   {/* Tombol Cepat Buka Soal (Mobile & Desktop) */}
   <motion.button
     type="button"
     onClick={() => setIsSoalModalOpen(true)}
     className="cbt-header-btn-quick-view"
     whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
     style={{
       backgroundColor: "rgba(255,255,255,0.12)",
       color: "#ffffff",
       border: "1px solid rgba(255,255,255,0.18)",
       borderRadius: 8,
       padding: "6px 10px",
       fontSize: 12,
       fontWeight: 800,
       cursor: "pointer",
       display: "inline-flex",
       alignItems: "center",
       gap: 5,
       flexShrink: 0
     }}
     title="Buka popup teks soal nomor ini"
   >
     <HelpCircle size={14} color="#c8f064" />
     <span>Soal</span>
   </motion.button>

   {/* Tombol Cepat Buka Wacana (Jika ada bacaan) */}
   {hasBacaan && (
     <motion.button
       type="button"
       onClick={() => setIsWacanaModalOpen(true)}
       className="cbt-header-btn-quick-view"
       whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
       style={{
         backgroundColor: "rgba(200, 240, 100, 0.15)",
         color: "#c8f064",
         border: "1px solid rgba(200, 240, 100, 0.35)",
         borderRadius: 8,
         padding: "6px 10px",
         fontSize: 12,
         fontWeight: 800,
         cursor: "pointer",
         display: "inline-flex",
         alignItems: "center",
         gap: 5,
         flexShrink: 0
       }}
       title="Buka popup wacana / stimulus cerita"
     >
       <BookOpen size={14} color="#c8f064" />
       <span>Wacana</span>
     </motion.button>
   )}
   ```

### C. Modal Sheet Soal Cepat (`isSoalModalOpen`)
1. Menggunakan pola modal bottom sheet spring physics yang sama dengan wacana:
   ```tsx
   <AnimatePresence>
     {isSoalModalOpen && currentItem && (
       <div
         style={{
           position: "fixed",
           inset: 0,
           backgroundColor: "rgba(10, 15, 13, 0.75)",
           backdropFilter: "blur(6px)",
           zIndex: 100000,
           display: "flex",
           alignItems: "flex-end",
           justifyContent: "center"
         }}
         onClick={() => setIsSoalModalOpen(false)}
       >
         <motion.div
           initial={{ y: "100%", opacity: 0.9 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: "100%", opacity: 0.9 }}
           transition={{ type: "spring", stiffness: 300, damping: 28 }}
           className="cbt-soal-sheet-modal"
           style={{
             width: "100%",
             maxWidth: 580,
             backgroundColor: "#ffffff",
             borderTopLeftRadius: 20,
             borderTopRightRadius: 20,
             padding: "16px 18px calc(24px + env(safe-area-inset-bottom, 16px)) 18px",
             maxHeight: "80vh",
             display: "flex",
             flexDirection: "column"
           }}
           onClick={(e) => e.stopPropagation()}
         >
           {/* Handle pill */}
           <div style={{ width: 38, height: 4.5, borderRadius: 999, backgroundColor: "#cbd5e1", margin: "0 auto 12px auto" }} />
           
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #e2e8e0" }}>
             <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", color: "#166534", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800 }}>
               <HelpCircle size={14} />
               <span>Soal Nomor {currentItem.nomor} (dari {total} butir)</span>
             </div>
             <button
               type="button"
               onClick={() => setIsSoalModalOpen(false)}
               style={{ backgroundColor: "#f1f5f9", border: "none", borderRadius: "50%", width: 28, height: 28, display: "grid", placeItems: "center", cursor: "pointer", color: "#475569" }}
             >
               <X size={16} />
             </button>
           </div>

           <div style={{ flex: 1, overflowY: "auto", fontSize: 14.5, lineHeight: 1.7, color: "#18221f" }}>
             <CbtContentRenderer content={currentItem.soal} />
             {currentItem.soal_img && (
               <div style={{ marginTop: 14, textAlign: "center" }}>
                 <img src={currentItem.soal_img} alt="Diagram Soal" style={{ maxWidth: "100%", maxHeight: 300, objectFit: "contain", borderRadius: 8 }} />
               </div>
             )}
           </div>
         </motion.div>
       </div>
     )}
   </AnimatePresence>
   ```

### D. Unit Test (`tests/cbtHeaderViewModals.test.js`)
Buat test suite yang memverifikasi:
1. Tombol `Soal` dan `Wacana` terpasang di header CBT runner.
2. Mengklik tombol `Soal` membuka modal sheet teks soal lengkap.
3. Fitur long-press dan hint gesture dibersihkan dari codebase.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (210+ passing).
2. `npm run build` -> Vite build passing (0 error).
3. Screenshot mobile (390x844) membuktikan tombol Soal & Wacana terpasang rapi di header atas di `.agents/evidence/TASK-069-mobile-cbt-header-view-modals.png`.

---

## 4. Execution Evidence & Status
- Status: `VERIFIED`
- Unit Tests: 211/211 passing (`tests/cbtHeaderViewModals.test.js` & all suites)
- Vite Build: 0 error
- Layout Verification:
  - Mobile (390x844): DOM leaking = 0 (`.agents/evidence/TASK-069-mobile-cbt-header-view-modals.png`, `.agents/evidence/TASK-069-mobile-soal-sheet-open.png`)
  - Desktop (1920x1080): DOM leaking = 0 (`.agents/evidence/TASK-069-desktop-cbt-header-view-modals.png`)
  - Vision analysis: Verified buttons Soal & Wacana side by side, timer intact, zero overlap, modals open cleanly on 1 tap.
- Files Changed:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/cbtHeaderViewModals.test.js`
  - Removed obsolete: `tests/cbtLongPressQuestionPeek.test.js`
