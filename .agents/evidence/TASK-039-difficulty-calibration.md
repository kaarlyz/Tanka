# Verifikasi TASK-QUIZ-DIFFICULTY-CALIBRATION-039

## Tanggal & Waktu
Jumat, 16 Oktober 2026

## Ringkasan Eksekusi
1. Memperbarui `server/services/quizGenerator.js`:
   - Mengalibrasi `typeGuidance` untuk domain matematika:
     * `beginner`: Murni matematika telanjang (naked math), pemanasan notasi dan identifikasi (soal 1-2), aljabar 1-2 langkah telanjang (soal 3-4), penyederhanaan pecahan prima langsung (soal 5). Larangan keras narasi studi kasus/lab/ragi/biologi. Opsi angka bulat atau pecahan ringkas.
     * `conceptual`: Standar Ujian Sekolah / TKA to-the-point tanpa narasi bertele-tele.
     * `analytical`: HOTS, baru diizinkan pemodelan skenario kontekstual dan parameter variabel ganda.
   - Mengalibrasi `typeGuidance` untuk non-matematika:
     * `beginner`: Definisi terminologi pokok, klasifikasi, fakta penting, dan tokoh dari teks sumber dengan opsi sangat singkat.
     * `conceptual`: Hubungan sebab-akibat dan perbandingan konsep.
     * `analytical`: Analisis fenomena kasus sosial/wacana kritis.
   - Mendekopel `antiSlopRule` dinamis berdasarkan kombinasi `isMathDomain` dan `quizType` agar tidak memaksakan stimulus narasi eksperimen/kasus nyata pada pemula atau menghalangi soal definisi terminologi dasar pada non-math beginner.
2. Memverifikasi seluruh automated test suite:
   `env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js`
   Hasil: 85/85 tests PASS.
3. Me-restart layanan systemd user `tanka`:
   `systemctl --user restart tanka` (status: active/running).
4. Verifikasi live endpoint POST `/api/ai/generate-quiz` dengan dokumen matematika (`doc_1792126089914_l725e`, "Eksponen dan Bentuk Akar", `quizType: "beginner"`, `count: 3`):
   - Soal 1: `Bentuk sederhana dari operasi perpangkatan $2^3 \times 2^4$ adalah ....`
   - Soal 2: `Jika $3^{x+1} = 27$, maka nilai $x$ adalah ....`
   - Soal 3: `Bentuk sederhana dari $\dfrac{5^6}{5^2 \times 5^1}$ adalah ....`
   - Hasil: Murni naked math tanpa narasi lab/ragi/biologi fiktif. Opsi jawaban ringkas dan bersih.
