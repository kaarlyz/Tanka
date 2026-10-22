# 🐴 Tanka - Panduan Arsitektur & Spesifikasi Lengkap Sistem (System Blueprint)

> **Dokumen ini adalah spesifikasi arsitektur teknis, fungsional, dan visual komprehensif dari platform belajar mandiri adaptif Tanka.** Dokumen ini dirancang tanpa ada bagian yang terlewat agar dapat digunakan sebagai konteks penuh bagi LLM, developer, maupun auditor sistem.

---

## 1. Visi Produk & Filosofi Rekayasa

### 1.1 Visi Utama
Tanka adalah **AI Autonomous Study Platform** yang dirancang untuk mentransformasi materi belajar mentah (buku teks tebal, slide presentasi dosen, rekaman/video kuliah YouTube 2 jam, lembar soal ujian) menjadi unit-unit pemahaman atomik yang terstruktur, bebas distorsi, dan siap dikuasai secara mandiri.

### 1.2 Target Pengguna
- **Siswa SMA Kelas XII:** Persiapan intensif Tes Kemampuan Akademik (TKA SMA 2026: Matematika Wajib, Sosiologi, Ekonomi, Bahasa Indonesia, Bahasa Inggris) dan UTBK-SNBT.
- **Mahasiswa:** Menelaah jurnal ilmiah panjang, menyerap slide perkuliahan, dan menguji pemahaman konsep fundamental.
- **Pejuang Kampus / Gap Year:** Belajar mandiri terarah dengan disiplin ritme tinggi tanpa biaya bimbingan belajar mahal.

### 1.3 Prinsip Desain Anti-Slop & Ergonomi Kognitif
1. **Paper-Ledger Aesthetic:** Menggunakan palet bernuansa kertas arsip (*parchment warm white* `#fcfdfa`, *forest charcoal* `#18221f`, aksen *electric lime* `#c8f064`, dan *muted sage border* `#dce2da`). Menolak gradien balon AI generik dan bayangan mencolok yang membebani mata.
2. **Pedagogi Fungsional Literal (Anti-Analogi Dunia Nyata):** Penjelasan konsep dan bimbingan tutor AI Nara wajib 100% berbasis penggunaan fungsional nyata (alur baris kode, penurunan langkah matematis, definisi konsep). Dilarang keras menggunakan analogi dunia nyata (seperti kasir McD, mobil, pipa air) karena berisiko membiaskan konsep murni.
3. **Sub-0.2ms Input Latency & Deterministik:** Interaksi ketik, navigasi tombol, dan switching soal dirancang instan. State lokal diprioritaskan sebelum request asinkronus ke server.
4. **Pencegahan Kelelahan Vertikal (Horizontal Bento Rail):** Pada lembar bedah soal puluhan butir, sistem menerapkan *Mode Bento Stage* dengan rel navigasi horizontal agar pengguna tidak lelah menggulir layar (*anti endless vertical scroll*).

---

## 2. Tech Stack & Lingkungan Eksekusi

### 2.1 Frontend
- **Framework:** React 19 (Hooks, Suspense, Lazy-loading, Context)
- **Bahasa:** TypeScript 5.8
- **Bundler & Build Tool:** Vite 8.3
- **Styling:** Vanilla CSS berstruktur modular dengan CSS Custom Properties (`landing.css`, `index-Cs_CgcgP.css`)
- **Rendering Formula:** `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` + font KaTeX lengkap
- **Rendering Diagram:** Mermaid.js, ASCII Canvas Renderer, SVG Interactive Mind Map
- **Ikonografi:** `lucide-react`
- **Efek & Animasi:** Canvas Confetti, Web Animations API, 3D CSS Card Flip

### 2.2 Backend & Runtime
- **Runtime:** Node.js 26 / Node 22 (Native HTTP server tanpa overhead Express berlebih, WebSocket native)
- **Database Engine:** SQLite 3 via `better-sqlite3` (WAL mode, foreign keys, synchronous normal)
- **Ekstraksi Teks & OCR:** Python 3.14 (.venv mandiri) dengan dependensi:
  - `pdftotext` & `pdftoppm` (Poppler Utilities)
  - `pdfimages` (Poppler Utilities)
  - `tesseract-ocr` (Bahasa: `ind+eng`, Engine: LSTM `--oem 1`)
  - ImageMagick (`magick`)
- **AI Gateway & Proxy:** 9Router (HTTP Proxy port 20128) menghubungkan model Gemini 3.8 Flash (High/Med/Low), Gemini 3.7 Flash, dan Claude 3.5 Sonnet.
- **Networking & Tunnel:** Cloudflare Quick Tunnel (`cloudflared` port 3001) untuk akses publik PWA aman multi-perangkat.

---

## 3. Struktur Direktori Proyek

