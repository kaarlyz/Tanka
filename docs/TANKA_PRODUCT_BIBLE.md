# 🐴 TANKA — PRODUCT BIBLE (CANONICAL SPECIFICATION)

> **Dokumen ini adalah referensi otoritatif tunggal (*single source of truth*) mengenai identitas, arsitektur, kapabilitas, alur kerja, dan batasan produk Tanka.** Dokumen ini disusun secara lengkap dan mandiri (*self-contained*) agar AI eksternal, desainer, maupun pengembang dapat memahami seluruh produk tanpa memerlukan akses langsung ke repository kode.

---

## 1. Identitas, Visi & Positioning Produk

### 1.1 Apa Itu Tanka?
**Tanka** adalah **AI Autonomous Study Platform & Anti-Slop Learning Cockpit** yang dirancang khusus untuk mentransformasi materi belajar mentah—mulai dari buku teks tebal, modul PDF 200 halaman, slide presentasi dosen, rekaman video kuliah YouTube 2 jam, hingga lembar soal ujian (CBT/tryout)—menjadi unit-unit pemahaman atomik yang terstruktur, bebas distorsi, dan siap dikuasai secara mandiri.

Tanka memadukan pedagogi fungsional literal, kecerdasan buatan terkalibrasi multi-tahap, dan antarmuka berkecepatan tinggi dengan filosofi visual *paper-ledger* yang menolak degradasi kualitas (*anti-slop*).

### 1.2 Masalah Fundamental Belajar yang Diselesaikan
1. **Beban Kognitif Berlebih (*Cognitive Overload*):** Siswa sering kali dihadapkan pada materi ratusan halaman atau video berjam-jam tanpa struktur prasyarat yang jelas, menimbulkan *paralysis* sebelum mulai belajar.
2. **Distorsi Ilusi Kompetensi (*Illusion of Competence*):** Membaca pasif atau menonton video tutorial sering membuat siswa merasa sudah paham, padahal belum mampu menyelesaikan soal secara mandiri saat ujian tiba.
3. **Kelelahan Visual & Scrolling Tak Berujung (*Endless Scroll Fatigue*):** Mayoritas platform belajar digital menumpuk puluhan butir soal atau bab panjang dalam satu halaman vertikal tanpa batas, mengakibatkan hilangnya fokus dan kelelahan mental (*decision fatigue*).
4. **Distraksi & Monetisasi Agresif:** Platform edukasi komersial modern dipenuhi iklan popup, sistem gamifikasi dangkal yang adiktif, serta pelacak privasi yang mengorbankan ketenangan belajar.
5. **Penjelasan Mengambang & Analogi Palsu:** Tutor generik atau AI standar kerap memberikan analogi dunia nyata yang tidak relevan (seperti mengibaratkan matematika dengan kasir restoran), alih-alih menurunkan langkah aljabar dan konsep formal yang sesungguhnya diuji di lembar ujian.

### 1.3 Value Proposition Utama
- **Materi Mentah Menjadi Modul 3 Menit:** Otomatis memecah silabus panjang menjadi bab-bab kecil (*digestible chapters*) yang dapat diselesaikan dalam 3 hingga 5 menit.
- **Bedah Lembar Soal 4-Tahap Deterministik:** Mengubah lembar PDF ujian mentah menjadi antarmuka latihan interaktif lengkap dengan langkah matematis terperinci, trik cepat, dan radar jebakan pembuat soal (*pitfall detector*).
- **Pendamping Belajar Nara AI Siaga 24 Jam:** Tutor pribadi yang merespons pertanyaan konsep atau rumus serumit apa pun menggunakan penurunan langkah demi langkah (KaTeX) secara literal, fungsional, dan bebas penghakiman.
- **Siklus Belajar Tuntas (Input $\rightarrow$ Pahami $\rightarrow$ Uji $\rightarrow$ Evaluasi $\rightarrow$ Kuasai):** Ekosistem tertutup yang mencakup pembaca materi, peta saraf konsep (*Interactive Mind Map*), kuis CBT, bank soal salah otomatis (*Mistake Notebook*), kartu flashcard Leitner, dan uji Feynman.
- **100% Bebas Iklan & Mengutamakan Privasi:** Menggunakan arsitektur server lokal mandiri, kompresi data Brotli/Gzip efisien, serta kemampuan offline PWA.

