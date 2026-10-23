# 🎨 TANKA — LANDING PAGE DESIGN BRIEF & VISUAL ART DIRECTION

> **Dokumen ini adalah panduan terarah (*design brief & visual art direction*) bagi LLM dan desainer eksternal untuk mengembangkan, memperkaya, dan mentransformasi landing page Tanka.** 
> Template HTML/CSS dan komponen React yang sudah ada dijadikan fondasi awal. Tugasmu adalah memperkayanya dengan visualisasi bermakna, ilustrasi SVG kustom, grafik diagram interaktif, alur penceritaan kinestetik, dan tata letak editorial premium yang mencerminkan kecerdasan dan ketenangan belajar.

---

## 1. Tujuan Halaman & Target Audiens

### 1.1 Tujuan Utama Halaman (North Star Metric)
Landing page Tanka memiliki satu misi mutlak: **Mengubah keraguan siswa menjadi keyakinan rasional bahwa materi sesulit apa pun dapat mereka kuasai secara mandiri dalam waktu singkat.**
Landing page ini bukan brosur penjualan pasif, melainkan **pembuktian kerja (*proof of work*) interaktif**. Pengguna harus merasakan kejernihan pedagogi Tanka bahkan sebelum mereka menekan tombol daftar akun.

### 1.2 Profil Audiens & Kondisi Psikologis
1. **Siswa SMA Kelas XII (Pejuang TKA & UTBK-SNBT):**
   - *Kondisi Emosional:* Tertekan oleh deadline ujian, cemas menghadapi soal variasi HOTS, lelah dengan bimbingan belajar konvensional yang mahal dan melelahkan.
   - *Respon yang Diinginkan:* "Akhirnya ada platform yang langsung menurunkan rumus langkah demi langkah tanpa basa-basi."
2. **Mahasiswa Tingkat Awal / Akhir:**
   - *Kondisi Emosional:* Kewalahan membaca puluhan jurnal ilmiah tebal berbahasa Inggris dan slide dosen ratusan halaman.
   - *Respon yang Diinginkan:* "Ini alat yang tepat untuk memecah silabus tebal jadi modul 3 menit dan peta konsep."
3. **Pejuang Kampus / Gap Year:**
   - *Kondisi Emosional:* Mandiri, hemat biaya, membutuhkan disiplin dan bank soal salah yang rapi untuk mencegah kesalahan berulang.

---

## 2. Identitas Visual & Bahasa Desain (Paper-Ledger Aesthetic)

Tanka menganut filosofi visual yang disebut **Paper-Ledger Aesthetic (Anti-Slop)**:

### 2.1 Makna Filosofis
- **Bukan Balon AI Generik:** Mayoritas SaaS AI saat ini terlihat seragam: latar belakang hitam gelap dipenuhi gradien ungu neon, lingkaran cahaya melayang (*glow blobs*), dan kartu melengkung tebal yang terasa seperti mainan anak-anak.
- **Buku Kas Intelektual (*The Intellectual Ledger*):** Tanka terinspirasi dari buku catatan arsip klasik, kertas kalkir arsitektur, dan tipografi buku teks matematika Oxford/Cambridge. Nuansanya tenang, teratur, terukur, dan menghormati ketenangan kognitif siswa.

### 2.2 Palet Warna & Token Visual

| Token Desain | Nilai Heksadesimal | Peran & Penggunaan |
| :--- | :--- | :--- |
| `--bg-main` | `#fcfdfa` | Kanvas dasar putih kertas hangat (*warm parchment*). Menghilangkan silau putih murni `#ffffff`. |
| `--color-ink` | `#18221f` | Warna teks utama, batas tebal editorial, latar belakang tombol primer, dan kartu gelap penegas (*deep charcoal*). |
| `--accent-lime` | `#c8f064` | Aksen sinyal tinggi (*electric lime*). Hanya digunakan pada titik fokus utama: tombol CTA primer, badge aktif, dan indikator kunci sukses. |
| `--accent-olive`| `#4b6623` / `#3f6212` | Warna sekunder editorial: kicker section, teks penjelasan ilmiah, status tuntas. |
| `--border-sage` | `#dce2da` / `#e2e8df` | Garis batas tipis 1px pada kartu, pemisah tabel, dan rel nomor soal. |
| `--text-muted`  | `#56615d` / `#78857f` | Teks keterangan sekunder, metadata durasi baca, dan label formula. |
| `--surface-subtle` | `#f4f6f1` / `#eff2ec` | Latar belakang kartu sekunder, header bento, dan chip kategori. |
| `--danger-tint` | `#c2410c` / `#fef2f2` | Aksen peringatan radar jebakan (*pitfall detector*). |
| `--success-tint`| `#166534` / `#f0fdf4` | Latar belakang kunci jawaban benar. |

