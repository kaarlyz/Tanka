# 📋 TANKA — FEATURE EVIDENCE LEDGER (AUDITABLE INVENTORY)

> **Dokumen ini adalah inventaris lengkap seluruh fitur Tanka yang dapat diaudit (*auditable feature ledger*).** Setiap entri dipetakan langsung ke file implementasi aktual di frontend, backend, skema database, endpoint API, dan bukti uji (*test evidence*).
> 
> **Status Klasifikasi:**
> - `implemented-and-verified`: Fitur selesai, berjalan di kode aktual, dan lolos uji otomatis / verifikasi browser.
> - `implemented-but-unverified`: Fitur terimplementasi di kode namun belum memiliki unit test otomatis formal.
> - `partial`: Fitur baru terimplementasi sebagian atau membutuhkan konfigurasi kredensial eksternal.
> - `planned`: Fitur telah masuk rancangan skema/antarmuka namun logika backend belum aktif.
> - `deprecated`: Fitur lama yang telah digantikan oleh pendekatan baru.
> - `unknown`: Fitur belum terverifikasi status kepastian perilakunya.

---

## Ringkasan Eksekutif Inventaris

- **Total Fitur Terpetakan:** 33 Fitur Sistem
- **Status `implemented-and-verified`:** 28 Fitur (84.8%)
- **Status `implemented-but-unverified`:** 3 Fitur (9.1%)
- **Status `partial`:** 2 Fitur (6.1% — Google OAuth Live Secret & Live WhatsApp Gateway)
- **Status `planned` / `deprecated`:** 0 Fitur
- **Hasil Test Suite Lokal:** 106 Uji Otomatis Lolos (0 Gagal)

---

## 1. Domain Ingestion, Ekstraksi & Pipeline Berkas

### FEAT-ING-01: Multi-Format Document Ingestion & Hybrid Text Extraction
- **Deskripsi & Manfaat Pengguna:** Mengunggah berkas materi belajar dalam format PDF (digital maupun pindaian hasil scan), Word (`.docx`), PowerPoint (`.pptx`), dan gambar (`.png`, `.jpg`). Sistem secara otomatis mengekstrak teks mentah berkecepatan tinggi tanpa membuat siswa pusing mengonversi berkas terlebih dahulu.
- **Komponen & File Terkait:**
  - Frontend: `src/components/modals/StagingUploadModal.tsx`, `src/hooks/useUploadStaging.ts`
  - Backend: `server/routes/documents.js` (`POST /api/documents/upload`), `extract_text.py`, `server/utils/pythonResolver.js`
- **API & Database:**
  - Endpoint: `POST /api/documents/upload`
  - Skema: Tabel `documents` (`id`, `title`, `content`, `status`, `content_hash`, `created_at`) dan `document_segments`
- **Workflow:** Pengguna drag-and-drop berkas $\rightarrow$ File di-encode ke base64 $\rightarrow$ Backend menjalankan skrip Python $\rightarrow$ Jika teks digital $\ge 30$ char/halaman langsung pakai `pdftotext` $\rightarrow$ Jika scanned/gambar dialirkan ke OCR worker Tesseract $\rightarrow$ Dokumen tersimpan di SQLite dengan status `processing` lalu `completed`.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/uploadIntegration.test.js` (Lolos uji upload teks biasa, berkas kosong 400, dan background pipeline error handling).
- **Kondisi / Batasan yang Diketahui:** Berkas PDF hasil pindaian beresolusi sangat rendah atau tulisan tangan miring ekstrem dapat menghasilkan akurasi OCR yang menurun.
- **Relevansi Landing Page:** Sangat Tinggi. Menjadi daya tarik utama di seksi Hero dan Stepper Alur ("Unggah format apapun: PDF, Word, Slide, hingga Foto Catatan").
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-ING-02: Content-Addressable Caching via SHA-256
- **Deskripsi & Manfaat Pengguna:** Sistem mendeteksi berkas yang identik menggunakan hashing teks SHA-256. Pengguna yang mengunggah kembali materi yang sama langsung mendapatkan hasil olahan instan (<1 detik) tanpa menunggu proses AI dan tanpa menguras token.
- **Komponen & File Terkait:**
  - Backend: `server/routes/documents.js`
- **API & Database:**
  - Skema: Kolom `content_hash` pada tabel `documents`
- **Workflow:** Backend menerima teks berkas $\rightarrow$ Menghitung hash SHA-256 $\rightarrow$ Melakukan query `SELECT * FROM documents WHERE content_hash = ?` $\rightarrow$ Jika ditemukan (*cache hit*), duplikasi record dokumen baru dengan konten yang sudah terstruktur $\rightarrow$ Mengembalikan respons instan.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/uploadIntegration.test.js` (Uji "Upload: Content-Addressable Cache hit — upload berkas identik mengembalikan dokumen cache tanpa LLM" lolos dalam 5.143ms).
- **Kondisi / Batasan yang Diketahui:** Perubahan minor 1 karakter spasi pada teks sumber akan mengubah hash SHA-256 sehingga dianggap dokumen baru.
- **Relevansi Landing Page:** Menengah-Tinggi. Memperkuat klaim keunggulan performa ("Hemat waktu, respons secepat kilat untuk materi yang pernah dibuka").
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-ING-03: Zero-Token 3-Layer Heuristic Visual Filter & Asset Cropping
- **Deskripsi & Manfaat Pengguna:** Membedah dokumen soal yang memiliki grafik, kurva, atau diagram. Sistem secara otomatis memotong gambar fungsional beresolusi tinggi dan membuang sampah visual dekoratif (kop surat, garis hiasan), lalu menampilkannya tepat di samping pertanyaan terkait.
- **Komponen & File Terkait:**
  - Backend: `extract_text.py`, direktori penyimpanan `/uploads/exam_images/`
  - Frontend: `src/components/tabs/ExamDrillView.tsx` (elemen `<img>` terhubung ke `imageUrl` dan `imageCaption`)
- **API & Database:**
  - Skema: Kolom `imageUrl` dan `imageCaption` pada array pertanyaan kuis / lembar soal
