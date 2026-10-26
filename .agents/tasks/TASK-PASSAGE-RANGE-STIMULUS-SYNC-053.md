# TASK-PASSAGE-RANGE-STIMULUS-SYNC-053: Passage Boundary Anchor & Deterministic Stimulus Propagation Across Question Ranges

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `server/services/examPipeline.js`
  - `tests/passageRangeStimulusSync.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & Root Cause

### Penyebab Soal 5 s.d. 8 Kehilangan Teks Cerita ("Layur, Teruslah Berlayar")
1. Di dokumen asli, wacana baru diperkenalkan dengan pola:
   `Teks “Layur, Teruslah berlayar” untuk soal nomor 5 s.d. 8`
   Teks wacana ini terletak di akhir Halaman 3/4, tepat **sebelum** penanda `S Hierarki Indikator (5)`.
2. Di `splitDocumentIntoQuestionChunks`:
   Delimiter chunking memotong pada:
   `boundaryRegex = /(?:^|\n)(?:(?:\[Gambar:[^\]]+\]\s+)?(?:[A-Z0-9$]+\s+)?Hierarki\s+Indikator)/gi;`
   Karena potongan baru dimulai pada `Hierarki Indikator (5)`, seluruh teks cerita Layur tersisa di ekor Soal 4 pada **Chunk 1**!
3. Chunk 2 dimulai langsung dari Soal 5:
   `S Hierarki Indikator (5) Berdasarkan teks tersebut, bagaimana sifat yang dimiliki oleh Layur?`
   tanpa memuat naskah cerita Layur sama sekali!
4. Akibatnya, AI mengekstrak Soal 5, 6, 7, 8 dengan `stimulus: null` (panjang 0 karakter).
5. Hal serupa terjadi pada soal-soal lain dalam rentang wacana yang sama (misal Soal 10 kehilangan teks wacana Pantai Bersih).

---

## 2. Spesifikasi Implementasi

### A. Jangkar Batas Wacana di `splitDocumentIntoQuestionChunks` (`server/services/examPipeline.js`)
1. Perbarui delimiter pemotongan agar memasukkan deklarasi wacana baru sebagai titik awal butir soal baru:
   ```javascript
   const passageHeaderPattern = /(?:^|\n)(?:(?:\[Gambar:[^\]]+\]\s+)?(?:Teks\s+["“][^"”]+["”]\s+untuk\s+soal\s+nomor\s+\d+|Wacana\s+untuk\s+soal\s+nomor\s+\d+))/i;
   ```
   Batas chunking harus memotong **sebelum** deklarasi wacana baru, bukan setelahnya.
2. Dengan demikian, naskah `Teks “Layur...” untuk soal nomor 5 s.d. 8` secara otomatis masuk ke awal paket Soal 5 (Chunk 2), BUKAN tertinggal di ekor Soal 4 (Chunk 1).

### B. Deterministic Stimulus Propagation Across Question Ranges
1. Pada `runExamPipeline` atau `pipelineToTankaFormat`:
   Parse seluruh rentang wacana yang dideklarasikan dalam naskah:
   `Teks\s+["“]([^"”]+)["”]\s+untuk\s+soal\s+nomor\s+(\d+)\s+s\.d\.?\s*(\d+)`
2. Ekstrak isi teks wacana lengkap untuk rentang tersebut (dari judul wacana sampai sebelum indikator soal pertama).
3. Untuk setiap butir soal dari nomor awal (`start`) sampai nomor akhir (`end`):
   - Jika `q.stimulus` kosong, null, atau tidak memuat judul wacana, isi otomatis dengan teks wacana kanonikal rentang tersebut.
   - Jika ada visual image yang melekat pada wacana (seperti ilustrasi Pantai Bersih), wariskan juga ke `imageUrl` soal pembuka (Soal 9).

### C. Sinkronisasi Database Tanka (`tanka.sqlite`)
1. Perbarui data kuis pada dokumen `doc_1792838551616_b7k6g`:
   - Soal 5, 6, 7, 8: Isi field `stimulus` dengan naskah lengkap cerita Layur ("Layur, Teruslah Berlayar: 'Bapak, pulanglah,' lirih Layur...").
   - Soal 9, 10, 11: Pastikan semuanya memiliki stimulus lengkap "Pantai Bersih Tanpa Sampah".
   - Soal 12, 13, 14: Pastikan memuat stimulus "Pulihkan Ekosistem".
   - Soal 15, 16, 17: Pastikan memuat stimulus "Prospek Ekonomi Global".
   - Soal 18, 19, 20, 21: Pastikan memuat stimulus "Tari Hudog" / "Interaksi Sosial" / "Roh Meratus".
   - Soal 22, 23, 24, 25: Pastikan memuat stimulus "Tradisi Belis".

### D. Unit Test (`tests/passageRangeStimulusSync.test.js`)
Buat test suite yang memverifikasi:
1. `splitDocumentIntoQuestionChunks` menempatkan deklarasi wacana baru dan ceritanya di awal chunk soal yang bersangkutan (Teks Layur berada di chunk Soal 5, bukan Soal 4).
2. Mekanisme stimulus propagation mengisi seluruh soal dalam rentang `start s.d. end` tanpa ada soal yang kehilangan wacana bacaannya.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (145+ passing).
2. `npm run build` -> build passing.
