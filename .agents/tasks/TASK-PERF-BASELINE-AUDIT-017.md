# TASK: TASK-PERF-BASELINE-AUDIT-017
## STATUS
READY

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Mode: ENGINEERING (Baseline Performance Investigation)
- Assigned: AURA (gikano)
- Manager: Vallencia (default)
- Authority: Eka

---

## 1. OBJECTIVE
Susun laporan investigasi berbasis bukti mendalam mengenai akar kelambatan dan *stuttering* performa mobile Tanka (TASK-010). 
Jangan menganggap masalah selesai hanya karena kode React disentuh atau pilot visual berhasil. Rekam baseline empiris sebelum merekomendasikan perubahan multi-lapis.

---

## 2. STRICT EVIDENCE STANDARDS
Setiap temuan atau dugaan WAJIB diberi label status eksplisit:
1. `[DIDUKUNG BUKTI]` — Temuan terverifikasi dengan angka, ukuran byte, benchmark, atau kutipan baris kode aktual.
2. `[HIPOTESIS]` — Dugaan logis yang belum terbukti di lapangan dan membutuhkan eksperimen terisolasi.
3. `[BELUM DIKETAHUI]` — Area abu-abu yang membutuhkan data telemetri tambahan.

Dilarang keras mengubah banyak lapisan kode sekaligus sebelum baseline direkam.

---

## 3. DOMAIN INVESTIGASI WAJIB
AURA harus menginvestigasi dan menyajikan bukti terukur untuk 5 domain berikut:
1. **Kompresi HTTP & Ukuran Transfer JS**:
   - Ukuran byte mentah vs terkompresi (gzip/brotli) untuk setiap chunk di `dist/assets/`.
   - Konfigurasi `server.js` (apakah ada `node:zlib` atau static compression middleware).
2. **Ukuran & Biaya Pemrosesan CSS**:
   - Jumlah baris CSS inline di `index.html` dan jumlah pemakaian tag `!important`.
   - Estimasi waktu kalkulasi gaya (*style recalculation cost*) pada prosesor mobile.
3. **Service Worker & Status Cache PWA**:
   - Versi cache aktif di `public/sw.js` (`tanka-pwa-v1` vs v2).
   - Mekanisme cache busting dan risiko ponsel pengguna mengunci aset lama.
4. **React Rendering, Layout, & State Profiling**:
   - Profil render tab navigasi dan dokumen matematika panjang (KaTeX render tree).
   - Potensi jank pada touch event vs efek `:hover` tombol di CSS.
5. **Jaringan & Perangkat Nyata**:
   - Pengukuran TTFB (Time to First Byte) dan total transfer time lewat tunnel Cloudflare.
   - Skenario jaringan seluler 4G kartu SIM vs loopback localhost.