### 2.3 Tipografi Bertingkat (Typography Stack)
- **Display & Section Headers:** `'Syne', -apple-system, sans-serif;` (Bobot: 700 & 800). Karakter huruf geometris dengan sudut tegas, memberikan aura modern, cerdas, dan arsitektural.
- **Body & Paragraphs:** `'Inter', -apple-system, sans-serif;` (Bobot: 400, 500, 600). Keterbacaan tinggi untuk membaca naskah panjang tanpa kelelahan mata.
- **Monospace, Labels & Math:** `'DM Mono', 'Fira Code', monospace;` (Bobot: 400, 500). Digunakan pada nomor soal, status chip, rumus KaTeX, durasi timer, dan metadata teknis.

---

## 3. Audit Template Desain Saat Ini & Rencana Evolusi

Dari implementasi aktual pada `src/components/landing/` dan `page.md`:

### 3.1 Bagian yang Harus Dipertahankan (Kekuatan Utama)
1. **Asymmetric Hero Split:** Proporsi teks headline tajam di kiri dan simulator live interaktif di kanan terbukti efektif menangkap perhatian.
2. **Karakter Simulator Nara (`SimulatorNaraCard`):** Interaksi mengetik pertanyaan dan melihat jawaban matematika beranimasi langkah demi langkah adalah nyawa dari landing page.
3. **Kartu Komparasi 3D Flip (`ComparisonLedger`):** Perbandingan cara lama vs Tanka menggunakan format kartu flashcard yang dapat dibalik sangat relevan dengan fitur asli Tanka.
4. **Dock Cockpit 4 Tab (`StudioCockpit`):** Mengganti tab fitur secara interaktif dengan sinkronisasi screenshot mockup.

### 3.2 Bagian yang Harus Ditingkatkan & Diperkaya
1. **Visual Dataflow Transisi (Antara Hero & Cockpit):** `HeroGraphic.tsx` saat ini masih berupa SVG sederhana. Perlu dikembangkan menjadi **ilustrasi alur data interaktif** yang lebih kaya detail (misal: visualisasi halaman PDF yang terurai menjadi simpul-simpul konsep bercahaya).
2. **Interactive Knowledge Graph Playground:** Bagian Peta Saraf saat ini baru berupa tangkapan layar statis. Sangat potensial dibuatkan **mini kanvas graf interaktif** di mana pengguna dapat mengarahkan mouse (*hover*) ke simpul untuk melihat garis relasi beranimasi.
3. **Interactive Bento Stage Preview:** Menampilkan cuplikan interaktif dari mode bedah soal (`ExamDrillView`) di mana pengguna bisa mengklik rel nomor soal `#1`, `#2`, `#3` dan melihat panggung bento berganti secara instan di landing page.
4. **Formula KaTeX Live Interactive Toggle:** Memberikan demonstrasi di mana rumus matematika rumit dapat diklik untuk membuka penjelasan breakdown tiap variabelnya.

---

## 4. Struktur Narasi Halaman (Scroll Storytelling Framework)

Landing page Tanka dirancang mengalir sebagai satu narasi utuh dari rasa penasaran hingga keyakinan penuh:

```text
[1. NAVIGATION BAR] ➔ Logo Box Monogram, Anchor Jump Links, CTA Buka Aplikasi
        │
        ▼
[2. THE PROVOCATION & LIVE PROOF (HERO)] 
    Headline Tajam + Nara Simulator Interaktif (Ketik rumus langsung lihat jawaban KaTeX)
        │
        ▼
[3. DATAFLOW TRANSITION GRAPHIC]
    Materi Mentah (PDF/Video/Slide) terpecah rapi masuk ke Nara dan keluar jadi modul 3 menit
        │
        ▼
[4. RUNNING MARQUEE TICKER]
    Pernyataan Nilai Berkesinambungan (Tanpa Iklan, Deterministik, KaTeX Rapi)
        │
        ▼
[5. THE PARADIGM SHIFT (COMPARISON LEDGER)]
    4 Flashcard 3D Flip: Friksi Belajar Lama vs Cara Kerja Tanka (+ Master Flip Switch)
        │
        ▼
[6. THE STUDIO COCKPIT (CORE CAPABILITIES)]
    Dock 4 Instrumen: Rangkum Video & PDF, Kuis & Bank Salah, Peta Saraf, Tutor Nara
        │
        ▼
[7. THE STEPPER JOURNEY (4-STEP PROGRESSION)]
    01 Input Bahan ➔ 02 Baca Ringkas ➔ 03 Tanya Tutor ➔ 04 Uji Pemahaman
        │
        ▼
[8. REAL HUMAN PROOF (PERSONAS & AUDIT LEDGER)]
    3 Profil Pejuang Belajar (Siswa SNBT, Mahasiswi Biologi, Gap Year) + 3D Tilt Card
        │
        ▼
[9. CLOSING CALL TO ACTION & ARCHITECTURE COMMITMENT]
    High-Contrast Dark Canvas + Electric Lime Magnetic CTA + Zero-Distraction Footer
```

---

## 5. Katalog Peluang Visual, Ilustrasi SVG & Interaksi Mikro Per Fitur

Berikut panduan detail untuk memperkaya visual setiap seksi:

### 5.1 Hero Section & Nara Simulator Playground
- **Tantangan:** Pengguna internet memiliki *attention span* 3 detik. Mereka tidak ingin membaca paragraf panjang untuk mengerti fungsi produk.
- **Peluang Visual & Interaksi:**
  - *Headline Mask Reveal (`SplitWords`):* Teks headline *"Ubah materi apapun, jadi langsung bisa dipahami."* muncul kata per kata dengan transisi vertikal yang anggun.
  - *Interactive Math Formula Chip:* Sediakan preset chip interaktif di atas simulator: `[Irisan Himpunan A ∩ B]`, `[Turunan Trigonometri]`, `[Kurva Permintaan Sosiologi-Ekonomi]`.
  - *Kinetic Derivation Stream:* Saat chip diklik, kotak chat Nara mengetikkan penjelasan baris demi baris, disusul pembungkus rumus KaTeX yang muncul dengan animasi fade-up halus.
  - *Badge Latensi Instan:* Sematkan chip kecil di sudut simulator bertuliskan `Nara Engine: Siaga • Response sub-0.2ms`.

### 5.2 Animated Dataflow Graphic (Jembatan Transisi)
- **Tantangan:** Menggambarkan bagaimana naskah PDF 200 halaman dan video YouTube 2 jam dapat diolah secara cerdas tanpa membuat pengguna merasa materi tersebut "dipotong sembarangan".
- **Peluang Visual & SVG:**
  - *SVG Pathway:* 3 jalur input di sisi kiri (Ikon PDF, Ikon Video YouTube merah, Ikon Slide presentasi) mengalirkan titik-titik data (*data pulses*) berwarna *electric lime* dan *forest olive* menuju inti pemrosesan Nara di tengah.
  - *The Nara Core Node:* Simbol kotak monogram Tanka yang berdenyut pelan (*subtle breathing pulse*).
  - *The 3-Minute Output Modules:* Dari simpul Nara, jalur memancar ke sisi kanan menghasilkan 3 kartu mini modul bertuliskan `Bab 1: Definisi & Prasyarat (3 mnt)`, `Bab 2: Penurunan Rumus (4 mnt)`, dan `Bab 3: Latihan Kuis (3 mnt)`.

### 5.3 Comparison Ledger (3D Flip Flashcards)
- **Tantangan:** Memperlihatkan kontras yang tajam antara penderitaan belajar konvensional vs pengalaman di Tanka.
- **Peluang Visual & Interaksi:**
  - *Kartu Sisi Depan (Friksi Lama):* Latar abu-abu kertas usang (`#f4f6f1`), ikon silang merah halus, teks keluhan yang sangat nyata (misal: *"Video YouTube 2 Jam: Baru tonton 15 menit sudah mengantuk, materi inti baru muncul di menit ke-90"*).
  - *Kartu Sisi Belakang (Solusi Tanka):* Latar *forest charcoal* gelap (`#18221f`) atau putih bersih dengan aksen *electric lime*, ikon centang hijau tegas, teks solusi presisi (misal: *"Pecah Jadi Bab 3 Menit: Otomatis diambil transkrip intinya, langsung lompat ke konsep yang diuji"*).
  - *3D Flip Perspective:* Menggunakan `transform: rotateY(180deg)` dengan bayangan dinamis yang meluas saat kartu berputar.
  - *Master Toggle Switch:* Tombol dengan ikon mata di header seksi bertuliskan *"Bandingkan Semua Sekaligus"* yang membalik ke-4 kartu secara bersamaan dengan efek riak (*staggered delay*).