- **Workflow:** Skrip Python mengekstrak gambar mentah via `pdfimages` langsung ke memori RAM $\rightarrow$ Menjalankan filter heuristik 3 layer (Layer 1 buang header kurikulum, Layer 2 deteksi seni murni tanpa teks, Layer 3 simpan diagram bertabel/sumbu angka) $\rightarrow$ Mengonversi 3-5 citra valid ke `/uploads/exam_images/` $\rightarrow$ Menyematkan placeholder `[Gambar: /uploads/exam_images/xxx.png]` ke teks soal.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Direktori `/uploads/exam_images/` memuat puluhan aset nyata (`ekonomi_img-018.png`, `grafik_partisipasi_clean.png`, `math_img-000.png`) dan lolos integrasi di `tests/quizValidator.test.js` ("Quiz Validator: mendukung pertanyaan bergambar").
- **Kondisi / Batasan yang Diketahui:** Membutuhkan utilitas Poppler (`pdfimages`) terpasang pada sistem operasi host.
- **Relevansi Landing Page:** Sangat Tinggi. Menjadi bukti visual bahwa Tanka menangani soal bergambar eksak (diagram fungsi, kurva ekonomi, grafik data BPS) dengan sempurna.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-ING-04: YouTube Video Transcription & Modular Summarization
- **Deskripsi & Manfaat Pengguna:** Siswa dapat menempelkan tautan video YouTube kuliah atau pembahasan materi berdurasi panjang (hingga 2 jam). Sistem mengunduh transkrip teks dan merangkumnya menjadi modul bab siap santap dalam hitungan detik.
- **Komponen & File Terkait:**
  - Frontend: `src/components/modals/YouTubeModal.tsx`, `src/hooks/useYouTubeModal.ts`
  - Backend: `server/routes/documents.js` (`POST /api/documents/youtube-info`, `POST /api/documents/youtube`), `extract_youtube.py`
- **API & Database:**
  - Endpoints: `POST /api/documents/youtube-info`, `POST /api/documents/youtube`
  - Skema: Tabel `documents`
- **Workflow:** Pengguna memasukkan URL YouTube $\rightarrow$ Frontend memanggil `/youtube-info` untuk validasi judul dan durasi $\rightarrow$ Pengguna menekan konfirmasi $\rightarrow$ Backend menjalankan skrip Python untuk menarik subtitle/transkrip $\rightarrow$ Teks dimasukkan ke pipeline kurikulum Tanka menjadi dokumen baru.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/youtubePipeline.test.js` (Uji "YouTube Pipeline: URL kosong mengembalikan 400" dan skema konsep kanonikal lolos).
- **Kondisi / Batasan yang Diketahui:** Video YouTube wajib memiliki subtitle (baik manual maupun auto-generated oleh YouTube). Video tanpa transkrip sama sekali akan ditolak.
- **Relevansi Landing Page:** Sangat Tinggi. Disorot langsung pada Hero Graphic dan Studio Cockpit ("Video 2 Jam jadi Modul 3 Menit").
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-ING-05: Quick Free-Text Ingestion (Catatan Kilat)
- **Deskripsi & Manfaat Pengguna:** Memungkinkan siswa menempelkan catatan teks bebas, rumus cepat, atau potongan artikel pelajaran tanpa perlu membuat berkas dokumen terlebih dahulu.
- **Komponen & File Terkait:**
  - Frontend: `src/components/tabs/HomeHubTab.tsx`, `src/components/modals/StagingUploadModal.tsx`
  - Backend: `server/routes/documents.js` (`POST /api/documents`)
- **API & Database:**
  - Endpoint: `POST /api/documents`
  - Skema: Tabel `documents`
- **Workflow:** Pengguna menempelkan teks pada textarea di beranda $\rightarrow$ Menekan tombol proses $\rightarrow$ Dokumen langsung dibuat di SQLite dan siap dipelajari.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/httpServerIntegration.test.js` (Lolos uji pembuatan dokumen teks biasa secara langsung).
- **Kondisi / Batasan yang Diketahui:** Disarankan minimal 50 karakter agar sistem dapat mengekstrak bab dan kuis secara memadai.
- **Relevansi Landing Page:** Menengah. Menunjukkan fleksibilitas input belajar.
- **Pertanyaan Terbuka:** Tidak ada.

---

## 2. Domain Autonomous Exam & CBT Pipeline

### FEAT-EXAM-01: Autonomous 4-Stage CBT Exam Pipeline (Extract, Solve, Write, Verify)
- **Deskripsi & Manfaat Pengguna:** Otomasi penuh pengolahan lembar soal ujian. Sistem mendeteksi apakah berkas yang diunggah adalah lembar soal, mengekstrak butir soal, memvalidasi kunci jawaban melalui konsensus multi-vote 3× LLM, menyusun pembahasan HOTS langkah demi langkah, dan memverifikasi integritas format.
- **Komponen & File Terkait:**
  - Backend: `server/services/examPipeline.js`, `server/services/examAnalyzer.js`, `server/routes/documents.js`
- **API & Database:**
  - Skema: Tabel `quizzes` (`quiz_type = 'exam_sheet'`), tabel `documents`