```text
/home/vallencia/Projects/tanka/
├── dist/                      # Production build bundle hasil Vite
│   ├── assets/                # Chunks JS, CSS, KaTeX woff/ttf fonts
│   ├── index.html             # Shell HTML utama
│   └── sw.js                  # PWA Service Worker offline
├── public/                    # Aset statis publik
│   ├── manifest.json          # PWA web app manifest
│   ├── icon-192.png           # PWA icon mobile
│   ├── icon-512.png           # PWA icon splash
│   └── sw.js                  # Service Worker source
├── server/                    # Backend modular Node.js
│   ├── routes/                # Endpoint modular REST & RPC
│   │   ├── auth.js            # Autentikasi lokal, Google, OTP SMS/WA
│   │   ├── chat.js            # Streaming endpoint Tanya Nara AI
│   │   ├── cheatsheet.js      # Generator & parser rumus KaTeX
│   │   ├── documents.js       # Ingestion berkas, upload OCR, caching
│   │   ├── examResults.js     # Rekap hasil tryout & statistik
│   │   ├── feynman.js         # Engine penilaian metode Feynman
│   │   ├── flashcards.js      # CRUD flashcard & Leitner box
│   │   ├── mistakes.js        # Notebook bank soal salah
│   │   ├── models.js          # Healthcheck & katalog model 9Router
│   │   ├── quizzes.js         # Pembuat kuis atomik & verifikasi jawaban
│   │   ├── rooms.js           # Multiplayer study room & live competition
│   │   ├── summary.js         # Ringkasan eksekutif & mind map
│   │   ├── topics.js          # Generator chapter & topik modular
│   │   └── users.js           # Profil, streak, target mingguan, XP
│   └── utils/
│       ├── examPipeline.js    # Autonomous 4-Stage CBT Pipeline
│       └── pythonResolver.js  # Deteksi path python virtual environment
├── src/                       # Frontend source code React + TypeScript
│   ├── components/
│   │   ├── common/            # Komponen pakai ulang
│   │   │   ├── DiagramRenderer.tsx   # Renderer KaTeX, Mermaid & ASCII
│   │   │   ├── ExamInsightPanel.tsx  # Panel bobot kisi-kisi soal
│   │   │   ├── InteractiveMindMap.tsx# Kanvas peta konsep interaktif
│   │   │   ├── MathView.tsx          # Wrapper rendering formula KaTeX
│   │   │   └── YouTubeIcon.tsx       # Ikon visual YouTube
│   │   ├── landing/           # Landing page modular
│   │   │   ├── ComparisonLedger.tsx  # 3D Flip Flashcard perbandingan
│   │   │   ├── CtaBanner.tsx         # Banner ajakan mulai belajar
│   │   │   ├── HeroSection.tsx       # Hero split grid
│   │   │   ├── HeroWorkspacePreview.tsx # Mockup browser Tanka
│   │   │   ├── LandingFooter.tsx     # Footer navigasi & copyright
│   │   │   ├── LandingNavbar.tsx     # Header bar landing
│   │   │   ├── LandingPage.tsx       # Master wrapper landing page
│   │   │   ├── MarqueeTicker.tsx     # Running text ticker fitur
│   │   │   ├── PersonasSection.tsx   # Kartu cerita testimoni pejuang
│   │   │   ├── SimulatorNaraCard.tsx # Simulator interaktif tanya Nara
│   │   │   ├── StepperSection.tsx    # 4 langkah alur kerja
│   │   │   ├── StudioCockpit.tsx     # Cockpit 4 instrumen belajar
│   │   │   └── landing.css           # Styling lengkap landing page
│   │   ├── modals/            # Dialog & Drawer interaktif
│   │   │   ├── AuthModal.tsx         # Modal login/register/guest
│   │   │   ├── EnrichModal.tsx       # Modal tambah materi pengayaan
│   │   │   ├── FormulaDrawer.tsx     # Drawer contekan rumus cepat
│   │   │   ├── ProfileModal.tsx      # Modal edit avatar & target mingguan
│   │   │   ├── RoomModal.tsx         # Modal ruang belajar bersama
│   │   │   ├── StagingUploadModal.tsx# Modal unggah berkas multi-format
│   │   │   ├── TimerAlarmModal.tsx   # Modal alarm pengingat pomodoro
│   │   │   ├── TopicModal.tsx        # Modal bedah topik mendalam
│   │   │   └── YouTubeModal.tsx      # Modal input tautan YouTube
│   │   └── tabs/              # Tab navigasi utama aplikasi
│   │       ├── ChatTab.tsx           # Tab obrolan interaktif AI
│   │       ├── ExamDrillView.tsx     # Bedah kisi-kisi soal & Bento Stage
│   │       ├── FeynmanTab.tsx        # Uji pemahaman mandiri Feynman
│   │       ├── FlashcardsTab.tsx     # Kartu hafalan atomik Leitner
│   │       ├── HomeHubTab.tsx        # Beranda command center
│   │       ├── MaterialTab.tsx       # Pembaca materi utama & Markdown
│   │       ├── MistakesTab.tsx       # Notebook bank soal salah
│   │       ├── QuizTab.tsx           # Antarmuka ujian CBT & skor
│   │       ├── SummaryTab.tsx        # Ringkasan eksekutif materi
│   │       └── TanyaNaraPanel.tsx    # Panel samping pendamping Nara
│   ├── App.tsx                # Master coordinator antarmuka
│   ├── index.css              # Global tokens & CSS baseline
│   ├── main.tsx               # Entrypoint React DOM
│   └── types.ts               # Deklarasi tipe TypeScript universal
├── uploads/                   # Folder media upload
│   └── exam_images/           # Aset visual grafik/diagram hasil OCR
├── extract_text.py            # Skrip ekstraksi multi-format & filter OCR
├── server.js                  # Entry point Node.js HTTP/WS server
├── package.json               # Konfigurasi dependensi Node.js
├── tsconfig.json              # Konfigurasi compiler TypeScript
├── vite.config.ts             # Konfigurasi bundler Vite
└── tanka.sqlite               # Database relasional utama
```

