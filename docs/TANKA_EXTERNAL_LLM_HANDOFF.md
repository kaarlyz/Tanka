# 🚀 TANKA — EXTERNAL LLM MASTER HANDOFF & INSTRUCTION MANUAL

> **DOKUMEN INSTRUKSI INI DITUJUKAN KHUSUS UNTUK MODEL AI / LLM EKSTERNAL (CLAUDE / CODING AGENT) YANG DIBERI TUGAS MENGEMBANGKAN VISUAL LANDING PAGE TANKA TANPA MEMILIKI AKSES LANGSUNG KE REPOSITORY KODE.**

---

## 1. Misi Utama & Konteks Tugas

Kamu menerima tugas mulia untuk menjadi **Lead Visual & Interaction Designer** bagi platform **Tanka**.
Pengembang Tanka telah membangun fondasi arsitektur produk yang solid, teruji, dan memiliki template dasar HTML/CSS serta komponen React.

Tugasmu **BUKAN** sekadar merapikan CSS atau menambahkan bayangan tipis. 
Tugasmu adalah **mentransformasi, memperkaya, dan meningkatkan derajat landing page Tanka** menjadi karya visual interaktif kelas dunia yang memiliki:
- Ilustrasi SVG kustom fungsional (*custom animated vector graphics*).
- Graf pengetahuan dan alur kurikulum interaktif (*animated knowledge graph & curriculum stepper*).
- Panggung simulasi produk nyata (*live interactive playgrounds*).
- Alur penceritaan kinestetik saat pengguna menggulir layar (*scroll storytelling & micro-interactions*).
- Tipografi editorial berwibawa dengan estetika *paper-ledger (anti-slop)*.

Semua ini harus dirancang agar calon siswa merasakan langsung kejernihan dan kecerdasan cara belajar Tanka dalam hitungan detik.

---

## 2. Peta Dokumen & Urutan Pembacaan Wajib

Sebelum kamu menulis atau memodifikasi satu baris kode pun, kamu **WAJIB** membaca dan memahami dokumen-dokumen pendukung berikut sesuai urutan logis:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ URUTAN 1: TANKA_PRODUCT_BIBLE.md                                       │
│ Pahami filosofi produk, masalah belajar siswa, cara kerja sistem AI,   │
│ persona tutor Nara, dan batasan klaim kebenaran (fakta aman vs palsu). │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ URUTAN 2: TANKA_FEATURE_EVIDENCE_LEDGER.md                             │
│ Pahami 33 fitur aktual yang benar-benar ada dan terverifikasi di kode. │
│ Jangan mengarang fitur fiktif yang tidak ada di dalam ledger ini.      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ URUTAN 3: TANKA_LANDING_PAGE_DESIGN_BRIEF.md                           │
│ Serap bahasa visual Paper-Ledger, token warna, tipografi, katalog ide  │
│ visual per fitur, dan prinsip motion design yang berdaya guna.         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ URUTAN 4: page.md / detail.md (Kode Template Awal)                     │
│ Pelajari struktur kode landing page saat ini (`landing.css`, 11 modul  │
│ komponen React, dan motion kit bawaan) sebagai kanvas awal kerjamu.    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cara Menggunakan Template Kode yang Diberikan

### 3.1 Struktur Kode Sumber Saat Ini
Kode landing page Tanka tersusun rapi dalam modul-modul React TypeScript di bawah direktori `src/components/landing/`:
1. `LandingPage.tsx`: Komponen kontainer utama pembungkus seluruh seksi.
2. `LandingNavbar.tsx`: Header bar sticky dengan logo box monogram `t` dan tautan navigasi.
3. `HeroSection.tsx` & `SimulatorNaraCard.tsx`: Grid asimetris hero dengan simulator live interaktif Nara.
4. `HeroWorkspacePreview.tsx`: Mockup bingkai peramban modern yang menampilkan ruang baca bab.
5. `MarqueeTicker.tsx`: Pita teks berjalan horizontal berkesinambungan.
6. `StudioCockpit.tsx`: Antarmuka cockpit 4 instrumen dengan sinkronisasi screenshot antarmuka.
7. `ComparisonLedger.tsx`: Grid 4 kartu flashcard 3D flip dengan toggle saklar pembalik serentak.
8. `PersonasSection.tsx`: Bento grid testimoni pejuang belajar nyata dengan efek 3D tilt.
9. `StepperSection.tsx`: Alur 4 langkah penguasaan materi (*Input $\rightarrow$ Baca $\rightarrow$ Tanya $\rightarrow$ Uji*).
10. `CtaBanner.tsx`: Banner penutup berlatar gelap kontras tinggi dengan tombol magnetik.
11. `LandingFooter.tsx`: Navigasi penutup dan komitmen privasi lokal.
12. `motion/`: Paket `HeroGraphic.tsx`, `MotionKit.tsx`, `useSmoothScroll.ts`, dan `landing-motion.css`.

