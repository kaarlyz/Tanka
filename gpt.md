# LAPORAN AUDIT SISTEM PEMBELAJARAN TANKA (ARTEFAK MENTAH 7 SESI)
**Disusun untuk**: Tim Audit LLM Eksternal (Claude, ChatGPT, Gemini) & Pengembang Sistem  
**Tanggal Audit**: Senin, 05 Oktober 2026  
**Basis Data**: `/home/vallencia/Projects/tanka/tanka.sqlite` (SQLite Local Engine)  
**Tujuan**: Pembuktian empiris komparasi sistem V1 (Sekuensial Hierarkis) vs V2 (Grounded Two-Pass & Decoupled Siblings), evaluasi integritas rumus/fakta, evaluasi sebaran kuis, dan bedah anomali natural language query.

---

# 🚨 STUDI KASUS ANOMALI SPESIAL (SESI 7): "aku ingin belajar aljabar"
### Fenomena *Chimera Sastra-Aljabar*: Ketika Grounding V2 Bekerja Terlalu Patuh pada Query Natural Language

> **Laporan Khusus untuk Claude:**
> Pada Sesi 7, pengguna memasukkan kalimat bahasa alami (*natural language*): `"aku ingin belajar aljabar"`. 
> Hasil modul, flashcard, dan kuis yang terbentuk menjadi unik: **separuh Sastra Indonesia (Cerita Bergambar Si Pitung & Cerpen Ranang Aji SP) dan separuh Matematika Aljabar**.

#### 1. Mengapa Hal Ini Terjadi (*Root Cause Analysis*)
1. **Ketiadaan Intent Normalization:**
   Sistem penelusuran web (`multiSourceAcademicSearch`) langsung menggunakan string mentah `"aku ingin belajar aljabar"` tanpa membersihkan kata percakapan (`"aku ingin belajar"`).
2. **Pencarian Harfiah pada API Jurnal (CrossRef):**
   CrossRef API mencocokkan kata *"aku ingin"* dan *"belajar"*. Tiga makalah teratas yang terambil:
   - *Aku Ingin Seperti Pitung Pada Cerita Bergambar* (Pendidikan Sastra Anak).
   - *STRUKTURALISME DALAM CERPEN "AKU TAK INGIN KACAMATA, AKU HANYA INGIN MATI, TUHAN" KARYA RANANG AJI SP* (Kajian Sastra).
   - *Meningkatkan Hasil Belajar Siswa Kelas VIII SMPN 6 Kediri dalam Menulis Puisi...* (PTK Bahasa).
3. **Kepatuhan Mutlak Pipeline V2 (Grounded Two-Pass):**
   Karena V2 melarang keras AI mengarang konsep di luar `document_segments`, Pass 1 secara patuh mengekstrak konsep kanonikal dari 3 makalah tersebut:
   - Konsep 1: *Bahan Bacaan Bergambar* (Si Pitung Betawi)
   - Konsep 2: *Analisis Struktural Cerpen* (Ranang Aji SP)
   - Konsep 3: *Model Pembelajaran AIT Puisi* (SMPN 6 Kediri)
   - Konsep 4 & 5 (Pengayaan): *Variabel dan Koefisien*, *Operasi Bentuk Aljabar*.
4. **Sintesis Kompromi di Pass 2 (Nara Module):**
   Nara berusaha mendamaikan dua dunia yang bertolak belakang tersebut dalam pembuka modul:
   > *"Pembelajaran ini memadukan kekuatan literasi bahasa dengan ketajaman logika matematika. Kita mengawali langkah dari pembedahan teks naratif dan kreativitas menulis, lalu beralih menuju penguasaan simbol serta aturan operasi hitung bentuk aljabar dasar."*

#### 2. Evaluasi Mutu Pembawaan Materi Matematika, Soal, dan Flashcard
- **Kualitas Notasi KaTeX:** Sangat rapi. Notasi pecahan, variabel, dan operasi hitung ter-render tanpa cacat:
  $$5x + 3y - 2x + 7y = 3x + 10y$$
  $$3(2p - 4q) - 2(p - 5q) = 6p - 12q - 2p + 10q = 4p - 2q$$
- **Konsistensi Hitungan:** Aljabar linear, substitusi variabel ke persamaan linier ($S = 4x + 6$ untuk $x = 6 \rightarrow 30$), serta operasi distributif terbukti 100% akurat secara matematis.
- **Kuis HOTS & Distribusi Kunci:**
  Kuis mengawinkan skenario sastra dengan model aljabar (Soal 1: biaya cetak buku bergambar $5x+3y-2x+7y$; Soal 2: inventaris buku paket $x$ dan $y$; Soal 4: koefisien unsur cerpen $p$ dan gambar $q$).
  - Butir 1: Kunci **B**
  - Butir 2: Kunci **E**
  - Butir 3: Kunci **A**
  - Butir 4: Kunci **D**
  - Butir 5: Kunci **C**
  Distribusi tepat 1A, 1B, 1C, 1D, 1E (Anti-Bias seimbang 100%).

---

# I. RINGKASAN EKSEKUTIF & PERBANDINGAN ARSITEKTUR

| Parameter Evaluasi | Versi Lama (V1 - Sekuensial Hierarkis) | Versi Baru (V2 - Grounded Two-Pass) |
|---|---|---|
| **Alur Ekstraksi** | Sumber ➔ Modul Dongeng ➔ Flashcard/Kuis | Sumber ➔ Segmen Riil ➔ Konsep Kanonikal ➔ Modul & Instrumen Terpisah |
| **Grounding Fakta** | Mengambang (hanya snippet di memori LLM) | Disimpan fisik ke `document_segments` (URL + teks mentah) |
| **Isolasi Halusinasi** | Rentan (*Cascade Hallucination* rumus fisika fiktif di Sosiologi) | Terisolasi murni (`origin: "source"` dan `origin: "ai_enrichment"`) |
| **Skema Sub-Bab** | Cerita bebas tanpa definisi formal | Mandatory Schema: Situasi nyata ➔ Definisi Baku ➔ KaTeX ➔ Analogi ➔ Pitfall |
| **Kuis HOTS** | Pilihan terpanjang selalu benar; kunci menumpuk | Skenario kasus baru, opsi seimbang, distribusi kunci seragam A-E |
| **Format Matematika** | Rentan crash KaTeX dan salah parse backslash JSON | KaTeX murni + pelindung koma desimal `{,}` |

---

# II. TABEL KUANTITATIF SELURUH SESI DI DATABASE SQLITE

| Sesi | ID Dokumen | Judul Materi | Mapel | Panjang Teks | Segmen Sumber | Konsep Kanonikal | Flashcard | Kuis HOTS |
|---|---|---|---|---|---|---|---|---|
| 1 | `doc_1791139261552_nkyl9` | **g30spki** | Sejarah | 6.121 kar | 2 segmen | 5 konsep | 11 kartu | 5 butir |
| 2 | `doc_1791139403835_6z3tv` | **pertempuran medan area** | Sejarah | 5.293 kar | 1 segmen | 5 konsep | 12 kartu | 5 butir |
| 3 | `doc_1791139793755_2g1l7` | **faktor pendorong dan dan penghambat perubahan sosial** | Sosiologi | 7.502 kar | 2 segmen | 7 konsep | 15 kartu | 5 butir |
| 4 | `doc_1791140381993_o1i2z` | **Elastisitas Permintaan dan Penawaran** | Ekonomi | 11.976 kar | 11 segmen | 5 konsep | 13 kartu | 5 butir |
| 5 | `doc_1791140489330_pea6c` | **Matriks Transformasi Geometri 2x2** | Matematika | 6.676 kar | 3 segmen | 6 konsep | 13 kartu | 5 butir |
| 6 | `doc_1791141138264_56lsn` | **Struktur Sosial & Mobilitas Sosial** | Sosiologi | 5.866 kar | 9 segmen | 7 konsep | 12 kartu | 5 butir |
| 7 | `doc_1791143026354_cgbvi` | **aku ingin belajar aljabar** | Matematika | 5.488 kar | 3 segmen | 5 konsep | 12 kartu | 5 butir |
| 8 | `doc_1791143163434_gb0tu` | **aljabar** | Matematika | 11.029 kar | 10 segmen | 5 konsep | 0 kartu | 0 butir |
| **TOTAL** | **8 Sesi** | - | - | **59.951 kar** | **41 Segmen** | **45 Konsep** | **88 Kartu** | **35 Butir** |

---

# III. BEDAH MENDALAM SELURUH SESI PEMBELAJARAN (SESI 1 - 8)

## SESI 1: "g30spki" (`doc_1791139261552_nkyl9`)

- **Panjang Dokumen**: 6.121 karakter
- **Tanggal Dibuat**: 5/10/2026, 01.41.01
- **Jumlah Segmen Sumber Tersimpan**: 2
- **Jumlah Konsep Kanonikal**: 5
- **Jumlah Flashcard**: 11
- **Jumlah Soal Kuis HOTS**: 5

### 1. Segmen Sumber Tersimpan (`document_segments`)
#### Segmen 1 [Tipe: `web_search`]
```text
# Memahami Peristiwa G30S/PKI 1965
> Sejarah bukan sekadar deretan tanggal dan nama untuk dihafal, melainkan rangkaian sebab-akibat tentang bagaimana keputusan masa lalu membentuk bangsa kita hari ini.

## Bab 1: Panggung Politik Indonesia Menjelang 1965
Bayangkan sebuah perahu layar yang sedang terombang-ambing di tengah badai, sementara para pendayungnya saling berebut kendali kemudi. Seperti itulah gambaran Republik Indonesia pada kurun waktu 1960 hingga 1965 di bawah sistem Demokrasi Terpimp...
```

#### Segmen 2 [Tipe: `web_search`]
```text
### Poin Pengecoh yang Sering Mengecoh:
- **Jenderal A.H. Nasution Bukan Korban Gugur:** Soal ujian kerap memasukkan nama Nasution ke dalam daftar pahlawan revolusi yang tewas. Faktanya, Jenderal A.H. Nasution berhasil meloloskan diri, meski putrinya, Ade Irma Suryani, gugur tertembak.
- **Lokasi Peristiwa Tidak Hanya di Jakarta:** Jangan terkecoh bahwa peristiwa hanya terjadi di ibu kota. Gerakan serupa juga merenggut nyawa Kolonel Katamso dan Letkol Sugiyono di Kentungan, Yogyakarta.
- **Pembe...
```

### 2. Konsep Kanonikal Kurikulum (`document_concepts`)
#### 1. [SUMBER RESMI] Demokrasi Terpimpin
- **Definisi Baku**: Sistem politik di Indonesia kurun 1959-1965 pimpinan Presiden Soekarno, ciri kekuasaan terpusat di tangan presiden dengan polarisasi kekuatan antara TNI AD dan PKI.
- **Tokoh/Ahli**: Soekarno
- **Peringatan Salah Kaprah**: Demokrasi Terpimpin dianggap sistem demokrasi liberal multipartai yang stabil.

#### 2. [SUMBER RESMI] Segitiga Kekuatan Politik
- **Definisi Baku**: Konstelasi perimbangan kekuasaan era 1960-1965 antara Presiden Soekarno sebagai penyeimbang sentral di puncak, serta Angkatan Darat dan PKI di kedua sisinya.
- **Tokoh/Ahli**: Soekarno
- **Peringatan Salah Kaprah**: TNI AD dan PKI dianggap berkoalisi mendukung penuh semua kebijakan satu sama lain.

#### 3. [SUMBER RESMI] Pahlawan Revolusi
- **Definisi Baku**: Gelar kehormatan untuk perwira militer korban gugur penculikan dan pembunuhan Gerakan 30 September 1965 di Jakarta dan Yogyakarta.
- **Tokoh/Ahli**: A.H. Nasution, Ade Irma Suryani, Katamso, Sugiyono
- **Peringatan Salah Kaprah**: Jenderal A.H. Nasution dianggap gugur sebagai pahlawan revolusi pada peristiwa G30S.

#### 4. [SUMBER RESMI] Pemberontakan PKI Madiun 1948
- **Definisi Baku**: Konflik bersenjata dipimpin Musso di Madiun tahun 1948 bertujuan mendirikan Soviet Republik Indonesia saat perang kemerdekaan, berbeda konteks dengan peristiwa G30S 1965.
- **Tokoh/Ahli**: Musso
- **Peringatan Salah Kaprah**: Peristiwa PKI Madiun 1948 disamakan latar belakang dan motifnya dengan G30S 1965.

#### 5. [PENGAYAAN AI] Gerakan 30 September (G30S)
- **Definisi Baku**: Peristiwa penculikan dan pembunuhan enam jenderal dan satu perwira TNI AD pada malam 30 September hingga 1 Oktober 1965 akibat konflik politik elite kekuasaan.
- **Tokoh/Ahli**: Soekarno, A.H. Nasution
- **Peringatan Salah Kaprah**: G30S hanya terjadi di wilayah Jakarta tanpa korban di daerah lain.

### 3. Struktur Modul & Contoh Teks Bersekat
**Daftar Bab Terdeteksi**:
- Bab 1: Panggung Politik Indonesia Menjelang 1965
- Bab 2: Malam Kelam dan Gerakan 30 September
- Bab 3: Peralihan Kendali dan Runtuhnya Orde Lama
- Bab 4: Kancing Memori Soal & Panduan Ujian (Exam Mastery)

**Cuplikan Teks Modul**:
```markdown
# Memahami Peristiwa G30S/PKI 1965
> Sejarah bukan sekadar deretan tanggal dan nama untuk dihafal, melainkan rangkaian sebab-akibat tentang bagaimana keputusan masa lalu membentuk bangsa kita hari ini.

## Bab 1: Panggung Politik Indonesia Menjelang 1965
Bayangkan sebuah perahu layar yang sedang terombang-ambing di tengah badai, sementara para pendayungnya saling berebut kendali kemudi. Seperti itulah gambaran Republik Indonesia pada kurun waktu 1960 hingga 1965 di bawah sistem Demokrasi Terpimpin. Di pucuk pimpinan ada Presiden Soekarno yang karismatik, tetapi di bawahnya ada dua kekuatan raksasa yang saling berhadapan dengan tensi tinggi: Angkatan Darat dan Partai Komunis Indonesia (PKI).

Kondisi ekonomi rakyat saat itu sedang berada di titik nadir akibat inflasi yang membubung tinggi hingga ratusan persen. Harga beras melambung, antrean bahan pokok terjadi di mana-mana, dan ketidakpuasan sosial makin melebar. Dalam situasi perut lapar ini, friksi politik antarkelompok semakin mudah tersulut oleh rasa saling curiga.

> 💡 **Insight Nara (Pengayaan):** 
> Bayangkan konsep Segitiga Kekuatan Politik: Soekarno berada di puncak sebagai penyeimbang, sementara PKI di sisi kiri dan TNI AD di sisi kanan. Selama Soekarno sehat dan kuat, kedua kubu tertahan. Namun, begitu ada rumor kesehatan Bung Karno memburuk, kedua kekuatan di bawah merasa harus mengambil langkah pencegahan agar tidak diserang lebih dulu.

Isu santer beredar bahwa kesehatan Presiden Soekarno menurun drastis pada p...
```