---

## 4. Skema Lengkap Database (SQLite)

Tanka menggunakan SQLite (`tanka.sqlite`) dengan 15 tabel relasional teroptimasi indeks:

### 4.1 Tabel Dokumen & Segmen
1. **`documents`**
   - `id` (TEXT, PK): ID unik dokumen (e.g. `doc_1792672195245_1zmf5`).
   - `title` (TEXT): Judul akademis bersih yang terdeteksi otomatis.
   - `content` (TEXT): Teks materi lengkap berformat Markdown/KaTeX.
   - `summary` (TEXT): Ringkasan eksekutif silabus.
   - `status` (TEXT): Status proses (`processing`, `completed`, `error`).
   - `content_hash` (TEXT): SHA-256 hash dari teks mentah untuk *Content-Addressable Caching*.
   - `created_at` (INTEGER): Timestamp pembuatan dalam milidetik.
2. **`document_segments`**
   - `id` (TEXT, PK): ID segmen (e.g. `seg_doc1_0`).
   - `doc_id` (TEXT): Foreign key ke dokumen.
   - `segment_index` (INTEGER): Urutan indeks segmen dalam teks.
   - `source_type` (TEXT): Tipe sumber (`text`, `slide`, `page`).
   - `raw_text` (TEXT): Teks mentah segmen.
   - `normalized_text` (TEXT): Teks bersih setelah normalisasi.
   - `created_at` (INTEGER): Timestamp pembuatan.
3. **`document_concepts`**
   - `id` (TEXT, PK): ID konsep unik.
   - `doc_id` (TEXT): FK ke dokumen.
   - `name` (TEXT): Nama konsep.
   - `definition` (TEXT): Definisi literal fungsional.
   - `prerequisites` (TEXT): Prasyarat pemahaman dalam JSON array.
   - `origin` (TEXT): Sumber ekstraksi.
   - `category` (TEXT): Kategori (`core`, `supporting`, `advanced`).
   - `is_required` (INTEGER): Flag wajib (1 atau 0).
   - `evidence_quote` (TEXT): Bukti kutipan dari teks sumber.
4. **`concept_edges`**
   - Menghubungkan node-node konsep untuk merender graf peta saraf (*Interactive Mind Map*).
   - Kolom: `id`, `doc_id`, `source_id`, `target_id`, `relation_label`, `relation_type`, `evidence_quote`.
5. **`chapter_plans`**
   - Pembagian bab belajar terstruktur per dokumen (`doc_id`, `chapter_number`, `title`, `trigger_question`, `target_goal`, `key_concept_ids`, `content`, `status`).

### 4.2 Tabel Evaluasi & Kuis
6. **`quizzes`**
   - `id` (TEXT, PK): ID set kuis.
   - `doc_id` (TEXT): FK ke dokumen terkait.
   - `quiz_type` (TEXT): Tipe kuis (`conceptual`, `exam_sheet`, `cbt`).
   - `questions` (TEXT): JSON array dari seluruh butir pertanyaan `QuizQuestion[]`.
   - `created_at` (INTEGER): Waktu pembuatan.
7. **`mistake_notebook`**
   - Rekam otomatis saat pengguna menjawab salah pada kuis.
   - Kolom: `id`, `doc_id`, `doc_title`, `question`, `options`, `correct_index`, `user_answer_index`, `formula`, `steps`, `explanation`, `pitfall`, `resolved` (0/1), `user_id`, `created_at`, `updated_at`.
8. **`flashcards`**
   - Kartu hafalan atomik 1 kartu 1 fakta.
   - Kolom: `id`, `doc_id`, `front`, `back`, `difficulty` (`new`, `learning`, `mastered`), `review_count`, `created_at`.
9. **`formula_cheatsheets`**
   - Tabel ringkasan rumus matematika/sains per dokumen (`doc_id`, `formulas` JSON, `created_at`).

### 4.3 Tabel Pengguna, Sesi & Multiplayer
10. **`users`**
    - `id` (TEXT, PK): ID unik user.
    - `username` (TEXT, UNIQUE): Username pengguna.
    - `password_hash` (TEXT): Hash bcrypt password lokal.
    - `name` (TEXT): Nama tampilan.
    - `bio` (TEXT): Deskripsi profil singkat.
    - `school_class` (TEXT): Tingkat kelas (e.g. "Kelas XII - IPA").
    - `avatar_color` (TEXT): Warna aksen avatar pengguna.
    - `target_weekly_days` (INTEGER): Target hari belajar mingguan (default 5).
    - `streak_count` (INTEGER): Rentetan hari belajar aktif berturut-turut.
    - `last_active_date` (TEXT): Tanggal aktivitas terakhir (`YYYY-MM-DD`).
    - `active_days_json` (TEXT): Riwayat hari aktif dalam minggu berjalan (`["Mon", "Wed"]`).
    - `total_study_minutes` (INTEGER): Total durasi belajar akumulatif.
    - `quizzes_completed` (INTEGER): Jumlah sesi kuis yang diselesaikan.
    - `quiz_correct_count` (INTEGER): Total butir soal yang dijawab benar.
    - `xp` (INTEGER): Experience points pengguna.
    - `phone` (TEXT, UNIQUE): Nomor telepon untuk verifikasi OTP.
    - `is_verified` (INTEGER): Flag akun terverifikasi.