### 1.4 Target Pengguna
1. **Siswa SMA Kelas XII (Prioritas Tertinggi):** Persiapan intensif Tes Kemampuan Akademik (TKA SMA: Matematika Wajib, Sosiologi, Ekonomi, Bahasa Indonesia, Bahasa Inggris) dan Seleksi Nasional Berdasarkan Tes (UTBK-SNBT).
2. **Mahasiswa Tingkat Awal/Akhir:** Menelaah jurnal ilmiah bahasa Inggris/Indonesia, merangkum slide perkuliahan tebal, dan menyusun peta konsep penelitian.
3. **Pejuang Kampus / Gap Year:** Belajar mandiri terarah dengan disiplin ritme tinggi tanpa biaya bimbingan belajar (bimbel) jutaan rupiah.

---

## 2. Filosofi Desain & Pedagogi (The Tanka Laws)

### 2.1 Filosofi Visual: Paper-Ledger Aesthetic (Anti-Slop)
Tanka menolak tren antarmuka SaaS modern yang dipenuhi gradien ungu-neon murahan, bayangan tebal melayang, dan elemen dekoratif tanpa fungsi.
- **Karakter Kertas Arsip:** Kanvas utama menggunakan warna *parchment warm white* (`#fcfdfa`) yang meniru kenyamanan membaca buku fisik di bawah pencahayaan hangat.
- **Kontras Tipografi Editorial:** Teks utama menggunakan warna *forest dark / deep charcoal* (`#18221f`) yang tegas dengan ketajaman keterbacaan tinggi.
- **Aksen Terarah (High-Signal Accents):** Aksen *electric lime* (`#c8f064`) dan *olive green* (`#4b6623`) hanya digunakan pada status aktif, tombol panggilan aksi primer, dan indikator keberhasilan.
- **Garis Pembatas Halus (Subtle Sage Borders):** Struktur antarmuka dipisahkan oleh garis tipis 1 piksel bernuansa *muted sage* (`#dce2da` / `#e2e8df`), menciptakan hierarki data yang terorganisir seperti buku kas akuntansi klasik (*ledger*).

### 2.2 Pedagogi Fungsional Literal (Hukum Anti-Analogi Dunia Nyata)
Dalam menjelaskan rumus, konsep sains, maupun ilmu sosial, sistem dan AI Tutor Nara **DILARANG KERAS menggunakan analogi fiktif dunia nyata** (misalnya: "ibarat pipa air yang mengalir", "seperti kasir di minimarket", "seperti mobil yang melaju di jalan tol").
- **Alasan Pedagogis:** Siswa yang mempersiapkan ujian nasional dan UTBK membutuhkan pemahaman murni mengenai alur eksekusi variabel, hubungan matematis, dan definisi ilmiah formal. Analogi buatan sering kali membiaskan sifat asli konsep dan runtuh ketika dihadapkan pada soal variasi HOTS (*Higher Order Thinking Skills*).
- **Standar Penjelasan Tanka:** Penjelasan wajib 100% literal berbasis penggunaan fungsional: urutan langkah penurunan matematis, substitusi variabel, bukti kutipan teks sumber, dan peta klasifikasi struktural.