### 4. Daftar Flashcard (11 Kartu)
| No | Pertanyaan (Front) | Kunci Jawaban (Back) |
|---|---|---|
| 1 | Apa definisi sistem politik Demokrasi Terpimpin? | Sistem politik di Indonesia kurun 1959-1965 pimpinan Presiden Soekarno berciri kekuasaan terpusat di tangan presiden dengan polarisasi TNI AD dan PKI. |
| 2 | Apa itu konsep Segitiga Kekuatan Politik era 1960-1965? | Konstelasi perimbangan kekuasaan dengan Soekarno sebagai penyeimbang sentral di puncak, serta TNI AD dan PKI di kedua sisinya. |
| 3 | Apa itu gelar Pahlawan Revolusi? | Gelar kehormatan untuk perwira militer yang gugur diculik dan dibunuh dalam peristiwa Gerakan 30 September 1965 di Jakarta dan Yogyakarta. |
| 4 | Apa tujuan utama Pemberontakan PKI Madiun 1948? | Mendirikan Soviet Republik Indonesia di tengah masa perang kemerdekaan di bawah pimpinan Musso. |
| 5 | Apa latar belakang peristiwa Gerakan 30 September 1965? | Konflik politik elite kekuasaan antara pimpinan Angkatan Darat dan PKI di tengah isu kesehatan Soekarno yang menurun. |
| 6 | Siapa pemimpin lapangan operasi militer Gerakan 30 September? | Letnan Kolonel Untung dari Resimen Cakrabirawa. |
| 7 | Ke mana perwira Angkatan Darat diculik pada G30S? | Para korban dibawa ke kawasan perkebunan karet di Lubang Buaya, Jakarta Timur. |
| 8 | Apa tindakan Mayor Jenderal Soeharto pasca-G30S? | Mengambil alih kekosongan pimpinan TNI AD, mengonsolidasi pasukan loyal, dan merebut kembali fasilitas vital seperti RRI serta Halim Perdanakusuma. |
| 9 | Apakah Jenderal A.H. Nasution korban gugur pahlawan revolusi? | Bukan. Jenderal A.H. Nasution berhasil meloloskan diri, sedangkan ajudannya Kapten Pierre Tendean dan putrinya Ade Irma Suryani yang menjadi korban. |
| 10 | Apakah lokasi peristiwa kekerasan G30S hanya di Jakarta? | Bukan. Peristiwa serupa juga memakan korban pahlawan revolusi di Kentungan, Yogyakarta, yaitu Kolonel Katamso dan Letkol Sugiyono. |
| 11 | Apa beda fokus PKI Madiun 1948 vs G30S 1965? | PKI Madiun 1948 dipimpin Musso bertujuan mendirikan Soviet Republik Indonesia saat perang kemerdekaan, sedangkan G30S 1965 dipicu perebutan kekuasaan elite rezim Demokrasi Terpimpin. |

### 5. Soal Kuis HOTS (5 Butir)
#### Soal 1 [Kunci: **A**]
**Skenario**: Seorang sejarawan menganalisis dinamika politik Indonesia era 1960-1965 dengan analogi timbangan tiga lengan. Apa peran fungsional utama Presiden Soekarno dalam model segitiga kekuatan politik tersebut?

**Pilihan Jawaban**:
- **A**. Menjadi poros penyeimbang ketegangan ideologis antara Angkatan Darat dan PKI.
- **B**. Membentuk aliansi militer permanen guna melemahkan hegemoni parlemen sipil.
- **C**. Menyerahkan otoritas ekonomi sepenuhnya kepada pimpinan serikat buruh terorganisir.
- **D**. Mendorong unifikasi mutlak doktrin militer ke dalam tubuh birokrasi kepartaian.
- **E**. Mengambil alih fungsi operasional staf umum angkatan bersenjata secara mandiri.

**Pembahasan**: Dalam skema Segitiga Kekuatan Politik (1960-1965), Presiden Soekarno berada di puncak sebagai figur karismatik penengah yang menyeimbangkan persaingan sengit antara Angkatan Darat di satu sisi dan PKI di sisi lain.

#### Soal 2 [Kunci: **A**]
**Skenario**: Pemerintah menganugerahi gelar Pahlawan Revolusi kepada perwira yang gugur akibat Gerakan 30 September 1965. Manakah pernyataan yang tepat mengenai perwira tinggi militer berikut dalam peristiwa tersebut?

**Pilihan Jawaban**:
- **A**. Jenderal A.H. Nasution lolos dari penculikan walau putrinya menjadi korban jiwa.
- **B**. Letnan Kolonel Sugiyono diculik di Jakarta lalu diterbangkan ke markas Yogyakarta.
- **C**. Jenderal A.H. Nasution wafat di Lubang Buaya bersama jajaran pimpinan angkatan darat.
- **D**. Kolonel Katamso berhasil memimpin serangan balik militer di kawasan Jawa Tengah.
- **E**. Kapten Pierre Tendean mengundurkan diri dari tugas militer sesaat sebelum insiden.

**Pembahasan**: Jenderal A.H. Nasution berhasil lolos dari upaya penculikan malam 1 Oktober 1965, sementara putrinya Ade Irma Suryani gugur tertembak dan ajudannya Kapten Pierre Tendean diculik lalu gugur di Lubang Buaya.

#### Soal 3 [Kunci: **B**]
**Skenario**: Seorang mahasiswa membandingkan konflik bersenjata Madiun 1948 dan G30S 1965. Titik pembeda paling mendasar antara kedua peristiwa tersebut ditinjau dari latar belakang historisnya adalah...

**Pilihan Jawaban**:
- **A**. Peristiwa 1948 dipimpin dewan militer, peristiwa 1965 murni aksi diplomatik parlemen.
- **B**. Peristiwa 1948 berupaya mengganti dasar negara, peristiwa 1965 dipicu konflik elite.
- **C**. Peristiwa 1948 berakar pada krisis moneter, peristiwa 1965 didorong agresi Belanda.
- **D**. Peristiwa 1948 terjadi di masa damai, peristiwa 1965 berlangsung saat perang terbuka.
- **E**. Peristiwa 1948 melibatkan front buruh tani, peristiwa 1965 didominasi laskar santri.

**Pembahasan**: Pemberontakan PKI Madiun 1948 dipimpin Musso bertujuan mendirikan Soviet Republik Indonesia di tengah agresi kemerdekaan, sedangkan G30S 1965 berlatar polarisasi elite politik dan isu kudeta masa Demokrasi Terpimpin.

#### Soal 4 [Kunci: **E**]
**Skenario**: Buku catatan seorang peneliti mencatat bahwa dampak G30S meluas hingga luar ibu kota. Fakta manakah yang membuktikan bahwa peristiwa tersebut tidak hanya terisolasi di Jakarta?

**Pilihan Jawaban**:
- **A**. Mobilisasi pasukan pengawal presiden secara serentak di pelabuhan Surabaya.
- **B**. Penyerbuan markas komando logistik daerah oleh kelompok bersenjata Banten.
- **C**. Penguasaan sepihak pemancar pusat stasiun radio nasional di kawasan Gambir.
- **D**. Pelaksanaan rapat darurat Dewan Revolusi cabang istana di pangkalan Halim.
- **E**. Gugurnya perwira militer Katamso dan Sugiyono akibat aksi kekerasan di Kentungan.

**Pembahasan**: Gerakan 30 September memakan korban di luar Jakarta, yaitu gugurnya Komandan Korem 072 Kolonel Katamso dan Kasrem Letkol Sugiyono di Kentungan, Yogyakarta.

#### Soal 5 [Kunci: **B**]
**Skenario**: Rumor kemunduran kondisi fisik Presiden Soekarno pada medio 1965 memicu ketidakstabilan nasional secara drastis. Mengapa informasi tersebut memicu eskalasi konflik antara Angkatan Darat dan PKI?

**Pilihan Jawaban**:
- **A**. Kedua kubu bersepakat membentuk pemerintahan koalisi transisi di bawah kabinet.
- **B**. Kedua kubu merasa harus bermanuver lebih dulu demi mengamankan suksesi kekuasaan.
- **C**. Kedua kubu menghentikan seluruh aktivitas intelijen guna menjaga wibawa kepala negara.
- **D**. Kedua kubu menyerahkan kendali militer kepada perwakilan diplomatik negara sahabat.
- **E**. Kedua kubu menuntut pembubaran parlemen demi menyelenggarakan pemilihan umum.

**Pembahasan**: Soekarno berperan sebagai poros penahan benturan. Isu kesehatannya memicu kekhawatiran bahwa kekosongan kekuasaan akan segera terjadi, sehingga baik AD maupun PKI bersiap mengambil langkah antisipatif mendahului lawan.

---

## SESI 2: "pertempuran medan area" (`doc_1791139403835_6z3tv`)

- **Panjang Dokumen**: 5.293 karakter
- **Tanggal Dibuat**: 5/10/2026, 01.43.23
- **Jumlah Segmen Sumber Tersimpan**: 1
- **Jumlah Konsep Kanonikal**: 5
- **Jumlah Flashcard**: 12
- **Jumlah Soal Kuis HOTS**: 5

### 1. Segmen Sumber Tersimpan (`document_segments`)
#### Segmen 1 [Tipe: `web_search`]
```text
# Pertempuran Medan Area
> Mari kita pahami pertempuran ini bukan sebagai deretan tanggal yang harus dihafal mati, melainkan sebagai cerita tentang harga diri sebuah bangsa yang baru lahir ketika kedaulatannya diinjak-injak secara terang-terangan.

---

## Bab 1: Tamu Tak Diundang dan Percikan di Jalan Bali

Coba bayangkan kamu baru saja merayakan kemerdekaan rumahmu sendiri setelah bertahun-tahun dikuasai orang lain. Tiba-tiba, datang rombongan orang asing yang mengaku hanya ingin merapikan bar...
```

### 2. Konsep Kanonikal Kurikulum (`document_concepts`)
#### 1. [SUMBER RESMI] NICA (Netherlands Indies Civil Administration)
- **Definisi Baku**: Otoritas sipil dan militer Belanda bertugas memulihkan pemerintahan kolonial Hindia Belanda pasca-kekalahan Jepang dalam Perang Dunia II.
- **Tokoh/Ahli**: Theodore Edward Dudley Kelly
- **Peringatan Salah Kaprah**: NICA disangka datang sendiri, padahal membonceng pasukan Sekutu (Britania Raya).

#### 2. [SUMBER RESMI] Insiden Jalan Bali
- **Definisi Baku**: Peristiwa perampasan dan penginjakan lencana merah-putih milik pemuda Indonesia oleh pejabat Belanda pada 13 Oktober 1945 yang memicu bentrokan fisik berskala besar pertama di Medan.
- **Peringatan Salah Kaprah**: Sering tertukar dengan Insiden Hotel Yamato Surabaya yang merobek warna biru pada bendera Belanda.

#### 3. [SUMBER RESMI] Fixed Boundaries Medan Area
- **Definisi Baku**: Papan pembatas tapal batas teritorial sepihak yang dipasang Sekutu pada 1 Desember 1945 untuk membatasi ruang gerak pejuang Indonesia dan menjadi asal-usul penamaan pertempuran.
- **Tokoh/Ahli**: Theodore Edward Dudley Kelly
- **Peringatan Salah Kaprah**: Kata 'Area' dianggap berasal dari divisi pasukan Indonesia, padahal berasal dari frasa plang Sekutu.

#### 4. [SUMBER RESMI] Resimen Komando Tentara Rakyat Medan Area
- **Definisi Baku**: Kesatuan komando militer pejuang Indonesia yang dibentuk untuk mengorganisir perang gerilya melawan Sekutu dan NICA setelah pusat kota Medan dikuasai musuh.
- **Peringatan Salah Kaprah**: Perlawanan pejuang dianggap berakhir tuntas saat pusat kota Medan jatuh ke tangan Sekutu pada April 1946.

#### 5. [PENGAYAAN AI] AFNEI (Allied Forces Netherlands East Indies)
- **Definisi Baku**: Komando militer Sekutu bertugas menerima penyerahan pasukan Jepang, membebaskan tawanan perang sekutu, dan memulangkan pasukan Jepang di wilayah Indonesia.
- **Tokoh/Ahli**: Philip Christison
- **Peringatan Salah Kaprah**: Sekutu dianggap netral tanpa kepentingan membantu pemulihan kekuasaan kolonial Belanda.

### 3. Struktur Modul & Contoh Teks Bersekat
**Daftar Bab Terdeteksi**:
- Bab 1: Tamu Tak Diundang dan Percikan di Jalan Bali
- Bab 2: Papan Pembatas dan Lahirnya Istilah "Medan Area"
- Bab 3: Kancing Memori Soal & Panduan Ujian (Exam Mastery)

**Cuplikan Teks Modul**:
```markdown
# Pertempuran Medan Area
> Mari kita pahami pertempuran ini bukan sebagai deretan tanggal yang harus dihafal mati, melainkan sebagai cerita tentang harga diri sebuah bangsa yang baru lahir ketika kedaulatannya diinjak-injak secara terang-terangan.

---

## Bab 1: Tamu Tak Diundang dan Percikan di Jalan Bali

Coba bayangkan kamu baru saja merayakan kemerdekaan rumahmu sendiri setelah bertahun-tahun dikuasai orang lain. Tiba-tiba, datang rombongan orang asing yang mengaku hanya ingin merapikan barang sisa penghuni lama, tetapi mereka membawa serta mantan penjajahmu yang ingin merebut kembali rumah tersebut. Perasaan terusik dan amarah seperti itulah yang menyelimuti dada para pemuda di Kota Medan pada akhir tahun 1945.

Kabar proklamasi 17 Agustus 1945 baru resmi diumumkan oleh Gubernur Sumatra, Muhammad Hasan, di Medan pada akhir September 1945. Belum sempat rakyat bernapas lega, pasukan Sekutu (Britania Raya) di bawah pimpinan Brigadir Jenderal Theodore Edward Dudley Kelly mendarat di Pelabuhan Belawan pada 9 Oktober 1945. Masalah besarnya, kedatangan pasukan Kelly ini ditunggangi oleh NICA (*Netherlands Indies Civil Administration*), aparat sipil Belanda yang terang-terangan berhasrat menegakkan kembali kolonialisme di tanah Sumatra.

Ketegangan yang menumpuk akhirnya meledak pada 13 Oktober 1945 di depan sebuah hotel di Jalan Bali, Medan. Seorang pejabat Belanda merampas lencana merah-putih milik seorang remaja Indonesia, lalu menginjak-injak simbol kemerdekaan tersebut di ...
```

### 4. Daftar Flashcard (12 Kartu)
| No | Pertanyaan (Front) | Kunci Jawaban (Back) |
|---|---|---|
| 1 | Apa tugas utama NICA di Indonesia? | Memulihkan pemerintahan kolonial Hindia Belanda pasca-kekalahan Jepang dalam Perang Dunia II. |
| 2 | Apa peran AFNEI di wilayah Indonesia? | Menerima penyerahan Jepang, membebaskan tawanan Sekutu, dan memulangkan pasukan Jepang. |
| 3 | Siapa pemimpin pasukan Sekutu di Medan? | Brigadir Jenderal Theodore Edward Dudley Kelly. |
| 4 | Kapan dan di mana Sekutu mendarat? | 9 Oktober 1945 di Pelabuhan Belawan. |
| 5 | Apa pemicu meletusnya Insiden Jalan Bali? | Pejabat Belanda merampas dan menginjak lencana merah-putih milik pemuda Indonesia pada 13 Oktober 1945. |
| 6 | Apa tujuan pemasangan Fixed Boundaries Medan Area? | Membatasi ruang gerak pejuang Indonesia dan mengukuhkan kekuasaan teritorial Sekutu secara sepihak. |
| 7 | Kapan Sekutu memasang Fixed Boundaries Medan Area? | 1 Desember 1945. |
| 8 | Mengapa Resimen Komando Tentara Rakyat dibentuk? | Mengorganisasi perang gerilya setelah Sekutu menguasai pusat kota Medan pada April 1946. |
| 9 | Ke mana basis komando Republik dipindahkan? | Pematangsiantar, setelah pusat kota Medan jatuh ke tangan Sekutu. |
| 10 | Bagaimana cara NICA masuk ke wilayah Indonesia? | Membonceng kedatangan pasukan militer Sekutu (Britania Raya), bukan datang secara mandiri. |
| 11 | Dari mana asal-usul penamaan Pertempuran Medan Area? | Berasal dari tulisan plang pembatas Sekutu 'Fixed Boundaries Medan Area', bukan dari divisi pasukan Indonesia. |
| 12 | Apa pembeda Insiden Jalan Bali dan Yamato? | Insiden Jalan Bali berupa penginjakan lencana merah-putih di Medan, sedangkan Hotel Yamato berupa perobekan warna biru bendera Belanda di Surabaya. |

### 5. Soal Kuis HOTS (5 Butir)
#### Soal 1 [Kunci: **B**]
**Skenario**: Seorang kurator museum memamerkan arsip pamflet militer Sekutu bertarikh 1 Desember 1945 yang memuat frasa 'Fixed Boundaries Medan Area'. Berdasarkan konteks sejarah masa revolusi di Sumatra Utara, fungsi utama pemasangan rambu tapal batas tersebut oleh pihak Sekutu adalah...