11. **`user_sessions`**
    - Token sesi autentikasi (`token`, `user_id`, `expires_at`, `created_at`).
12. **`auth_verifications`**
    - Kode OTP sementara untuk validasi login/pendaftaran nomor telepon.
13. **`chat_messages`**
    - Riwayat percakapan dengan Nara AI (`id`, `doc_id`, `user_id`, `role`, `content`, `model`, `created_at`).
14. **`study_rooms`** & **`room_participants`**
    - Sinkronisasi ruang kompetisi belajar bersama secara multiplayer realtime (`room_id`, `host_user_id`, `status`, `quiz_count`, `questions_json`, nilai skor dan jumlah benar per peserta).

---

## 5. Pipeline Ingestion & OCR Universal

### 5.1 Alur Pemrosesan Berkas (`extract_text.py` & `documents.js`)
Ketika berkas PDF atau dokumen diunggah ke endpoint `POST /api/documents/upload`:

```text
[Berkas Diunggah] 
       │
       ▼
[Deteksi Ekstensi & MIME]
       ├── PDF: Jalankan pdftotext langsung
       │         │
       │         ├── Teks Terbaca (>= 30 char/hal) ➔ Langsung dipakai (Instant)
       │         └── Halaman Kosong/Scanned (Len < 30) ➔ Masuk Antrean OCR Tesseract
       │
       ▼
[Batch Raster Rendering]
pdftoppm -png -r 150 -f <min> -l <max> (Satu kali panggil batch untuk seluruh halaman)
       │
       ▼
[Parallel Page OCR]
8-Worker ThreadPoolExecutor + OMP_THREAD_LIMIT=1 (Anti thread-thrashing Ryzen 8-core)
       │
       ▼
[Universal Visual Extraction]
pdfimages diekstrak native (.ppm/.jpg) langsung ke RAM tmpfs (1,4 detik vs 5,7 detik)
       │
       ▼
[3-Layer Zero-Token Heuristic Filter]
  ├── Layer 1: Eliminasi Header/Metadata kurikulum ("Hierarki Indikator", "Bentuk Soal")
  ├── Layer 2: Deteksi Pure Art (Diagram geometri, kurva tanpa teks, lukisan: OCR <= 5 char)
  └── Layer 3: Deteksi Structured Chart/Table (Mengandung kata "tabel", "grafik" atau deretan angka sumbu)
  └── Anti-Leak: Buang potongan yang murni teks soal atau pilihan ganda.
       │
       ▼
[Auto-Cleanup Raster]
Hanya 3-5 visual valid yang dikonversi ke PNG di `/uploads/exam_images/`.
Sisa 80+ potongan sampah layout Word langsung dihapus otomatis dari memori.
       │
       ▼
[Content-Addressable Cache (SHA-256)]
Jika hash teks identik pernah diproses dan ada di database, gunakan cache langsung (<1s).
```

### 5.2 Autonomous 4-Stage CBT Pipeline (`examPipeline.js`)
Jika dokumen terdeteksi sebagai lembar soal ujian:
1. **Stage 1 (EXTRACT):** Mengidentifikasi nomor soal, stimulus bacaan, pertanyaan, opsi jawaban A-E, tipe soal (`pilihan_ganda`, `pilihan_ganda_kompleks` / MCMA, `kategori` / Benar-Salah), serta mengaitkan placeholder gambar `[Gambar: /uploads/exam_images/xxx.png]`.
2. **Stage 2 (SOLVE):** Konsensus Multi-Vote (3× voting LLM independen) untuk memverifikasi kunci jawaban objektif, mengeliminasi halusinasi kunci dari sumber mentah.
3. **Stage 3 (WRITE):** Menyusun bedah pembahasan lengkap:
   - Langkah penyelesaian matematis / konseptual terperinci.
   - Rumus kunci KaTeX (`formula`).
   - Trik cepat / jalan pintas waktu pengerjaan ujian (`trik_cepat`).
   - Analisis mendalam per opsi pengecoh (`analisis_opsi`).
   - Radar jebakan khas pembuat soal (`pitfall`).
4. **Stage 4 (VERIFY):** Audit anomali, memastikan rentang indeks kunci sesuai pilihan (0..n), dan menandai butir soal ambigu.

---

## 6. Penjelasan Seluruh Tab & Antarmuka Aplikasi

### 6.1 Landing Page (`LandingPage.tsx`)
Pintu gerbang publik Tanka sebelum masuk ke antarmuka aplikasi. Terdiri dari 10 modul modular:
1. **LandingNavbar:**
   - Logo Tanka box monogram (`t`).
   - Anchor links: `#tanya-nara`, `#keunggulan`, `#perbandingan`, `#alur`, `#testimoni`.
   - Tombol "Masuk" dan tombol CTA primer "Buka Aplikasi".
