# TASK-OCR-IMAGE-POSITIONING-FILTER-HARDENING-052: Accurate Visual Illustration Extraction, Dense Prose Rejection & Contextual Placement

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `extract_text.py`
  - `server/services/examPipeline.js`
  - `tests/imageExtractionHardening.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & Root Cause

### Masalah 1: Ilustrasi Nyata Soal 9 (Pak Wayan & Pantai Bersih) Dibuang
1. Pada Halaman 6 PDF Bahasa Indonesia, terdapat karya ilustrasi penting berukuran 871×638 pixel (Pak Wayan duduk murung di samping papan "PANTAI BERSIH TANPA SAMPAH" sementara turis berselfie). Ilustrasi ini menjadi stimulus visual utama untuk Soal 9 s.d. 11.
2. Di `extract_text.py`:
   - `is_pure_art = len(img_ocr_text) <= 5`
   - Karena OCR membaca teks spanduk ("PANTAI BERSIH TANPA SAMPAH") dan kop wacana (total ~114 karakter), panjang teks > 5, sehingga `is_pure_art` menjadi `false`.
   - Dan karena tidak ada kata "grafik/tabel", gambar dibuang mentah-mentah.

### Masalah 2: Teks Wacana Soal 12 Lolos Sebagai Gambar & Menempel di Soal 11
1. Pada Halaman 8 PDF, naskah memuat Soal 11 di bagian atas, dan awal wacana Soal 12 s.d. 14 ("Pulihkan Ekosistem") di bagian bawah. Di file Word aslinya, wacana Soal 12 berupa potongan gambar raster (`img-031`).
2. Di wacana Soal 12 terdapat kalimat: *"Kementerian Lingkungan Hidup dan Kehutanan (KLHK) menyatakan bahwa..."*.
3. Di `extract_text.py` baris 147:
   `has_explicit_heading = any(re.search(rf"\b{kw}\b", img_ocr_text, re.I) for kw in [..., "kementerian", ...])`
   Kata `"kementerian"` menyebabkan `has_explicit_heading` menjadi `true`. Gambar potongan teks wacana Soal 12 ini lolos sebagai gambar!
4. Lalu di baris 188 `extract_text.py`:
   Skrip menempelkan `[Gambar: ...img-031.png]` **di baris paling atas Halaman 8**. Karena Soal 11 berada di puncak Halaman 8, tag gambar wacana Soal 12 tertempel ke badan Soal 11.

---

## 2. Spesifikasi Implementasi

### A. Perbaikan Filter Gambar di `extract_text.py`
1. **Hapus Keyword Sembrono**:
   - Hapus kata `"kementerian"`, `"urbanisasi"` dari daftar `has_explicit_heading`. Keyword visual sah HANYA:
     `"grafik"`, `"diagram"`, `"tabel"`, `"kurva"`, `"bagan"`, `"infografis"`, `"peta"`, `"kartun"`, `"karikatur"`, `"ilustrasi"`.
2. **Tolak Raster Wacana Teks Padat (Dense Prose Rejection)**:
   - Hitung rasio kepadatan teks: jika `len(img_ocr_text) > 200` dan teks berupa kalimat/paragraf narasi biasa (memuat konjungsi/paragraf tanpa tabel/angka sumbu grafik), gambar tersebut adalah teks wacana bacaan yang ter-rasterize, **BUKAN ilustrasi visual**. Tolak (return `None`).
3. **Terima Ilustrasi / Poster Wacana**:
   - Gambar berdimensi besar (lebar >= 400 dan tinggi >= 200) dengan kepadatan teks rendah (< 0.0008 karakter per pixel) atau memuat poster slogan ("PANTAI BERSIH TANPA SAMPAH") wajib diterima sebagai ilustrasi visual (`is_illustration = True`).

### B. Contextual Placement (Penempatan Posisi Gambar yang Presisi)
1. Jangan membabi-buta menempelkan `[Gambar: ...]` di baris pertama halaman (`p_txt = f"[Gambar: ...]\n\n" + p_txt`).
2. Jika teks OCR gambar memuat frasa judul/heading yang ada di halaman (contoh: `Teks “Pantai Bersih Tanpa Sampah” untuk soal nomor 9 s.d. 11`):
   - Sisipkan `[Gambar: ...]` tepat di bawah atau di atas heading wacana tersebut di `p_txt`.
3. Jika tidak ada kecocokan teks:
   - Gunakan metadata koordinat vertikal (Y / top) dari `pdftohtml -xml` atau urutan index gambar di halaman.
   - Jika gambar berada di bagian bawah halaman (`top > page_height * 0.5`), tempelkan di bagian bawah teks halaman, bukan di puncak halaman.

### C. Sinkronisasi Database Tanka (`tanka.sqlite`)
1. Perbarui data kuis pada dokumen `doc_1792838551616_b7k6g` (TKA Bahasa Indonesia Wajib):
   - Pasang gambar asli Pak Wayan (`..._img-020.png` atau `pdf_..._img-020.png`) pada wacana Soal 9 s.d. 11.
   - Bersihkan tag gambar salah `_img-031.png` dari Soal 11 (hapus `imageUrl` salah dan hapus teks `[Gambar: ...img-031.png]` dari pertanyaan Soal 11).

### D. Unit Test (`tests/imageExtractionHardening.test.js`)
Buat test suite yang memverifikasi:
1. `extract_text.py` berhasil mengekstrak ilustrasi pantai Pak Wayan (`img-020`) sebagai visual valid.
2. `extract_text.py` menolak `img-031` (teks wacana KLHK) dan tidak menjadikannya tag gambar.
3. Tag gambar disisipkan sesuai wacana yang relevan, bukan menempel di puncak halaman yang salah.

---

## 3. Verification Protocol
1. `npm test` passing (140+ passing).
2. `npm run build` passing.

---

## 4. Implementation & Verification Evidence (MARAKA)
- Status: `VERIFIED`
- Executor: MARAKA (`maraka`)
- Changes:
  1. `extract_text.py`:
     - Menghapus keyword sembrono `"kementerian"` dan `"urbanisasi"`. Keyword visual sah: `"grafik"`, `"diagram"`, `"tabel"`, `"kurva"`, `"bagan"`, `"infografis"`, `"peta"`, `"kartun"`, `"karikatur"`, `"ilustrasi"`.
     - Implementasi Dense Prose Rejection: raster teks padat (>200 karakter dengan konjungsi/paragraf dan tanpa tabel/simbol grafik) ditolak (`return None`). Menolak `img-031` (KLHK wacana).
     - Implementasi Penerimaan Ilustrasi: dimensi besar (w >= 400 & h >= 200) dengan kepadatan teks rendah (< 0.0008 karakter/pixel) atau slogan pantai bersih diterima (`img-020` Pak Wayan).
     - Implementasi Contextual Placement: membaca koordinat `pdftohtml -xml` dan mencocokkan heading wacana halaman untuk menyisipkan tag gambar tepat di bawah heading wacana (Soal 9 s.d. 11), atau di bagian bawah teks jika `top > page_height * 0.5`.
  2. `server/services/examPipeline.js`:
     - Membersihkan tag raw `[Gambar: ...]` dari teks pertanyaan kuis pada saat mapping format Tanka.
  3. `tanka.sqlite`:
     - Memperbarui dokumen `doc_1792838551616_b7k6g`: memasang `pdf_1cc27a2ed4b661ea_img-020.png` pada Soal 9 s.d. 11 wacana.
     - Membersihkan `img-031.png` dari `imageUrl` dan dari teks pertanyaan Soal 11.
  4. `tests/imageExtractionHardening.test.js`:
     - Menambahkan 5 unit test mencakup visual keyword check, heuristic filter test (Wayan vs KLHK), contextual placement test, extract_pdf test bindo_wajib.pdf, dan sinkronisasi SQLite.
- Verification Results:
  - `npm test`: 145 passing (100% PASS).
  - `npm run build`: Vite build sukses dalam 497ms.