### 2.3 Ergonomi Kognitif: Horizontal Bento Stage (Anti-Endless Scroll)
Pada antarmuka bedah lembar ujian (`ExamDrillView`), Tanka mengeliminasi kebiasaan buruk halaman web yang menjejalkan 30-50 butir soal secara vertikal ke bawah.
- **Panggung Bento 2 Kolom:** Hanya satu butir soal yang ditampilkan di atas panggung dalam satu waktu. Kolom kiri memuat narasi stimulus, pertanyaan, dan aset gambar visual asli; kolom kanan memuat pilihan jawaban interaktif, penurunan langkah matematis, trik cepat, dan radar jebakan.
- **Rel Stepper Horizontal:** Navigasi antar nomor soal dilakukan melalui rel tombol horizontal di bagian atas dengan penanda visual status butir (nomor, tipe soal, ada gambar, ada jebakan) atau melalui tombol panah keyboard (`ArrowLeft` / `ArrowRight`).

### 2.4 Ritme Belajar 10/10 (Pomodoro Adaptif)
Tanka mengintegrasikan pengatur waktu fokus bawaan dengan ritme 10 menit fokus penuh dan 10 menit jeda refleksi (atau 25/5 standar). Ritme ini disesuaikan untuk menjaga ketahanan mental siswa saat memecahkan soal berkonsentrasi tinggi tanpa mengalami *burnout*.

---

## 3. Arsitektur Sistem & Spesifikasi Teknis

### 3.1 Ringkasan Teknologi
- **Frontend Framework:** React 19 dengan TypeScript 5.8, dibundel menggunakan Vite 8.3.
- **Styling Architecture:** Pure Vanilla CSS berstruktur modular dengan CSS Custom Properties yang terisolasi (`landing.css`, `landing-motion.css`, `index.css`).
- **Motion & Micro-interactions:** Motion for React (`motion/react`), Lenis smooth inertial scrolling, CSS 3D Transforms, Web Animations API, Canvas Confetti.
- **Rendering Formula & Dokumen:** KaTeX via `remark-math` + `rehype-katex`, `react-markdown`, `remark-gfm`. Cache formula sisi klien (`katexCache.ts`) untuk latensi rendering sub-milidetik.
- **Backend Runtime:** Node.js native `http` server (arsitektur modular tanpa framework Express berat, menyajikan kompresi Brotli `br` dan Gzip secara otomatis).
- **Database Engine:** SQLite 3 via `better-sqlite3` dengan mode Write-Ahead Logging (WAL) dan foreign keys aktif untuk integritas relasional tinggi.
- **Pipeline Ekstraksi & OCR:** Python 3 (Poppler `pdftotext`, `pdftoppm`, `pdfimages`, `tesseract-ocr` LSTM engine `ind+eng`).
- **AI Gateway & LLM Orchestration:** Terhubung melalui 9Router HTTP Proxy menuju model Gemini 3.8 Flash (High/Med/Low), Gemini 3.7 Flash, dan Claude 3.5 Sonnet.
- **Distribusi Jaringan:** Cloudflare Quick Tunnel (`cloudflared`) menyajikan PWA multi-perangkat melalui HTTPS publik.

### 3.2 Diagram Aliran Data Sistem (End-to-End System Flow)

