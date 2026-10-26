# TASK-AI-DRILL-KEY-DISTRIBUTION-CALIBRATION-088

## Context & Critical Architectural Pivot
AURA mengidentifikasi kelemahan *positional bias* pada LLM generator yang menumpuk kunci di opsi A/B dan mengusulkan shuffling acak murni (Fisher-Yates 20% seragam A-E).
Namun, **Eka dan Lead Orchestrator mengoreksi usulan tersebut berdasarkan audit psikometrik empiris naskah resmi Pusmendik TKA (733 butir di `tanka.sqlite`)**:
Di dunia nyata, pembuat soal Pusmendik **BUKAN generator acak seragam**. Mereka memiliki bias kognitif sistemik yang sudah terbukti di naskah resmi:
1. **Bahasa Inggris:** Opsi **B memonopoli 44.4%** kunci jawaban resmi (rasio 4:1 terhadap opsi lain).
2. **Matematika:** Opsi **B (30.6%) & C (36.7%) menguasai 66.0%** naskah (The Math Bell Curve; A dan E dijauhi sebagai angka ekstrem).
3. **Ekonomi:** Opsi **E adalah yang tertinggi (29.6%)**, menampung bauran formula/kebijakan makro terlengkap.
4. **Sosiologi:** Berpusat di **C & D (51.5%)**, opsi E paling dihindari (11.4%).

Jika opsi di-shuffle 20% flat seragam, **AI Drill justru kehilangan keotentikan medan tempur aslinya** dan gagal melatih insting siswa terhadap distribusi resmi Pusmendik.

## Discrete Implementation Mandate for MARAKA (Under AURA's Architectural Supervision)
1. **Bangun Algoritma Pusmendik Target-Weight Key Calibration (`server/services/aiDrillGenerator.js`):**
   - Buat fungsi post-processor sebelum paket disimpan ke database: `calibrateKeyDistribution(items, subject)`.
   - Fungsi ini mengambil daftar butir soal PG dan mengatur penempatan huruf kunci jawaban sesuai matriks probabilitas empiris Pusmendik per mapel:
     * **Bahasa Inggris:** Target bobot `[A: 15%, B: 40%, C: 20%, D: 15%, E: 10%]`.
     * **Matematika:** Target bobot `[A: 8%, B: 32%, C: 35%, D: 17%, E: 8%]`.
     * **Ekonomi:** Target bobot `[A: 12%, B: 18%, C: 20%, D: 20%, E: 30%]`.
     * **Sosiologi:** Target bobot `[A: 18%, B: 20%, C: 28%, D: 24%, E: 10%]`.
     * **Bahasa Indonesia:** Target bobot `[A: 15%, B: 28%, C: 26%, D: 18%, E: 13%]`.

2. **Mekanisme Shuffling Berbobot (Weighted Target Swap):**
   - Ambil opsi jawaban butir soal.
   - Tentukan huruf target kunci berdasarkan kuota distribusi mapel tersebut.
   - Pindahkan opsi yang benar ke posisi huruf target tersebut, lalu susun kembali opsi pengecoh secara acak pada posisi yang tersisa.
   - Update `kunci_jawaban` dan sesuaikan `options` array (`a, b, c, d, e`).

3. **Verifikasi & Quality Gate:**
   - Buat test suite baru `tests/pusmendikKeyCalibration.test.js`:
     * Generate sampel batch (misal 50 butir simulasi per mapel).
     * Uji bahwa distribusi kunci Bahasa Inggris mendekati ~40% B, Matematika mengumpul di B/C ~65%, dan Ekonomi mempertahankan E tertinggi ~30%.
     * Pastikan tidak ada kunci/opsi yang rusak atau hilang saat swap.
   - Pastikan `npm test` passing (274+ tests lulus).
   - Pastikan `npm run build` sukses 0 error.
   - Restart `systemctl --user restart tanka`.