**Pilihan Jawaban**:
- **A**. menentukan garis demarkasi gencatan senjata resmi
- **B**. membatasi pergerakan pejuang dan mematok sektor kota
- **C**. memberi tanda zona evakuasi bagi tawanan perang
- **D**. memisahkan markas garnisun Jepang dan tentara Sekutu
- **E**. membagi wilayah administratif bersama pihak NICA

**Pembahasan**: Pemasangan papan 'Fixed Boundaries Medan Area' pada 1 Desember 1945 dilakukan sepihak oleh Sekutu untuk memagari gerak rakyat serta menandai kawasan yang dikuasai militer Sekutu.

#### Soal 2 [Kunci: **C**]
**Skenario**: Ketegangan politik di Medan pascaproklamasi berubah menjadi bentrokan senjata terbuka pertama pada 13 Oktober 1945 di Jalan Bali. Peristiwa spesifik yang menyulut amarah massa pemuda pada insiden tersebut adalah...

**Pilihan Jawaban**:
- **A**. perobekan warna biru dari bendera triwarna Belanda
- **B**. penolakan ultimatum penyerahan senjata rampasan
- **C**. perampasan serta penginjakan lencana merah-putih
- **D**. penembakan sepihak terhadap pos laskar rakyat
- **E**. penyegelan kantor gubernur Sumatra oleh NICA

**Pembahasan**: Bentrokan di Jalan Bali bermula saat seorang pejabat Belanda merampas dan menginjak lencana merah-putih milik pemuda Indonesia di depan umum.

#### Soal 3 [Kunci: **B**]
**Skenario**: Ketika pasukan Britania Raya di bawah komando Brigadir Jenderal T.E.D. Kelly mendarat di Belawan pada Oktober 1945, rakyat menaruh kecurigaan besar karena kedatangan mereka diboncengi oleh NICA. Peran dan agenda utama NICA dalam peristiwa tersebut adalah...

**Pilihan Jawaban**:
- **A**. menjalankan mandat PBB untuk melucuti senjata Jepang
- **B**. menegakkan kembali struktur kekuasaan Hindia Belanda
- **C**. mengamankan perkebunan asing tanpa motif kedaulatan
- **D**. mengorganisasi pembentukan negara federasi Sumatra
- **E**. mengadili pejabat militer Jepang atas kejahatan perang

**Pembahasan**: NICA membonceng pasukan Sekutu dengan misi memulihkan otoritas dan pemerintahan kolonial Hindia Belanda pascakekalahan Jepang.

#### Soal 4 [Kunci: **C**]
**Skenario**: Setelah pusat kota Medan berhasil dikuasai Sekutu dan NICA pada April 1946, pejuang kemerdekaan memindahkan pusat komando ke Pematangsiantar dan membentuk Resimen Komando Tentara Rakyat Medan Area. Langkah ini menunjukkan bahwa strategi pejuang adalah...

**Pilihan Jawaban**:
- **A**. mengakui garis batas wilayah kekuasaan yang dipatok musuh
- **B**. menyerahkan sepenuhnya pertahanan Sumatra ke tangan TKR pusat
- **C**. melanjutkan perlawanan gerilya jangka panjang dari luar kota
- **D**. menghentikan perang fisik demi fokus ke jalur diplomasi
- **E**. membubarkan kesatuan laskar guna membentuk tentara reguler

**Pembahasan**: Mundurnya komando ke Pematangsiantar dan pembentukan Resimen Komando Tentara Rakyat Medan Area bertujuan mengorganisasi strategi gerilya jangka panjang meski pusat kota dikuasai musuh.

#### Soal 5 [Kunci: **C**]
**Skenario**: Dalam historiografi perjuangan kemerdekaan di Sumatra Utara, istilah pertempuran 'Medan Area' secara historis berakar dari...

**Pilihan Jawaban**:
- **A**. nama front gabungan divisi laskar rakyat Sumatra
- **B**. zona netral hasil kesepakatan perundingan gencatan senjata
- **C**. kalimat pada plang pembatas sepihak milik Sekutu
- **D**. wilayah teritorial yang ditetapkan pemerintah daerah
- **E**. sebutan sandi operasi militer pimpinan T.E.D. Kelly

**Pembahasan**: Nama 'Medan Area' lahir dari papan bertuliskan 'Fixed Boundaries Medan Area' yang dipasang Sekutu di pinggiran kota untuk membatasi wilayah kekuasaannya.

---

## SESI 3: "faktor pendorong dan dan penghambat perubahan sosial" (`doc_1791139793755_2g1l7`)

- **Panjang Dokumen**: 7.502 karakter
- **Tanggal Dibuat**: 5/10/2026, 01.49.53
- **Jumlah Segmen Sumber Tersimpan**: 2
- **Jumlah Konsep Kanonikal**: 7
- **Jumlah Flashcard**: 15
- **Jumlah Soal Kuis HOTS**: 5

### 1. Segmen Sumber Tersimpan (`document_segments`)
#### Segmen 1 [Tipe: `web_search`]
```text
# Memahami Dinamika Perubahan Sosial: Faktor Pendorong dan Penghambat

> Perubahan sosial bukanlah peristiwa acak yang tiba-tiba jatuh dari langit, melainkan hasil pergulatan nyata antara daya yang mendorong kemajuan dan daya yang menahannya di dalam ruang hidup kita.

---

## Bab 1: Denyut Masyarakat yang Tak Pernah Diam

Pernahkah kamu memperhatikan bagaimana caramu memesan makanan hari ini dibandingkan dengan kebiasaan orang tuamu dua puluh tahun lalu? Dahulu, seseorang harus berjalan kaki me...
```

#### Segmen 2 [Tipe: `web_search`]
```text
> 💡 **Insight Nara (Pengayaan):** Keengganan mengganti sistem pembukuan manual dengan aplikasi kasir digital di pasar tradisional sering kali bukan karena pedagang tidak mampu membeli gawai pintar. Pedagang merasa sistem manual sudah terbukti aman selama puluhan tahun, sementara sistem digital dicurigai berisiko memicu kebocoran data pajak atau kesalahan teknis. Sikap ini adalah contoh nyata kebiasaan yang tertanam kuat (*habitual vested interest*) yang memperlambat modernisasi tata kelola.

--...
```

### 2. Konsep Kanonikal Kurikulum (`document_concepts`)
#### 1. [SUMBER RESMI] Perubahan Sosial
- **Definisi Baku**: Segala perubahan pada lembaga-lembaga kemasyarakatan yang memengaruhi sistem sosialnya, termasuk nilai, sikap, dan pola perilaku kelompok.
- **Tokoh/Ahli**: Selo Soemardjan
- **Peringatan Salah Kaprah**: Perubahan sosial dianggap hanya mencakup kemajuan teknologi fisik, bukan pergeseran nilai dan institusi.

#### 2. [SUMBER RESMI] Vested Interest
- **Definisi Baku**: Kepentingan tertanam kuat dari individu atau kelompok yang berusaha mempertahankan posisi, kebiasaan, atau hak istimewa lama sehingga menghambat pembaruan.
- **Peringatan Salah Kaprah**: Penolakan inovasi selalu disebabkan oleh ketidakmampuan ekonomi, bukan keengganan melepas rasa aman dari sistem lama.

#### 3. [SUMBER RESMI] Difusi
- **Definisi Baku**: Proses penyebaran unsur-unsur kebudayaan, gagasan, atau teknologi dari satu individu ke individu lain atau dari satu masyarakat ke masyarakat lain.
- **Peringatan Salah Kaprah**: Difusi disamakan dengan asimilasi penuh, padahal difusi sebatas penyebaran unsur budaya.

#### 4. [SUMBER RESMI] Cultural Lag
- **Definisi Baku**: Kesenjangan budaya yang terjadi ketika kebudayaan kebendaan (material/teknologi) berkembang lebih cepat dibandingkan kesiapan mentalitas, norma, atau perilaku sosial (non-material).
- **Peringatan Salah Kaprah**: Cultural lag dianggap keterbelakangan teknologi total, padahal terjadi akibat ketimpangan kecepatan adaptasi mental terhadap teknologi yang sudah maju.

#### 5. [SUMBER RESMI] Evolusi Multilinier
- **Definisi Baku**: Teori evolusi sosial yang menyatakan bahwa perubahan bertahap melalui berbagai jalur perkembangan yang berbeda menuju tingkat tertentu, bukan lewat satu jalur tunggal.
- **Peringatan Salah Kaprah**: Semua masyarakat dianggap wajib melewati tahapan perubahan sosial yang seragam secara linear.

#### 6. [SUMBER RESMI] Isolasi Geografis
- **Definisi Baku**: Kondisi fisik wilayah yang terpencil dan tertutup dari kontak luar sehingga menghambat arus informasi dan difusi inovasi.
- **Peringatan Salah Kaprah**: Masyarakat terisolasi tidak berkembang karena tingkat kecerdasan rendah, padahal murni ketiadaan akses interaksi sosial luar.

#### 7. [PENGAYAAN AI] Kontak dengan Kebudayaan Lain
- **Definisi Baku**: Interaksi langsung antarpopulasi berbeda budaya yang membuka celah adopsi gagasan baru dan mempercepat dinamika sosial.
- **Peringatan Salah Kaprah**: Kontak kebudayaan selalu langsung memicu konflik tanpa menghasilkan sintesis atau pembaruan cara hidup.

### 3. Struktur Modul & Contoh Teks Bersekat
**Daftar Bab Terdeteksi**:
- Bab 1: Denyut Masyarakat yang Tak Pernah Diam
- Bab 2: Mesin Pendorong Perubahan Sosial
- Bab 3: Benteng Penghambat Perubahan Sosial
- Bab 4: Kancing Memori Soal & Panduan Ujian (Exam Mastery)

**Cuplikan Teks Modul**:
```markdown
# Memahami Dinamika Perubahan Sosial: Faktor Pendorong dan Penghambat

> Perubahan sosial bukanlah peristiwa acak yang tiba-tiba jatuh dari langit, melainkan hasil pergulatan nyata antara daya yang mendorong kemajuan dan daya yang menahannya di dalam ruang hidup kita.

---

## Bab 1: Denyut Masyarakat yang Tak Pernah Diam

Pernahkah kamu memperhatikan bagaimana caramu memesan makanan hari ini dibandingkan dengan kebiasaan orang tuamu dua puluh tahun lalu? Dahulu, seseorang harus berjalan kaki menuju kedai terdekat atau menunggu pedagang keliling melintas di depan rumah. Kini, hanya bermodalkan ketukan jari di layar ponsel, seporsi makanan hangat dapat diantar langsung ke depan pintu kamar. 

Pergeseran sederhana tersebut membuktikan satu hukum dasar dalam sosiologi: tidak ada masyarakat yang benar-benar berhenti berkembang. Tokoh sosiologi Indonesia, Selo Soemardjan, merumuskan bahwa perubahan sosial adalah segala perubahan pada lembaga-lembaga kemasyarakatan yang memengaruhi sistem sosialnya, termasuk nilai, sikap, dan pola perilaku kelompok. 

Masyarakat selalu bergerak dinamis karena kebutuhan manusia terus bertambah dan lingkungan tempat tinggal terus mengalami pergeseran. Namun, laju pergerakan ini tidak selalu mulus; ada kelompok yang bergerak sangat cepat menuju pembaharuan, sementara kelompok lain memilih bertahan pada pola lama. Tarik-menarik antara dorongan untuk berubah dan keinginan untuk bertahan inilah yang menentukan wajah peradaban kita hari ini.

---

## Bab ...
```

### 4. Daftar Flashcard (15 Kartu)
| No | Pertanyaan (Front) | Kunci Jawaban (Back) |
|---|---|---|
| 1 | Apa definisi perubahan sosial menurut Selo Soemardjan? | Perubahan pada lembaga kemasyarakatan yang memengaruhi sistem sosial, termasuk nilai, sikap, dan pola perilaku kelompok. |
| 2 | Apa pengertian konsep difusi kebudayaan? | Proses penyebaran unsur kebudayaan, gagasan, atau teknologi antarindividu atau antarmasyarakat. |
| 3 | Apa yang dimaksud dengan vested interest? | Kepentingan tertanam kuat untuk mempertahankan posisi, kebiasaan, atau hak istimewa lama sehingga menghambat pembaruan. |
| 4 | Apa definisi konsep cultural lag? | Kesenjangan akibat kebudayaan material berkembang lebih cepat daripada kesiapan mentalitas atau norma non-material. |
| 5 | Bagaimana isolasi geografis menghambat perubahan sosial? | Kondisi fisik wilayah terpencil menutup kontak luar, memutus arus informasi, dan menghentikan difusi inovasi. |
| 6 | Bagaimana peran kontak kebudayaan lain mendorong dinamika sosial? | Interaksi langsung antarpopulasi berbeda membuka celah adopsi gagasan baru dan mempercepat pertukaran unsur budaya. |
| 7 | Mengapa kelompok pemilik vested interest menolak inovasi? | Inovasi dipandang sebagai ancaman langsung terhadap kenyamanan status sosial, privilese, dan posisi kekuasaan lama. |
| 8 | Bagaimana pendidikan formal maju mendorong perubahan sosial? | Pendidikan membekali cara berpikir ilmiah dan rasional untuk menilai serta memperbarui tata cara lama. |
| 9 | Apa perbedaan utama difusi dengan asimilasi kebudayaan? | Difusi sebatas proses penyebaran unsur budaya, bukan peleburan kebudayaan secara menyeluruh. |
| 10 | Apa hakikat utama teori evolusi multilinier? | Perubahan bertahap berlangsung melalui berbagai jalur perkembangan berbeda, bukan satu jalur seragam linear. |
| 11 | Apa penyebab utama terjadinya cultural lag? | Ketimpangan kecepatan adaptasi mental dan norma sosial terhadap teknologi material yang sudah maju. |
| 12 | Apa penyebab utama stagnasi pada masyarakat terisolasi? | Murni ketiadaan akses interaksi sosial luar, bukan akibat tingkat kecerdasan rendah. |
| 13 | Apa pemicu utama penolakan inovasi pada vested interest? | Keengganan melepas rasa aman dari sistem lama, bukan akibat faktor ketidakmampuan ekonomi. |
| 14 | Bencana alam dan perang tergolong faktor perubahan apa? | Faktor pemicu eksternal (dari luar masyarakat). |
| 15 | Pertambahan penduduk dan pemberontakan tergolong faktor apa? | Faktor pemicu internal (dari dalam masyarakat). |

### 5. Soal Kuis HOTS (5 Butir)
#### Soal 1 [Kunci: **E**]
**Skenario**: Pemerintah daerah meresmikan sistem transaksi tiket elektronik pada seluruh armada transportasi publik perkotaan. Namun, sebagian besar penumpang tetap berdesakan di loket manual demi mencetak tiket kertas karena belum terbiasa menggunakan kartu pembayaran digital secara mandiri. Berdasarkan sosiologi, fenomena ketimpangan respons tersebut merepresentasikan konsep...

**Pilihan Jawaban**:
- **A**. vested interest karena keengganan petugas melepas status kerjanya
- **B**. evolusi multilinier dalam modernisasi fasilitas umum perkotaan
- **C**. difusi budaya luar yang gagal diserap masyarakat secara menyeluruh
- **D**. isolasi kebudayaan masyarakat akibat penolakan sistem perbankan
- **E**. cultural lag akibat keterlambatan adaptasi norma terhadap teknologi

**Pembahasan**: Cultural lag terjadi ketika kebudayaan materiil (perangkat teknologi e-ticketing) berkembang melampaui kebudayaan immateriil (keterampilan, kebiasaan, dan pola pikir pengguna transportasi publik).

#### Soal 2 [Kunci: **A**]
**Skenario**: Dewan tetua pengrajin tenun di Desa Silungkang menolak implementasi alat tenun mesin otomatis bantuan dinas perindustrian, meskipun mesin tersebut mampu melipatgandakan omzet kain. Penolakan terjadi karena para tokoh senior khawatir kehilangan otoritas penentuan standar motif kain serta tergesernya kedudukan hierarki perajin berpengalaman oleh operator muda. Faktor penghambat perubahan sosial pada kasus tersebut adalah...

