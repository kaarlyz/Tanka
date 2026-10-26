# TASK-NARA-PANEL-MOBILE-HORIZONTAL-LOCK-063: Lock Horizontal Viewport & Eliminate Right Spacing Overscroll in Mobile Tanya Nara Drawer

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/modals/TanyaNaraPanel.tsx`
  - `src/index.css`
  - `tests/naraPanelHorizontalLock.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka
- Status: VERIFIED

---

## 1. Root Cause Analysis (Temuan Pengguna)

Pengguna menyampaikan:
> *"kenapa pas buka chat nara panel nya itu kek ada spacing kekanan? blok jangan sampe bisa geser ke kanan"*

### Akar Penyebab Teknis:
1. **Lebar Menggunakan `100vw` (Viewport Scrollbar Leakage):**
   - Di `src/index.css` baris 1641-1643:
     ```css
     .ai-panel-box.open {
       width: 100vw !important;
       min-width: 100vw !important;
       max-width: 100vw !important;
     }
     ```
   - Di browser mobile (termasuk Chrome Android & iOS WebKit), `100vw` **memperhitungkan lebar scrollbar sistem**, yang seringkali melebihi lebar layar riil (`100%`). Akibatnya, ada kelebihan 8px–16px ruang kosong di sebelah kanan, sehingga seluruh panel bisa digeser-geser ke kanan (*horizontal overscroll / jitter*).
2. **Left Resize Handle Desktop Bocor ke Mobile:**
   - Di `TanyaNaraPanel.tsx` baris 764:
     Handle drag desktop diposisikan dengan:
     `position: "absolute", left: -4, width: 8, height: "100%"`
     Di mobile, elemen dengan `left: -4` tanpa penahanan `overflow: hidden` pada container luar mendorong bounding box layar melebihi 100%. Handle resize desktop ini wajib disembunyikan total di mobile (`display: none` pada `@media (max-width: 768px)`).
3. **Ketiadaan `overscroll-behavior-x: contain` & `touch-action: pan-y`:**
   - Panel modal tidak mengunci sumbu X secara keras. Saat pengguna mengusap layar secara diagonal, browser mengizinkan panning horizontal.

---

## 2. Spesifikasi Implementasi

### A. Kunci Lebar Panel ke `100%` / `100dvw` & Sembunyikan Resize Handle di Mobile (`src/index.css`)
Perbarui aturan `.ai-panel-box.open` di `@media (max-width: 768px)`:
```css
@media (max-width: 768px) {
  .ai-panel-box.open {
    position: fixed !important;
    inset: 0 !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important; /* Gunakan 100%, BUKAN 100vw agar tidak bocor scrollbar */
    min-width: 100% !important;
    max-width: 100% !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    z-index: 5000 !important;
    background: #ffffff !important;
    display: flex !important;
    flex-direction: column !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow-x: hidden !important; /* Blokir total pergeseran horizontal */
    overscroll-behavior-x: none !important;
    touch-action: pan-y !important; /* Hanya izinkan usapan vertikal */
    box-sizing: border-box !important;
  }

  /* Sembunyikan handle resize desktop di mobile agar tidak mendorong lebar layar */
  .ai-panel-resizer-desktop,
  .ai-panel-box .ai-panel-resizer {
    display: none !important;
  }

  .ai-panel-inner {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
  }
}
```

### B. Pasang Class pada Resize Handle (`src/components/modals/TanyaNaraPanel.tsx`)
1. Berikan class `ai-panel-resizer-desktop` pada elemen div resize handle:
   ```tsx
   <div
     className="ai-panel-resizer-desktop"
     onMouseDown={startResize}
     ...
   >
   ```
2. Pada kontainer `<aside className={...}>`, tambahkan `touchAction: "pan-y"`, `overflowX: "hidden"`.

### C. Unit Test (`tests/naraPanelHorizontalLock.test.js`)
Buat test suite yang memverifikasi:
1. `.ai-panel-box.open` di mobile menggunakan lebar `100%` (bukan `100vw`) dan memiliki `overflow-x: hidden`.
2. Resize handle desktop memiliki class penanda dan dinonaktifkan di mobile.
3. DOM probe pada mobile 390x844 saat panel Nara AI terbuka:
   `document.querySelector('.ai-panel-box').getBoundingClientRect().right === 390` (nol pixel bocor ke kanan).

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (195+ passing).
2. `npm run build` -> Vite build passing (0 error).
3. Screenshot mobile (390x844) saat panel chat Nara AI terbuka di `.agents/evidence/TASK-063-mobile-nara-panel-horizontal-lock.png`.

---

## 4. Execution & Verification Results (MARAKA)

- **Test Suite**: `npm test` passing 196/196 tests (including `tests/naraPanelHorizontalLock.test.js`).
- **Production Build**: `npm run build` passing with 0 errors.
- **Runtime DOM Probe (browser_exec)**:
  - Viewport: 390x844 (mobile).
  - `.ai-panel-box.open` computed width: `390px`, left: `0px`, right: `390px`.
  - Leaking elements (`getBoundingClientRect().right > 390`): `0`.
  - Resize handle `.ai-panel-resizer-desktop`: `display: none !important`.
- **Desktop Probe (1920x1080)**:
  - Panel display: `flex`, width: `420px`, resizer display: `flex`, cursor: `col-resize`.
- **Screenshot Evidence**:
  - Captured at `.agents/evidence/TASK-063-mobile-nara-panel-horizontal-lock.png` (141,984 bytes).
  - Inspected with `vision_analyze`: 0 horizontal spill, clean edge-to-edge alignment.