2. **HeroSection (Asymmetric Split Grid):**
   - Sisi Kiri: Headline tajam *"Ubah materi apapun, jadi langsung bisa dipahami."*, subjudul editorial, tombol CTA utama "Mulai Belajar Sekarang — Gratis".
   - Sisi Kanan (`SimulatorNaraCard`): Simulator interaktif Tanya Nara langsung di hero. Pengguna dapat memilih contoh pertanyaan (Irisan Himpunan $A \cap B$, Fotosintesis, Teorema Pythagoras), melihat animasi gelembung chat AI dengan penurunan KaTeX rapi, atau mengetik pertanyaan kustom.
3. **HeroWorkspacePreview:**
   - Chrome mockup antarmuka reader buku Tanka dengan URL pill `tanka.app/modul/operasi-himpunan`.
   - Dua floating badge: *"Bab Santai 3 Menit (Otomatis dipotong ringkas)"* dan *"Nara AI Siaga 24 Jam (Tanya rumus tanpa batas)"*.
4. **MarqueeTicker:**
   - Running text ticker animasi horizontal tanpa henti: *Penurunan Rumus Kontinu • Tutor Nara Siaga 24 Jam • Modul Per Bab Siap Santap • Kuis Deterministik Atomik • Fokus Belajar Bebas Distraksi • Pemahaman Berbasis Bukti*.
5. **StudioCockpit:**
   - Dock 4 kapabilitas interaktif:
     - *Tutor Nara AI:* Ruang aman tanya rumus serumit apa pun dengan KaTeX step-by-step.
     - *Rangkum Video & PDF:* Pemadatan berkas panjang jadi modul 3 menit.
     - *Kuis & Bank Salah:* Kuis 1 kartu 1 fakta dan pencatatan otomatis kekeliruan.
     - *Peta Saraf Materi:* Visualisasi node konsep dan kaitan prasyarat.
   - Sisi kanan menampilkan tangkapan layar perangkat simulasi yang sinkron dengan tab aktif.
6. **ComparisonLedger:**
   - Grid 4 kartu flashcard 3D flip interaktif yang membandingkan friksi cara belajar lama vs solusi Tanka:
     1. Video YouTube 2 Jam ➔ Modul Ringkas 3 Menit.
     2. PDF 200 Halaman Membingungkan ➔ Pecah Otomatis per Bab.
     3. Malu Bertanya di Kelas ➔ Nara AI Siaga 24 Jam Bebas Penghakiman.
     4. Terdistraksi Iklan & Notifikasi ➔ 100% Bebas Iklan, Privat & Offline PWA.
   - Dilengkapi tombol toggle *"Tampilkan Semua Solusi Tanka"* untuk membalik seluruh kartu sekaligus.
7. **PersonasSection:**
   - Kartu testimoni pejuang belajar nyata (Dafa - Siswa Kelas XII Pejuang SNBT, Nadia - Mahasiswi Biologi, Rian - Gap Year).
8. **StepperSection:**
   - 4 langkah alur penguasaan materi:
     - 01 // INPUT BAHAN (Unggah multi-format).
     - 02 // BACA RINGKAS (Materi jadi bab kecil).
     - 03 // TANYA TUTOR (Tanya rumus kapan saja).
     - 04 // UJI PEMAHAMAN (Kuis pintar & bank salah).
9. **CtaBanner:**
   - Call to action penutup berlatar belakang gelap dengan tombol aksen electric lime.
10. **LandingFooter:**
    - Navigasi tautan fitur, komitmen privasi 100% lokal, dan atribusi arsitektur.

---

### 6.2 Top Navigation Header (`App.tsx`)
Header horizontal bagian atas saat masuk ke dalam aplikasi:
- **Status Dokumen Aktif:** Menampilkan judul dokumen aktif yang sedang dipelajari.
- **Study Timer (Pomodoro):** Timer digital dengan tombol play/pause/reset dan set durasi (10 menit fokus + 10 menit jeda ala ritme Eka). Mengeluarkan modal alarm audio saat waktu habis.
- **AI Model Selector Dropdown:** Memilih engine AI aktif (Gemini 3.8 Flash High/Med/Low, Gemini 3.7 Flash, Claude 3.5 Sonnet) yang terhubung via 9Router dengan indikator latensi.
- **Kompetisi Room Trigger:** Tombol cepat membuka hub multiplayer challenge.
- **User Profile Pill:** Menampilkan avatar warna kustom, nama user, kelas, dan status streak aktif.

---

### 6.3 Global Sidebar Navigation (`App.tsx`)
Sidebar vertikal di desktop dan laci geser (*mobile drawer*) di perangkat layar sentuh:
- **Brand Logo:** `t tanka.` dengan link preview landing page.
- **Menu Navigasi Tab:**
  - `H` **Beranda Hub** (`home`)
  - `M` **Materi Saya** (`material`)
  - `L` **Latihan Kuis** (`quiz`) — dilengkapi badge counter jumlah butir soal.
  - `B` **Bank Soal Salah** (`mistakes`) — dilengkapi badge merah jika ada soal salah belum terselesaikan.
  - `K` **Flashcards** (`flashcards`)
  - `F` **Uji Feynman** (`feynman`)
  - `Room Kompetisi` (`room`) — badge "EVENT"
