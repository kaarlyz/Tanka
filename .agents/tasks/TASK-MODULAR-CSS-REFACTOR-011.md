# TASK: TASK-MODULAR-CSS-REFACTOR-011
## STATUS
REVIEW_REQUIRED

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `index.html`
  - `src/index.css` (New file)
  - `src/main.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE
Jalankan refactoring arsitektur stylesheet frontend Tanka: ekstraksi seluruh 2.924 baris inline CSS dari tag `<style>` di `index.html` ke file modular baru `src/index.css`, impor di `src/main.tsx`, dan rampingkan `index.html` hingga di bawah 40 baris sesuai standar kanonikal Vite React TSX.

---

## 2. BACKGROUND & DIAGNOSIS
- File `index.html` saat ini membengkak hingga 2.958 baris, dengan 2.924 baris inline CSS di dalam tag `<style>` dan lebih dari 640 aturan `!important`.
- Inline CSS masif ini membebani parser HTML browser seluler, meniadakan kemampuan browser & CDN untuk melakukan immutable caching terhadap berkas CSS, dan memicu reflow thrashing.
- Standar arsitektur Vite React TSX yang bersih (seperti pada repositori `kaarlyz/myfxjournal`) memisahkan seluruh stylesheet ke dalam `src/index.css` yang diimpor di entrypoint `src/main.tsx`.

---

## 3. SPESIFIKASI IMPLEMENTASI (FOR MARAKA)

### A. Ekstraksi CSS Penuh ke `src/index.css`
1. Pindahkan seluruh isi dari dalam tag `<style>...</style>` di `index.html` ke file baru: `src/index.css`.
2. Pertahankan 100% token desain, variabel `:root`, typography, keyframes, KaTeX styling, reader mode, kartu 3D, formula drawer, dialog modal, dan mobile bottom nav tanpa cacat visual.
3. Optimasi touch & hover:
   - Pastikan hover tombol hanya aktif pada perangkat pointer:
     ```css
     @media (hover: hover) and (pointer: fine) {
       button:hover:not(:disabled) {
         transform: translateY(-1.5px);
       }
     }
     ```
   - Pastikan `.chapter-content-fade` dan `.tab-pane-animate` tidak memiliki delay yang menahan render.

### B. Integrasi TypeScript di `src/main.tsx`
Tambahkan impor CSS di `src/main.tsx`:
```tsx
import "./index.css";
```
(Tempatkan tepat di bawah `import "katex/dist/katex.min.css";` atau di bagian atas impor aplikasi).

### C. Rampingkan `index.html` (<40 baris)
Hapus tag `<style>...</style>` sepenuhnya dari `index.html`. Sisakan hanya kerangka HTML minimalis:
```html
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Tanka - AI Autonomous Study Platform</title>
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#18221f" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
    <script>
      if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
          navigator.serviceWorker.register("/sw.js").catch(() => {});
        });
      }
    </script>
  </body>
</html>
```

---

## 4. ACCEPTANCE CRITERIA
- [x] Seluruh CSS dari `index.html` berhasil diekstraksi ke `src/index.css`.
- [x] `src/main.tsx` mengimpor `src/index.css`.
- [x] `index.html` bersih dari tag `<style>` dengan jumlah baris < 40 baris.
- [x] `npm run build` sukses menghasilkan chunk CSS terpisah yang teroptimasi di `dist/assets/index-[hash].css`.
- [x] Seluruh unit & integration test lolos 100% (`env TANKA_DB_PATH=:memory: node --test tests/*.test.js` -> 83/83 passing).
- [x] Tampilan visual dan fungsionalitas aplikasi di desktop & mobile tetap 100% identik tanpa regresi.
- [x] DILARANG melakukan `git push` ke remote GitHub.

---

## 5. VERIFICATION COMMANDS
```bash
wc -l index.html
npm run build
env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js
systemctl --user restart tanka
```