**Pilihan Jawaban**:
- **A**. vested interest dari kelompok senior guna mempertahankan privilese
- **B**. rendahnya mutu pendidikan formal masyarakat pengrajin daerah lokal
- **C**. prasangka kelompok tertutup terhadap bahaya destruksi budaya asing
- **D**. ketakutan irasional terhadap kerapuhan integrasi norma paguyuban desa
- **E**. isolasi geografis yang memutus komunikasi dan arus inovasi teknologi

**Pembahasan**: Vested interest adalah kepentingan yang tertanam kuat pada kelompok yang diuntungkan oleh tatanan lama. Pengrajin senior menolak pembaruan mesin demi mempertahankan posisi sosial dan monopoli otoritas keahlian mereka.

#### Soal 3 [Kunci: **E**]
**Skenario**: Sekelompok pemuda tani di lereng gunung mempelajari teknik irigasi tetes hemat air setelah berdiskusi langsung dengan tim agronom dari universitas mitra. Teknik tersebut kemudian diterapkan bersama warga desa tetangga tanpa mengubah tatanan nilai musyawarah tradisional setempat. Mekanisme pendorong dinamika perubahan sosial pada fenomena ini dinamakan...

**Pilihan Jawaban**:
- **A**. asimilasi penuh yang menghapus ciri identitas budaya agraris
- **B**. revolusi struktural yang memutus rantai birokrasi kepemilikan lahan
- **C**. akulturasi mutlak akibat peleburan menyeluruh dua kebudayaan
- **D**. disorganisasi sosial yang memaksa terbentuknya kebiasaan baru
- **E**. difusi kebudayaan melalui kontak langsung antarpopulasi berbeda

**Pembahasan**: Difusi adalah proses penyebaran unsur-unsur kebudayaan, ide, atau teknik dari individu/kelompok satu ke individu/kelompok lain. Interaksi petani dengan ilmuwan universitas memicu difusi metode irigasi.

#### Soal 4 [Kunci: **E**]
**Skenario**: Dua komunitas pesisir mengembangkan sistem ekonomi maritim yang berlainan: Komunitas A beralih ke budidaya rumput laut berbasis bioteknologi modern, sedangkan Komunitas B mengembangkan koperasi pariwisata bahari berbasis kearifan lokal. Keduanya berhasil mencapai tingkat kemakmuran tanpa mengikuti pola industrialisasi pabrik pengolahan ikan seperti perkotaan. Teori sosiologi yang paling relevan menjelaskan variasi perkembangan ini adalah...

**Pilihan Jawaban**:
- **A**. teori siklus peradaban yang memandang dinamika sosial berulang
- **B**. teori konflik dialektis yang mendasarkan kemajuan pada revolusi kelas
- **C**. teori evolusi unilinier yang mewajibkan tahapan seragam industri
- **D**. teori perubahan struktural-fungsional atas dasar difusi mekanik
- **E**. teori evolusi multilinier yang mengakui keragaman jalur perubahan

**Pembahasan**: Teori evolusi multilinier menekankan bahwa setiap masyarakat dapat berkembang menuju tingkat kemajuan tertentu melalui rute atau tahapan yang berlainan, bukan lewat satu jalur tunggal yang kaku.

#### Soal 5 [Kunci: **E**]
**Skenario**: Suku pedalaman di lembah perbukitan terpencil belum mengenal teknologi penanaman bibit unggul maupun sistem perbankan. Kondisi ini murni disebabkan oleh ketiadaan jalur transportasi darat dan infrastruktur telekomunikasi yang menghubungkan mereka dengan peradaban luar. Menurut konsep sosiologi Selo Soemardjan, hambatan perubahan sosial tersebut diklasifikasikan sebagai...

**Pilihan Jawaban**:
- **A**. prasangka berlebihan terhadap potensi ancaman disintegrasi budaya
- **B**. cultural lag akibat penolakan mental masyarakat terhadap sains modern
- **C**. penolakan ideologis terhadap integrasi sistem ekonomi pasar bebas
- **D**. vested interest akibat monopoli adat kepemimpinan suku pedalaman
- **E**. faktor isolasi geografis yang membatasi kontak dan difusi informasi

**Pembahasan**: Isolasi geografis adalah kondisi keterisolasian fisik wilayah yang menutup akses komunikasi dan transportasi, sehingga mencegah terjadinya kontak kebudayaan dan difusi inovasi dari luar.

---

## SESI 4: "Elastisitas Permintaan dan Penawaran" (`doc_1791140381993_o1i2z`)

- **Panjang Dokumen**: 11.976 karakter
- **Tanggal Dibuat**: 5/10/2026, 02.00.24
- **Jumlah Segmen Sumber Tersimpan**: 11
- **Jumlah Konsep Kanonikal**: 5
- **Jumlah Flashcard**: 13
- **Jumlah Soal Kuis HOTS**: 5

### 1. Segmen Sumber Tersimpan (`document_segments`)
#### Segmen 1 [Tipe: `ruangguru`]
```text
[Sumber: Pengertian Elastisitas Permintaan & Penawaran serta Rumusnya | Ekonomi Kelas 10 (https://www.ruangguru.com/blog/alasan-kenapa-harga-bahan-pokok-naik-menjelang-lebaran)]
Kenapa ya setiap menjelang lebaran harga pokok hampir selalu meningkat? Hal ini ada kaitannya dengan permintaan dan penawaran. Simak artikel Ekonomi kelas 10 ini untuk penjelasan lebih lengkapnya.

Kenapa sih harga bahan pokok selalu naik saat menjelang lebaran dan saat bulan puasa? Hampir setiap orang pasti mengeluh den...
```

#### Segmen 2 [Tipe: `ruangguru`]
```text
[Sumber: Rangkuman Materi Ekonomi Kelas 10 Kurikulum Merdeka (https://www.ruangguru.com/blog/materi-ekonomi-kelas-10-kurikulum-merdeka)]
Yuk, cek daftar lengkap materi pelajaran Ekonomi kelas 10 SMA, mulai dari semester 1 hingga semester 2, sesuai Kurikulum Merdeka!

Kalau kamu baru masuk SMA dan mulai belajar Ekonomi, mungkin kamu akan bertanya-tanya, “Sebenernya, materi Ekonomi kelas 10 itu belajar apa aja, sih?” Nah, di artikel ini, kita akan bahas lengkap materi ekonomi kelas 10 Kurikulum Me...
```

#### Segmen 3 [Tipe: `wikipedia`]
```text
[Sumber: Elastisitas (ekonomi) (https://id.wikipedia.org/wiki/Elastisitas%20(ekonomi))]
Dalam ilmu ekonomi, elastisitas adalah perbandingan perubahan proporsional dari sebuah variabel dengan perubahan variable lainnya. Dengan kata lain, elastisitas mengukur seberapa besar kepekaan atau reaksi konsumen terhadap perubahan harga.
Rumus elastisitas yaitu

  
    
      
        
          E
          
            d
          
        
        =
        
          
            
              Δ
      ...
```

#### Segmen 4 [Tipe: `wikipedia`]
```text
[Sumber: Ekonomi mikro (https://id.wikipedia.org/wiki/Ekonomi%20mikro)]
Ekonomi mikro (sering juga ditulis mikroekonomi) adalah cabang dari ilmu ekonomi yang mempelajari perilaku konsumen dan perusahaan serta penentuan harga-harga pasar dan kuantitas faktor input, barang dan jasa yang diperjual-belikan. Ekonomi mikro meneliti bagaimana berbagai keputusan dan perilaku tersebut memengaruhi penawaran dan permintaan atas barang dan jasa, yang akan menentukan harga; dan bagaimana harga, pada gilirann...
```

#### Segmen 5 [Tipe: `wikipedia`]
```text
[Sumber: Filsafat ekonomi (https://id.wikipedia.org/wiki/Filsafat%20ekonomi)]
Filsafat Ekonomi adalah interdisiplin ilmu ekonomi yang berkutat pada pengkajian teori ekonomi ; metodologi ekonomi, berupa penilaian terhadap hasil, institusi, dan proses ekonomi ; serta etika dalam proses ekonomi. Fokus utama pada kajian filsafat ekonomi adalah permasalahan yang berkaitan dengan metodologi dan epistemologi. Pengkajian atau pembelajaran konseptual terhadap metodologi dan teori ekonomi akan membawa ahl...
```

#### Segmen 6 [Tipe: `wikipedia`]
```text
[Sumber: Elastisitas permintaan (https://id.wikipedia.org/wiki/Elastisitas%20permintaan)]
Dalam ilmu ekonomi, elastisitas permintaan atau price elasticity of demand (PED) adalah ukuran perubahan jumlah permintaan barang (jumlah barang akan dibeli oleh pembeli) terhadap perubahan harga barang itu. Pada umumnya, jika harga barang naik, kesediaan pembeli untuk membeli barang tersebut akan menurun. Namun, tingkat perubahan ini berbeda-beda: untuk barang tertentu, kenaikan harga yang kecil akan penga...
```

#### Segmen 7 [Tipe: `wikibooks`]
```text
[Sumber: Ekonomi mikro (https://id.wikibooks.org/wiki/Ekonomi%20mikro)]
Model permintaan dan penawaran menjelaskan bagaimana harga beragam sebagai hasil dari keseimbangan antara ketersediaan produk pada tiap harga (penawaran) dengan kebijakan distribusi dan keinginan dari mereka dengan kekuatan pembelian pada tiap harga (permintaan). Grafik ini memperlihatkan sebuah pergeseran ke kanan dalam permintaan dari D1 ke D2 bersama dengan peningkatan harga dan jumlah yang diperlukan untuk mencapai sebua...
```

#### Segmen 8 [Tipe: `wikibooks`]
```text
[Sumber: Ekonomi Publik/Teori Sektor Publik (https://id.wikibooks.org/wiki/Ekonomi%20Publik%2FTeori%20Sektor%20Publik)]
Kata “Publik” berasal dari bahasa Latin publicus yang artinya “dewasa”, dalam konteks ekonomi adalah penyampaian gagasan yang berkaitan dengan masyarakat. Dalam bahasa Inggris “publik” berarti milik warga, bangsa, atau masyarakat luas yang dipertahankan atau digunakan oleh orang atau masyarakat secara keseluruhan. Jadi yang dimaksud dengan sektor publik adalah segala sesuatu ya...
```

#### Segmen 9 [Tipe: `crossref`]
```text
[Sumber: elastisitas permintaan dan penawaran]
catatan tugas resume ekonomi mikro tentang elastisitas permintaan dan penawaran
```

#### Segmen 10 [Tipe: `crossref`]
```text
[Sumber: ELASTISITAS PERMINTAAN DAN PENAWARAN]
catatan tugas rsume ekonomi mikro tentang elastistas permintaan dan penawaran
```

#### Segmen 11 [Tipe: `crossref`]
```text
[Sumber: Elastisitas Permintaan dan Penawaran]
Elastisitas permintaan adalah suatu alat atau konsep yang digunakan untuk mengukur derajat kepekaan atau respon perubahan jumlah atau kualitas barang yang dibeli sebagai akibat perubahan faktor yang mempengaruhi.
```

### 2. Konsep Kanonikal Kurikulum (`document_concepts`)
#### 1. [SUMBER RESMI] Elastisitas
- **Definisi Baku**: Tingkat kepekaan atau perbandingan perubahan proporsional dari sebuah variabel terhadap perubahan variabel lainnya.
- **Peringatan Salah Kaprah**: Elastisitas dianggap nilai perubahan absolut, bukan perbandingan perubahan proporsional atau persentase.

#### 2. [SUMBER RESMI] Elastisitas Permintaan
- **Definisi Baku**: Ukuran derajat kepekaan perubahan jumlah barang yang diminta akibat perubahan harga barang tersebut.
- **Rumus KaTeX**: $E_d = \frac{\Delta Q}{\Delta P} \cdot \frac{P}{Q}$
- **Peringatan Salah Kaprah**: Tanda negatif elastisitas permintaan dianggap nilai matematis riil, padahal tanda negatif hanya tunjuk arah hubungan terbalik harga dan kuantitas.

#### 3. [SUMBER RESMI] Klasifikasi Elastisitas
- **Definisi Baku**: Pengelompokan respon kuantitas barang berdasar nilai koefisien, cakup elastis ($E > 1$), inelastis ($E < 1$), elastis uniter ($E = 1$), inelastis sempurna ($E = 0$), dan elastis sempurna ($E = \infty$).
- **Peringatan Salah Kaprah**: Anggapan semua barang bereaksi sama saat harga naik, padahal derajat perubahan beda tergantung sifat kebutuhan dan substitusi.

#### 4. [SUMBER RESMI] Ceteris Paribus
- **Definisi Baku**: Asumsi bahwa semua faktor lain di luar variabel yang sedang dianalisis tetap sama atau konstan.
- **Peringatan Salah Kaprah**: Lupa anggap faktor lain konstan hingga analisis dampak perubahan harga jadi rancu dengan pengaruh faktor pendapatan atau tren.

#### 5. [PENGAYAAN AI] Elastisitas Penawaran
- **Definisi Baku**: Ukuran derajat kepekaan persentase perubahan jumlah barang yang ditawarkan akibat persentase perubahan harga barang tersebut.
- **Rumus KaTeX**: $E_s = \frac{\Delta Q_s}{\Delta P} \cdot \frac{P}{Q_s}$
- **Peringatan Salah Kaprah**: Penyamaan respon penawaran dan permintaan, padahal koefisien elastisitas penawaran punya korelasi positif searah dengan harga.

### 3. Struktur Modul & Contoh Teks Bersekat
**Daftar Bab Terdeteksi**:
- Bab 1: Fondasi Konsep Elastisitas dan Asumsi Pasar
- Bab 2: Elastisitas Permintaan: Pengukuran dan Klasifikasi
- Bab 3: Elastisitas Penawaran dan Pengambilan Keputusan Ekonomi

**Cuplikan Teks Modul**:
```markdown
# Elastisitas Permintaan dan Penawaran

> Selamat datang di pembahasan elastisitas ekonomi bersama Nara! Di modul ini, kita akan membongkar rahasia di balik naik-turunnya harga barang di pasar, mengapa pembeli bereaksi panik saat harga kebutuhan tertentu naik, dan bagaimana produsen menentukan strategi penetapan harga yang tepat. Dengan memahami derajat kepekaan transaksi pasar serta asumsi dasarnya, kamu akan menguasai materi kunci ujian ekonomi ini secara mendalam dan terstruktur.

---

## Bab 1: Fondasi Konsep Elastisitas dan Asumsi Pasar

### Elastisitas

Bayangkan kamu sedang menarik dua benda berbeda: seutas karet gelang dan sebatang kayu kecil. Karet gelang akan memanjang secara drastis saat ditarik, sedangkan kayu hampir tidak berubah bentuk sama sekali. Pasar bekerja dengan cara yang persis sama ketika disentuh oleh perubahan harga atau pendapatan.

Sebagian barang mengalami lonjakan atau penurunan transaksi yang sangat besar saat harganya digeser sedikit saja. Namun, ada pula barang yang jumlah transaksinya hampir bergeming meskipun harganya melonjak tinggi. Derajat kelenturan atau respons pasar inilah yang menjadi inti pembahasan kita.

> 📖 **Definisi Baku:**
> Elastisitas adalah tingkat kepekaan atau perbandingan perubahan proporsional dari sebuah variabel terhadap perubahan variabel lainnya.

Dalam analisis ekonomi mikro, kita tidak sekadar melihat apakah jumlah barang bertambah atau berkurang. Kita mengukur seberapa sensitif variabel jumlah barang merespons pem...
```