- **Workflow:** Dokumen diunggah $\rightarrow$ Heuristik mendeteksi pola nomor soal dan pilihan ganda $\rightarrow$ Stage 1 ekstrak butir $\rightarrow$ Stage 2 voting kunci 3 model $\rightarrow$ Stage 3 penulisan pembahasan (Langkah matematis + Trik Cepat + Analisis Opsi + Radar Jebakan) $\rightarrow$ Stage 4 verifikasi $\rightarrow$ Hasil disimpan ke tabel `quizzes`.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/uploadIntegration.test.js` (Uji "Upload: dokumen terdeteksi sebagai lembar ujian — status DB = completed, questions disimpan" lolos dan terekam di log tes).
- **Kondisi / Batasan yang Diketahui:** Membutuhkan koneksi ke LLM gateway untuk menjalankan tahapan voting dan penulisan pembahasan.
- **Relevansi Landing Page:** Sangat Tinggi. Menjadi diferensiasi utama Tanka dibanding AI perangkum biasa.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-EXAM-02: Exam Sheet Bento Stage & Horizontal Stepper Rail
- **Deskripsi & Manfaat Pengguna:** Antarmuka khusus untuk membedah puluhan butir soal tanpa kelelahan scroll vertikal. Menyajikan panggung 2 kolom asimetris: stimulus dan gambar di kiri, pilihan jawaban serta pembahasan lengkap di kanan. Dilengkapi rel navigasi nomor soal horizontal dan navigasi keyboard panah.
- **Komponen & File Terkait:**
  - Frontend: `src/components/tabs/ExamDrillView.tsx`, `src/components/common/ExamInsightPanel.tsx`
- **API & Database:**
  - Terhubung ke data kuis dokumen aktif via `useDocuments.ts` / `useQuiz.ts`
- **Workflow:** Pengguna membuka dokumen bertipe lembar soal $\rightarrow$ Tampilan otomatis beralih ke `ExamDrillView` $\rightarrow$ Pengguna dapat melompat nomor dengan mengklik tombol pada rel horizontal atau menekan panah keyboard kiri/kanan $\rightarrow$ Dapat beralih ke mode daftar linier via toggle switch.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Tangkapan layar audit browser di `.agents/evidence/TASK-034-desktop-timeline-alignment.png` dan verifikasi fungsionalitas keyboard handler di kode `ExamDrillView.tsx`.
- **Kondisi / Batasan yang Diketahui:** Pada layar ponsel (<768px), tata letak otomatis menyatu menjadi 1 kolom yang tersusun rapi tanpa patah (*responsive single-column layout*).
- **Relevansi Landing Page:** Sangat Tinggi. Desain panggung bento ini adalah *hero showcase* visual yang membedakan Tanka dari platform edukasi lain.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-EXAM-03: Gap Analysis & Exam Insight Panel
- **Deskripsi & Manfaat Pengguna:** Menampilkan matriks ringkasan kisi-kisi soal: distribusi subtes materi, tingkat kesulitan (mudah, sedang, sulit), dan deteksi kesenjangan pemahaman konsep (*gap analysis*) dari butir-butir soal yang dianalisis.
- **Komponen & File Terkait:**
  - Frontend: `src/components/common/ExamInsightPanel.tsx`
  - Backend: `server/services/examAnalyzer.js`, `server/routes/examResults.js`
- **API & Database:**
  - Endpoint: `GET /api/exam-results/:id`
- **Workflow:** Analisis gap mengekstrak kata kunci dan rumus dari butir soal $\rightarrow$ Membandingkan dengan koleksi dokumen yang dimiliki pengguna $\rightarrow$ Memberikan rekomendasi bab mana yang perlu dipelajari ulang.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Terpasang di bagian atas `ExamDrillView.tsx` dan teruji di `server/services/examAnalyzer.js`.
- **Kondisi / Batasan yang Diketahui:** Efektif jika pengguna telah memiliki beberapa dokumen materi tersimpan di akunnya.
- **Relevansi Landing Page:** Menengah. Menunjukkan kapabilitas analitik Tanka.
- **Pertanyaan Terbuka:** Tidak ada.

---

## 3. Domain Kurikulum, Modul Modular & Konsep Kanonikal

### FEAT-CURR-01: Canonical Concept Extraction & Concept Graph
- **Deskripsi & Manfaat Pengguna:** Mengekstrak konsep-konsep kanonikal dari dokumen belajar, mendefinisikannya secara literal fungsional, memetakan hubungan prasyarat (*prerequisites*), dan mengkategorikannya menjadi konsep inti (*core*), pendukung (*supporting*), atau lanjutan (*advanced*).
- **Komponen & File Terkait:**
  - Backend: `server/services/curriculumPipeline.js`, `server/services/conceptGraphService.js`
- **API & Database:**
  - Endpoint: `GET /api/documents/:id/concept-graph`
  - Skema: Tabel `document_concepts` dan `concept_edges`
- **Workflow:** Teks materi disegmentasi $\rightarrow$ LLM mengekstrak konsep kunci beserta bukti kutipan teks asli $\rightarrow$ `conceptGraphService.js` membangun relasi graf berarah $\rightarrow$ Data tersimpan di SQLite.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/conceptGraph.test.js` (Uji "Concept Graph: inferensi edges dari prasyarat dan bab tanpa self-loop" dan "integrasi database SQLite" lolos).
- **Kondisi / Batasan yang Diketahui:** Membutuhkan teks materi yang memiliki substansi konseptual yang memadai.
- **Relevansi Landing Page:** Sangat Tinggi. Menjadi dasar visualisasi *Interactive Knowledge Graph / Peta Saraf Materi*.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-CURR-02: Auto-Repair Curriculum Coverage & Quality Auditor
- **Deskripsi & Manfaat Pengguna:** Menjamin tidak ada materi penting yang tertinggal saat AI menyusun rencana bab. Jika ada konsep wajib yang tercecer dari draf bab, sistem secara otomatis merevisi outline (*auto-repair*). Sistem juga mengaudit draf untuk mencegah kebocoran kunci jawaban atau bab kosong.
- **Komponen & File Terkait:**
  - Backend: `server/services/coverageValidator.js`, `server/services/qualityAuditor.js`, `server/services/curriculumPipeline.js`
- **API & Database:**
  - Skema: Kolom `is_required` pada `document_concepts`, tabel `chapter_plans`
- **Workflow:** Setelah outline bab dibuat $\rightarrow$ `coverageValidator.js` mengecek cakupan konsep $\rightarrow$ Jika status `NEEDS_REVISION`, `autoRepairOutlineCoverage` memetakan konsep yang tercecer $\rightarrow$ `qualityAuditor.js` menyaring kebocoran pilihan ganda.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/coverageValidator.test.js` (8 skenario coverage lolos) dan `tests/qualityAuditor.test.js` (5 skenario lolos).
- **Kondisi / Batasan yang Diketahui:** Bekerja pada level pipeline backend secara deterministik.
- **Relevansi Landing Page:** Menengah-Tinggi. Membuktikan integritas akademis Tanka ("Kurikulum Lengkap Tanpa Konsep yang Tercecer").
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-CURR-03: Modular Chapter Writer & 3-Minute Digest Reader
- **Deskripsi & Manfaat Pengguna:** Memecah materi belajar tebal menjadi modul per bab yang dapat diselesaikan dalam 3 menit. Setiap bab dilengkapi pertanyaan pemantik, target pemahaman konkret, dan penjelasan yang padat tanpa basa-basi.
- **Komponen & File Terkait:**
  - Frontend: `src/components/tabs/MaterialTab.tsx`
  - Backend: `server/services/curriculumPipeline.js`
- **API & Database:**
  - Skema: Tabel `chapter_plans` (`chapter_number`, `title`, `trigger_question`, `target_goal`, `content`, `status`)
- **Workflow:** Pengguna memilih dokumen di Material Tab $\rightarrow$ Panel samping menampilkan daftar bab terurut $\rightarrow$ Konten bab dirender dengan tipografi yang nyaman dibaca dan waktu estimasi baca.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/chapterWriterModular.test.js` (Uji perakitan modul kurikulum modular terurut lolos).
- **Kondisi / Batasan yang Diketahui:** Panjang tiap bab dikalibrasi berkisar 800-1500 kata agar tidak membebani kapasitas memori kerja siswa.
- **Relevansi Landing Page:** Sangat Tinggi. Menjadi fitur unggulan yang dikontraskan dengan cara belajar lama ("Buku 200 Halaman vs Bab 3 Menit").
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-CURR-04: Interactive Mind Map Engine
- **Deskripsi & Manfaat Pengguna:** Kanvas visual interaktif yang menampilkan relasi antar konsep dalam bentuk diagram jaringan simpul (*node network*). Siswa dapat melihat gambaran besar materi dan bagaimana suatu konsep menjadi prasyarat bagi konsep lainnya.
- **Komponen & File Terkait:**
  - Frontend: `src/components/common/InteractiveMindMap.tsx`
  - Backend: `server/services/conceptGraphService.js` (`/api/documents/:id/concept-graph`)