- **Weekly Target Widget:**
  - Menampilkan progres target mingguan (contoh: `0/5 hari`).
  - Indikator lingkaran 7 hari (`S S R K J S M`) yang menyala hijau saat ada rekam aktivitas belajar.
- **Profil Singkat Pengguna:** Menampilkan username dan badge status.

---

### 6.4 Beranda Hub (`HomeHubTab.tsx`)
Command center tempat pengguna memulai sesi belajar:
- **Hero Greeting:** Sapaan personal berbasis waktu dan status streak belajar aktif.
- **Kartu Ringkasan Progres Dokumen Aktif:**
  - Judul materi aktif, progres bab terselesaikan, estimasi menit baca.
  - Tombol lanjut membaca dan tombol uji kuis cepat.
- **Bento Tray Aksi Cepat:**
  - *Unggah Berkas Baru:* Membuka `StagingUploadModal`.
  - *Tempel Teks Bebas:* Input teks catatan atau materi kilat.
  - *Rangkum YouTube:* Membuka `YouTubeModal`.
- **Daftar Materi Terkini (Recent Documents):** Daftar dokumen yang tersimpan di database lokal beserta statusnya (`completed`, `processing`).

---

### 6.5 Materi Saya & Exam Drill View (`MaterialTab.tsx` & `ExamDrillView.tsx`)
Tab inti membaca dokumen dan berlatih kisi-kisi:

#### Mode Materi Standar (Buku / Modul)
- **Reading Canvas:** Teks Markdown terstruktur dengan dukungan penuh rumus KaTeX (`$math$`, `$$math$$`), tabel GFM, blok kode, dan gambar visual responsif.
- **Table of Contents (Daftar Isi Bab):** Navigasi lompat bab di panel kiri.
- **Interactive Mind Map Drawer:** Peta konsep visual yang digenerate otomatis dari entitas dokumen.

#### Mode Bedah Lembar Soal Ujian (`ExamDrillView.tsx`)
Dirancang khusus untuk mengeliminasi kelelahan scrolling vertikal puluhan nomor soal ujian:
1. **Header Kisi-Kisi & Ringkasan Bobot:**
   - Badge jumlah butir soal terurai.
   - Tombol aksi primer "Uji Tryout Soal Ini" yang langsung meluncurkan kuis interaktif CBT.
2. **Horizontal Stepper Rail:**
   - Baris tombol nomor soal (`#1`, `#2`, ..., `#30`) yang disusun horizontal dengan *smooth scrollbar-free rail*.
   - Badge penanda tipe soal (`[MCMA]`, `[Kategori]`), ikon penanda aset visual gambar, dan titik merah indikator jebakan pembuat soal.
   - Tombol geser panah kiri `<` dan panah kanan `>` untuk melompat antar nomor.
3. **Bento Stage 2 Kolom Asimetris (Soal Aktif):**
   - **Bento Card Kiri (Kanvas Lembar Soal):**
     - Header bar nomor soal, subtes, tingkat kesulitan (`mudah`, `sedang`, `sulit`), dan estimasi waktu pengerjaan.
     - Stimulus wacana / narasi bacaan bergaris tepi aksen hijau.
     - Aset visual gambar asli (diagram kurva permintaan, diagram fungsi kuadrat, tabel statistika BPS) yang di-crop rapi dengan resolusi tinggi.
     - Pertanyaan inti soal berukuran font 15px dengan rendering rumus KaTeX bersih.
   - **Bento Card Kanan (Interaksi Opsi & Bedah Solusi Lengkap):**
     - Pilihan jawaban A-E dengan penanda hijau terang pada kunci jawaban yang benar.
     - Mode Kategori (Benar/Salah) untuk butir soal matriks tipe UTBK modern.
     - Kotak langkah penyelesaian lengkap langkah demi langkah (*step-by-step mathematical derivation*).
     - Kotak Konsep Kunci & Rumus KaTeX dengan tombol interaktif *"Buat modul teori dari konsep ini"*.
     - Kotak Trik Cepat & Shortcut Waktu (ikon petir hijau).
     - Kotak Radar Jebakan & Kesalahan Umum Pengecoh (ikon segitiga peringatan oranye).
4. **Bottom Stepper & Keyboard Navigation:**
   - Navigasi melompat instan via tombol keyboard panah `ArrowLeft` dan `ArrowRight`.
   - Tombol *"Soal Sebelumnya"* dan *"Soal Berikutnya"*.
5. **View Mode Switcher:**
   - Toggle instan antara **Mode Bento Fokus** (1 nomor di panggung, tanpa scroll vertikal) dan **Mode Daftar Penuh** (tampilan linier ke bawah untuk kebutuhan preview/print).
6. **Mobile Ergonomics:**
   - Di layar HP (<768px), Bento Grid otomatis menyatu secara proporsional dengan lebar 100% tanpa ada overflow horizontal. Pengguna hanya perlu menggeser rail atas atau menekan tombol navigasi bawah untuk berpindah soal.

---