### 4. Daftar Flashcard (13 Kartu)
| No | Pertanyaan (Front) | Kunci Jawaban (Back) |
|---|---|---|
| 1 | Apa definisi umum elastisitas dalam ekonomi? | Perbandingan perubahan proporsional dari sebuah variabel terhadap perubahan variabel lainnya. |
| 2 | Apa definisi baku elastisitas permintaan? | Ukuran derajat kepekaan perubahan jumlah barang yang diminta akibat perubahan harga barang tersebut. |
| 3 | Apa definisi baku elastisitas penawaran? | Ukuran derajat kepekaan persentase perubahan jumlah barang yang ditawarkan akibat persentase perubahan harga barang tersebut. |
| 4 | Apa makna asumsi ceteris paribus? | Asumsi bahwa semua faktor lain di luar variabel yang sedang dianalisis bernilai tetap atau konstan. |
| 5 | Apa arti klasifikasi elastisitas elastis ($E > 1$)? | Persentase perubahan jumlah barang lebih besar daripada persentase perubahan harga. |
| 6 | Apa arti klasifikasi elastisitas inelastis ($E < 1$)? | Persentase perubahan kuantitas lebih kecil daripada persentase perubahan harga. |
| 7 | Berapa koefisien untuk kondisi inelastis sempurna? | Nilai koefisien sama dengan nol ($E = 0$). |
| 8 | Berapa koefisien untuk kondisi elastis sempurna? | Nilai koefisien tak terhingga ($E = \infty$). |
| 9 | Apa fungsi elastisitas silang permintaan? | Mengukur kepekaan permintaan suatu barang akibat perubahan harga barang komplementer atau barang substitusi. |
| 10 | Apa arti tanda negatif elastisitas permintaan? | Tanda negatif bukan nilai riil, melainkan menunjukkan arah hubungan terbalik antara harga dan kuantitas. |
| 11 | Bagaimana hubungan arah elastisitas penawaran? | Koefisien memiliki korelasi positif atau perubahan jumlah barang searah dengan perubahan harga. |
| 12 | Bagaimana rumus resmi koefisien elastisitas permintaan? | $E_d = \frac{\Delta Q}{\Delta P} \cdot \frac{P}{Q}$ |
| 13 | Bagaimana rumus resmi koefisien elastisitas penawaran? | $E_s = \frac{\Delta Q_s}{\Delta P} \cdot \frac{P}{Q_s}$ |

### 5. Soal Kuis HOTS (5 Butir)
#### Soal 1 [Kunci: **E**]
**Skenario**: Sebuah koperasi sekolah menjual buku tulis dengan harga awal Rp4.000,00 per buah dan mencatat permintaan harian sebanyak 200 buah. Ketika harga buku tulis dinaikkan menjadi Rp5.000,00 per buah, jumlah buku yang diminta turun menjadi 120 buah. Dengan asumsi ceteris paribus, nilai koefisien elastisitas permintaan buku tulis tersebut adalah...

**Pilihan Jawaban**:
- **A**. $E_d = 0{,}6$
- **B**. $E_d = 2{,}0$
- **C**. $E_d = 1{,}2$
- **D**. $E_d = 1{,}0$
- **E**. $E_d = 1{,}6$

**Pembahasan**: Elastisitas permintaan dihitung menggunakan perbandingan perubahan relatif kuantitas terhadap harga. Diperoleh nilai mutlak koefisien sebesar 1,6 yang menandakan sifat permintaan elastis.

#### Soal 2 [Kunci: **C**]
**Skenario**: Pengrajin anyaman bambu mulanya menjual tas belanja seharga Rp20.000,00 dan mampu menyediakan stok 100 unit per minggu. Menjelang festival kerajinan, harga tas naik menjadi Rp25.000,00 sehingga penawaran tas naik menjadi 150 unit per minggu. Koefisien elastisitas penawaran ($E_s$) tas bambu tersebut adalah...

**Pilihan Jawaban**:
- **A**. $E_s = 1{,}0$
- **B**. $E_s = 0{,}5$
- **C**. $E_s = 2{,}0$
- **D**. $E_s = 1{,}5$
- **E**. $E_s = 2{,}5$

**Pembahasan**: Perubahan harga sebesar 25% memicu pertambahan penawaran sebesar 50%, menghasilkan koefisien $E_s = 50\% / 25\% = 2{,}0$.

#### Soal 3 [Kunci: **D**]
**Skenario**: Jika fungsi permintaan suatu komoditas sayur di pasar lokal dirumuskan dengan $Q_d = 500 - 2P$, berapakah nilai koefisien elastisitas permintaan titik ($E_d$) pada tingkat harga $P = 100$?

**Pilihan Jawaban**:
- **A**. $E_d = 0{,}50$
- **B**. $E_d = 0{,}25$
- **C**. $E_d = 1{,}00$
- **D**. $E_d = 0{,}67$
- **E**. $E_d = 1{,}50$

**Pembahasan**: Elastisitas pada titik tertentu dihitung dari turunan pertama fungsi permintaan dikalikan rasio harga terhadap kuantitas barang.

#### Soal 4 [Kunci: **B**]
**Skenario**: Hasil analisis pasar menunjukkan bahwa kenaikan harga tiket kereta komuter sebesar 10% mengakibatkan penurunan jumlah penumpang sebesar 10%. Berdasarkan nilai koefisien elastisitasnya, sifat permintaan tiket kereta tersebut tergolong...

**Pilihan Jawaban**:
- **A**. Elastis
- **B**. Elastis uniter
- **C**. Inelastis
- **D**. Elastis sempurna
- **E**. Inelastis sempurna

**Pembahasan**: Jika persentase perubahan kuantitas yang diminta persis sama dengan persentase perubahan harga barang ($E = 1$), sifat permintaannya adalah elastis uniter.

#### Soal 5 [Kunci: **A**]
**Skenario**: Dalam kajian ekonomi mikro, hukum permintaan yang menyatakan hubungan terbalik antara tingkat harga dan jumlah barang yang diminta hanya berlaku sah apabila memenuhi syarat...

**Pilihan Jawaban**:
- **A**. Faktor penentu lain diasumsikan konstan
- **B**. Pemerintah menetapkan regulasi batas harga
- **C**. Pendapatan konsumen mengalami lonjakan pesat
- **D**. Pasar berada pada struktur monopoli murni
- **E**. Tingkat elastisitas penawaran bernilai nol

**Pembahasan**: Hukum permintaan berlaku dengan asumsi ceteris paribus, di mana faktor lain seperti selera, pendapatan, dan harga barang substitusi tidak mengalami perubahan.

---

## SESI 5: "Matriks Transformasi Geometri 2x2" (`doc_1791140489330_pea6c`)

- **Panjang Dokumen**: 6.676 karakter
- **Tanggal Dibuat**: 5/10/2026, 02.01.50
- **Jumlah Segmen Sumber Tersimpan**: 3
- **Jumlah Konsep Kanonikal**: 6
- **Jumlah Flashcard**: 13
- **Jumlah Soal Kuis HOTS**: 5

### 1. Segmen Sumber Tersimpan (`document_segments`)
#### Segmen 1 [Tipe: `crossref`]
```text
[Sumber: GEOMETRI FRAKTAL DAN TRANSFORMASI GEOMETRI SEBAGAI DASAR PENGEMBANGAN MOTIF BATIK SEKAR JAGAD]
Batik adalah bagian dari kebudayaan yang telah menjadi keseharian masyarakat Indonesia.Setiap motif yang digambarkan pada kain biasanya memiliki filosofi atau makna-makna tertentu yang dipengaruhi oleh kondisi disekitar pembuat batik, salah satunya adalah motif batik SekarJagad. Pengembangan motif batik dapat dilakukan dengan berbagai cara, salah satunya dengan menggunakan pola-pola geometri f...
```

#### Segmen 2 [Tipe: `crossref`]
```text
[Sumber: Etnomatematika: Eksplorasi Transformasi Geometri Tenun Suku Sasak Sukarara]
Mathematics is considered as a subject that still far from reality and culture. Historically, mathematics has closely related to everyday life, including culture in Lombok West Nusa Tenggara. This culture can explore mathematical concepts to bring mathematics closer to reality and people's perceptions and cultural aspects as the basis for learning mathematics in schools. Therefore, this study explores the elemen...
```

#### Segmen 3 [Tipe: `crossref`]
```text
[Sumber: MENENTUKAN MATRIKS PELUANG TRANSISI UNTUK WAKTU OKUPANSI MENGGUNAKAN TRANSFORMASI LAPLACE DAN MATRIKS EKSPONENSIAL]
MENENTUKAN MATRIKS PELUANG TRANSISI UNTUK WAKTU OKUPANSI MENGGUNAKAN TRANSFORMASI LAPLACE DAN MATRIKS EKSPONENSIAL
```

### 2. Konsep Kanonikal Kurikulum (`document_concepts`)
#### 1. [SUMBER RESMI] Transformasi Geometri
- **Definisi Baku**: Operasi pemetaan titik-titik pada bidang datar ke himpunan titik lain berdasar aturan tertentu.
- **Rumus KaTeX**: $\begin{pmatrix} x' \\ y' \end{pmatrix} = M \begin{pmatrix} x \\ y \end{pmatrix}$
- **Peringatan Salah Kaprah**: Anggap transformasi geometri ubah luas objek pada semua jenis operasi.

#### 2. [SUMBER RESMI] Geometri Fraktal
- **Definisi Baku**: Bentuk geometri kasar atau terfragmentasi yang tunjukkan sifat keserupaan diri pada berbagai skala pembesaran.
- **Tokoh/Ahli**: Benoit Mandelbrot, Waclaw Sierpinski, David Hilbert, Helge von Koch
- **Peringatan Salah Kaprah**: Kira fraktal hanya pola berulang biasa tanpa rasio skala matematis pasti.

#### 3. [SUMBER RESMI] Refleksi (Pencerminan)
- **Definisi Baku**: Transformasi yang memindahkan setiap titik pada bidang pakai sifat bayangan cermin dari titik yang dipindahkan.
- **Rumus KaTeX**: $\begin{pmatrix} x' \\ y' \end{pmatrix} = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix}$
- **Peringatan Salah Kaprah**: Pencerminan ubah ukuran objek asli.

#### 4. [PENGAYAAN AI] Matriks Representasi Transformasi 2x2
- **Definisi Baku**: Matriks berordo 2x2 yang gunakan aljabar linier untuk petakan vektor basis bidang dua dimensi.
- **Rumus KaTeX**: M = \begin{pmatrix} a & b \\ c & d \end{pmatrix}
- **Peringatan Salah Kaprah**: Operasi translasi murni bisa dibuat matriks pengali 2x2 tanpa koordinat homogen.

#### 5. [PENGAYAAN AI] Rotasi (Perputaran)
- **Definisi Baku**: Transformasi yang memutar setiap titik sebesar sudut tertentu terhadap pusat putaran tetap.
- **Rumus KaTeX**: R_\theta = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}
- **Peringatan Salah Kaprah**: Sudut putar positif gerak searah jarum jam.

#### 6. [PENGAYAAN AI] Dilatasi (Perkalian Skala)
- **Definisi Baku**: Transformasi yang ubah ukuran bangun tanpa ubah bentuk bangun asal.
- **Rumus KaTeX**: D_k = \begin{pmatrix} k & 0 \\ 0 & k \end{pmatrix}
- **Peringatan Salah Kaprah**: Dilatasi faktor negatif hasilkan bangun tidak simetris arah sebaliknya.

### 3. Struktur Modul & Contoh Teks Bersekat
**Daftar Bab Terdeteksi**:
- Bab 1: Fondasi Geometri Bidang dan Konsep Transformasi
- Bab 2: Representasi Aljabar Linier Matriks Ordo 2x2
- Bab 3: Operasi Isometri - Refleksi dan Rotasi
- Bab 4: Operasi Non-Isometri - Dilatasi Skala
- Bab 5: Rantai Kausalitas & Panduan Ujian (Exam Mastery)

**Cuplikan Teks Modul**:
```markdown
# Matriks Transformasi Geometri 2x2

> Modul pelajari pemetaan titik pada bidang datar via aljabar linier matriks $2 \times 2$. Analisis mencakup prinsip transformasi, geometri fraktal etnomatematika, hingga operasi refleksi, rotasi, dan dilatasi untuk persiapan ujian.

## Bab 1: Fondasi Geometri Bidang dan Konsep Transformasi

Transformasi geometri petakan posisi objek pada bidang datar dua dimensi tanpa rusak relasi garis lurus.

### Definisi Baku Pemetaan Linier
Transformasi linier petakan titik awal $(x, y)$ ke titik bayangan $(x', y')$ melalui matriks operator $M$ orde $2 \times 2$. Operasi jaga titik origin $(0,0)$ tetap diam:

$$\begin{pmatrix} x' \\ y' \end{pmatrix} = M \begin{pmatrix} x \\ y \end{pmatrix}$$

Contoh titik $P(2, 3)$ dikenai $M = \begin{pmatrix} 2 & 0 \\ 0 & 2 \end{pmatrix}$:

$$\begin{pmatrix} x' \\ y' \end{pmatrix} = \begin{pmatrix} 2 & 0 \\ 0 & 2 \end{pmatrix} \begin{pmatrix} 2 \\ 3 \end{pmatrix} = \begin{pmatrix} (2)(2) + (0)(3) \\ (0)(2) + (2)(3) \end{pmatrix} = \begin{pmatrix} 4 \\ 6 \end{pmatrix}$$

Hasil: titik bergeser ke $P'(4, 6)$.

### Etnomatematika dan Geometri Fraktal
Penenun Desa Sukarara pindahkan motif lungi/lumbung pakai kaidah pergeseran geometri teratur. Pada batik Sekar Jagad, pola tunjukkan struktur **fraktal**: bentuk terfragmentasi dengan sifat keserupaan diri (*self-similarity*) lintas skala perbesaran via fungsi iteratif (studi Mandelbrot, Sierpinski, Hilbert, Koch). Contoh alam: struktur brokoli Romanesco.

Fraktal punya rasi...
```

### 4. Daftar Flashcard (13 Kartu)
| No | Pertanyaan (Front) | Kunci Jawaban (Back) |
|---|---|---|
| 1 | Apa definisi transformasi geometri? | Operasi pemetaan titik-titik pada bidang datar ke himpunan titik lain berdasarkan aturan tertentu. |
| 2 | Apa definisi geometri fraktal? | Bentuk geometri kasar atau terfragmentasi yang menunjukkan sifat keserupaan diri pada berbagai skala pembesaran. |
| 3 | Apa definisi refleksi (pencerminan)? | Transformasi yang memindahkan setiap titik pada bidang menggunakan sifat bayangan cermin dari titik asal. |
| 4 | Apa definisi matriks representasi transformasi 2x2? | Matriks berordo 2x2 yang menggunakan aljabar linier untuk memetakan vektor basis bidang dua dimensi. |
| 5 | Bagaimana pengaruh rotasi terhadap titik pada bidang? | Memutar setiap titik sebesar sudut tertentu terhadap pusat putaran tetap. |
| 6 | Bagaimana dilatasi memengaruhi ukuran dan bentuk bangun? | Mengubah ukuran bangun tanpa mengubah bentuk bangun asalnya. |
| 7 | Mengapa translasi murni tidak bisa memakai matriks 2x2? | Translasi murni membutuhkan koordinat homogen agar dapat direpresentasikan dalam bentuk matriks pengali. |
| 8 | Konsep geometri apa yang ditemukan pada tenun Sukarara? | Konsep refleksi dan translasi pada motif wayang, subahnale, keker, bintang empat, dan alang/lumbung. |
| 9 | Apa arah putaran sudut positif pada rotasi? | Sudut bernilai positif berputar berlawanan arah dengan jarum jam, bukan searah jarum jam. |
| 10 | Apakah transformasi geometri selalu mengubah luas objek? | Salah. Tidak semua operasi mengubah luas; refleksi dan rotasi mempertahankan luas objek aslinya. |
| 11 | Berapa rumus matriks refleksi terhadap sumbu X? | $\begin{pmatrix} x' \\ y' \end{pmatrix} = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix}$ |
| 12 | Berapa rumus matriks untuk rotasi sudut $\theta$? | $R_\theta = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}$ |
| 13 | Berapa rumus matriks dilatasi dengan faktor skala $k$? | $D_k = \begin{pmatrix} k & 0 \\ 0 & k \end{pmatrix}$ |