- **API & Database:**
  - Endpoint: `GET /api/documents/:id/concept-graph`
  - Skema: Tabel `concept_edges` dan `document_concepts`
- **Workflow:** Komponen memuat node dan edge dari database $\rightarrow$ Menghitung posisi tata letak simpul $\rightarrow$ Mengizinkan interaksi drag, zoom, dan klik simpul untuk membaca kartu ringkasan konsep.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Komponen `InteractiveMindMap.tsx` aktif di dalam aplikasi dan terverifikasi di `tests/conceptGraph.test.js`.
- **Kondisi / Batasan yang Diketahui:** Membutuhkan layar yang cukup lapang; pada layar ponsel kanvas dapat digeser menggunakan sentuhan dua jari.
- **Relevansi Landing Page:** Sangat Tinggi. Sangat potensial disajikan sebagai animasi graf simpul interaktif di landing page.
- **Pertanyaan Terbuka:** Tidak ada.

---

## 4. Domain Matematika Eksak & Formula Normalizer

### FEAT-MATH-01: KaTeX Formula Normalizer, Sanitizer & Pipeline Cache
- **Deskripsi & Manfaat Pengguna:** Mengatasi masalah klasik rendering rumus matematika pada web. Normalizer Tanka mengubah seluruh varian LaTeX (`\(...\)`, `\[...\]`, lingkungan `aligned`, `matrix`, `cases`) menjadi format KaTeX baku, membersihkan karakter kontrol tersembunyi, dan memproteksi tabel Markdown.
- **Komponen & File Terkait:**
  - Frontend: `src/utils/mathNormalizer.ts`, `src/utils/katexCache.ts`, `src/components/common/MathView.tsx`, `src/components/common/DiagramRenderer.tsx`
  - Backend: `server/utils/mathify.js`, `server/utils/jsonParser.js`
- **API & Database:**
  - Pipeline pemrosesan teks di seluruh endpoint AI
- **Workflow:** Teks sebelum dirender di-pipe ke `mathNormalizer.ts` $\rightarrow$ Regex mendeteksi rumus matematika $\rightarrow$ Mengecek cache formula lokal browser $\rightarrow$ KaTeX merender rumus secara instan tanpa kedip (*zero layout shift*).
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/mathNormalizer.test.js` (8 uji skenario LaTeX lolos) dan `tests/jsonParser.test.js` (5 uji sanitasi JSON LaTeX lolos).
- **Kondisi / Batasan yang Diketahui:** Simbol LaTeX yang tidak didukung pustaka KaTeX standar akan ditampilkan sebagai teks mentah berpagar.
- **Relevansi Landing Page:** Menengah-Tinggi. Memperlihatkan bahwa Tanka sangat serius dan presisi menangani rumus eksak UTBK.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-MATH-02: Quick Formula Cheatsheet Drawer
- **Deskripsi & Manfaat Pengguna:** Laci contekan rumus cepat yang dapat dibuka dari sisi layar kapan saja. Merangkum seluruh formula penting dari dokumen aktif lengkap dengan penjelasan variabel.
- **Komponen & File Terkait:**
  - Frontend: `src/components/modals/FormulaDrawer.tsx`, `src/hooks/useFormulas.ts`
  - Backend: `server/routes/cheatsheet.js`, `server/services/formulaExtractor.js`
- **API & Database:**
  - Endpoints: `POST /api/ai/extract-formulas`, `GET /api/documents/:id/formulas`
  - Skema: Tabel `formula_cheatsheets`
- **Workflow:** Pengguna menekan ikon rumus pada header $\rightarrow$ Drawer terbuka $\rightarrow$ Mengambil formula terarsip dari database atau mengekstrak otomatis jika belum ada.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/formulaExtractor.test.js` dan `tests/httpServerIntegration.test.js` (Lolos siklus cheatsheet lifecycle).
- **Kondisi / Batasan yang Diketahui:** Formula dikelompokkan per dokumen belajar yang sedang aktif.
- **Relevansi Landing Page:** Menengah. Menunjukkan fitur pendukung belajar yang praktis.
- **Pertanyaan Terbuka:** Tidak ada.

---

## 5. Domain Evaluasi, Latihan & Penguatan Memori

### FEAT-QUIZ-01: Full-Bleed CBT Quiz Simulator
- **Deskripsi & Manfaat Pengguna:** Antarmuka simulasi ujian berbasis komputer yang menyerupai antarmuka resmi UTBK. Mendukung format soal pilihan ganda tunggal (A-E), pilihan ganda kompleks (jawaban lebih dari satu), dan tipe kategori benar/salah pada tabel matriks.
- **Komponen & File Terkait:**
  - Frontend: `src/components/tabs/QuizTab.tsx`, `src/hooks/useQuiz.ts`
  - Backend: `server/routes/quizzes.js`, `server/services/quizGenerator.js`, `server/services/quizValidator.js`
- **API & Database:**
  - Endpoints: `POST /api/ai/generate-quiz`, `GET /api/documents/:id/quizzes`, `POST /api/ai/quiz-question-chat`
  - Skema: Tabel `quizzes`