### 6.6 Latihan Kuis CBT (`QuizTab.tsx`)
Antarmuka simulasi ujian resmi berbasis komputer (CBT):
- **Full-Bleed CBT Layout:** Layar fokus bebas distraksi sidebar.
- **Timer Countdown Ujian:** Menghitung mundur sisa waktu pengerjaan.
- **Tipe Soal yang Didukung:**
  - Pilihan Ganda Tunggal (Single Choice A-E).
  - Pilihan Ganda Kompleks (MCMA - Multiple Correct Choices).
  - Soal Kategori / Asosiatif (Menentukan Benar atau Salah pada tiap pernyataan tabel).
- **Evaluasi & Feedback Instan:** Setelah menjawab, kunci jawaban dan pembahasan langsung terbuka.
- **Confetti Celebration:** Letupan efek partikel confetti saat pengguna meraih skor sempurna atau lulus ambang batas target.
- **Pencatatan Otomatis ke Bank Salah:** Setiap butir yang salah langsung dikirim ke `mistake_notebook` untuk siklus revisi.

---

### 6.7 Bank Soal Salah (`MistakesTab.tsx`)
Buku catatan pintar untuk mencegah terulangnya kesalahan (*zero relapse on exam slips*):
- **Filter Berdasarkan Subtes:** Mengelompokkan salah hitung aljabar, salah analisis grafik, atau miskonsepsi teori.
- **Kartu Review Interaktif:** Menampilkan kembali soal asli, jawaban salah yang dipilih pengguna, dan kunci yang benar.
- **Tombol "Tandai Selesai / Paham" (`resolved`):** Memindahkan soal dari antrean aktif ke arsip tuntas setelah pengguna menguasai mekanismenya.

---

### 6.8 Flashcards Atomik (`FlashcardsTab.tsx`)
Sistem pengulangan berjeda (*Spaced Repetition System / Leitner Box*):
- **Prinsip 1 Kartu 1 Fakta:** Tiap kartu hanya memuat 1 konsep tunggal tanpa kebocoran petunjuk.
- **3D Flip Card:** Animasi kartu membalik saat diklik untuk memeriksa sisi depan (pertanyaan/konsep) dan sisi belakang (jawaban/rumus).
- **5 Kotak Penguasaan (Leitner Box 1 s/d 5):** Kartu yang dijawab benar akan naik level kotak, kartu yang salah akan kembali ke Kotak 1.

---

### 6.9 Uji Feynman (`FeynmanTab.tsx`)
Modul menguji penguasaan materi melalui pengajaran mandiri:
- **Alur Kerja:**
  1. Pengguna memilih satu topik atau rumus dari dokumen.
  2. Pengguna mengetik atau merekam penjelasan konsep tersebut menggunakan bahasa sendiri yang paling sederhana.
  3. Mesin evaluasi AI menganalisis penjelasan berdasarkan 4 rubrik:
     - *Kejelasan Bahasa:* Bebas dari jargon berputar-putar.
     - *Ketepatan Konsep:* Bebas dari kesalahan hitung atau miskonsepsi.
     - *Kelengkapan Komponen Inti:* Menjelaskan seluruh bagian rumus/teori.
     - *Deteksi Celah (Gap Analysis):* Memberi tahu secara spesifik bagian konsep mana yang belum terjelaskan dengan benar.

---

### 6.10 Tanya Nara AI Panel (`TanyaNaraPanel.tsx` / `ChatTab.tsx`)
Panel pendamping belajar yang siaga 24 jam:
- **Mode Tampilan:** Dapat dibuka sebagai tab obrolan mandiri atau sebagai panel samping (*dockable drawer*) saat membaca materi.
- **Karakter Jawaban:**
  - Kalimat ringkas, lembut, dan to the point.
  - Penurunan rumus step-by-step menggunakan blok KaTeX yang rapi.
  - Menerapkan hukum *anti-analogi dunia nyata* (penjelasan literal fungsional).
- **Context-Aware:** Nara secara otomatis menyertakan konteks segmen materi aktif yang sedang dibaca pengguna.

---

### 6.11 Multiplayer Study Room (`RoomModal.tsx` & `server/routes/rooms.js`)
Fitur kompetisi dan belajar bersama secara realtime:
- **Pembuatan Ruang:** Host membuat ruangan, memilih dokumen soal, dan mengatur jumlah butir ujian (5, 10, atau 20 butir).
- **Kode Bergabung:** Peserta dapat masuk menggunakan 6 karakter kode unik ruang.
- **Lobi Sinkronisasi:** Menampilkan daftar nama peserta, warna avatar, dan tombol status "Siap" (*Ready*).
- **Live CBT Race:** Seluruh peserta mengerjakan soal yang sama secara bersamaan dengan papan skor (*live leaderboard*) yang terupdate setiap ada jawaban masuk.

---