### 5.4 Studio Cockpit (Interactive Capability Matrix)
- **Tantangan:** Memperlihatkan bahwa Tanka adalah sistem lengkap (*all-in-one study engine*), bukan cuma chat wrapper.
- **Peluang Visual & Interaksi:**
  - *Bento Tab Selector:* 4 tombol bergaya arsitektural dengan nomor urut monospace (`01 // RANGKUM VIDEO & PDF`, `02 // KUIS & BANK SALAH`, `03 // PETA SARAF MATERI`, `04 // TUTOR NARA 24 JAM`).
  - *Interactive Interactive Device Frame:* Bingkai browser modern dengan tombol kontrol jendela macOS (*traffic lights*) di kiri atas dan URL bar pill.
  - *Live Micro-State:* Setiap tab yang diklik tidak hanya mengganti gambar tangkapan layar, tetapi juga menyajikan statistik hidup (misal di tab Kuis: bar progres 8/10 soal benar, badge "+50 XP", dan indikator 1 soal salah masuk ke Bank Salah).

### 5.5 Bento Stage Interactive Drill Preview (Mode Bedah Soal)
- **Tantangan:** Memperkenalkan keunggulan fitur `ExamDrillView` (panggung bedah soal 2 kolom) yang mengeliminasi kelelahan scroll.
- **Peluang Visual & Interaksi:**
  - Tampilkan mini-preview panggung bento: di kiri ada stimulus soal dengan gambar kurva ekonomi nyata, di kanan ada 4 opsi pilihan interaktif.
  - Biarkan pengunjung landing page mengklik salah satu pilihan jawaban di landing page:
    - Jika memilih opsi salah: muncul highlight merah lembut dan kotak ekspansi *Radar Jebakan (Pitfall)* yang menjelaskan mengapa opsi tersebut sering mengecoh siswa.
    - Jika memilih opsi benar: muncul partikel hijau cerah dan kotak ekspansi *Trik Cepat 30 Detik*.

### 5.6 Interactive Knowledge Graph (Mini Mind Map Canvas)
- **Tantangan:** Mengomunikasikan konsep *prerequisite graph* secara visual.
- **Peluang Visual & Interaksi:**
  - Buat kanvas SVG interaktif berisi 5-7 simpul konsep (misal topik Matematika: `Fungsi Komposisi` $\rightarrow$ `Fungsi Invers` $\rightarrow$ `Aljabar Matriks`).
  - Garis penghubung memiliki anak panah beranimasi pelan yang menunjukkan arah prasyarat.
  - Arahkan mouse (*hover*) ke salah satu simpul: simpul lain yang menjadi prasyarat akan menyala (*glow highlight*) dan menampilkan kartu tooltip definisi padat.

### 5.7 The Stepper Progression (Alur Penguasaan 4 Langkah)
- **Tantangan:** Menunjukkan bahwa proses belajar di Tanka memiliki metodologi yang jelas.
- **Peluang Visual & Interaksi:**
  - 4 langkah horizontal bernomor monospace besar: `01 INPUT` $\rightarrow$ `02 BACA` $\rightarrow$ `03 TANYA` $\rightarrow$ `04 UJI`.
  - Menggunakan garis penghubung bertitik (*dashed timeline rail*) yang warnanya terisi hijau saat pengguna menggulir layar (*scroll-driven fill*).

### 5.8 Personas & Social Ledger (Studi Kasus Pejuang Belajar)
- **Tantangan:** Testimoni pengguna sering terlihat palsu jika hanya berupa kutipan teks generik.
- **Peluang Visual & Interaksi:**
  - *Struktur Ledger:* Sajikan testimoni bukan sebagai "rating bintang 5" klise, melainkan sebagai **lembar catatan audit hasil belajar nyata**:
    - Profil Dafa (Kelas XII): `Target: Kedokteran UI | Subtes: Matematika & Biologi | Hasil: Bank Soal Salah tuntas 42 butir, skor tryout naik dari 540 ke 715`.
    - Profil Nadia (Mahasiswi): `Subjek: Biologi Sel | Bahan: Modul PDF 180 hal | Hasil: Terpecah jadi 12 bab pendek, selesai dalam 2 malam`.
  - *Efek 3D Tilt Card (`TiltCard`):* Kartu merespons pergerakan kursor mouse dengan kemiringan perspektif 3D halus dan lapisan sorotan cahaya kursor (*cursor spotlight*).