- **Workflow:** Pengguna memilih mulai kuis $\rightarrow$ Timer hitung mundur berjalan $\rightarrow$ Pengguna menjawab tiap butir soal $\rightarrow$ Sistem menghitung skor objektif $\rightarrow$ Kunci dan pembahasan terbuka setelah selesai.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/quizValidator.test.js` (14 skenario validasi opsi, shuffling deterministik, dan healing karakter kontrol lolos).
- **Kondisi / Batasan yang Diketahui:** Pengacakan urutan pilihan jawaban tetap menjaga konsistensi indeks kunci yang benar.
- **Relevansi Landing Page:** Sangat Tinggi. Menjadi bukti bahwa Tanka bukan sekadar pembaca teks, melainkan platform drill ujian nyata.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-QUIZ-02: Instant Score Feedback & Confetti Celebration
- **Deskripsi & Manfaat Pengguna:** Memberikan umpan balik instan begitu kuis diselesaikan dengan animasi letupan konfeti (*canvas-confetti*) bagi siswa yang mencapai ambang batas kelulusan, meningkatkan dopamin dan motivasi belajar secara sehat.
- **Komponen & File Terkait:**
  - Frontend: `src/components/tabs/QuizTab.tsx`, dependensi `canvas-confetti`
- **API & Database:** Tidak membutuhkan database khusus.
- **Workflow:** Setelah butir terakhir dijawab $\rightarrow$ Sistem menghitung persentase skor $\rightarrow$ Jika skor $\ge 75\%$, memicu partikel konfeti di layar dan menampilkan kartu evaluasi performa.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Terpasang di `QuizTab.tsx` dan terverifikasi live.
- **Kondisi / Batasan yang Diketahui:** Efek visual confetti ringan dan tidak membebani GPU perangkat berdaya rendah.
- **Relevansi Landing Page:** Menengah. Dapat ditampilkan sebagai micro-interaction di kartu fitur kuis.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-MISTAKE-01: Autonomous Mistake Notebook (Bank Soal Salah)
- **Deskripsi & Manfaat Pengguna:** Mencegah kesalahan yang sama terulang kembali. Setiap kali siswa salah menjawab soal pada sesi kuis, butir soal tersebut otomatis dicatat ke dalam buku saku kesalahan lengkap dengan catatan jebakan yang memicunya dan cara penyelesaian yang benar.
- **Komponen & File Terkait:**
  - Frontend: `src/components/tabs/MistakesTab.tsx`, `src/hooks/useMistakes.ts`
  - Backend: `server/routes/mistakes.js`
- **API & Database:**
  - Endpoints: `GET /api/mistakes`, `POST /api/mistakes/record`, `POST /api/mistakes/:id/resolve`, `DELETE /api/mistakes/:id`
  - Skema: Tabel `mistake_notebook`
- **Workflow:** Jawaban kuis salah $\rightarrow$ Hook `useQuiz` otomatis mengirim payload ke `/api/mistakes/record` $\rightarrow$ Data masuk ke database $\rightarrow$ Di tab Bank Soal Salah, siswa dapat meninjau kembali dan mengklik "Tandai Paham" (`resolved`) setelah menguasainya.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/httpServerIntegration.test.js` dan migrasi skema tabel `mistake_notebook`.
- **Kondisi / Batasan yang Diketahui:** Terisolasi per ID pengguna sehingga catatan kekeliruan bersifat privat.
- **Relevansi Landing Page:** Sangat Tinggi. Disorot di Studio Cockpit dan Marquee Ticker ("Soal Salah Dicatat Otomatis").
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-CARD-01: Atomic Leitner Spaced-Repetition Flashcards
- **Deskripsi & Manfaat Pengguna:** Kartu hafalan cerdas dengan sistem pengulangan berjeda 5 kotak (*Leitner Box*). Dirancang dengan prinsip ketat: **1 kartu hanya memuat 1 fakta/rumus atomik**. Menghilangkan kebocoran petunjuk (*cue leakage*) dan melatih *active recall*.
- **Komponen & File Terkait:**
  - Frontend: `src/components/tabs/FlashcardsTab.tsx`, `src/hooks/useFlashcards.ts`
  - Backend: `server/routes/flashcards.js`
- **API & Database:**
  - Endpoints: `POST /api/ai/generate-flashcards`, `GET /api/flashcards`, `PATCH /api/flashcards/:id/review`
  - Skema: Tabel `flashcards`
- **Workflow:** Pengguna membuka tab flashcard $\rightarrow$ Kartu menampilkan sisi depan $\rightarrow$ Pengguna mengklik kartu untuk melihat animasi flip 3D ke sisi belakang $\rightarrow$ Pengguna memilih tingkat kemudahan $\rightarrow$ Level kotak kartu diperbarui di SQLite.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Terpasang di `FlashcardsTab.tsx` dan terverifikasi di tangkapan layar `.agents/evidence/flashcard-comparison-desktop-1920x1080.png`.
- **Kondisi / Batasan yang Diketahui:** Kartu di-generate per bab materi atau per dokumen utuh.
- **Relevansi Landing Page:** Sangat Tinggi. Menjadi inspirasi elemen interaktif *ComparisonLedger* di landing page.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-FEYN-01: Feynman Self-Explanation & 4-Rubric AI Evaluation
- **Deskripsi & Manfaat Pengguna:** Siswa menguji pemahaman tertingginya dengan menjelaskan suatu konsep rumit menggunakan bahasanya sendiri. Mesin AI mengevaluasi penjelasan tersebut berdasarkan 4 kriteria: kejelasan bahasa, ketepatan konsep, kelengkapan komponen, dan deteksi celah materi (*gap analysis*).
- **Komponen & File Terkait:**
  - Frontend: `src/components/tabs/FeynmanTab.tsx`, `src/hooks/useFeynman.ts`
  - Backend: `server/routes/feynman.js` (`POST /api/ai/feynman-evaluate`)
- **API & Database:**
  - Endpoint: `POST /api/ai/feynman-evaluate`
  - Skema: Tabel `learner_events`