### 6.12 Daftar Modal & Drawer Pendukung
1. **`AuthModal.tsx`:** Modal masuk, daftar akun baru, atau *Quick Register Guest* (masuk instan tanpa email rumit).
2. **`ProfileModal.tsx`:** Mengubah nama, kelas sekolah, warna tema avatar, dan target jumlah hari belajar mingguan.
3. **`StagingUploadModal.tsx`:** Drag-and-drop tray untuk mengunggah berkas PDF, DOCX, PPTX, gambar, memilih model AI eksekutor, serta memilih tujuan dokumen (Materi Ringkas vs Lembar Bedah Soal).
4. **`YouTubeModal.tsx`:** Memasukkan URL video YouTube untuk diambil transkrip teksnya secara otomatis dan diubah menjadi rangkuman bab.
5. **`FormulaDrawer.tsx`:** Contekan cepat kumpulan rumus matematika dan ekonomi yang dapat ditarik dari sisi layar kapan saja.
6. **`TimerAlarmModal.tsx`:** Notifikasi pop-up ketika sesi belajar 10 menit atau 25 menit selesai dengan efek audio pengingat istirahat.
7. **`TopicModal.tsx`:** Generator bab materi baru dari satu sub-topik tertentu.
8. **`EnrichModal.tsx`:** Menambahkan materi pengayaan eksternal ke dalam dokumen yang sedang aktif.

---

## 7. Referensi Lengkap API Endpoint

### 7.1 Dokumen & Ingestion (`/api/documents`)
- `GET /api/documents` ➔ Mengambil seluruh daftar dokumen tersimpan.
- `GET /api/documents/:id` ➔ Mengambil detail dokumen lengkap beserta ringkasan.
- `POST /api/documents/upload` ➔ Mengunggah berkas base64 (PDF/DOCX/PPTX/gambar), mengekstrak teks OCR, dan memicu pipeline latar belakang.
- `DELETE /api/documents/:id` ➔ Menghapus dokumen beserta kuis, flashcard, dan segmennya.

### 7.2 Kuis & Ujian (`/api/quizzes`)
- `GET /api/quizzes?docId=:id` ➔ Mengambil daftar soal kuis untuk dokumen tertentu.
- `POST /api/quizzes/generate` ➔ Meminta AI menyusun set soal kuis baru dari teks materi.
- `POST /api/quizzes/evaluate` ➔ Memvalidasi jawaban kuis pengguna dan merekam salah ke notebook.

### 7.3 Flashcards & Formula (`/api/flashcards`, `/api/cheatsheet`)
- `GET /api/flashcards?docId=:id` ➔ Mengambil kartu flashcard per dokumen.
- `POST /api/flashcards/review` ➔ Mengupdate status kotak Leitner kartu setelah direview.
- `GET /api/cheatsheet?docId=:id` ➔ Mengambil daftar formula KaTeX dokumen.

### 7.4 Bank Soal Salah (`/api/mistakes`)
- `GET /api/mistakes?userId=:uid` ➔ Mengambil seluruh daftar butir soal yang pernah dijawab salah.
- `PATCH /api/mistakes/:id/resolve` ➔ Menandai butir salah telah dikuasai dan diselesaikan.

### 7.5 Uji Feynman & AI Chat (`/api/feynman`, `/api/chat`)
- `POST /api/feynman/evaluate` ➔ Mengirim penjelasan pengguna dan menerima evaluasi 4 rubrik.
- `POST /api/chat/stream` ➔ Streaming respon AI Nara dengan konteks materi aktif.

### 7.6 Ruang Belajar Multiplayer (`/api/rooms`)
- `POST /api/rooms/create` ➔ Membuat ruang kuis baru.
- `GET /api/rooms/:id` ➔ Mengambil state ruang, peserta, dan skor realtime.
- `POST /api/rooms/:id/join` ➔ Bergabung ke ruang menggunakan user ID.
- `POST /api/rooms/:id/ready` ➔ Mengubah status kesiapan peserta.
- `POST /api/rooms/:id/answer` ➔ Mengirim jawaban live kuis dan memperbarui leaderboard.

### 7.7 Autentikasi & Pengguna (`/api/auth`, `/api/users`)
- `POST /api/auth/register` ➔ Pendaftaran akun baru.
- `POST /api/auth/login` ➔ Login dan penerbitan token sesi.
- `GET /api/users/:id/profile` ➔ Mengambil profil, XP, rekam streak, dan target mingguan.
- `PATCH /api/users/:id/profile` ➔ Memperbarui target mingguan dan atribut profil.

---

## 8. Panduan Desain & Token Antarmuka

| Token / Elemen | Nilai / Spesifikasi | Penggunaan |
| :--- | :--- | :--- |
| **Parchment White** | `#fcfdfa` | Background kanvas utama aplikasi & landing |
| **Forest Dark** | `#18221f` | Warna teks utama, header bar gelap, button primer |
| **Electric Lime** | `#c8f064` | Aksen tombol primer, badge aktif, kontras tinggi |
| **Olive Green** | `#4b6623` / `#3f6212` | Kicker section, sub-header materi, status tuntas |
| **Sage Border** | `#dce2da` / `#e2e8df` | Garis batas tipis 1px pada kartu dan tabel bento |
| **Muted Slate** | `#56615d` / `#78857f` | Teks keterangan pendukung dan metadata waktu |
| **Danger / Pitfall** | `#c2410c` / `#fee2e2` | Kotak peringatan radar jebakan soal |
| **Kunci Benar** | `#166534` / `#dcfce7` | Latar belakang opsi kunci jawaban benar |
| **Font Utama** | `'Inter', sans-serif` | Keterbacaan teks paragraf, opsi, dan menu |
| **Font Heading** | `'Syne', sans-serif` | Judul hero landing page dan judul seksi besar |
| **Font Monospace** | `'DM Mono', monospace` | Angka nomor soal, KaTeX label, timer, dan status chip |
