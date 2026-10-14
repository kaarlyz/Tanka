# TASK: TASK-AUTH-MODAL-HEADER-004
## STATUS
READY

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Assigned: MARAKA (maraka)
- Reviewer: AURA (gikano)
- Authority: Eka

## OBJECTIVE
Hilangkan kotak border pembungkus pada area header modal registrasi/login (`AuthModal.tsx` & `index.html`), jadikan header menyatu polos dan bersih dengan background putih modal utama, dan posisikan tombol close (✕) berdiri bebas di pojok kanan atas modal tanpa terkurung dalam border.

## ROOT CAUSE DIAGNOSIS
1. Di `index.html` (baris 2368 & 2414), terdapat aturan CSS global:
   ```css
   [role="dialog"], [class*="modal"] > div {
     border: 1px solid #c8d4c6 !important;
     box-shadow: 0 16px 40px rgba(15, 23, 20, 0.18), 0 0 0 1px rgba(27, 39, 35, 0.04) !important;
   }
   ```
   Karena modal card memakai class `modal-scale-in` (mengandung substring `modal`), **seluruh elemen `div` anak langsung di dalamnya (termasuk container header)** otomatis dipaksa memiliki border 1px dan bayangan drop-shadow seperti alert/banner kotak di dalam kotak!
2. Di `AuthModal.tsx`:
   - Area header `div` (icon + judul + subjudul) harus bebas dari border / bayangan (berikan inline style `border: "none !important", boxShadow: "none !important"` atau perbaiki selektor di `index.html` menjadi `[class*="modal-overlay"] > div, [class*="modal-backdrop"] > div`).
   - Tombol tutup (`✕`) harus berdiri bebas di pojok kanan atas modal dialog (`position: "absolute", top: 16, right: 16`), tanpa border pembungkus, transparan atau hover halus (`#f4f6f1`), mandiri menutup seluruh modal dialog.

## SCOPE OF WORK
1. **Perbaikan CSS Global (`index.html`)**:
   - Batasi selektor modal di `index.html` agar tidak sembarangan menembus semua anak `div`:
     Ganti `[class*="modal"] > div` menjadi `[class*="modal-overlay"] > div, [class*="modal-backdrop"] > div`.
2. **Pembersihan Header & Tombol Tutup (`src/components/modals/AuthModal.tsx`)**:
   - Pastikan container header tidak memiliki border, bayangan, atau outline: murni background putih polos modal.
   - Posisikan tombol close `✕` di `top: 16px, right: 16px` (atau `top: 18px, right: 18px`) dengan gaya clean, flat, tanpa border kotak tebal, hit area ergonomis (padding 6-8px, border-radius 8px).
3. **Verifikasi Visual & Bebas Regresi**:
   - Jalankan `npm run build` dan `npm test`.
   - Pastikan visual modal bersih, minimalis, dan tidak ada kotak di dalam kotak.

## ACCEPTANCE CRITERIA
- [ ] Header modal (icon, judul, subjudul) menyatu polos dengan background dialog tanpa garis border pembungkus/kotak.
- [ ] Tombol close (✕) berada bebas di pojok kanan atas modal dialog, tidak terkurung dalam garis border header.
- [ ] Tidak ada nesting border pada container modal.
- [ ] `npm run build` sukses 100%.
- [ ] `npm test` lulus seluruh test suite (83/83 passing).