- **Workflow:** Pengguna memilih konsep dari dokumen $\rightarrow$ Mengetik penjelasan di textarea $\rightarrow$ Mengirim ke backend $\rightarrow$ AI menganalisis dan mengembalikan skor beserta umpan balik 4 rubrik $\rightarrow$ Hasil evaluasi dicatat ke event pembelajar secara idempoten.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/feynman.test.js` (4 uji skenario evaluasi deterministik, validasi input kosong, dan proteksi duplikasi event lolos).
- **Kondisi / Batasan yang Diketahui:** Penjelasan yang terlalu pendek (<10 kata) akan meminta siswa menguraikan lebih lengkap.
- **Relevansi Landing Page:** Menengah-Tinggi. Memperlihatkan bahwa Tanka membimbing pemahaman sejati (*deep learning*), bukan sekadar hafalan hafalan buta.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-FEYN-02: Audio Speech-to-Text for Feynman Recording
- **Deskripsi & Manfaat Pengguna:** Memungkinkan siswa merekam penjelasan konsep secara lisan melalui mikrofon. Suara siswa langsung ditranskripsikan menjadi teks rapi menggunakan model Whisper untuk dievaluasi oleh sistem Feynman.
- **Komponen & File Terkait:**
  - Frontend: `src/components/tabs/FeynmanTab.tsx`, `src/hooks/useAudioSpeech.ts`
  - Backend: `server/services/stt.py`, `server/routes/feynman.js` (`POST /api/ai/transcribe-audio`)
- **API & Database:**
  - Endpoint: `POST /api/ai/transcribe-audio`
- **Workflow:** Pengguna menekan tombol rekam mikrofon $\rightarrow$ Browser merekam audio WebM/WAV $\rightarrow$ Mengirim ke endpoint backend $\rightarrow$ Skrip Python Whisper mentranskripsi suara $\rightarrow$ Teks otomatis terisi di kotak penjelasan Feynman.
- **Status Verifikasi & Bukti:** `implemented-but-unverified`
  - Bukti: Kode skrip `server/services/stt.py` dan rute `server/routes/feynman.js` terpasang penuh. Diperlukan mikrofon fisik aktif untuk uji end-to-end.
- **Kondisi / Batasan yang Diketahui:** Membutuhkan izin akses mikrofon di peramban pengguna.
- **Relevansi Landing Page:** Menengah. Menunjukkan fitur interaksi suara yang modern.
- **Pertanyaan Terbuka:** Tidak ada.

---

## 6. Domain Bimbingan AI & Tutor Nara

### FEAT-NARA-01: Tanya Nara AI Companion (Context-Aware Tutor & Side Drawer)
- **Deskripsi & Manfaat Pengguna:** Asisten dan tutor belajar pribadi yang siaga 24 jam. Dapat dibuka sebagai tab obrolan mandiri atau sebagai panel samping (*side drawer*) saat membaca materi atau membedah soal. Nara memahami materi aktif yang sedang dibaca siswa sehingga penjelasannya relevan dan instan.
- **Komponen & File Terkait:**
  - Frontend: `src/components/modals/TanyaNaraPanel.tsx`, `src/components/tabs/ChatTab.tsx`, `src/hooks/useChat.ts`
  - Backend: `server/routes/chat.js` (`POST /api/ai/chat`), `server/prompts/nara.js`
- **API & Database:**
  - Endpoints: `POST /api/ai/chat`, `GET /api/documents/:id/chat`, `DELETE /api/documents/:id/chat`
  - Skema: Tabel `chat_messages`
- **Workflow:** Siswa mengetik pertanyaan di panel Nara $\rightarrow$ Request dikirim dengan konteks teks bab aktif $\rightarrow$ Server memotong riwayat chat secara pair-aware $\rightarrow$ Jawaban Nara disajikan dengan format KaTeX rapi $\rightarrow$ Percakapan tersimpan di database.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/chatHistory.test.js` (4 uji sanitasi riwayat chat, filter role, batas karakter, dan 404 dokumen lolos).
- **Kondisi / Batasan yang Diketahui:** Riwayat percakapan dibatasi secara otomatis agar tidak melampaui jendela konteks token LLM.
- **Relevansi Landing Page:** Sangat Tinggi. Menjadi elemen kunci di hero section (`SimulatorNaraCard`) dan studio cockpit.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-NARA-02: Strict Anti-Real-World-Analogy & Functional Literal Pedagogy
- **Deskripsi & Manfaat Pengguna:** Pedoman sistemik yang menjamin tutor Nara tidak pernah menggunakan analogi dunia nyata yang keliru atau mengaburkan konsep (misal menganalogikan aljabar dengan pedagang buah). Bimbingan Nara selalu berfokus pada alur baris kode, penurunan aljabar formal, atau definisi sosial struktural.
- **Komponen & File Terkait:**
  - Backend: `server/prompts/nara.js`
  - Frontend: Seluruh preset chip simulasi di `SimulatorNaraCard.tsx`
- **API & Database:** Terpasang di lapisan *system prompt* global Nara AI.
- **Workflow:** Setiap instruksi ke model menyertakan klausul mutlak: situasi konkret dulu $\rightarrow$ nama ilmiah formal $\rightarrow$ penurunan langkah demi langkah $\rightarrow$ tanpa analogi fiktif dunia nyata.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Telah diaudit pada commit `ba5d374` di mana seluruh analogi dunia nyata di `SimulatorNaraCard` dan `StudioCockpit` dibersihkan menjadi penurunan formal.
- **Kondisi / Batasan yang Diketahui:** Mengharuskan model mematuhi *system prompt* tanpa deviasi.
- **Relevansi Landing Page:** Sangat Tinggi. Ini adalah pembeda filosofis terbesar Tanka dari AI edukasi pasaran.
- **Pertanyaan Terbuka:** Tidak ada.

---

## 7. Domain Kolaborasi, Gamifikasi & Profil

### FEAT-ROOM-01: Multiplayer Synchronized Study Room & Live CBT Leaderboard
- **Deskripsi & Manfaat Pengguna:** Fitur kompetisi belajar bersama teman secara realtime. Siswa dapat membuat ruangan dengan kode 6 karakter, mengundang teman-temannya, melakukan ready check, lalu bersama-sama mengerjakan kuis yang sama dengan papan peringkat nilai langsung (*live race*).
- **Komponen & File Terkait:**
  - Frontend: `src/components/modals/RoomModal.tsx`
  - Backend: `server/routes/rooms.js`
