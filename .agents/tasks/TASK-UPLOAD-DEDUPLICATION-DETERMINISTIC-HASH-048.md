# TASK-UPLOAD-DEDUPLICATION-DETERMINISTIC-HASH-048: Deterministic File Hashing & In-Flight Processing Deduplication

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `extract_text.py`
  - `server/routes/documents.js`
  - `tests/uploadDeduplication.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Root Cause Analysis
1. **Dynamic Image Paths Mutating `content_hash`:**
   - Di `extract_text.py`, `doc_base = os.path.splitext(os.path.basename(file_path))[0]`.
   - Nama file upload dari server berbasis timestamp dinamis (misal `upload_1792838521753_t4zu.pdf`), sehingga placeholder gambar di teks berbunyi `[Gambar: /uploads/exam_images/upload_1792838521753_t4zu_img-031.png]`.
   - Saat file yang persis sama diunggah ulang 30 detik kemudian, `file_path` baru menghasilkan placeholder `upload_1792838552017_pt2n_img-031.png`. Perbedaan timestamp ini mengubah SHA-256 `mergedText` secara total (`b9d733...` vs `d3fdb7...`). Content-Addressable Cache gagal mendeteksi berkas identik.
2. **Cache Hanya Mengecek `status = 'completed'`:**
   - Di `server/routes/documents.js`:
     ```sql
     SELECT * FROM documents WHERE content_hash = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1
     ```
   - Berkas naskah soal membutuhkan 2-5 menit untuk dianalisis oleh Pipeline 4-Tahap (`status = 'processing'`). Jika user melakukan re-upload saat berkas sedang diproses, server tidak menemukan cache `completed`, sehingga menyisipkan baris dokumen baru dan memicu pipeline AI kedua secara paralel.
3. **Redudansi Dokumen di DB:**
   - `doc_1792838551616_b7k6g` dan `doc_1792838582487_ejzqc` memproses naskah TKA Bahasa Indonesia yang sama persis secara paralel, membuang token dan menampilkan 2 modul kembar di beranda.

---

## 2. Spesifikasi Implementasi

### A. Deterministik Image Naming & Hashing (`extract_text.py`)
1. Jangan gunakan nama file sementara acak/timestamp sebagai nama file output gambar.
2. Hitung hash deterministik dari isi file PDF (misal 16 karakter pertama SHA-256 dari buffer file):
   `doc_hash = hashlib.sha256(open(file_path, "rb").read()).hexdigest()[:16]`
3. Beri nama file gambar: `f"pdf_{doc_hash}_img-{img_idx:03d}.png"`.
4. Dengan demikian, jika file yang sama di-upload berulang kali, tag `[Gambar: ...]` dan seluruh teks ekstraksi dijamin 100% identik bit-for-bit.

### B. In-Flight Processing Deduplication (`server/routes/documents.js`)
1. Sebelum membuat dokumen baru, cek apakah sudah ada dokumen dengan `content_hash` yang sama berstatus `processing`:
   ```javascript
   const inFlightDoc = db.prepare(
     "SELECT * FROM documents WHERE content_hash = ? AND status = 'processing' ORDER BY created_at DESC LIMIT 1"
   ).get(contentHash);
   ```
2. Jika ditemukan `inFlightDoc`, **JANGAN** insert dokumen baru dan **JANGAN** spawn worker AI kedua.
3. Segera kembalikan respons 200 dengan dokumen in-flight tersebut:
   ```javascript
   return sendJSON(res, {
     success: true,
     id: inFlightDoc.id,
     title: inFlightDoc.title,
     content: inFlightDoc.content,
     status: "processing",
     inFlight: true,
     message: "Dokumen ini sedang diproses di latar belakang."
   });
   ```
4. Bersihkan dokumen duplikat `doc_1792838582487_ejzqc` di database `tanka.sqlite` secara aman jika `doc_1792838551616_b7k6g` telah selesai atau jika belum memiliki foreign key ketergantungan.

### C. Unit Test (`tests/uploadDeduplication.test.js`)
Buat test suite yang memverifikasi:
1. File identik menghasilkan ekstraksi gambar deterministik (hash konsisten).
2. Upload berkas saat status `processing` mengembalikan referensi dokumen in-flight yang sama tanpa membuat baris baru di tabel `documents`.
3. Upload berkas saat status `completed` mengembalikan cache dokumen.

---

## 3. Verification Protocol
1. `npm test` passing.
2. `npm run build` passing.

---

## 4. Execution Evidence & Audit Record
- **Executor:** MARAKA
- **Status:** `VERIFIED`
- **Files Modified:**
  - `extract_text.py` (deterministik image naming berbasis sha256 buffer file: `pdf_{doc_hash}_img-{img_idx:03d}.png`)
  - `server/routes/documents.js` (in-flight deduplication check status = 'processing')
  - `tests/uploadDeduplication.test.js` (unit tests untuk deterministic hashing, in-flight deduplication, dan completed cache)
- **Database Cleanup:**
  - `doc_1792838582487_ejzqc` dibersihkan dari `tanka.sqlite` secara atomik di dalam transaksi: 38 concepts, 22 segments, 1 quiz, 1 document.
  - Dokumen induk `doc_1792838551616_b7k6g` (status: `completed`) tetap utuh.
- **Verification Commands & Results:**
  - `node --test tests/uploadDeduplication.test.js`: 3/3 passed (235ms)
  - `npm test`: 129/129 passed (17.3s)
  - `npm run build`: Vite build passing (0 errors, 400ms)

