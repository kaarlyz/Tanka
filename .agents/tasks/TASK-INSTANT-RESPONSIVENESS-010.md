# TASK: TASK-INSTANT-RESPONSIVENESS-010
## STATUS
REVIEW_REQUIRED

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/App.tsx`
  - `src/hooks/useAppRoute.ts`
  - `src/components/tabs/MaterialTab.tsx`
  - `index.html`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE
Eliminasi tuntas seluruh sumber delay, persepsi berat, dan lag navigasi di seluruh website Tanka. Ubah seluruh klik tombol, link navigasi, dan perpindahan bab menjadi **SEKETIKA / INSTAN (0ms delay)** tanpa transisi artifisial yang menahan render.

---

## 2. LATAR BELAKANG & DIAGNOSIS (AKAR MASALAH "MAKIN BERAT")
Audit mendalam menemukan 4 biang keladi yang membuat website terasa tertahan/lambat:
1. **`startTransition` di `useAppRoute.ts`**:
   - `setActiveTabState(tab)` dibungkus `startTransition()`. Di React, ini menandai perpindahan tab sebagai prioritas rendah (*deferred*), sehingga React sengaja menunda eksekusi update tab beberapa frame di background. User merasa klik tertahan/delay.
2. **`transition: max-width 0.2s ease` di `src/App.tsx` (Line 874)**:
   - Kontainer induk seluruh tab menganimasikan `maxWidth` (1080px $\leftrightarrow$ 1440px) selama 200ms. Animasikan `max-width` memicu **Forced Reflow & Layout Thrashing** pada ribuan node DOM di setiap frame, mencekik CPU browser ponsel.
3. **`startChapterTransition` di `MaterialTab.tsx`**:
   - Mengganti bab dibungkus `useTransition()`, menunda update state bab sehingga klik terasa tidak responsif.
4. **Artifisial Opacity 0 di `.tab-pane-animate` & `.chapter-content-fade`**:
   - Tiap kali tab atau bab berganti, animasi CSS memaksa `from { opacity: 0 }`. Konten hilang sesaat dan baru muncul perlahan, menciptakan ilusi visual "lemot/delay".
5. **CSS `transition: ... !important` pada Seluruh `button, a`**:
   - Di `index.html`, aturan global memaksa transisi 200ms pada setiap klik tombol/link.

---

## 3. SPESIFIKASI IMPLEMENTASI (FOR MARAKA)

### A. Buang Animasi `max-width` di `src/App.tsx`
Pada kontainer konten (sekitar baris 874), hapus `transition: "max-width 0.2s ease"`:
```tsx
// SEBELUM:
<div style={{ maxWidth: activeTab === "material" ? 1440 : 1080, margin: "0 auto", width: "100%", transition: "max-width 0.2s ease" }}>

// SESUDAH (Hapus properti transition):
<div style={{ maxWidth: activeTab === "material" ? 1440 : 1080, margin: "0 auto", width: "100%" }}>
```

### B. Kembalikan Navigasi Sinkron Instan di `src/hooks/useAppRoute.ts`
Hapus `startTransition`. Jalankan `setActiveTabState(tab)` secara langsung dan sinkron:
```ts
  const navigateTab = useCallback((tab: ActiveTab) => {
    const targetPath = tab === "home" ? "/" : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, "", targetPath);
    }
    setActiveTabState(tab);
  }, []);
```

### C. Kembalikan Pergantian Bab Sinkron Instan di `src/components/tabs/MaterialTab.tsx`
1. Hapus `startChapterTransition` dan `useTransition`. Jalankan `setCurrentChapterIdx` secara langsung:
   ```tsx
   const handleSelectChapter = (idx: number | ((prev: number) => number)) => {
     const scrollContainer = document.querySelector(".content-scroll");
     if (scrollContainer) scrollContainer.scrollTop = 0;
     window.scrollTo(0, 0);
     setCurrentChapterIdx(idx);
   };
   ```
2. Hapus pembungkus `.chapter-content-fade` dari `<MemoizedMarkdownBody>` agar bab baru langsung tampil seketika tanpa efek pudar dari 0.

### D. Bersihkan Aturan CSS yang Memperlambat di `index.html`
1. Ubah `.tab-pane-animate` agar tidak menahan opacity dari 0:
   ```css
   .tab-pane-animate {
     /* Render instan tanpa delay opacity */
     animation: none !important;
   }
   ```
2. Hapus `transition: ... !important` universal dari `button, a` di `index.html` agar klik tidak tertahan delay CSS:
   ```css
   /* Biarkan tombol responsif seketika tanpa transisi universal yang menahan */
   button, a {
     -webkit-tap-highlight-color: transparent !important;
     touch-action: manipulation !important;
   }
   ```
3. Pastikan `.content-scroll` memiliki `overflow-anchor: none !important;`.

---

## 4. ACCEPTANCE CRITERIA
- [x] Klik tab navigasi (Beranda, Materi, Latihan, Bank Salah) berganti **seketika (0 ms)** tanpa jeda `startTransition`.
- [x] Tidak ada layout reflow berat animasi `max-width` di `App.tsx`.
- [x] Ganti bab materi berganti seketika dengan scroll reset langsung di puncak judul bab.
- [x] Konten tab langsung terlihat jelas tanpa jeda fade-in dari transparan.
- [x] Seluruh unit & integration test lolos 100% (`npm test` -> 83/83 passing).
- [x] DILARANG melakukan `git push` ke remote GitHub.

---

## 5. VERIFICATION COMMANDS
```bash
npm run build
env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js
```

### Verification Result (MARAKA - 2026-10-14):
- `npm run build`: Success in 430ms.
- Tests: 83/83 pass, 0 fail (duration ~59s).
- Status: Ready for audit by AURA.