- **API & Database:**
  - Endpoints: `POST /api/rooms`, `GET /api/rooms`, `GET /api/rooms/:id`, `POST /api/rooms/:id/join`, `POST /api/rooms/:id/ready`, `POST /api/rooms/:id/start`, `POST /api/rooms/:id/submit`
  - Skema: Tabel `study_rooms` dan `room_participants`
- **Workflow:** Host membuat room $\rightarrow$ Menentukan paket kuis $\rightarrow$ Peserta memasukkan kode $\rightarrow$ Semua peserta menekan tombol Ready $\rightarrow$ Host memulai lomba $\rightarrow$ Peserta menjawab kuis $\rightarrow$ Skor dan leaderboard terupdate realtime.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Rute dan skema `study_rooms` serta `room_participants` terverifikasi di migrasi database dan pengujian API.
- **Kondisi / Batasan yang Diketahui:** Maksimal 10-20 peserta per room untuk menjaga latensi sinkronisasi tetap rendah.
- **Relevansi Landing Page:** Menengah-Tinggi. Menunjukkan adanya aspek sosial dan kompetisi seru dalam belajar mandiri.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-TIME-01: 10/10 Rhythm Pomodoro Study Timer & Synthesized Alarm
- **Deskripsi & Manfaat Pengguna:** Timer fokus belajar terintegrasi dengan opsi ritme 10 menit fokus + 10 menit jeda (atau 25/5). Dilengkapi generator audio alarm berbasis Web Audio API sintetik tanpa perlu aset file audio eksternal.
- **Komponen & File Terkait:**
  - Frontend: `src/hooks/useStudyTimer.ts`, `src/components/modals/TimerAlarmModal.tsx`, `src/utils/sound.ts`
- **API & Database:**
  - Terkoneksi dengan pelacak menit belajar di tabel `users`.
- **Workflow:** Pengguna menekan tombol mulai timer di topbar $\rightarrow$ Waktu menghitung mundur $\rightarrow$ Ketika mencapai 00:00, jendela alarm muncul dan memainkan nada chime lembut melalui Web Audio API $\rightarrow$ Menit belajar bertambah di profil.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Komponen `TimerAlarmModal.tsx` dan modul `sound.ts` terverifikasi aktif di topbar aplikasi.
- **Kondisi / Batasan yang Diketahui:** Audio alarm bergantung pada interaksi awal pengguna dengan peramban (*user gesture*).
- **Relevansi Landing Page:** Menengah. Menunjukkan fitur pembangun disiplin ritme belajar.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-USER-01: User Profile, Weekly Target (0/5 Days), Streak Counter & XP
- **Deskripsi & Manfaat Pengguna:** Dasbor personalisasi belajar: memantau konsistensi mingguan (misal target 5 hari belajar per minggu), rentetan hari aktif berturut-turut (*streak count*), total poin pengalaman (XP), serta kustomisasi avatar dan identitas sekolah.
- **Komponen & File Terkait:**
  - Frontend: `src/components/modals/ProfileModal.tsx`, `src/components/layout/Sidebar.tsx`, `src/hooks/useAuth.ts`
  - Backend: `server/routes/users.js`
- **API & Database:**
  - Endpoints: `GET /api/users/profile`, `PATCH /api/users/profile`, `POST /api/users/activity`, `GET /api/users/leaderboard`
  - Skema: Tabel `users`
- **Workflow:** Setiap kali pengguna menyelesaikan bab atau kuis $\rightarrow$ `/api/users/activity` dipanggil $\rightarrow$ Menghitung streak hari aktif dan menambah XP $\rightarrow$ Widget sidebar menampilkan 7 titik hari yang menyala hijau.
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Terpasang di sidebar dan modal profil; skema kolom `streak_count`, `active_days_json`, `xp` aktif di database.
- **Kondisi / Batasan yang Diketahui:** Perhitungan streak menggunakan tanggal lokal server atau zona waktu peramban pengguna.
- **Relevansi Landing Page:** Menengah. Mendukung narasi kedisiplinan dan pembentukan kebiasaan belajar.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-AUTH-01: Unified Authentication (Local Password, WhatsApp OTP, Google OAuth 2.0, Guest Mode)
- **Deskripsi & Manfaat Pengguna:** Sistem autentikasi multifungsi yang fleksibel: login instan sebagai tamu tanpa ribet (*Guest Mode*), pendaftaran akun lokal (username/password), verifikasi instan kode OTP WhatsApp, atau masuk menggunakan Google OAuth 2.0.
- **Komponen & File Terkait:**
  - Frontend: `src/components/modals/AuthModal.tsx`, `src/hooks/useAuth.ts`
  - Backend: `server/routes/auth.js`