---

## 6. Arahan Motion Design & Kinetic Principles

Motion di Tanka bukan sekadar "pemanis visual", melainkan **alat penjelas hierarki kognitif (*functional choreography*)**:

### 6.1 Prinsip Motion Tanka
1. **Purpose-Driven Motion:** Setiap animasi harus menjawab pertanyaan: *"Informasi apa yang sedang diperjelas oleh gerakan ini?"*. Jika hanya bergerak tanpa menambah pemahaman, hapus gerakan tersebut.
2. **Kurva Easing Arsitektural:** Gunakan kurva bezier berdaya pegas alami:
   ```css
   cubic-bezier(0.16, 1, 0.3, 1) /* High-end ease-out: cepat keluar, mendarat dengan anggun */
   ```
3. **Staggered Delays:** Elemen bersaudara (seperti deretan kartu atau butir list) wajib muncul dengan jeda waktu bertingkat (*staggered*) antara 0.05s s/d 0.12s, menghindari benturan visual serempak yang mengejutkan mata.
4. **Subtle & Fast:** Durasi transisi interaksi mikro (hover, click, tab switch) berkisar antara 180ms s/d 300ms. Durasi transisi narasi scroll berkisar antara 600ms s/d 950ms.

### 6.2 Aksesibilitas & Reduced Motion
- Wajib menyertakan media query `@media (prefers-reduced-motion: reduce)`.
- Pada mode ini, seluruh animasi transform posisi dan loop SVG diubah menjadi `opacity` fade instan atau statis, demi kenyamanan pengguna dengan sensitivitas vestibular.

---

## 7. Responsivitas, Performa & Standar Mobile

1. **Mobile-First Cognitive Flow:**
   - Di layar ponsel (<768px), panggung split-grid hero otomatis beralih menjadi susunan vertikal yang proporsional.
   - Simulator Nara tetap dapat digunakan di ponsel dengan lebar tombol dan input minimal 44 piksel (*touch-friendly target*).
2. **Performa Rendering:**
   - Gunakan properti CSS yang diakselerasi GPU (`transform`, `opacity`). Hindari menganimasikan `width`, `height`, `top`, `margin`, atau `box-shadow` tebal saat scroll.
   - Aset gambar wajib menggunakan format WebP/PNG terkompresi dengan atribut `loading="lazy"` pada seksi di bawah fold.
3. **No Overflow Law:** Dilarang keras membiarkan elemen visual menyebabkan scroll horizontal liar pada peramban seluler (`overflow-x: hidden` pada container induk).

---

## 8. Tolok Ukur Kualitas: Perbedaan Desain Premium vs SaaS Generik

| Parameter Desain | ❌ SaaS AI Generik (Hindari) | ✨ Tanka Premium Standard (Wajib Diwujudkan) |
| :--- | :--- | :--- |
| **Latar Belakang** | Gradien ungu/biru neon gelap pekat, glow melayang tak berarah. | *Paper-ledger parchment* (`#fcfdfa`) dengan aksen arsitektural dan garis sage tipis 1px. |
| **Hero Visual** | Screenshot dashboard statis di dalam bingkai laptop melayang miring 45°. | Simulator interaktif nyata (`SimulatorNaraCard`) di mana calon siswa bisa menguji ketik soal langsung. |
| **Animasi** | Fade-in serentak dari bawah saat scroll, kartu goyang tanpa alasan. | Kinetic typography reveal, dataflow SVG terarah, 3D flip card bermakna, Lenis smooth scroll. |
| **Copywriting** | "Revolusikan masa depan belajarmu dengan kekuatan AI ajaib terdepan!" | "Ubah materi apapun, jadi langsung bisa dipahami. Rumus dijelaskan langkah demi langkah. Bebas iklan." |
| **Penyajian Fitur** | Grid 3 kolom berisi kartu putih dengan ikon Lucide bulat ungu. | Panggung interaktif (Bento Stage, Studio Cockpit, Interactive Mind Map, Comparison Ledger). |
| **Integritas Konseptual**| Menggunakan perumpamaan generik yang tidak relevan dengan ujian. | 100% berbasis materi nyata UTBK/TKA, KaTeX eksak, dan analisis kisi-kisi terukur. |