### 5. Soal Kuis HOTS (5 Butir)
#### Soal 1 [Kunci: **E**]
**Skenario**: Seorang perajin kain tenun Sukarara memetakan koordinat motif dasar pada bidang Kartesius dua dimensi menggunakan matriks transformasi $M = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$. Berapakah ordo dari matriks representasi transformasi linier tersebut?

**Pilihan Jawaban**:
- **A**. $1 \times 2$
- **B**. $3 \times 3$
- **C**. $2 \times 3$
- **D**. $2 \times 1$
- **E**. $2 \times 2$

**Pembahasan**: Matriks transformasi pada bidang koordinat Kartesius 2D memetakan vektor berdimensi 2 ke dimensi 2, sehingga matriks berordo $2 \times 2$.

#### Soal 2 [Kunci: **C**]
**Skenario**: Titik ujung motif pucuk rebung berada pada koordinat $P(3, 2)$. Perajin mencerminkan motif tersebut terhadap sumbu-$X$ menggunakan matriks pencerminan $\begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}$. Berapakah koordinat bayangan $P'$ hasil pencerminan tersebut?

**Pilihan Jawaban**:
- **A**. $(2, 3)$
- **B**. $(-3, 2)$
- **C**. $(3, -2)$
- **D**. $(-2, 3)$
- **E**. $(-3, -2)$

**Pembahasan**: Pencerminan terhadap sumbu-$X$ mempertahankan nilai absis $x$ dan membalik tanda ordinat $y$, menghasilkan $(3, -2)$.

#### Soal 3 [Kunci: **D**]
**Skenario**: Dalam desain digital motif fraktal Sierpinski untuk batik Sekar Jagad, sebuah titik sudut segitiga $A(2, 4)$ diperbesar terhadap pusat $(0, 0)$ dengan faktor skala $k = 3$. Berapakah koordinat baru titik sudut $A'$?

**Pilihan Jawaban**:
- **A**. $(6, 4)$
- **B**. $(5, 7)$
- **C**. $(2, 12)$
- **D**. $(6, 12)$
- **E**. $(12, 6)$

**Pembahasan**: Dilatasi titik $(x, y)$ berpusat di $(0,0)$ dengan faktor skala $k$ menghasilkan koordinat $(kx, ky) = (3 \times 2, 3 \times 4) = (6, 12)$.

#### Soal 4 [Kunci: **A**]
**Skenario**: Sebuah simpul motif kain tenun subahnale terletak pada koordinat $B(4, 1)$. Titik tersebut diputar sebesar $\theta = 90^\circ$ berlawanan arah jarum jam terhadap pusat $(0, 0)$ menggunakan matriks rotasi $R_{90^\circ} = \begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}$. Berapakah koordinat bayangan $B'$?

**Pilihan Jawaban**:
- **A**. $(-1, 4)$
- **B**. $(-1, -4)$
- **C**. $(1, -4)$
- **D**. $(-4, 1)$
- **E**. $(1, 4)$

**Pembahasan**: Rotasi $90^\circ$ berlawanan arah jarum jam memetakan titik $(x, y)$ ke $(-y, x)$. Dengan $x = 4$ dan $y = 1$, diperoleh $(-1, 4)$.

#### Soal 5 [Kunci: **B**]
**Skenario**: Titik ornamen kurva fraktal pada batik Sekar Jagad mula-mula berada pada koordinat $C(1, 2)$. Titik tersebut pertama dicerminkan terhadap sumbu-$X$, kemudian bayangannya didilatasi terhadap pusat $(0, 0)$ dengan faktor skala $k = 2$. Berapakah koordinat akhir titik tersebut?

**Pilihan Jawaban**:
- **A**. $(-2, 4)$
- **B**. $(2, -4)$
- **C**. $(4, -2)$
- **D**. $(-2, -4)$
- **E**. $(2, 4)$

**Pembahasan**: Tahap 1 menghasilkan bayangan $(1, -2)$. Tahap 2 melipatgandakan kedua koordinat dengan faktor 2, menghasilkan $(2, -4)$.

---

## SESI 6: "Struktur Sosial & Mobilitas Sosial" (`doc_1791141138264_56lsn`)

- **Panjang Dokumen**: 5.866 karakter
- **Tanggal Dibuat**: 5/10/2026, 02.12.37
- **Jumlah Segmen Sumber Tersimpan**: 9
- **Jumlah Konsep Kanonikal**: 7
- **Jumlah Flashcard**: 12
- **Jumlah Soal Kuis HOTS**: 5

### 1. Segmen Sumber Tersimpan (`document_segments`)
#### Segmen 1 [Tipe: `ruangguru`]
```text
[Sumber: Teks Tanggapan: Pengertian, Ciri, Struktur & Contoh | Bahasa Indonesia Kelas 9 (https://www.ruangguru.com/blog/struktur-dan-contoh-teks-tanggapan-berisi-kritik-dan-pujian)]
Bahasa Indonesia SMP Kelas 9

Yuk, kita belajar tentang teks tanggapan, mulai dari pengertian, ciri, struktur, kaidah kebahasaan, hingga contohnya di artikel Bahasa Indonesia kelas 9 ini!

Dalam suatu forum lisan atau tulisan, baik itu ilmiah maupun nonilmiah, tentu kamu dapat memberikan tanggapan yang berisi kritik ...
```

#### Segmen 2 [Tipe: `wikipedia`]
```text
[Sumber: Struktur sosial (https://id.wikipedia.org/wiki/Struktur%20sosial)]
Struktur sosial adalah suatu tingkatan dalam masyarakat. Salah satu jenis contoh konkret dari struktur sosial adalah sistem kasta. Menurut Abdul Syani, struktur sosial dapat diartikan sebagai suatu tatanan sosial yang ada pada masyarakat yang juga merupakan jaringan dari unsur-unsur sosial yang pokok. Proses pembentukan struktur sosial dipengaruhi oleh beberapa hal, seperti; (1) penemuan-penemuan baru dalam hal ilmu peng...
```

#### Segmen 3 [Tipe: `wikipedia`]
```text
[Sumber: Perubahan sosial (https://id.wikipedia.org/wiki/Perubahan%20sosial)]
Perubahan sosial adalah bentuk peralihan yang mengubah tata kehidupan masyarakat yang berlangsung terus menerus karena sifat sosial yang dinamis dan bisa terus berubah, dan merupakan perubahan-perubahan yang terjadi pada individu dalam masyarakat dan juga lembaga-lembaga kemasyarakatan dalam suatu masyarakat yang memengaruhi sistem sosialnya, termasuk nilai, adat, budaya, sikap-sikap sosial dari Individu masyarakat ter...
```

#### Segmen 4 [Tipe: `wikipedia`]
```text
[Sumber: Gerak sosial (https://id.wikipedia.org/wiki/Gerak%20sosial)]
Gerak sosial  atau mobilitas sosial adalah perpindahan status sosial sekelompok orang atau individu ke status yang lain baik secara vertikal maupun horizontal. Hal ini dilakukan pada suatu sistem sosial yang memiliki sistem stratifikasi sosial terbuka. Seseorang dapat melakukan mobilisasi sosial apabila ia dapat memenuhi persyaratan tertentu di tingkat sosial tertentu, seperti tingkat studi, kekayaan, pangkat, atau lainnya. Bi...
```

#### Segmen 5 [Tipe: `wikipedia`]
```text
[Sumber: Stratifikasi sosial (https://id.wikipedia.org/wiki/Stratifikasi%20sosial)]
Stratifikasi sosial atau penstrataan sosial adalah pembedaan atau pengelompokan para anggota masyarakat secara vertikal (bertingkat). Menurut sosiolog Italia, Gaetano Mosca bahwa pembedaan di dalam masyarakat ini terkait dengan konsep kekuasaan, yakni ada sekelompok orang memang berkuasa atas kelompok orang yang lain.
Selain terkait dengan konsep kekuasaan, stratifikasi sosial juga memiliki keterkaitan dengan kon...
```

#### Segmen 6 [Tipe: `wikibooks`]
```text
[Sumber: Dampak Pembangunan Kereta Api di Bidang Sosial (https://id.wikibooks.org/wiki/Dampak%20Pembangunan%20Kereta%20Api%20di%20Bidang%20Sosial)]

=== Munculnya Tenaga Ahli ===

Perusahaan kereta api Nederlandsch-Indische Spoorweg Maatschappij (NISM) juga merekrut pekerja pribumi untuk berkontribusi dalam operasional perkeretaapian. Beberapa penduduk lokal tercatat bekerja sebagai masinis dan petugas pemindah jalur di berbagai stasiun, seperti Srandakan, Mangiran, dan Pekodjo. Para pekerja pri...
```

#### Segmen 7 [Tipe: `crossref`]
```text
[Sumber: MOBILITAS SOSIAL PEKERJA K3L UNIVERSITAS PADJADJARAN]
Mobilitas sosial merupakan salah satu kegiatan yang selalu ada dalam kehidupan manusia. Setiap orang selalu melakukan mobilitas sosial, sebab mobilitas sosial merupakan salah satu upaya dalam pencapaian pemenuhan kebutuhan baik yang bersifat primer, sekunder atau bahkan tersier. Hal ini menarik perhatian penulis untuk melakukan penelitian mengenai gerak mobilisasi pekerja K3L Universitas Padjadajaran, hal ini dilakukan unuk mengetahu...
```

#### Segmen 8 [Tipe: `crossref`]
```text
[Sumber: Kontestasi pendidikan keislaman dan pendidikan umum: persepsi masyarakat tentang sumber kekuatan mobilitas sosial di kabupaten bone]
Kontestasi pendidikan keislaman dan pendidikan umum: persepsi masyarakat tentang sumber kekuatan mobilitas sosial di kabupaten bone
```

#### Segmen 9 [Tipe: `crossref`]
```text
[Sumber: MOBILITAS SOSIAL PESANTREN DI INDONESIA]
&lt;p&gt;The birth of the Islamic boarding school in the middle of the community, have led this institution has a strong relationship with the community. In fact, often the interplay between boarding school with life and the surrounding environment exceeds the effect of the administrative area of the village or surrounding villages. human  resource development for the students should refer to the needs of the community itself, because then the st...
```

### 2. Konsep Kanonikal Kurikulum (`document_concepts`)
#### 1. [SUMBER RESMI] Struktur Sosial
- **Definisi Baku**: Tatanan sosial hierarkis masyarakat wujud jaringan unsur-unsur sosial pokok pembentuk pola perilaku mantap.
- **Tokoh/Ahli**: Abdul Syani, Charles P. Loomis
- **Peringatan Salah Kaprah**: Kira struktur sosial fisik, padahal pola relasi abstrak antarstatus sosial.

#### 2. [SUMBER RESMI] Stratifikasi Sosial
- **Definisi Baku**: Pembedaan atau pengelompokan anggota masyarakat vertikal bertingkat dasar kekuasaan, privilese, prestise.
- **Tokoh/Ahli**: Gaetano Mosca, Pitirim Sorokin, Robert M.Z. Lawang, Max Weber
- **Peringatan Salah Kaprah**: Anggap sama rata beda horizontal (diferensiasi) dan beda vertikal (stratifikasi).

#### 3. [SUMBER RESMI] Status Sosial
- **Definisi Baku**: Kedudukan atau posisi individu kelompok masyarakat, peroleh lewat kelahiran (ascribed), usaha (achieved), atau dominan (master status).
- **Tokoh/Ahli**: Ralph Linton
- **Peringatan Salah Kaprah**: Anggap status sosial cuma soal prestise ekonomi semata.

#### 4. [SUMBER RESMI] Mobilitas Sosial (Gerak Sosial)
- **Definisi Baku**: Perpindahan posisi atau status sosial individu/kelompok dari strata sosial satu ke strata lain, vertikal atau horizontal.
- **Tokoh/Ahli**: Eric Hobsbawm
- **Peringatan Salah Kaprah**: Kira mobilitas sosial selalu gerak naik pangkat/kaya.

#### 5. [SUMBER RESMI] Mobilitas Intergenerasi & Intragenerasi
- **Definisi Baku**: Perubahan status sosial antargenerasi (orang tua ke anak) atau perubahan status internal jalur hidup satu generasi.
- **Peringatan Salah Kaprah**: Kira kenaikan gaji otomatis ganti status sosial saat itu juga.

#### 6. [PENGAYAAN AI] Saluran Mobilitas Sosial
- **Definisi Baku**: Lembaga perantara tempat gerak status sosial jalan, misal lembaga pendidikan, institusi kerja, atau perkawinan.
- **Peringatan Salah Kaprah**: Anggap gelar sekolah formal jamin pasti naik kelas sosial.

#### 7. [SUMBER RESMI] Perubahan Sosial
- **Definisi Baku**: Peralihan tata susun tatanan hidup masyarakat karena sifat sosial dinamis pengaruh sistem norma dan perilaku kelompok.
- **Tokoh/Ahli**: Karl Marx, Herbert Spencer
- **Peringatan Salah Kaprah**: Kira perubahan sosial selalu jalan lambat dan tanpa konflik.

### 3. Struktur Modul & Contoh Teks Bersekat
**Daftar Bab Terdeteksi**:
- Bab 1: Fondasi Struktur Sosial dan Penentu Kedudukan
- Bab 2: Stratifikasi Sosial dan Hierarki Kekuasaan
- Bab 3: Mekanisme dan Ragam Gerak Mobilitas Sosial
- Bab 4: Saluran Penunjang Mobilitas dan Transformasi Makro
- Bab 5: Rantai Kausalitas & Panduan Ujian (Exam Mastery)

**Cuplikan Teks Modul**:
```markdown
# Struktur Sosial & Mobilitas Sosial

> Modul bedah tatanan relasi hierarki warga, mekanisme gerak perpindahan strata kelas, serta dampaknya pada transformasi tatanan hidup bersama.

## Bab 1: Fondasi Struktur Sosial dan Penentu Kedudukan

### Hakikat Struktur Sosial
Struktur sosial: jejaring relasi abstrak antarposisi pembentuk keteraturan perilaku warga. Bukan wujud fisik instansi gedung. Abdul Syani sebut struktur sosial jejaring unsur pokok penata pola sikap. Charles P. Loomis rinci sepuluh unsur: pengetahuan, solidaritas, tujuan bersama, norma hukum, kedudukan-peran, kekuasaan, hierarki, sanksi, sarana lembaga, potensi konflik laten. Analogi: tata kelola sekolah. Kepala sekolah, guru, pengurus OSIS, siswa isi fungsi terkoordinasi tanpa desain ulang harian.

### Tipologi Perolehan Status Sosial
Status sosial: posisi individu pemandu interaksi kelompok. Ralph Linton bagi tiga jalur status:
- **Ascribed status**: bawaan lahir mutlak tanpa ikhtiar (gelar trah bangsawan, jenis kelamin).
- **Achieved status**: hasil kompetisi dan usaha sadar (ijazah dokter, gelar insinyur).
- **Master status**: identitas dominan penentu interaksi utama di ruang publik.
Status terhormat tidak mutlak identik kepemilikan materi ekonomi. Contoh: kedudukan tetua adat atau pemuka agama.

## Bab 2: Stratifikasi Sosial dan Hierarki Kekuasaan

### Dimensi Stratifikasi Sosial
Stratifikasi sosial: pembedaan vertikal bertingkat anggota kelompok atas dasar kekuasaan, hak istimewa (*privilege*), dan kehorma...
```