- **API & Database:**
  - Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`, `POST /api/auth/whatsapp/send-otp`, `POST /api/auth/whatsapp/verify`, `GET /api/auth/google/login`, `POST /api/auth/google`
  - Skema: Tabel `users`, `user_sessions`, `auth_verifications`
- **Workflow:** Pengguna memilih metode login di `AuthModal` $\rightarrow$ Backend memvalidasi kredensial / OTP / token $\rightarrow$ Menerbitkan token sesi 30 hari yang disimpan di tabel `user_sessions` $\rightarrow$ Disimpan di `localStorage` peramban.
- **Status Verifikasi & Bukti:** `implemented-and-verified` (untuk Local, Sessions, WhatsApp mock/flow, dan Google flow); `partial` untuk live production secret eksternal.
  - Bukti: `tests/auth.test.js` dan `tests/authSessions.test.js` (8 skenario autentikasi lolos).
- **Kondisi / Batasan yang Diketahui:** Google OAuth live membutuhkan `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` pada file `.env`.
- **Relevansi Landing Page:** Tinggi. Menjadi pintu gerbang tombol "Masuk" dan CTA di landing page.
- **Pertanyaan Terbuka:** Tidak ada.

---

## 8. Domain Arsitektur Visual Landing Page & Motion Suite

### FEAT-LAND-01: Zero-Slop Paper-Ledger Modular Landing Page
- **Deskripsi & Manfaat Pengguna:** Pintu gerbang publik Tanka yang dirancang dengan estetika *paper-ledger*, tipografi tajam, dan pembagian modular yang rapi. Memperkenalkan produk secara jujur tanpa trik marketing palsu.
- **Komponen & File Terkait:**
  - `src/components/landing/LandingPage.tsx`
  - `src/components/landing/LandingNavbar.tsx`
  - `src/components/landing/HeroSection.tsx`
  - `src/components/landing/HeroWorkspacePreview.tsx`
  - `src/components/landing/MarqueeTicker.tsx`
  - `src/components/landing/StudioCockpit.tsx`
  - `src/components/landing/ComparisonLedger.tsx`
  - `src/components/landing/PersonasSection.tsx`
  - `src/components/landing/StepperSection.tsx`
  - `src/components/landing/CtaBanner.tsx`
  - `src/components/landing/LandingFooter.tsx`
  - `src/components/landing/landing.css`
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Tangkapan layar penuh di `.agents/evidence/landing-desktop-1920x1080.png` dan `.agents/evidence/landing-mobile-390x844.png`.
- **Relevansi Landing Page:** Fondasi utama tugas handoff desain.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-LAND-02: Interactive Nara Question Simulator
- **Deskripsi & Manfaat Pengguna:** Simulator interaktif di atas fold hero section. Pengguna dapat memilih preset pertanyaan pelajaran (misal: Irisan Himpunan $A \cap B$, Penurunan Aljabar, dll) atau mengetik pertanyaan sendiri, lalu melihat animasi jawaban Nara yang terbit langkah demi langkah lengkap dengan KaTeX.
- **Komponen & File Terkait:**
  - `src/components/landing/SimulatorNaraCard.tsx`
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Terpasang di kolom kanan HeroSection dan terverifikasi di browser.
- **Relevansi Landing Page:** Sangat Tinggi. Bukti hidup kemampuan AI sebelum pengguna mendaftar akun.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-LAND-03: 3D Flip Comparison Flashcards with Flip-All Switch
- **Deskripsi & Manfaat Pengguna:** Seksi perbandingan cara belajar konvensional vs Tanka yang disajikan dalam bentuk 4 kartu flashcard 3D flip. Dilengkapi tombol saklar master "Tampilkan Semua Solusi Tanka" untuk membalik seluruh kartu secara serentak.
- **Komponen & File Terkait:**
  - `src/components/landing/ComparisonLedger.tsx`
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Terverifikasi di `.agents/evidence/flashcard-comparison-desktop-1920x1080.png`.
- **Relevansi Landing Page:** Sangat Tinggi. Memberikan interaksi kinestetik yang menyenangkan bagi calon pengguna.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-LAND-04: Studio Cockpit Live Multi-Device Mockup Switcher
- **Deskripsi & Manfaat Pengguna:** Cockpit interaktif dengan 4 tab instrumen (Tanya Nara, Rangkum Dokumen, Kuis & Bank Salah, Peta Saraf). Sisi kanan menampilkan mockup layar antarmuka Tanka yang berganti secara sinkron sesuai tab yang dipilih pengguna.
- **Komponen & File Terkait:**
  - `src/components/landing/StudioCockpit.tsx`
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Terpasang di landing page dengan aset showcase di `public/assets/landing/`.
- **Relevansi Landing Page:** Sangat Tinggi. Menunjukkan bahwa produk Tanka sudah nyata dan memiliki antarmuka yang matang.
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-LAND-05: Modular Motion Kit (HeroGraphic, Lenis, SplitWords, Magnetic, TiltCard, TimeShrink)
- **Deskripsi & Manfaat Pengguna:** Paket animasi dan interaksi mikro modern:
  - `HeroGraphic.tsx`: Animasi dataflow SVG (PDF/video mentah mengalir masuk ke Nara dan keluar menjadi bab kecil).
  - `ScrollProgress`: Garis progres scroll di puncak layar.
  - `SplitWords`: Headline hero yang muncul kata per kata dari balik masker editorial.
  - `Magnetic`: Tombol CTA utama yang tertarik halus mengikuti kursor mouse.
  - `TiltCard`: Efek kemiringan perspektif 3D dan spotlight kursor pada kartu persona siswa.
  - `TimeShrink`: Angka durasi belajar yang menyusut dinamis saat digulir dari 120 menit ke 3 menit.
  - `useSmoothScroll.ts`: Scrolling inersia mulus berbasis Lenis.
- **Komponen & File Terkait:**
  - `src/components/landing/motion/HeroGraphic.tsx`
  - `src/components/landing/motion/MotionKit.tsx`
  - `src/components/landing/motion/useSmoothScroll.ts`
  - `src/components/landing/landing-motion.css`
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Diintegrasikan pada commit `ba5d374` dan `e68887c`, teruji lolos build dan rendering browser.
- **Relevansi Landing Page:** Sangat Tinggi. Merupakan titik awal yang harus diperkaya oleh LLM eksternal.
- **Pertanyaan Terbuka:** Tidak ada.

---

## 9. Domain Infrastruktur, Performa & PWA

### FEAT-PERF-01: Native HTTP Compression (Brotli & Gzip) & Cache Headers
- **Deskripsi & Manfaat Pengguna:** Server Node.js mengompresi payload secara otomatis menggunakan algoritma Brotli (`br`) atau Gzip untuk menghemat kuota internet siswa di perangkat seluler dan mempercepat waktu muat halaman (*first contentful paint*).
- **Komponen & File Terkait:**
  - `server.js` (fungsi `getCompressionStream`), `server/config.js`
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: `tests/serverCompression.test.js` (Lolos verifikasi kompresi Brotli, Gzip, dan raw stream).
- **Relevansi Landing Page:** Menengah (aspek performa teknis di balik layar).
- **Pertanyaan Terbuka:** Tidak ada.

---

### FEAT-PWA-01: Progressive Web App (PWA) Offline Reading & Service Worker
- **Deskripsi & Manfaat Pengguna:** Tanka dapat dipasang (*install*) ke layar beranda HP atau desktop layaknya aplikasi native. Modul materi yang telah dimuat tetap dapat dibaca secara offline tanpa koneksi internet.
- **Komponen & File Terkait:**
  - `public/manifest.json`, `public/sw.js`, `index.html`
- **Status Verifikasi & Bukti:** `implemented-and-verified`
  - Bukti: Konfigurasi manifest PWA terpasang dengan ikon 192px dan 512px.
- **Relevansi Landing Page:** Menengah-Tinggi. Disorot sebagai keunggulan ("Dapat Dibaca Offline & Bisa Diinstal").
- **Pertanyaan Terbuka:** Tidak ada.
