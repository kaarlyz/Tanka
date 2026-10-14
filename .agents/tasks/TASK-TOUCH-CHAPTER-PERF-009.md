# TASK: TASK-TOUCH-CHAPTER-PERF-009
## STATUS
VERIFIED

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `index.html`
  - `src/components/layout/MobileBottomNav.tsx`
  - `src/hooks/useAppRoute.ts`
  - `src/components/tabs/MaterialTab.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE
Eliminasi delay respons sentuhan pada navigasi bawah ponsel (Mobile Bottom Nav) dan hilangkan lag/stutter saat berpindah bab (Chapter Switching) pada pembaca materi dengan mengintegrasikan React Concurrent Transition, eliminasi 300ms mobile touch delay, dan auto-scroll reset bab.

---

## 2. LATAR BELAKANG & DIAGNOSIS
1. **Delay Sentuhan pada Mobile Bottom Nav**:
   - Elemen tombol navigasi bawah tidak memiliki `touch-action: manipulation`, memicu delay 300ms dari browser mobile yang menunggu potensi double-tap.
   - Tidak ada feedback visual instan saat tombol ditekan (kurang feedback tactile `:active`).
   - Perpindahan tab mengeksekusi re-render sinkron tanpa `React.startTransition`, menyebabkan sentuhan terasa tertahan/freeze.
2. **Lag & Disorientasi Saat Ganti Bab Materi**:
   - Di `MaterialTab.tsx`, bab memuat ratusan formula KaTeX (hingga 313 rumus per bab). Mengganti bab mengeksekusi kompilasi KaTeX secara sinkron di main-thread, membekukan animasi klik.
   - Tidak ada mekanisme reset scroll saat ganti bab. User yang mengklik tombol *"Lanjut ke Bab Selanjutnya"* di bagian bawah halaman tetap tertahan di bagian paling bawah halaman bab baru, bukan di bagian atas judul bab.

---

## 3. SPESIFIKASI IMPLEMENTASI (FOR MARAKA)

### A. Eliminasi 300ms Touch Delay & Snappy Tactile Feedback di `index.html`
Tambahkan aturan CSS global untuk sentuhan mobile:
```css
/* Snappy Mobile Touch & Manipulation */
button,
a,
.mobile-bottom-btn,
.mobile-bottom-nav,
.mobile-drawer-edge-tab {
  touch-action: manipulation !important;
  -webkit-tap-highlight-color: transparent !important;
}

.mobile-bottom-btn {
  user-select: none;
  -webkit-user-select: none;
  transition: transform 0.1s cubic-bezier(0.16, 1, 0.3, 1), color 0.15s ease !important;
}

.mobile-bottom-btn:active {
  transform: scale(0.92) !important;
}

@keyframes chapterCrossfade {
  from {
    opacity: 0.5;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chapter-content-fade {
  animation: chapterCrossfade 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

### B. React Concurrent Transition di `src/hooks/useAppRoute.ts`
Bungkus `setActiveTabState` di dalam `startTransition`:
```ts
import { useState, useEffect, useCallback, startTransition } from "react";
...
  const navigateTab = useCallback((tab: ActiveTab) => {
    const targetPath = tab === "home" ? "/" : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab }, "", targetPath);
    }
    startTransition(() => {
      setActiveTabState(tab);
    });
  }, []);
```

### C. Memoize `MobileBottomNav` di `src/components/layout/MobileBottomNav.tsx`
Bungkus komponen dengan `React.memo`:
```tsx
export const MobileBottomNav = React.memo(function MobileBottomNav({
  activeTab,
  setActiveTab,
  isAiPanelOpen,
  setIsAiPanelOpen,
  setIsMobileDrawerOpen,
  mistakes,
}: MobileBottomNavProps) {
  // ...
});
```

### D. Optimasi Ganti Bab di `src/components/tabs/MaterialTab.tsx`
1. Gunakan `React.useTransition` untuk perpindahan bab:
   ```tsx
   const [isChapterPending, startChapterTransition] = React.useTransition();
   
   const handleSelectChapter = (idx: number) => {
     startChapterTransition(() => {
       setCurrentChapterIdx(idx);
     });
   };
   ```
2. Ganti pemanggilan `setCurrentChapterIdx(...)` pada tombol Sebelumnya/Selanjutnya dan tombol daftar bab dengan `handleSelectChapter(...)`.
3. Tambahkan `useEffect` scroll-to-top otomatis saat `currentChapterIdx` berganti:
   ```tsx
   React.useEffect(() => {
     window.scrollTo({ top: 0, behavior: "smooth" });
     const scrollContainer = document.querySelector(".content-scroll");
     if (scrollContainer) {
       scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
     }
   }, [currentChapterIdx]);
   ```
4. Tambahkan kelas `.chapter-content-fade` pada wrapper `<MemoizedMarkdownBody>` agar ada transisi lembut saat bab berganti.

---

## 4. ACCEPTANCE CRITERIA
- [x] Tombol navigasi bawah merespons seketika pada sentuhan pertama (0ms touch delay, `touch-action: manipulation`).
- [x] Tombol bottom nav memiliki tactile scale feedback `scale(0.92)` saat ditekan.
- [x] Navigasi tab berjalan via `startTransition` tanpa freeze antarmuka.
- [x] Ganti bab materi berjalan mulus via `startChapterTransition` tanpa lag freeze KaTeX.
- [x] Reader otomatis scroll ke puncak halaman saat bab berganti.
- [x] Seluruh unit/integration test lolos 100% (`npm test` -> 83/83 passing).
- [x] DILARANG melakukan `git push` ke remote GitHub.

---

## 5. VERIFICATION COMMANDS
```bash
npm run build
env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js
```