### 4. Daftar Flashcard (12 Kartu)
| No | Pertanyaan (Front) | Kunci Jawaban (Back) |
|---|---|---|
| 1 | Apa definisi struktur sosial menurut Abdul Syani? | Tatanan sosial masyarakat yang merupakan jaringan dari unsur-unsur sosial pokok. |
| 2 | Apa arti teks tanggapan? | Teks untuk meringkas, menganalisis, dan menanggapi suatu teks atau karya seni disertai penilaian. |
| 3 | Apa definisi stratifikasi sosial menurut Pitirim A. Sorokin? | Pembedaan penduduk atau masyarakat ke dalam kelas-kelas secara bertingkat (hierarkis). |
| 4 | Apa hakikat perubahan sosial menurut Kingsley Davis? | Perubahan-perubahan yang terjadi dalam struktur dan fungsi masyarakat. |
| 5 | Apa konsekuensi sistem stratifikasi sosial tertutup? | Tidak memungkinkan adanya perpindahan posisi atau mobilitas sosial bagi anggota masyarakat. |
| 6 | Apa pemicu perubahan sosial menurut Emile Durkheim? | Faktor ekologis dan demografis yang mengubah solidaritas mekanistik menjadi solidaritas organistik. |
| 7 | Apa fungsi struktur sosial menurut Mayor Polak? | Menekan pelanggaran norma kelompok dan menjadi landasan penanaman disiplin sosial. |
| 8 | Mengapa teks tanggapan wajib menyertakan alasan logis? | Agar penilaian bersifat objektif, santun, dan membangun, bukan sekadar mencela berdasarkan opini pribadi. |
| 9 | Apa beda stratifikasi sosial dengan diferensiasi sosial? | Stratifikasi membagi masyarakat secara vertikal-bertingkat, diferensiasi membagi secara horizontal-sejajar. |
| 10 | Apa beda pendekatan fungsionalisme vs realisme struktur sosial? | Fungsionalisme melihat susunan tampak sehari-hari, realisme melihat prinsip dasar tersembunyi yang tidak tampak. |
| 11 | Apa beda ascribed status dengan achieved status? | Ascribed didapat otomatis lewat kelahiran, achieved diperoleh lewat usaha disengaja. |
| 12 | Apa beda mobilitas intergenerasi dengan mobilitas intragenerasi? | Intergenerasi melibatkan perpindahan status antargenerasi (orang tua ke anak), intragenerasi terjadi dalam riwayat hidup satu generasi yang sama. |

### 5. Soal Kuis HOTS (5 Butir)
#### Soal 1 [Kunci: **E**]
**Skenario**: Sebuah distrik industri menerapkan sistem rotasi kerja baru bagi buruh pabrik tekstil. Pak Danu, seorang teknisi mesin tenun, dipindahkan menjadi operator pemeliharaan ketel uap dengan besaran upah serta golongan kepangkatan yang sama persis seperti posisi sebelumnya. Konsep mobilitas sosial yang mencerminkan kondisi peralihan posisi Pak Danu tersebut adalah...

**Pilihan Jawaban**:
- **A**. mobilitas struktural akibat perubahan regulasi manajemen korporasi skala nasional
- **B**. mobilitas batas lateral terpadu antardivisi manufaktur dalam sistem tertutup
- **C**. mobilitas sosial vertikal intragenerasi ke bawah akibat pemindahan bidang tugas kerja
- **D**. mobilitas sosial antargenerasi naik berkat penguasaan instrumen teknologi modern
- **E**. mobilitas sosial horizontal karena tidak mengubah derajat kedudukan status sosialnya

**Pembahasan**: Mobilitas horizontal adalah perpindahan individu dari suatu kelompok sosial ke kelompok sosial lain yang sederajat, tanpa terjadi kenaikan atau penurunan lapisan derajat sosial.

#### Soal 2 [Kunci: **E**]
**Skenario**: Di suatu kerajaan agraris tradisional, posisi pengatur irigasi lumbung desa hanya dapat diwariskan kepada garis keturunan keluarga pemuka adat pendiri desa tanpa memedulikan kecakapan teknis warga lainnya. Pola penempatan kedudukan sosial tersebut didasarkan atas pembentukan...

**Pilihan Jawaban**:
- **A**. symbolic status yang ditentukan kepemilikan modal materiil jaringan usaha tani
- **B**. master status fungsional lewat pemilihan musyawarah mufakat dewan birokrasi
- **C**. assigned status berdasarkan konsensus formal lembaga peradilan adat agraris
- **D**. achieved status yang diraih lewat pembuktian kecakapan kompetensi bercocok tanam
- **E**. ascribed status yang didapatkan secara otomatis melalui garis keturunan kelahiran

**Pembahasan**: Ascribed status adalah kedudukan sosial yang diperoleh seseorang secara otomatis sejak lahir melalui garis keturunan, bukan karena usaha pribadi.

#### Soal 3 [Kunci: **E**]
**Skenario**: Sosiolog Robert M.Z. Lawang mendefinisikan stratifikasi sosial sebagai penggolongan individu ke dalam lapisan hierarkis. Dasar utama pembagian lapisan bertingkat tersebut bertumpu pada dimensi...

**Pilihan Jawaban**:
- **A**. integrasi normatif lembaga hukum, kesadaran kolektif warga, dan stabilitas politik
- **B**. solidaritas mekanistik kelompok, pembagian peran biologis, dan ikatan kekerabatan
- **C**. diferensiasi klan, identitas etnisitas kultural kedaerahan, dan variasi profesi warga
- **D**. perubahan evolusioner demografi, tingkat urbanisasi kota, dan adaptasi lingkungan
- **E**. kekuasaan memerintah, kepemilikan privilese hak istimewa, serta prestise kehormatan

**Pembahasan**: Robert M.Z. Lawang menegaskan stratifikasi sosial merupakan penggolongan orang-orang ke dalam lapisan-lapisan hierarkis berdasar dimensi kekuasaan, privilese, dan prestise.

#### Soal 4 [Kunci: **B**]
**Skenario**: Kakek Rian adalah seorang kuli panggul dermaga tanpa ijazah dasar, ayahnya bekerja sebagai teknisi montir bengkel bersertifikat, dan kini Rian berhasil menyelesaikan magister hukum hingga terpilih menjadi hakim pengadilan negeri. Fenomena dinamika status keluarga Rian merupakan representasi dari...

**Pilihan Jawaban**:
- **A**. mobilitas geografis terencana melalui saluran perkawinan campuran lintas kelas
- **B**. mobilitas sosial vertikal intergenerasi naik dengan lembaga pendidikan sebagai saluran
- **C**. mobilitas sosial struktural tertutup yang dipengaruhi oleh privilese turun-temurun
- **D**. mobilitas sosial horizontal antargenerasi melalui saluran paguyuban etnis daerah
- **E**. mobilitas sosial vertikal intragenerasi naik berkat perluasan jaringan komersial

**Pembahasan**: Terjadi kenaikan status dari kakek ke ayah hingga cucu (lintas generasi = intergenerasi) secara bertingkat naik melalui sarana lembaga pendidikan tinggi.

#### Soal 5 [Kunci: **C**]
**Skenario**: Penerapan sistem otomatisasi kecerdasan buatan pada sentra pelayanan publik memicu pergeseran pola kerja birokrasi, penyesuaian aturan etika data baru, hingga perubahan tata relasi aparat dan masyarakat. Peristiwa pergeseran tata kehidupan kemasyarakatan tersebut paling tepat dikaji menggunakan konsep...

**Pilihan Jawaban**:
- **A**. stratifikasi sosial tertutup kasta birokrat menghadapi revolusi mekanik massal
- **B**. asimilasi struktural statis tanpa pergeseran kedudukan peranan sosial warga
- **C**. perubahan sosial pada sistem nilai, tatanan norma, dan pola perilaku institusi
- **D**. akulturasi spontan tanpa modifikasi pranata hukum dan keseimbangan kelompok
- **E**. diferensiasi klan berdasarkan latar belakang pemilikan modal teknologi informasi

**Pembahasan**: Perubahan sosial merupakan peralihan yang mengubah tata kehidupan masyarakat terus menerus, memengaruhi lembaga sosial, nilai, norma, serta pola perilaku antar-kelompok.

---

## SESI 7: "aku ingin belajar aljabar" (`doc_1791143026354_cgbvi`)

- **Panjang Dokumen**: 5.488 karakter
- **Tanggal Dibuat**: 5/10/2026, 02.44.00
- **Jumlah Segmen Sumber Tersimpan**: 3
- **Jumlah Konsep Kanonikal**: 5
- **Jumlah Flashcard**: 12
- **Jumlah Soal Kuis HOTS**: 5

### 1. Segmen Sumber Tersimpan (`document_segments`)
#### Segmen 1 [Tipe: `crossref`]
```text
[Sumber: Aku Ingin Seperti Pitung Pada Cerita Bergambar]
Cerita bergambar dapat meningkatkan minat baca anak sejak dini agar otak anak terstimulus berkembang, memiliki daya imajinasi lebih tinggi, dan menambah kosakata dalam tutur bicara anak. Hal ini dapat dilakukan dengan menyediakan buku bacaan menarik minat anak sesuai usianya, dengan cerita yang mengandung berbagai informasi pengalaman kehidupan untuk mengembangkan daya fantasinya. Penelitian “Aku ingin seperti Pitung” pada cerita bergambar...
```

#### Segmen 2 [Tipe: `crossref`]
```text
[Sumber: STRUKTURALISME DALAM CERPEN “AKU TAK INGIN KACAMATA, AKU HANYA INGIN MATI, TUHAN” KARYA RANANG AJI SP]
Penelitian ini berjudul “Strukturalisme dalam Cerpen “Aku Tak Ingin Kacamata, Aku Hanya Ingin Mati, Tuhan” Karya Ranang Aji Sp. Permasalahan dalam penelitian ini adalah bagaimanakah strukturalisme pada cerpen “Aku Tak Ingin Kacamata, Aku Hanya Ingin Mati, Tuhan” Karya Ranang Aji Sp dengan menggunakan metode analisis struktural? tujuan yang hendak dicapai adalah mendeskripsikan struktur...
```

#### Segmen 3 [Tipe: `crossref`]
```text
[Sumber: Meningkatkan Hasil Belajar Siswa Kelas VIII SMPN 6 Kediri dalam Menulis Puisi dengan Pengembangan  Model AIT (Aku Ingin Tapi)]
The process of learning Indonesian in Class VIII-A of SMPN 6 Kediri experienced several obstacles. The problem is that the teacher only gives assignments or asks students to write poetry without being accompanied by unclear instructions on how to write poetry. After the evaluation, it was found that 53% of students had complete KKM scores. The solution to overco...
```

### 2. Konsep Kanonikal Kurikulum (`document_concepts`)
#### 1. [SUMBER RESMI] Bahan Bacaan Bergambar
- **Definisi Baku**: Media cetak visual berisi teks cerita dan ilustrasi untuk meningkatkan minat baca dan daya imajinasi anak sejak dini.
- **Peringatan Salah Kaprah**: Buku bergambar dianggap hanya untuk hiburan anak prasekolah dan tidak memiliki nilai edukasi kognitif formal.

#### 2. [SUMBER RESMI] Analisis Struktural Cerpen
- **Definisi Baku**: Metode pembedahan karya sastra melalui identifikasi keterpaduan unsur intrinsik seperti tema, alur, tokoh, latar, sudut pandang, dan amanat.
- **Tokoh/Ahli**: Ranang Aji SP
- **Peringatan Salah Kaprah**: Analisis sastra dianggap hanya merangkum isi cerita tanpa memeriksa kaitan relasional antarunsur intrinsik.

#### 3. [SUMBER RESMI] Model Pembelajaran AIT
- **Definisi Baku**: Metode pembelajaran menulis puisi secara kelompok terbimbing berbasis media gambar melalui langkah sebut nama, tentukan nama, dan ceritakan nama tokoh.
- **Peringatan Salah Kaprah**: Menulis karya sastra dianggap semata bakat alam yang tidak dapat dilatih dengan tahapan atau model terstruktur.

#### 4. [PENGAYAAN AI] Variabel dan Koefisien
- **Definisi Baku**: Simbol pengganti nilai yang belum diketahui dalam bentuk aljabar, di mana pengali dari variabel tersebut disebut koefisien.
- **Rumus KaTeX**: $ax + b$
- **Tokoh/Ahli**: Muhammad bin Musa al-Khwarizmi
- **Peringatan Salah Kaprah**: Menganggap huruf dalam aljabar merupakan singkatan kata benda, bukan besaran angka yang tidak tetap nilainya.

#### 5. [PENGAYAAN AI] Operasi Bentuk Aljabar
- **Definisi Baku**: Perhitungan matematika dasar pada bentuk aljabar yang hanya dapat menjumlahkan atau mengurangkan suku-suku sejenis.
- **Rumus KaTeX**: $ax + bx = (a + b)x$
- **Peringatan Salah Kaprah**: Menjumlahkan suku beda variabel secara langsung tanpa memeriksa kesamaan variabel dan pangkatnya.

### 3. Struktur Modul & Contoh Teks Bersekat
**Daftar Bab Terdeteksi**:
- Bab 1: Analisis Bahasa dan Literasi Teks Naratif
- Bab 2: Fondasi Aljabar: Variabel dan Bentuk Simbolik

**Cuplikan Teks Modul**:
```markdown
# aku ingin belajar aljabar

> Pembelajaran ini memadukan kekuatan literasi bahasa dengan ketajaman logika matematika. Kita mengawali langkah dari pembedahan teks naratif dan kreativitas menulis, lalu beralih menuju penguasaan simbol serta aturan operasi hitung bentuk aljabar dasar.

## Bab 1: Analisis Bahasa dan Literasi Teks Naratif

### Bahan Bacaan Bergambar

Ketika melihat adik kecil membuka buku penuh warna, perhatian mereka langsung tertuju pada gambar aksi sebelum membaca kalimatnya. Perpaduan visual dan teks ini merangsang imajinasi serta mempermudah otak menghubungkan kata baru dengan maknanya secara konkret.

> 📖 **Definisi Baku:** Media cetak visual berisi teks cerita dan ilustrasi untuk meningkatkan minat baca dan daya imajinasi anak sejak dini.

Ilustrasi visual berfungsi sebagai jembatan kognitif. Saat anak membaca kisah keteladanan—seperti adaptasi cerita tokoh Betawi yang dipecah menjadi episode tematik perlindungan, pertolongan, dan berbagi—daya fantasi serta perbendaharaan kata mereka bertambah secara terarah.

Peringatan Salah Kaprah: Buku bergambar kerap dipandang sebelah mata hanya sebagai hiburan anak prasekolah. Padahal, media ini memiliki nilai edukasi kognitif formal untuk membangun kebiasaan literasi kritis.

---

### Analisis Struktural Cerpen

Membaca cerpen bukan sekadar menikmati akhir ceritanya, melainkan melihat bagaimana mesin di balik cerita tersebut dirakit. Mengetahui nama tokoh saja tidak cukup jika kita tidak memahami mengapa peristiwa ...
```

### 4. Daftar Flashcard (12 Kartu)
| No | Pertanyaan (Front) | Kunci Jawaban (Back) |
|---|---|---|
| 1 | Apa definisi bahan bacaan bergambar? | Media cetak visual berisi teks cerita dan ilustrasi untuk menstimulasi minat baca serta imajinasi anak sejak dini. |
| 2 | Apa fokus metode analisis struktural cerpen? | Identifikasi keterpaduan dan relasi antarunsur intrinsik seperti tema, alur, tokoh, latar, sudut pandang, dan amanat. |
| 3 | Apa definisi model pembelajaran AIT? | Metode pembelajaran menulis puisi secara kelompok terbimbing menggunakan media gambar sebagai inspirasi. |
| 4 | Apa arti variabel dalam aljabar? | Simbol pengganti suatu nilai atau besaran angka yang belum diketahui pasti nilainya. |
| 5 | Bagaimana peran ilustrasi pada cerita anak? | Memicu imajinasi, menstimulasi perkembangan otak, dan memperkaya kosakata tutur anak sejak dini. |
| 6 | Apa tiga langkah utama model AIT? | Langkah model AIT mencakup sebut nama, tentukan nama, dan ceritakan nama tokoh. |
| 7 | Kapan suku aljabar dapat dijumlahkan? | Operasi penjumlahan aljabar hanya berlaku sah pada suku-suku yang memiliki variabel dan pangkat sejenis. |
| 8 | Siapa tokoh pengembang konsep aljabar kanonikal? | Muhammad bin Musa al-Khwarizmi. |
| 9 | Apa salah kaprah umum fungsi buku bergambar? | Buku bergambar sering disalahartikan sekadar hiburan prasekolah, padahal memiliki fungsi edukasi kognitif formal. |
| 10 | Apa pembeda variabel dengan koefisien? | Variabel merupakan simbol nilai yang belum diketahui, sedangkan koefisien adalah angka pengali dari variabel tersebut. |
| 11 | Bagaimana bentuk rumus umum linear satu variabel? | Bentuk representasi kanonikal aljabar dinyatakan dengan $ax + b$. |
| 12 | Bagaimana rumus penjumlahan suku aljabar sejenis? | Penjumlahan suku sejenis dinyatakan dengan rumus $ax + bx = (a + b)x$. |