### 3.2 Aturan Modifikasi & Arsitektur Bersih
- **Jaga Kebersihan Modular:** Hindari menggabungkan seluruh kode menjadi satu file raksasa ribuan baris yang sulit dipelihara. Pecah modul baru ke dalam komponen mandiri yang jelas tanggung jawabnya (misal: `InteractiveMindMapGraphic.tsx`, `BentoDrillPreview.tsx`).
- **Gunakan CSS Custom Properties:** Seluruh nilai warna, border, dan radius wajib merujuk pada token desain yang telah didefinisikan di `landing.css` (seperti `var(--bg-main)`, `var(--color-ink)`, `var(--accent-lime)`, `var(--border-sage)`).
- **Hindari Pustaka Eksternal Tambahan yang Tidak Perlu:** Tanka sudah memiliki `motion/react` (Motion), `lenis` (Smooth scroll), `canvas-confetti`, dan `lucide-react`. Optimalkan pustaka yang sudah tersedia ini. Jangan mengimpor library berat baru tanpa izin.

---

## 4. Hukum Copywriting & Batasan Integritas Brand

Sebagai AI yang cerdas, kamu harus sangat disiplin dalam menyusun teks, headline, dan mikro-kopi di landing page:

### 4.1 Hukum Anti-Analogi Dunia Nyata (Mutlak)
- **DILARANG KERAS** menggunakan analogi fiktif dunia nyata (seperti kasir restoran, pipa air, mobil balap, koki dapur) untuk menjelaskan materi akademis.
- **GUNAKAN PENJELASAN LITERAL FUNGSIONAL:** Jelaskan langsung mekanisme penurunannya, variabel matematisnya, langkah aljabarnya, atau konteks struktural sosiologi/ekonomi yang sebenarnya diuji dalam lembar soal ujian.

### 4.2 Fakta Aman vs Klaim Terlarang
- ✅ **Aman Digunakan:**
  - *"Ubah materi apapun, jadi langsung bisa dipahami."*
  - *"Buku 200 halaman dan video 2 jam dipecah otomatis jadi bab 3 menit."*
  - *"Tanya Nara AI siaga 24 jam dengan penurunan rumus langkah demi langkah."*
  - *"Konsensus 3× LLM untuk memverifikasi kunci jawaban ujian."*
  - *"Soal salah otomatis dicatat ke Bank Soal Salah pribadi."*
  - *"100% bebas iklan, tanpa distraksi, mengutamakan privasi lokal."*
  - *"Dapat dibaca offline dan diinstal sebagai PWA."*
- ❌ **Dilarang Digunakan (Overclaim / Bohong):**
  - "AI super pintar yang menjamin 100% kamu lolos Fakultas Kedokteran tanpa belajar."
  - "Mendukung seluruh format file di alam semesta tanpa batasan."
  - "Nara adalah guru manusia asli yang mengawasi layarmu secara live."
  - "Waktu respons inferensi AI 0.00001 milidetik."

### 4.3 Karakter Bahasa
- Gunakan Bahasa Indonesia yang mengalir cerdas, lugas, bersahabat, dan dewasa (*high-agency, calm, intellectual*).
- Hindari bahasa klise marketing yang berisik atau teriakan lebay (kurangi penggunaan tanda seru beruntun `!!!`).

---

## 5. Standar Eksekusi Visual yang Diharapkan

Ketika kamu menyerahkan hasil pekerjaanmu, evaluasilah karyamu menggunakan daftar periksa (*quality checklist*) berikut:

1. **Keunikan Visual (*Distinct Character*):** Apakah landing page ini terlihat seperti buku catatan intelektual modern (*paper-ledger*) yang berwibawa, atau malah terlihat seperti template SaaS AI pasaran?
2. **Kekayaan Interaksi (*Tactile Interactivity*):** Apakah pengunjung dapat mengklik tombol, membalik kartu flashcard, menguji coba mengetik pertanyaan rumus di hero simulator, atau melihat simpul graf berpendar saat disorot kursor?
3. **Koreografi Gerak (*Choreographed Motion*):** Apakah animasi yang kamu tambahkan memiliki tujuan penjelasan yang jelas, menggunakan kurva easing yang anggun (`cubic-bezier(0.16, 1, 0.3, 1)`), dan mematuhi `@media (prefers-reduced-motion)`?
4. **Kerapian Responsif Seluler (*Mobile Resilience*):** Apakah seluruh panggung bento, simulator, dan kartu komparasi tetap proporsional dan mudah disentuh di layar ponsel tanpa ada elemen yang terpotong atau meluap (*no horizontal scrollbar*)?
5. **Kesiapan Integrasi (*Production Readiness*):** Apakah kode TypeScript dan CSS yang kamu berikan valid, bebas dari error sintaks, dan dapat langsung dipasang ke dalam codebase Tanka?

---

## 6. Format Deliverable yang Diinginkan

Ketika memberikan solusi kode kepada pengembang:
1. **Sertakan Penjelasan Arsitektur Singkat:** Jelaskan komponen apa yang kamu buat atau tingkatkan dan apa peran visual barunya.
2. **Sediakan Kode Lengkap Tanpa Potongan Pseudo:** Berikan implementasi komponen React TypeScript dan styling CSS secara utuh tanpa meninggalkan komentar placeholder seperti `// ... tambahkan kode lain di sini ...`.
3. **Pastikan Kompatibel:** Gunakan tipe data dari `src/types/index.ts` dan ikuti pola hook yang ada.

Selamat berkarya! Jadikan landing page Tanka sebagai mahakarya visual edukasi yang paling memukau, jernih, dan membanggakan bagi pejuang belajar di seluruh Indonesia.