```text
               ┌────────────────────────────────────────────────────────┐
               │                    SUMBER BELAJAR MENTAH               │
               │  (PDF Digital/Scanned, Word DOCX, PPTX, YouTube, Teks) │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        UNIVERSAL INGESTION & PROCESSING ENGINE                         │
│                                                                                        │
│  [Content-Addressable Cache (SHA-256)] ──(Hit: <1s)──> [Gunakan Dokumen DB Langsung]   │
│                   │ (Miss)                                                             │
│                   ▼                                                                    │
│  [Ekstraksi Teks Hybrid] ➔ pdftotext / Tesseract OCR (8-Worker Pool)                   │
│  [Zero-Token Heuristic Filter] ➔ Crop diagram/grafik ke /uploads/exam_images/          │
│  [Deteksi Tipe Dokumen] ➔ Deteksi apakah Dokumen Materi atau Lembar Soal Ujian        │
└───────────────────────────┬────────────────────────────────────────────┬───────────────┘
                            │                                            │
        (Jika Lembar Soal Ujian)                                (Jika Dokumen Teori/Materi)
                            │                                            │
                            ▼                                            ▼
┌───────────────────────────────────────┐    ┌───────────────────────────────────────────┐
│       AUTONOMOUS 4-STAGE CBT PIPELINE │    │       CURRICULUM & CONCEPT GRAPH PIPELINE │
│                                       │    │                                           │
│ 1. EXTRACT: Soal, Opsi, Stimulus, Gbr │    │ 1. Segmentasi Dokumen (`document_segments`)│
│ 2. SOLVE: 3× Multi-Vote LLM Consensus │    │ 2. Ekstraksi Konsep & Outline             │
│ 3. WRITE: Solusi KaTeX, Trik, Pitfall │    │ 3. Auto-Repair Coverage & Quality Audit   │
│ 4. VERIFY: Kalibrasi Kunci & Format   │    │ 4. Modular Chapter Plans (`chapter_plans`)│
│                                       │    │ 5. Concept Edges (`concept_edges` Graph)  │
└───────────────────┬───────────────────┘    └─────────────────────┬─────────────────────┘
                    │                                              │
                    ▼                                              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               DATABASE RELASIONAL SQLITE                               │
│  documents | document_segments | document_concepts | concept_edges | chapter_plans     │
│  quizzes   | mistake_notebook   | flashcards        | formula_cheatsheets | users      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           ANTARMUKA BELAJAR TANKA (REACT 19)                           │
│                                                                                        │
│  [Home Hub]            ➔ Dashboard progres, streak, aksi kilat                         │
│  [Material Reader]     ➔ Modul baca per bab 3 menit + KaTeX + Mind Map                 │
│  [Exam Drill View]     ➔ Bento Stage horizontal 2-kolom bedah soal ujian               │
│  [CBT Quiz Practice]   ➔ Simulasi ujian berwaktu (Single, MCMA, Kategori)              │
│  [Mistake Notebook]    ➔ Rekam otomatis butir salah & radar jebakan                    │
│  [Atomic Flashcards]   ➔ Kartu hafalan 3D flip 5-kotak Leitner                         │
│  [Feynman Test]        ➔ Uji pemahaman mandiri via teks/suara + evaluasi 4 rubrik      │
│  [Tanya Nara AI Panel] ➔ Pendamping belajar kontekstual 24 jam                         │
│  [Study Rooms]         ➔ Kompetisi kuis realtime multiplayer                           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Rincian Seluruh Modul & Fitur Sistem

Berikut adalah bedah tuntas seluruh fitur yang terimplementasi di dalam kode Tanka:

### 4.1 Ingestion & Processing Suite
1. **Multi-Format Document Upload:**
   - Mendukung format PDF (baik teks digital maupun hasil scan gambar), Word (`.docx`), PowerPoint (`.pptx`), dan citra langsung (`.png`, `.jpg`).
   - Penanganan otomatis: jika PDF memiliki teks $\ge 30$ karakter per halaman, sistem langsung mengekstrak teks via `pdftotext` secara instan. Jika berupa pindaian (halaman kosong/gambar), sistem mengalirkan halaman ke *batch raster rendering* (`pdftoppm`) lalu memproses OCR paralel dengan 8 thread worker Tesseract.
2. **Content-Addressable Caching (SHA-256):**
   - Sebelum memanggil model AI, backend menghitung SHA-256 hash dari teks mentah. Jika berkas yang sama pernah diunggah sebelumnya, data langsung diambil dari database tanpa jeda dan tanpa mengonsumsi kuota token API.
3. **Zero-Token Heuristic Visual Filter & Asset Cropping:**
   - Ekstraktor gambar `extract_text.py` membedah elemen grafis langsung di memori RAM (*tmpfs*).
   - Menggunakan filter heuristik 3 lapis untuk membuang artefak dekoratif Word/kop surat dan hanya menyimpan 3-5 diagram/grafik fungsional (seperti kurva ekonomi, fungsi kuadrat, infografis sosiologi) ke `/uploads/exam_images/`.
4. **YouTube Video Transcription & Modular Ingestion:**
   - Pengguna cukup memasukkan URL video YouTube (misalnya rekaman pembahasan soal atau kuliah 2 jam).
   - Skrip `extract_youtube.py` mengunduh transkrip teks resmi maupun transkrip otomatis, memfilter tag waktu, lalu menyajikannya ke pipeline ringkasan bab Tanka.
5. **Catatan Teks Kilat (Quick Free-Text):**
   - Pengguna dapat langsung menempel (*paste*) teks catatan singkat untuk diubah menjadi kuis dan flashcard instan tanpa perlu mengunggah berkas.

### 4.2 Autonomous 4-Stage CBT Exam Pipeline
Dirancang khusus untuk mengolah lembar soal ujian (TKA, UTBK, USBN):
- **Stage 1 (EXTRACT):** Memecah lembar soal menjadi butir-butir terstruktur: nomor soal, stimulus bacaan bersama, pertanyaan inti, opsi pilihan A-E, serta tautan ke diagram gambar hasil potong visual.
- **Stage 2 (SOLVE):** Menjalankan konsensus *3× Multi-Vote LLM* independen untuk menetapkan kunci jawaban objektif. Menghindari kesalahan kunci pada dokumen kisi-kisi mentah.
- **Stage 3 (WRITE):** Menghasilkan paket pembahasan HOTS komprehensif:
  - *Langkah Matematis:* Penurunan baris demi baris menggunakan KaTeX.
  - *Trik Cepat:* Jalan pintas eliminasi opsi atau metode substitusi kilat untuk menghemat waktu ujian.
  - *Analisis Opsi:* Alasan terperinci mengapa pilihan A, B, C, D, atau E tepat atau keliru.
  - *Radar Jebakan (Pitfall Detector):* Analisis titik kelemahan umum siswa (misal: lupa membalik tanda pertidaksamaan saat membagi bilangan negatif).
- **Stage 4 (VERIFY):** Memvalidasi indeks jawaban (0..4), memastikan opsi tidak terpotong, dan menandai butir yang berpotensi ambigu.

### 4.3 Curriculum, Modular Chapters & Concept Graph
1. **Segmentasi Dokumen & Ekstraksi Konsep Kanonikal:**
   - Memecah naskah menjadi segmen-segmen logis (`document_segments`), mengidentifikasi konsep-konsep kunci (`document_concepts`), kategori (`core`, `supporting`, `advanced`), dan bukti kutipan teks asli (`evidence_quote`).
2. **Auto-Repair Coverage & Quality Auditor:**
   - Algoritma `coverageValidator.js` memeriksa apakah seluruh konsep wajib telah terpetakan ke dalam rencana bab (`chapter_plans`). Jika ada konsep yang tercecer, sistem secara otomatis merevisi dan menyisipkan konsep tersebut ke bab yang relevan.
   - Algoritma `qualityAuditor.js` memastikan tidak ada kebocoran soal pilihan ganda di dalam teks bacaan dan menjamin keutuhan heading materi.
3. **Modular Chapter Plans (Materi Ringkas 3 Menit):**
   - Teks materi yang panjang dipecah menjadi modul-modul bab ringkas berdurasi baca 3 menit dengan pertanyaan pemantik (*trigger question*) dan target penguasaan konkret (*target goal*).
4. **Interactive Mind Map (Graf Saraf Materi):**
   - Layanan `conceptGraphService.js` membangun relasi prasyarat (*prerequisite*) dan relasi asosiasi antar konsep dalam bentuk graf terarah (`concept_edges`).
   - Dirender di antarmuka frontend sebagai kanvas graf interaktif yang dapat di-zoom, digeser, dan diklik untuk melihat definisi konsep.

### 4.4 Rendering Formula Eksak & Cheatsheet
1. **Normalisasi & Sanitasi KaTeX Universal:**
   - Modul `mathNormalizer.ts` dan `mathify.js` mengonversi seluruh variasi penulisan matematika (seperti `\(...\)`, `\[...\]`, lingkungan `\begin{aligned}`, `matrix`, `cases`) menjadi sintaks KaTeX standar (`$...$` dan `$$...$$`).
   - Memproteksi karakter pipa tabel GFM (`|`) di dalam rumus matematika agar tabel markdown tidak rusak.
   - Menggunakan cache formula lokal di browser untuk menjamin rendering formula mulus tanpa kedip (*flicker-free*).
2. **Drawer Contekan Rumus Cepat (Formula Drawer):**
   - Panel samping yang merangkum seluruh rumus matematika, fisika, atau ekonomi dari dokumen yang sedang dipelajari, siap diakses kapan saja saat mengerjakan latihan.

### 4.5 Evaluasi, Latihan & Penguatan Memori
1. **Antarmuka Ujian CBT Interaktif (Full-Bleed Quiz Tab):**
   - Antarmuka simulasi ujian modern dengan pengatur waktu hitung mundur.
   - Mendukung 3 format soal:
     - *Pilihan Ganda Tunggal (Single Choice)*: Memilih satu dari 5 opsi (A-E).
     - *Pilihan Ganda Kompleks (MCMA)*: Memilih lebih dari satu pernyataan yang benar.
     - *Soal Kategori / Matriks*: Menentukan status Benar atau Salah pada baris-baris pernyataan tabel.
   - Evaluasi instan dengan visual feedback warna (hijau untuk benar, merah untuk salah) dan letupan partikel konfeti (*Canvas Confetti*) saat lulus.
2. **Bank Soal Salah Pintar (Mistake Notebook):**
   - Setiap butir soal kuis yang dijawab salah oleh siswa secara otomatis direkam ke tabel database `mistake_notebook` tanpa perlu tindakan manual.
   - Dilengkapi filter berdasarkan subtes pelajaran, catatan jebakan yang memicu kekeliruan, dan tombol penanda "Tandai Paham" (`resolved`) setelah siswa mempelajari kembali pembahasannya.
3. **Kartu Flashcard Atomik (Leitner Spaced Repetition):**
   - Mengikuti kaidah ketat: **1 kartu hanya memuat 1 fakta/rumus atomik**.
   - Dilengkapi animasi balik 3 dimensi (*3D CSS Card Flip*).
   - Memiliki 5 tingkat kotak penguasaan (Kotak Leitner 1 hingga 5). Jawaban benar menaikkan level kartu, jawaban ragu/salah mengembalikan kartu ke Kotak 1.
4. **Uji Pemahaman Metode Feynman (Self-Explanation & Audio STT):**
   - Siswa menguji pemahamannya dengan menjelaskan suatu konsep menggunakan bahasa sehari-hari yang sederhana, baik melalui ketikan teks maupun rekaman suara langsung (ditranskripsikan via model STT Whisper).
   - Mesin evaluasi AI mengaudit penjelasan siswa berdasarkan 4 rubrik deterministik:
     1. *Kejelasan Bahasa:* Bebas dari pengulangan jargon kosong.
     2. *Ketepatan Konsep:* Bebas dari kesalahan logika atau miskonsepsi ilmiah.
     3. *Kelengkapan Komponen:* Mencakup seluruh elemen penting dari konsep terkait.
     4. *Deteksi Celah (Gap Analysis):* Menunjukkan bagian materi mana yang luput dijelaskan.

### 4.6 Pendamping Belajar Nara AI (Tanya Nara)
- **Karakter & Persona:** Nara bertindak sebagai tutor pribadi yang bersahabat, sabar, dan berpikiran runtut layaknya guru pembimbing di depan papan tulis.
- **Bebas Penghakiman:** Siswa bebas bertanya dari pertanyaan paling mendasar tanpa rasa takut dihakimi.
- **Konteks Reaktif:** Nara mengetahui secara presisi dokumen dan bab mana yang sedang dibuka oleh siswa, sehingga jawaban yang diberikan langsung merujuk pada materi terkait.
- **Penurunan Langkah Matematis Terperinci:** Nara memecah perhitungan kompleks menjadi tahapan-tahapan kecil yang jelas, lengkap dengan penjelasan alasan di balik setiap baris substitusi rumus.

### 4.7 Kolaborasi Multiplayer & Study Rooms
- Fitur ruang belajar bersama realtime (`study_rooms` dan `room_participants`).
- Host dapat membuat ruangan dengan 6 karakter kode unik, memilih paket kuis dokumen, dan menentukan batas durasi.
- Peserta bergabung, melakukan konfirmasi kesiapan (*ready check*), dan mengerjakan kuis bersamaan secara kompetitif dengan papan peringkat langsung (*live leaderboard score*).

### 4.8 Pelacak Progres, Gamifikasi Sehat & Profil
- **Target Belajar Mingguan:** Melacak konsistensi belajar pengguna (misal target 5 hari per minggu) dengan visual 7 titik hari yang menyala hijau saat ada aktivitas belajar.
- **Rentetan Hari Aktif (Streak Counter):** Mencatat rekam belajar berturut-turut untuk membangun disiplin harian.
- **Experience Points (XP) & Jam Belajar:** Akumulasi poin berdasarkan kuis yang diselesaikan dan menit belajar fokus yang tercatat.
- **Sistem Autentikasi Fleksibel:**
  - Login cepat mode tamu (*Guest Quick Access*).
  - Pendaftaran lokal menggunakan username dan password.
  - Verifikasi kode OTP nomor WhatsApp.
  - Login Google OAuth 2.0.

---

## 5. Karakter Produk & Persona Tutor Nara

### 5.1 Karakter Brand Tanka
Tanka mengusung kepribadian yang **tenang, presisi, berwibawa, dan dapat diandalkan**.
- Bukan platform yang berisik dengan efek suara kartun berlebihan atau maskot yang mengganggu.
- Tanka adalah *tempat kerja intelektual*—sebuah studio digital di mana seorang siswa dapat duduk dengan segelas air, membuka materi tersulitnya, dan menemukan kejelasan langkah demi langkah.

### 5.2 Bahasa Komunikasi & Copywriting Tanka
- **Bahasa Indonesia Bernuansa Percakapan Berkualitas:** Lugas, alami, bersahabat, dan dewasa tanpa terkesan kaku seperti surat keputusan resmi, namun juga tidak menggunakan bahasa gaul yang berlebihan.
- **Anti-Basa-Basi:** Menghindari pembuka klise seperti *"Halo sahabat pintar! Apakah kamu siap meraih masa depan cerah?"*. Langsung masuk ke nilai manfaat nyata: *"Ubah materi apapun, jadi langsung bisa dipahami."* atau *"Rumus dijelaskan langkah demi langkah."*
- **Penekanan pada Agensi Pengguna:** Tanka memposisikan siswa sebagai pengendali utama proses belajarnya (*active learner*). AI bukan pengganti berpikir, melainkan lensa pembesar yang memperjelas struktur materi.

### 5.3 Pedoman Karakter Tutor Nara
1. **Tenang dan Mendorong:** Tidak pernah meremehkan siswa yang belum paham. Jika siswa salah menjawab kuis, Nara menunjukkan letak titik kekeliruannya tanpa nada menyalahkan.
2. **Runtut dan Terstruktur:** Menyajikan informasi dalam blok-blok logis (Situasi konkret $\rightarrow$ Konsep formal $\rightarrow$ Penurunan rumus $\rightarrow$ Aplikasi pada soal).
3. **Penyajian Matematis Bersih:** Menghormati formalisme matematika dengan notasi KaTeX yang rapi.

---

## 6. Fakta Terverifikasi vs Klaim yang Harus Dihindari

Untuk menjaga integritas brand dan mencegah kekecewaan pengguna, LLM eksternal yang menyusun copywriting landing page **wajib mematuhi batasan kebenaran produk berikut**:

| Fitur / Topik | ✅ FAKTA AMAN & TERVERIFIKASI (Boleh Dipromosikan) | ❌ KLAIM SALAH / OVERCLAIM (Dilarang Digunakan) |
| :--- | :--- | :--- |
| **Kecepatan Input** | Respons antarmuka instan; navigasi soal cepat tanpa lag scrolling; render rumus sub-milidetik dengan cache browser. | "AI berpikir secepat kilat dalam 0.0001 milidetik" (LLM tetap membutuhkan waktu inferensi jaringan). |
| **Pemrosesan Dokumen** | Mendukung PDF scanned/digital, Word DOCX, PPTX, gambar, dan tautan video YouTube. | "Mendukung semua format berkas di seluruh dunia tanpa batasan ukuran." |
| **Keakuratan Kuis** | Menggunakan konsensus multi-vote 3× LLM untuk memverifikasi kunci jawaban dan meminimalisir kesalahan. | "Kuis 100% sempurna tanpa pernah ada kemungkinan ambigu." |
| **Penyimpanan Data** | Seluruh catatan belajar, bank soal salah, dan riwayat dokumen tersimpan aman di database SQLite lokal. | "Tersinkronisasi otomatis ke miliaran server blockchain terdesentralisasi." |
| **Iklan & Monetisasi** | 100% bebas dari banner iklan, tanpa pelacak pihak ketiga, tanpa interupsi pop-up komersial. | "Platform ini berjanji gratis selamanya sampai kiamat tanpa biaya server." |
| **Tutor AI Nara** | Siaga 24 jam untuk menjawab pertanyaan, menurunkan rumus, dan menjelaskan konsep materi yang diunggah. | "Nara adalah manusia asli yang duduk di balik layar menemani belajarmu." |
| **Dukungan Offline** | Dapat dibuka sebagai PWA di perangkat mobile dan desktop; materi yang sudah dimuat dapat dibaca saat offline. | "Bisa menghasilkan kuis AI baru dari materi baru saat perangkat sedang di tengah hutan tanpa sinyal internet." |

---

## 7. Glosarium Terminologi Produk Tanka

- **Bento Stage:** Tata letak panggung dua kolom asimetris pada mode bedah soal (`ExamDrillView`) yang menampilkan stimulus bacaan di sisi kiri dan panel interaksi solusi di sisi kanan.
- **Horizontal Stepper Rail:** Bilah navigasi nomor soal yang mengalir menyamping secara horizontal di bagian atas panggung soal.
- **Radar Jebakan (Maker Pitfall):** Catatan kewaspadaan taktis yang mendeteksi perangkap logika khas pembuat soal ujian nasional/UTBK.
- **Trik Cepat:** Metode jalan pintas atau teknik eliminasi cerdas untuk menyelesaikan soal dalam waktu kurang dari 60 detik.
- **1 Kartu 1 Fakta:** Standar pembuatan kartu flashcard atomik di mana satu kartu dilarang memuat lebih dari satu definisi atau hubungan konsep.
- **Kotak Leitner (Leitner Box):** Algoritma pengulangan berjeda 5 tingkat untuk menguji daya ingat jangka panjang.
- **Uji Feynman:** Metode pengujian penguasaan konsep melalui formulasi bahasa mandiri sederhana yang diuji oleh 4 rubrik evaluasi AI.
- **Paper-Ledger:** Gaya desain visual khas Tanka dengan palet kertas hangat, batas tipis bernuansa sage, dan tipografi editorial presisi tinggi.
- **Zero-Slop:** Prinsip rekayasa produk yang menolak fitur gimmick murahan, dekorasi berlebihan, dan bahasa marketing palsu.