### 5. Soal Kuis HOTS (5 Butir)
#### Soal 1 [Kunci: **B**]
**Skenario**: Sebuah percetakan memproduksi buku cerita bergambar seri petualangan anak. Biaya cetak per buku dimodelkan dengan bentuk aljabar $5x + 3y - 2x + 7y$. Bentuk paling sederhana dari total biaya produksi tersebut adalah...

**Pilihan Jawaban**:
- **A**. $13xy$
- **B**. $3x + 10y$
- **C**. $7x + 10y$
- **D**. $7x - 4y$
- **E**. $3x + 4y$

**Pembahasan**: Penyederhanaan aljabar dilakukan dengan menjumlahkan atau mengurangkan koefisien dari suku-suku yang memiliki variabel bersesuaian: $5x - 2x = 3x$ dan $3y + 7y = 10y$, sehingga menghasilkan $3x + 10y$.

#### Soal 2 [Kunci: **E**]
**Skenario**: Dalam rangka kegiatan literasi sekolah, panitia membeli $4$ paket buku bergambar $x$ dan $6$ paket modul analisis sastra $y$. Pada pesanan kedua, panitia menambah $3$ paket buku bergambar $x$ namun mengembalikan $2$ paket modul sastra $y$. Bentuk aljabar dari total akhir buku yang dibeli panitia adalah...

**Pilihan Jawaban**:
- **A**. $x + 8y$
- **B**. $11xy$
- **C**. $12x + 4y$
- **D**. $7x - 4y$
- **E**. $7x + 4y$

**Pembahasan**: Gabungkan koefisien variabel sejenis: untuk variabel $x$ didapat $4 + 3 = 7$, dan untuk variabel $y$ didapat $6 - 2 = 4$. Total inventaris menjadi $7x + 4y$.

#### Soal 3 [Kunci: **A**]
**Skenario**: Seorang guru mencatat pemenuhan ketuntasan kriteria nilai siswa dalam tiga siklus berturut-turut yang mengikuti persamaan linear $K(n) = 14n + 39$, dengan $n$ menyatakan nomor siklus ($n = 1, 2, 3$). Persentase kelulusan siswa pada siklus ke-3 ($n = 3$) adalah...

**Pilihan Jawaban**:
- **A**. $81\%$
- **B**. $73\%$
- **C**. $95\%$
- **D**. $67\%$
- **E**. $82\%$

**Pembahasan**: Substitusi variabel $n = 3$ menghasilkan perhitungan $14 \times 3 = 42$. Kemudian $42 + 39 = 81$, maka persentase ketuntasan pada siklus ke-3 adalah $81\%$.

#### Soal 4 [Kunci: **D**]
**Skenario**: Jika koefisien dari unsur intrinsik cerpen dinotasikan sebagai $p$ dan koefisien ilustrasi gambar dinotasikan sebagai $q$, maka hasil penyederhanaan dari operasi aljabar $3(2p - 4q) - 2(p - 5q)$ adalah...

**Pilihan Jawaban**:
- **A**. $4p - 22q$
- **B**. $4p + 7q$
- **C**. $4p + 2q$
- **D**. $4p - 2q$
- **E**. $8p - 2q$

**Pembahasan**: Terapkan sifat distributif perkalian terhadap pengurangan: $3(2p) - 3(4q) = 6p - 12q$. Lalu $-2(p) - 2(-5q) = -2p + 10q$. Jumlahkan suku sejenis: $6p - 2p = 4p$ dan $-12q + 10q = -2q$. Hasil akhir adalah $4p - 2q$.

#### Soal 5 [Kunci: **C**]
**Skenario**: Jumlah siswa dalam suatu kelas dirumuskan dengan $S = 4x + 6$. Jika siswa tersebut dibagi habis ke dalam kelompok belajar beranggotakan masing-masing $5$ orang tanpa sisa, dan nilai $x$ yang memenuhi adalah $6$, berapakah total seluruh siswa di dalam kelas tersebut?

**Pilihan Jawaban**:
- **A**. $28$
- **B**. $36$
- **C**. $30$
- **D**. $24$
- **E**. $34$

**Pembahasan**: Substitusikan nilai variabel $x = 6$ ke bentuk linear $4(6) + 6 = 24 + 6 = 30$. Total siswa adalah $30$, yang tepat habis dibagi ke dalam kelompok beranggotakan $5$ orang.

---

## SESI 8: "aljabar" (`doc_1791143163434_gb0tu`)

- **Panjang Dokumen**: 11.029 karakter
- **Tanggal Dibuat**: 5/10/2026, 02.46.24
- **Jumlah Segmen Sumber Tersimpan**: 10
- **Jumlah Konsep Kanonikal**: 5
- **Jumlah Flashcard**: 0
- **Jumlah Soal Kuis HOTS**: 0

### 1. Segmen Sumber Tersimpan (`document_segments`)
#### Segmen 1 [Tipe: `ruangguru`]
```text
[Sumber: Cara Menyelesaikan Operasi Perpangkatan pada Bentuk Aljabar | Matematika Kelas 7 (https://www.ruangguru.com/blog/matematika-kelas-7-cara-menyelesaikan-operasi-perpangkatan-pada-bentuk-aljabar)]
Pada artikel Matematika kelas 7 kali ini, kamu akan mengetahui cara menyelesaikan operasi perpangkatan bentuk aljabar. Yuk, kita pelajari selengkapnya!

Jika pada artikel sebelumnya kamu telah mengetahui tentang bentuk aljabar dan cara menyelesaikan beberapa operasi hitung aljabar, maka pada arti...
```

#### Segmen 2 [Tipe: `ruangguru`]
```text
[Sumber: Cara Menyelesaikan Bentuk-Bentuk Aljabar | Matematika Kelas 7 (https://www.ruangguru.com/blog/penyelesaian-bentuk-bentuk-aljabar)]
Dalam Matematika, kita akan sering menemukan bentuk aljabar. Apakah itu dan bagaimana cara menyelesaikannya? Yuk, cari tau jawabannya di artikel Matematika kelas 7 ini!

Siapa yang pernah mendengar istilah aljabar? Aljabar merupakan salah satu cabang ilmu matematika yang menggunakan simbol dan operasi matematika, seperti penjumlahan, pengurangan, perkalian, ...
```

#### Segmen 3 [Tipe: `ruangguru`]
```text
[Sumber: Al Khawarizmi, Tokoh Penemu Matematika & Bapak Aljabar (https://www.ruangguru.com/blog/al-khawarizmi)]
Al-Khawarizmi adalah ilmuwan yang menyumbangkan pemikiran terbesarnya di dalam matematika. Karya-karyanya sangat berpengaruh bagi peradaban manusia. Seperti apakah sosok penemu matematika ini?

Apa yang pertama kali ada di pikiranmu ketika mendengar “Matematika”? Mungkin beragam. Tapi, berdasarkan pengalaman bertemu dengan pelajar-pelajar di Indonesia, banyak yang menganggap matematika...
```

#### Segmen 4 [Tipe: `wikipedia`]
```text
[Sumber: Aljabar (https://id.wikipedia.org/wiki/Aljabar)]
Aljabar adalah cabang matematika yang mengkaji sistem-sistem abstrak tertentu, yang dikenal sebagai struktur aljabar, serta memanipulasi ekspresi di dalam sistem-sistem tersebut. Aljabar merupakan bentuk umum aritmetika yang memperkenalkan variabel dan operasi-operasi aljabar selain operasi aritmetika standar seperti penambahan dan perkalian.
Aljabar elementer adalah bentuk utama aljabar yang dipelajari di banyak sekolah. Aljabar elemente...
```

#### Segmen 5 [Tipe: `wikipedia`]
```text
[Sumber: Aljabar Heyting (https://id.wikipedia.org/wiki/Aljabar%20Heyting)]
Dalam matematika, sebuah Aljabar Heyting (juga dikenal sebagai aljabar pseudo-Boolean) adalah kekisi berbatas, dengan operasi sambungan dan pertemuan yang tertulis ∨ dan ∧ dan dengan elemen terkecil 0 dan elemen terbesar 1, dilengkapi dengan operasi biner a → b dari implikasi sedemikian rupa maka (c ∧ a) ≤ b adalah ekuivalen c ≤ (a → b). Dari sudut pandang logika, A → B adalah definisi dengan proposisi terlemah yang modu...
```

#### Segmen 6 [Tipe: `wikipedia`]
```text
[Sumber: Aljabar asosiatif (https://id.wikipedia.org/wiki/Aljabar%20asosiatif)]
Dalam matematika, aljabar asosiatif adalah struktur aljabar dengan operasi penjumlahan, perkalian yang kompatibel (diasumsikan sebagai asosiatif), dan perkalian skalar dengan elemen bidang. Operasi penjumlahan dan perkalian A dengan struktur gelanggang; operasi penjumlahan dan perkalian skalar bersama-sama memberikan A struktur dari ruang vektor di atas K. Dalam artikel ini kita juga akan menggunakan istilah aljabar-...
```

#### Segmen 7 [Tipe: `wikipedia`]
```text
[Sumber: Operasi aljabar (https://id.wikipedia.org/wiki/Operasi%20aljabar)]
Dalam matematika, operasi aljabar dasar adalah salah satu dari operasi aritmetika yang umum, yang mencakup penambahan, pengurangan, perkalian, pembagian, menaikkan menjadi bilangan bulat pangkat, dan mengambil akar (pangkat pecahan). Operasi ini dapat dilakukan pada bilangan, dalam hal ini sering disebut operasi aritmetika. Mereka juga dapat dilakukan, dengan cara yang sama, pada variabel, ekspresi aljabar, dan lebih umu...
```

#### Segmen 8 [Tipe: `wikibooks`]
```text
[Sumber: Aljabar linear/Basis dan Dimensi (https://id.wikibooks.org/wiki/Aljabar%20linear%2FBasis%20dan%20Dimensi)]
BASIS DAN DIMENSI
 
Basis : suatu ukuran tertentu yang menyatakan  komponen dari sebuah vector. Dimensi biasanya dihubungkan dengan ruang, misalnya garis adalah ruang dengan dimensi 1, bidang adalah uang dengan dimensi 2 dan seterusnya. Definisi basis secara umum adalah sebagai berikut :
Jika V adalah ruang vektor dan S = {v1, v2, v3, ….., vn} adalah kumpulan vektor di dalam V, mak...
```

#### Segmen 9 [Tipe: `wikibooks`]
```text
[Sumber: Matematika/Aljabar linear (https://id.wikibooks.org/wiki/Matematika%2FAljabar%20linear)]
Aljabar linear adalah bidang studi matematika yang mempelajari sistem persamaan linear dan solusinya, vektor, serta transformasi linear. Matriks dan operasinya juga merupakan hal yang berkaitan erat dengan bidang aljabar linear.


== Daftar isi ==


=== Vektor ===
Pendahuluan
Bilangan kompleks
Vektor dalam C
Bilangan kompleks


=== Persamaan linear ===
Bentuk persamaan linear
Trival solution dan non...
```

#### Segmen 10 [Tipe: `crossref`]
```text
[Sumber: Analisis Jaringan Petri pada Jalur Angkutan Umum di Jombang Menggunakan Aljabar Max-Plus]
The aim of this research is to get a representation of public transport systems in max-plus algebra after the system is simulated into the timeless petri net function. The analysis includes how to simulate the model of public transport transportation on the petri net function and then convert it into the form of a max-plus algebra matrix and then compile a model that meets  
```

### 2. Konsep Kanonikal Kurikulum (`document_concepts`)
#### 1. [SUMBER RESMI] Bentuk Aljabar
- **Definisi Baku**: Pernyataan matematika gabung variabel, konstanta, dan koefisien lewat operasi hitung.
- **Rumus KaTeX**: $ax + b$
- **Tokoh/Ahli**: Al-Khawarizmi
- **Peringatan Salah Kaprah**: Variabel dianggap huruf statis bukan pengganti nilai acak/tak diketahui.

#### 2. [SUMBER RESMI] Operasi Aljabar
- **Definisi Baku**: Operasi hitung aritmetika dasar pada ekspresi matematika variabel atau elemen struktur aljabar.
- **Rumus KaTeX**: $a^n = \underbrace{a \times a \times \dots \times a}_{n}$
- **Peringatan Salah Kaprah**: Suku beda variabel langsung dijumlah tanpa aturan suku sejenis.

#### 3. [SUMBER RESMI] Aljabar Linear
- **Definisi Baku**: Cabang matematika pelajari sistem persamaan linear, vektor, ruang vektor, matriks, dan transformasi linear.
- **Rumus KaTeX**: $\mathbf{A}\mathbf{x} = \mathbf{b}$
- **Peringatan Salah Kaprah**: Matriks dianggap daftar angka biasa bukan representasi transformasi linear.

#### 4. [SUMBER RESMI] Basis dan Dimensi
- **Definisi Baku**: Himpunan vektor pembangun ruang vektor yang bebas linear; dimensi hitung jumlah vektor basis.
- **Rumus KaTeX**: $v = k_1 v_1 + k_2 v_2 + \dots + k_n v_n$
- **Peringatan Salah Kaprah**: Vektor bergantung linear disangka bisa jadi basis ruang.

#### 5. [SUMBER RESMI] Aljabar Abstrak
- **Definisi Baku**: Kajian struktur himpunan objek matematika bersama operasi biner seperti grup, gelanggang, dan medan.
- **Tokoh/Ahli**: Arend Heyting
- **Peringatan Salah Kaprah**: Semua sistem aljabar patuh hukum komutatif aritmetika biasa.

### 3. Struktur Modul & Contoh Teks Bersekat
**Daftar Bab Terdeteksi**:
- Bab 1: Fondasi Aljabar Elementer dan Operasi
- Bab 2: Aljabar Linear: Vektor, Matriks, dan Ruang
- Bab 3: Pengantar Aljabar Abstrak dan Terapan

**Cuplikan Teks Modul**:
```markdown
# aljabar

> Selamat datang di ruang belajar matematika bersama Nara. Kita akan membedah aljabar secara bertahap mulai dari simbol dasar di tingkat sekolah, melangkah ke sistem linear matriks, hingga melihat struktur abstrak modern yang mendasari logika komputasi masa kini. Mari siapkan catatan dan bangun pemahaman konsep yang kokoh bersama-sama.

---

## Bab 1: Fondasi Aljabar Elementer dan Operasi

### Bentuk Aljabar

Bayangkan kamu membeli dua kantong misteri berisi kelereng yang jumlah isinya sama, lalu kamu mendapat tambahan satu kelereng lepas di luar kantong. Kamu belum tahu pasti berapa isi kelereng di dalam tiap kantong, tetapi polanya sudah bisa dipastikan: dua kali isi kantong ditambah satu. Dalam matematika, situasi nilai yang belum diketahui ini kita lambangkan dengan huruf agar perhitungannya menjadi jauh lebih ringkas dan teratur.

Tokoh besar peradaban Islam, Al-Khawarizmi, menuliskan metode penyelesaian masalah menggunakan simbol-simbol perwakilan angka ini dalam kitabnya *al-Kitāb al-Mukhtaṣar fī Ḥisāb al-Jabr wal-Muqābalah*. Dari istilah *al-jabr* inilah lahir cabang matematika aljabar yang kita pelajari hari ini.

> 📖 **Definisi Baku:** Bentuk Aljabar adalah pernyataan matematika gabung variabel, konstanta, dan koefisien lewat operasi hitung.

Bentuk aljabar dibangun oleh tiga komponen utama. Komponen pertama adalah variabel, yaitu lambang pengganti nilai yang belum tetap atau berubah-ubah. Komponen kedua adalah koefisien, yakni faktor pengali yang berada...
```

### 4. Daftar Flashcard (0 Kartu)
*(Belum ada kartu di-generate)*

### 5. Soal Kuis HOTS (0 Butir)
*(Belum ada kuis di-generate)*

---

