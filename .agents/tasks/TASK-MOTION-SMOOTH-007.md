# TASK: TASK-MOTION-SMOOTH-007
## STATUS
ACCEPTED & VERIFIED

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `index.html`
  - `src/components/modals/TanyaNaraPanel.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE
Tingkatkan kehalusan gerak (motion smoothing) di seluruh antarmuka Tanka tanpa memberatkan beban render mobile. Ubah transisi yang kaku (abrupt popping & harsh scale) menjadi animasi organik berbasis GPU (Apple/Linear-style cubic-bezier) pada modal, backdrop overlay, drawer mobile, tab switching, dan kartu interaktif.

---

## 2. BACKGROUND & AUDIT TEMUAN (PENYEBAB KAKU)
1. **Backdrop & Overlay Tanpa Transisi (0ms Flash)**:
   - `.modal-overlay`, `.modal-backdrop`, `.ai-panel-backdrop`, dan `.drawer-overlay` muncul seketika secara instan (0ms) saat dibuka, sehingga layar terasa kaget/berkedip gelap.
2. **Modal Dialog Terlalu Datar & Kaku**:
   - `.modal-scale-in` hanya melakukan `scale(0.95) -> scale(1)` tanpa pergeseran elevasi vertikal yang halus.
3. **Tanya Nara di Mobile Langsung Muncul (Snap)**:
   - `.ai-panel-box.open` di mobile (`max-width: 768px`) langsung berpindah dari `display: none` ke `display: flex` tanpa animasi slide-up sheet dari bawah.
4. **Tab Switch Bergetar (Jittery 12px Jump)**:
   - `.tab-pane-animate` menggunakan `translateY(12px)` yang terlalu tinggi, menimbulkan efek staccato saat navigasi tab.
5. **Tombol & Card Hover Terlalu Kasar**:
   - Interaksi klik tombol `scale(0.975)` terlalu kaku tanpa kurva pelepasan (*spring release*) yang natural.

---

## 3. SPESIFIKASI IMPLEMENTASI (FOR MARAKA)

### A. Animasi Overlay & Backdrop Halus (`index.html`)
Tambahkan keyframe dan aturan animasi pada seluruh backdrop:
```css
@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-overlay,
.modal-backdrop,
.drawer-overlay,
.ai-panel-backdrop.open {
  animation: overlayFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both !important;
}
```

### B. Organik Spring Modal Dialog (`index.html`)
Perhalus `scaleIn` agar modal muncul dengan elevasi natural dari bawah dan sedikit scale:
```css
@keyframes scaleIn {
  0% {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-scale-in {
  animation: scaleIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) both !important;
}
```

### C. Slide-up Sheet untuk Tanya Nara Mobile (`index.html`)
Pada media query mobile (`@media (max-width: 768px)`), berikan animasi sheet slide-up pada `.ai-panel-box.open`:
```css
@keyframes sheetSlideUp {
  from {
    transform: translateY(100%);
    opacity: 0.85;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .ai-panel-box.open {
    animation: sheetSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both !important;
  }
}
```

### D. Perhalus Tab Crossfade & Transisi Konten (`index.html`)
Kurangi lonjakan `fadeInUp` dari 12px menjadi 6px yang elegan:
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-pane-animate {
  animation: fadeInUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

### E. Micro-interactions pada Tombol & Kartu (`index.html`)
Perbarui transisi global tombol dan kartu modul:
```css
button, a, .tab-pill, .bento-stat-card, .learning-card-white, .study-card {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1),
              background-color 0.15s ease,
              border-color 0.15s ease !important;
}

button:active:not(:disabled) {
  transform: scale(0.98) !important;
}

.home-docs-grid > div:hover {
  transform: translateY(-2.5px);
  box-shadow: 0 8px 24px rgba(24, 34, 31, 0.06);
}
```

---

## 4. ACCEPTANCE CRITERIA
- [x] Overlay backdrop (modal, sidebar, Tanya Nara) memudar masuk secara halus (`overlayFadeIn`).
- [x] Dialog modal mengapung masuk dengan pergerakan scale & translate elegan (`scaleIn`).
- [x] Drawer Tanya Nara di mobile meluncur naik dari bawah layar seperti native bottom sheet.
- [x] Pergantian tab terasa silky tanpa hentakan kasar.
- [x] Hover dan klik kartu/tombol terasa kenyal dan responsif (`scale(0.98)`).
- [x] Metrik build tetap ringan (semua animasi murni CSS berbasis GPU composite `transform` & `opacity`).
- [x] Test suite lolos 100% (`npm test` -> 83/83 passing).
- [x] DILARANG melakukan `git push` ke remote GitHub.

---

## 5. VERIFICATION COMMANDS
```bash
npm run build
env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js
```
