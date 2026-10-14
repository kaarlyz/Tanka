# TASK: TASK-PERF-CODE-SPLIT-006
## STATUS
ACCEPTED & VERIFIED

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/App.tsx`
  - `src/components/tabs/MaterialTab.tsx`
  - `vite.config.ts`
  - `index.html`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE
Lakukan optimasi performa modular (Zero-Regress Code Splitting & GPU Composite Acceleration) pada aplikasi web Tanka agar initial JavaScript bundle (`dist/assets/index-*.js`) turun dari 1.34 MB menjadi < 350 kB tanpa mendegradasi fitur, estetika, atau fungsi KaTeX.

---

## 2. BACKGROUND & DIAGNOSIS
Ukuran bundel `index-*.js` saat ini membengkak hingga 1.34 MB (1.341 kB). Hal ini membuat loading awal di mobile via Cloudflare Tunnel lambat karena seluruh komponen berikut di-import statis sekaligus di root `App.tsx`:
1. Tab-tab sekunder: `QuizTab`, `FlashcardsTab`, `FeynmanTab`, `SummaryTab`, `MistakesTab`.
2. Kanvas grafis berat: `InteractiveMindMap` di dalam `MaterialTab.tsx`.
3. Modal-modal besar: `TopicModal`, `EnrichModal`, `StagingUploadModal`, `YouTubeModal`, `TimerAlarmModal`, `AuthModal`, `ProfileModal`, `RoomModal`, `FormulaDrawer`, `TanyaNaraPanel`.
4. Library komputasi AST: `katex`, `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`.

---

## 3. SCOPE OF IMPLEMENTATION (FOR MARAKA)

### A. Dynamic Imports & Suspense di `src/App.tsx`
1. Ubah import statis berikut menjadi `React.lazy()`:
   ```tsx
   // Lazy Tabs
   const QuizTab = lazy(() => import("./components/tabs/QuizTab").then(m => ({ default: m.QuizTab })));
   const FlashcardsTab = lazy(() => import("./components/tabs/FlashcardsTab").then(m => ({ default: m.FlashcardsTab })));
   const FeynmanTab = lazy(() => import("./components/tabs/FeynmanTab").then(m => ({ default: m.FeynmanTab })));
   const SummaryTab = lazy(() => import("./components/tabs/SummaryTab").then(m => ({ default: m.SummaryTab })));
   const MistakesTab = lazy(() => import("./components/tabs/MistakesTab").then(m => ({ default: m.MistakesTab })));

   // Lazy Modals (Fallback null)
   const TanyaNaraPanel = lazy(() => import("./components/modals/TanyaNaraPanel").then(m => ({ default: m.TanyaNaraPanel })));
   const FormulaDrawer = lazy(() => import("./components/modals/FormulaDrawer").then(m => ({ default: m.FormulaDrawer })));
   const TopicModal = lazy(() => import("./components/modals/TopicModal").then(m => ({ default: m.TopicModal })));
   const EnrichModal = lazy(() => import("./components/modals/EnrichModal").then(m => ({ default: m.EnrichModal })));
   const StagingUploadModal = lazy(() => import("./components/modals/StagingUploadModal").then(m => ({ default: m.StagingUploadModal })));
   const YouTubeModal = lazy(() => import("./components/modals/YouTubeModal").then(m => ({ default: m.YouTubeModal })));
   const TimerAlarmModal = lazy(() => import("./components/modals/TimerAlarmModal").then(m => ({ default: m.TimerAlarmModal })));
   const AuthModal = lazy(() => import("./components/modals/AuthModal").then(m => ({ default: m.AuthModal })));
   const ProfileModal = lazy(() => import("./components/modals/ProfileModal").then(m => ({ default: m.ProfileModal })));
   const RoomModal = lazy(() => import("./components/modals/RoomModal").then(m => ({ default: m.RoomModal })));
   ```
   *(Catatan: `HomeHubTab` dan `MaterialTab` tetap dapat dipertahankan agar landing tab Beranda dan pembaca materi instan tanpa jeda chunk).*
2. Bungkus tab-tab sekunder di dalam `<Suspense fallback={<TabFallbackSkeleton />}>`.
   Buat komponen fallback yang halus dan selaras dengan tema Tanka:
   ```tsx
   function TabFallbackSkeleton() {
     return (
       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 12, color: "#617169" }}>
         <div style={{ width: 32, height: 32, border: "3px solid #dce2d8", borderTopColor: "#4b6623", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
         <span style={{ fontSize: 13, fontWeight: 600 }}>Memuat fitur...</span>
       </div>
     );
   }
   ```
3. Bungkus render modal di dalam `<Suspense fallback={null}>`.

### B. Lazy Load `InteractiveMindMap` di `src/components/tabs/MaterialTab.tsx`
1. Di `src/components/tabs/MaterialTab.tsx`:
   Ganti import statis `InteractiveMindMap` menjadi:
   ```tsx
   const InteractiveMindMap = React.lazy(() =>
     import("../common/InteractiveMindMap").then((m) => ({ default: m.InteractiveMindMap }))
   );
   ```
2. Bungkus penggunaan `<InteractiveMindMap />` di dalam `<React.Suspense fallback={<div style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center", color: "#60706a" }}>Memuat Peta Konsep...</div>}>`.

### C. Manual Chunking di `vite.config.ts`
Atur `rollupOptions.output.manualChunks` di `vite.config.ts`:
```ts
build: {
  chunkSizeWarningLimit: 600,
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/")) {
          return "vendor-react";
        }
        if (id.includes("/node_modules/katex/")) {
          return "vendor-katex";
        }
        if (
          id.includes("/node_modules/react-markdown/") ||
          id.includes("/node_modules/remark-gfm/") ||
          id.includes("/node_modules/remark-math/") ||
          id.includes("/node_modules/rehype-katex/")
        ) {
          return "vendor-markdown";
        }
        if (id.includes("/node_modules/lucide-react/")) {
          return "vendor-icons";
        }
      },
    },
  },
}
```
Ini memisahkan engine KaTeX (~509 kB), React (~206 kB), Markdown (~172 kB), dan icons (~31 kB) ke dalam file chunk terisolasi, sehingga initial bundle entry (`index-*.js`) menyusut drastis menjadi 187 kB (< 350 kB).

### D. GPU Composite Acceleration di `index.html`
Tambahkan aturan hardware-accelerated CSS pada elemen modal dan overlay di `index.html`:
```css
.modal-scale-in,
.modal-overlay,
.modal-backdrop,
.ai-panel-box,
.ai-panel-backdrop,
.sidebar-drawer,
.formula-drawer-box,
[role="dialog"] {
  transform: translateZ(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}
```

---

## 4. ACCEPTANCE CRITERIA
- [x] Initial bundle `dist/assets/index-*.js` berukuran `< 350 kB` (setelah `npm run build` -> 187.54 kB).
- [x] Chunk vendor terpisah (`vendor-react`, `vendor-katex`, `vendor-markdown`, `vendor-icons`).
- [x] Tab sekunder (`QuizTab`, `FlashcardsTab`, `FeynmanTab`, `SummaryTab`, `MistakesTab`) termuat via on-demand code splitting.
- [x] MindMap di `MaterialTab` termuat on-demand via Suspense.
- [x] Semua modal di `App.tsx` termuat on-demand via Suspense.
- [x] Animasi modal terakselerasi GPU (`translateZ(0)` + `will-change`).
- [x] Seluruh unit & integration test lolos 100% (`npm test` -> 83/83 passing).
- [x] Tidak ada regresi visual atau fungsional pada KaTeX dan navigasi.
- [x] DILARANG melakukan `git push` ke remote repository.

---

## 5. VERIFICATION COMMANDS & RESULTS
```bash
npm run build
# dist/assets/index-BL4DUXGR.js: 187.54 kB (gzip: 47.04 kB)
# vendor chunks: vendor-react (206k), vendor-katex (509k), vendor-markdown (172k), vendor-icons (31k)

ls -lh dist/assets/*.js
# All secondary tabs, modals, and mindmap extracted into on-demand chunks

env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js
# 83 passed, 0 failed
```
