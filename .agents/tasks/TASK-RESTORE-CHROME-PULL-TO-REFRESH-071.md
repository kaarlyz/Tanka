# TASK-RESTORE-CHROME-PULL-TO-REFRESH-071: Restore Native Pull-to-Refresh Gesture While Guarding Modal Overscroll

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/index.css`
  - `tests/pullToRefreshRestore.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & Root Cause Analysis

Pengguna menyampaikan komplain:
> *"kenapa di tanka pas ak di chrome mau refresh swipe atas kebawah gabisa"*

### Akar Penyebab:
Di task sebelumnya, untuk mematikan efek rubber-band saat mentok scroll, baris 1469 di `src/index.css` dipasangi:
```css
html, body {
  overscroll-behavior: none !important;
}
.app-shell {
  overscroll-behavior: none !important;
}
```
Di Google Chrome Android / iOS:
- Properti CSS `overscroll-behavior: none` atau `overscroll-behavior-y: none` pada elemen `html, body` **SECARA TOTAL MEMATIKAN FITUR NATIVE PULL-TO-REFRESH** peramban Chrome!
- Setiap kali pengguna mengusap layar dari paling atas ke bawah (*swipe down*), Chrome dicegah menampilkan lingkaran panah refresh bawaan.

### Solusi Tepat:
1. **Kembalikan `overscroll-behavior-y: auto` (atau biarkan default) pada `html, body`**:
   - Hanya kunci sumbu horizontal: `overscroll-behavior-x: none !important;` agar layar tidak bisa digeser-geser ke samping.
   - Sumbu vertikal $Y$ harus mengizinkan pull-to-refresh: `overscroll-behavior-y: auto !important;` (atau `overscroll-behavior: auto none !important;`).
2. **Kunci `overscroll-behavior: none` HANYA pada Drawer / Modal Tertentu**:
   - Kunci rubber-band HANYA diberlakukan pada panel modal yang sedang terbuka (`.ai-panel-box.open`, modal wacana/soal), BUKAN di tingkat root `html, body` halaman utama.
   - Dengan demikian, saat berada di halaman biasa (Beranda, Materi, CBT), pengguna bisa dengan bebas melakukan gestur tarik ke bawah (*pull-to-refresh*) di Chrome untuk me-reload halaman web seperti biasa.

---

## 2. Spesifikasi Implementasi

### A. Perbaikan CSS di `src/index.css`
Pada `@media (max-width: 768px)`:
```css
html, body {
  overflow-x: hidden !important;
  width: 100% !important;
  max-width: 100% !important;
  position: relative !important;
  overscroll-behavior-x: none !important; /* Kunci geser horizontal */
  overscroll-behavior-y: auto !important; /* KEMBALIKAN gestur native pull-to-refresh Chrome */
}

.app-shell {
  flex-direction: column !important;
  height: 100% !important;
  max-height: 100% !important;
  width: 100% !important;
  overflow: hidden !important;
  overscroll-behavior-x: none !important;
}

/* Kunci overscroll HANYA saat panel modal chat Nara AI terbuka */
.ai-panel-box.open {
  overscroll-behavior: none !important;
  overscroll-behavior-x: none !important;
  touch-action: pan-y !important;
}
```

### B. Unit Test (`tests/pullToRefreshRestore.test.js`)
Buat test suite yang memverifikasi:
1. `html, body` tidak lagi memiliki `overscroll-behavior: none !important` global.
2. `overscroll-behavior-y` diatur ke `auto` agar Chrome native pull-to-refresh berfungsi.
3. Proteksi horizontal `overscroll-behavior-x: none` tetap aktif mencegah geser ke samping.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (215/215 pass).
2. `npm run build` -> build passing (0 error).

---

## 4. Execution Evidence & Audit Log
- Status: `VERIFIED`
- Executor: MARAKA
- Files Changed:
  - `src/index.css` (ganti `overscroll-behavior: none` jadi `overscroll-behavior-x: none` dan `overscroll-behavior-y: auto` di `html, body`; ganti jadi `overscroll-behavior-x: none` di `.app-shell`)
  - `tests/pullToRefreshRestore.test.js` (unit test verifikasi overscroll root vs modal)
- Verification Results:
  - `npm test`: 215 pass, 0 fail.
  - `npm run build`: built in 455ms, 0 error.
  - Runtime DOM Probing: computed `overscrollBehaviorX: none`, `overscrollBehaviorY: auto`, horizontal overflow elements = 0 pada mobile viewport 390x844.
  - Screenshots:
    - Mobile: `.agents/evidence/TASK-071-mobile-pull-to-refresh-390x844.png`
    - Desktop: `.agents/evidence/TASK-071-desktop-pull-to-refresh-1920x1080.png`

