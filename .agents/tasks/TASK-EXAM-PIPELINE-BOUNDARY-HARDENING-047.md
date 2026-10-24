# TASK-EXAM-PIPELINE-BOUNDARY-HARDENING-047: TKA Exam Pipeline OCR Boundary Hardening & Zero-Drop Extraction

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `extract_text.py`
  - `server/services/examPipeline.js`
  - `tests/examPipelineHardening.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Root Cause Analysis (Temuan Audit Empiris)

### Masalah 1: Soal Nomor 1 Hilang Total di Layer Ekstraksi PDF (`extract_text.py`)
1. **Penyebab:** Pada `extract_text.py` baris 27, ada filter halaman scan:
   `if len(p_strip) >= 30: final_pages.append((idx, p_strip)) else: needs_ocr.append(idx)`
   Halaman 1 `ekonomi.pdf` memiliki watermark teks berbunyi `"Soal TKA Ekonomi (Pilihan) SMA/MA/SMK Tahun 2025"` sepanjang 47 karakter.
2. **Dampak:** Karena 47 >= 30, skrip menganggap Halaman 1 **bukan scan**, sehingga Halaman 1 dilewati dari Tesseract OCR!
   Padahal seluruh isi Soal 1 ("Alih fungsi lahan pertanian...") berada di raster scan di bawah teks watermark tersebut. Soal 1 hilang total sebelum teks masuk ke AI pipeline.
3. **Solusi:** Periksa apakah halaman memiliki panjang teks rendah (<150 karakter) atau hanya berupa baris judul pendek. Jika ya, wajib gabungkan hasil OCR Tesseract agar konten soal pada raster gambar tidak hilang.

### Masalah 2: Pemotongan Chunk Membelah 1 Soal Menjadi 2 Bagian (`examPipeline.js`)
1. **Penyebab:** Di `splitDocumentIntoQuestionChunks`:
   `const splitRegex = /(?=(?:Indikator:[^\n]*\(\d+\)|Bentuk Soal\s*:|Soal No\.\s*\d+))/i;`
   Pada naskah TKA resmi, **SETIAP** butir soal memuat `Indikator: ... (N)` DAN `Bentuk Soal : Pilihan Ganda`.
2. **Dampak:** Regex ini memotong satu soal menjadi 2 part (30 soal jadi 60 potongan).
   Lalu di-batch 5 part per chunk (`CHUNK_SOAL_COUNT = 5`). Karena 5 ganjil:
   - Chunk 1 mengambil Soal 1 dan 2, plus indikator Soal 3.
   - Chunk 2 mengambil pertanyaan Soal 3 tanpa indikatornya, lalu Soal 4, plus indikator Soal 5.
   - Setiap soal bernomor ganjil terpotong lehernya di batas chunk! Akibatnya 9 soal hilang/terpotong, dan Soal 15 jatuh sebagai `ID: null`.
3. **Solusi:** Hapus `Bentuk Soal\s*:` dari split delimiter. Delimiter batas butir soal wajib unik per nomor: `Indikator:[^\n]*\(\d+\)` atau `(?:S\s+)?Hierarki\s+Indikator` atau `Soal\s+(?:No\.?\s*)?\d+` atau `^\d+[\.\)]\s+`.

### Masalah 3: Salah Klasifikasi Subtes & Urutan Nomor Teracak
1. **Penyebab:** `detectSubtes()` memprioritaskan kata kunci TPS UTBK ("harga", "persen", "tabel" -> `pengetahuan_kuantitatif`; "fungsi" -> `penalaran_matematika`).
2. **Dampak:** Dokumen naskah TKA Ekonomi dipecah-pecah ke header TPS palsu ("Pengetahuan Kuantitatif", "Penalaran Matematika"), dan nomor soal (1 s/d 30) diacak mengikuti kelompok subtes palsu tersebut.
3. **Solusi:**
   - Jika dokumen atau judul terdeteksi TKA Mapel spesifik (`/tka\s*(?:ekonomi|sosiologi|geografi|sejarah|fisika|kimia|biologi|matematika)/i`), subtes default adalah `mapel_tka`.
   - Urutkan soal selalu berdasarkan nomor urut asli kanonikal dokumen (1 s/d N), bukan diacak per subtes.

---

## 2. Spesifikasi Implementasi

### A. Perbaikan `extract_text.py`
Halaman dengan teks minimal (< 150 karakter) tetap dimasukkan ke antrean OCR atau hasil OCR digabung jika teks pdftotext tidak memiliki pola soal utuh.

### B. Perbaikan `server/services/examPipeline.js`
1. `splitDocumentIntoQuestionChunks(rawText)`:
   - Split regex HANYA membelah pada awal batas butir soal (bukan di dalam butir soal).
   - Pastikan chunking menjaga keutuhan 1 butir soal utuh: indikator, kode naskah, stimulus, pertanyaan, opsi A-E, dan tag `[Gambar: ...]`.
2. `detectSubtes(questionText, options, docTitle)`:
   - Hormati domain dokumen TKA. Jika judul memuat mata pelajaran TKA tertentu, gunakan subtes yang relevan atau `mapel_tka`.
3. Nomor Urut Kanonikal:
   - Ekstrak nomor dari `Indikator: ... (N)` jika ada, atau nomor eksplisit `1.`, `2.`.
   - Susun output akhir urut dari nomor 1 sampai selesai (30 soal).

### C. Unit Test `tests/examPipelineHardening.test.js`
Buat test suite yang memverifikasi:
1. `splitDocumentIntoQuestionChunks` tidak memecah soal di tengah jalan pada naskah TKA 30 soal.
2. Semua nomor 1 s/d 30 terekstrak tanpa ada yang bernomor `null` atau hilang.
3. Tag gambar `[Gambar: ...]` dan tabel tetap utuh di stimulus/pertanyaan yang bersangkutan.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing.
2. `npm run build` -> build sukses.

---

## 4. Execution Evidence & Audit Log (MARAKA)
- Status: `VERIFIED`
- Date: 2026-10-24
- Changes:
  1. `extract_text.py`: batas scan filter dinaikkan ke `< 150` karakter; jika pdftotext sparse, halaman tetap di-OCR Tesseract dan teks digabungkan. Soal 1 terekstrak utuh.
  2. `server/services/examPipeline.js`:
     - `splitDocumentIntoQuestionChunks`: boundary regex memotong pada `Hierarki Indikator` / `Indikator: ... (N)`, tidak membelah di `Bentuk Soal :`. Tag `[Gambar: ...]` dan kop dokumen awal tetap melekat utuh.
     - `detectSubtes`: menambahkan parameter `docTitle` dan prioritas deteksi keyword TKA Ekonomi/Sosiologi/Geografi/Sejarah sebelum parser matematika/kuantitatif TPS.
     - Nomor Urut Kanonikal: parsing nomor fallback dari indikator/pertanyaan, deduplikasi map, dan pengurutan kanonikal 1 s/d 30 pada `quizQuestions` serta `studyGuide`.
     - Export `splitDocumentIntoQuestionChunks` untuk unit testing.
  3. `tests/examPipelineHardening.test.js`:
     - Test suite memverifikasi chunking 6 butir dan 30 butir naskah TKA asli.
     - Test suite memverifikasi preservasi tag gambar `[Gambar: ...]`.
     - Test suite memverifikasi `detectSubtes` pada TKA Ekonomi.
     - Test suite memverifikasi canonical numbering sort.
- Test Verification:
  - `npm test`: 121 passing (0 failing).
  - `npm run build`: built in 472ms.
