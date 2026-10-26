# TASK-CBT-EXAM-HUB-TRACKLIST-AND-PALETTE-OVERHAUL-074: CBT Simulator Hub Overhaul into Subject-Grouped Tracklist & Canonical Tanka Color Palette Redesign

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/cbtTracklistHub.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & Root Cause Analysis

Pengguna menyampaikan:
> *"gini ocoba kamu liat deh yg pas bagian simulasi cbt itu nah itukan kek card" gitu menurutmu bagus kah format nya gitu? jadinya kek "penyimpanan bngt gasi" ... buatkan sebagus mungkin ya dan sedikit ubah ui ux kita yg aneh coba cek deh bagian landing page dengan warna dan jenis tombol yg bagus gitu yg bagian sini kalau gasalah itukan bentuknya tombol html body div#root div.tanka-landing-container.lenis div section#peta-konsep.kg-section div.kg-copy div.kg-panel div div.kg-prereq-chain div.kg-chain-pills span.kg-chain-pill.active nah itu bagus gitu tombolnya nah itu ciri khas tanka llau merahnya itu seharusnya seperti itu juga cm kek itukan versi ijonya, versi merahnya ya tinggal cari tipe merah color grading yg seperti itu bukannya kek warna #e4f0e8 dan #f2ebe1 itu aneh keknya tanka gada warna itu deh jdi sekalian rombak color kita font dll"*

### Temuan Empiris:
1. **Grid Kartu Monoton ("Rasa Folder Google Drive / Penyimpanan")**:
   - Di `ExamCbtTab.tsx` baris 2008:
     `gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))"`
     26 paket naskah ujian ditampilkan sebagai kotak-kotak berulang yang membosankan dan memakan scroll vertikal panjang di mobile tanpa hirarki mata pelajaran yang jelas.
2. **Penyimpangan Palet Warna (Slop Generic Blue / Anomali Merah & Abu-abu)**:
   - Tanka memiliki identitas desain kanonikal khas (dari Landing & Knowledge Graph Pill):
     - Background gelap: `#18221f` / `#121a17`
     - Background terang / kanvas: `#fcfdfa`
     - Brand Lime Accent: `#c8f064` (aktif, segar, kontras tinggi terhadap `#18221f`)
     - Olive Accent: `#4b6623`
     - Dark Slate Pill: `#23342e` dengan border `#334840` dan teks `#d1ded6`
   - Namun di `ExamCbtTab.tsx`:
     - Terdapat tombol biru Tailwind generik `#2563eb` (bukan warna Tanka!).
     - Warna merah memakai `#ef4444` / `#dc2626` mentah alih-alih warna merah hangat/koral khas Tanka (`#ff6b6b` / `#e05353` pada kontainer `#2a1b1b` atau `#ff5c5c`).
     - Terdapat border dan background pudar `#eef2eb`, `#dce2d6`, dan `#f1f5f9` yang tidak selaras dengan sistem token Tanka.

---

## 2. Spesifikasi Implementasi

### A. Rombak Tampilan Simulasi CBT Menjadi "Subject Tracklist / Hub Resmi"
Alih-alih grid kartu kotak 26 biji:
1. **Hero Quick-Action Banner di Atas:**
   - Tombol / Kartu Hero: **🎯 Ujian Acak Kilat (Quick Match Pusmendik)**.
   - Pilihan instan bagi pengguna yang tidak ingin pusing memilih: 1 klik langsung masuk ke paket acak standar ujian.
2. **Pengelompokan Berbasis Mata Pelajaran (Grouped Subject Accordion / Tracklist):**
   - Kelompokkan `filteredPackages` berdasarkan `subtes_or_mapel` (e.g., *Bahasa Indonesia, Matematika, Sosiologi, Ekonomi, Literasi Bahasa Inggris*).
   - Tiap kelompok mata pelajaran berupa **Kartu Accordion Elegan**:
     - Header Mata Pelajaran: Ikon mapel, nama mapel, jumlah total paket tersedia, dan total butir soal.
     - Di dalamnya, daftar paket tersusun rapi dalam bentuk **Tracklist Baris Padat (Compact List Row)**:
       - Kolom 1: Badge Paket (`Paket 1`, `Paket 2`) bergaya pill Tanka (`.kg-chain-pill.active`).
       - Kolom 2: Metadata (25 Soal • Pusmendik Resmi / SNBT).
       - Kolom 3: Status (Belum Dikerjakan / Pernah Dicoba dengan Skor / Ada Sesi Aktif).
       - Kolom 4: Aksi Tombol Tanka: `[ ⏱️ Mulai Ujian ]` dan `[ ⚡ Latihan Mandiri ]`.
3. **Ergonomi Mobile (`< 768px`)**:
   - Di HP, baris tracklist otomatis bertransformasi menjadi baris sentuh yang nyaman dengan touch-target minimal 44px, tanpa horizontal overflow (`overflowingInsideCount: 0`).

### B. Standardisasi Palet Warna & Tombol Tanka Khas (`landing-story.css` Style)
1. **Tombol & Badge Mengadopsi Ciri Khas `.kg-chain-pill`**:
   - Status / Tag Normal: background `#23342e`, border `1px solid #334840`, color `#d1ded6`, font-family `'DM Mono', monospace`.
   - Status / Tombol Aktif Lime: background `#c8f064`, color `#18221f`, font-weight 700, border `1px solid #c8f064`.
   - **Warna Merah Khas Tanka (Coral Crimson Grading)**:
     - Merah aktif / salah: `#ff5c5c` atau `#f87171` dengan background `#2d1a1a` dan border `#4a2323` (warna merah ala HUD Tanka, bukan generic `#ef4444`).
     - Teks merah: `#e05353` pada background terang, atau `#ff6b6b` pada dark slate.
2. **Eliminasi Warna Asing**:
   - Ganti semua warna biru generik `#2563eb` di `ExamCbtTab.tsx` menjadi `#18221f` (tinta utama) atau `#c8f064` (aksen lime).
   - Bersihkan background abu-abu pudar menjadi `#fcfdfa` dan border rapi `#e2e8df`.

### C. Unit Test & Visual Probe (`tests/cbtTracklistHub.test.js`)
Buat test suite yang memverifikasi:
1. `ExamCbtTab` mengelompokkan paket naskah secara semantis berdasarkan `subtes_or_mapel`.
2. Tombol quick match / mulai ujian berfungsi memuat soal dengan format yang benar.
3. Warna dan kelas CSS tombol menggunakan token Tanka lime `#c8f064` dan crimson `#ff5c5c` / `#e05353`.
4. Screenshot visual desktop (1920x1080) dan mobile (390x844) disimpan di `.agents/evidence/`.

---

## 3. Verification Protocol
1. `npm test` passing (224+ passing) -> **PASSED: 252/252 tests pass**.
2. `npm run build` passing tanpa error -> **PASSED: Vite production build clean (0 errors)**.
3. DOM probe layout mobile: `0` overflow element di 390px -> **PASSED: 0 overflowing elements (right <= 390)**. Touch targets >= 44px.
4. Simpan bukti tangkapan layar di `.agents/evidence/TASK-074-desktop-tracklist.png` dan `.agents/evidence/TASK-074-mobile-tracklist.png` -> **CAPTURED & VERIFIED**.

## 4. Execution Evidence & Completion Report
- Status: `VERIFIED` (Siap diaudit AURA)
- Files Changed:
  - `src/components/tabs/ExamCbtTab.tsx` (Subject-Grouped Tracklist, Quick Match Pusmendik Banner, eliminasi `#2563eb`, palet kanonikal Tanka)
  - `src/index.css` (Styling `.cbt-tracklist-hub`, `.cbt-quick-match-banner`, `.cbt-subject-card`, responsive mobile touch targets >= 44px)
  - `tests/cbtTracklistHub.test.js` (5 unit tests: semantic subject grouping, quick match prioritization, class/DOM architecture, canonical Tanka palette assertions)
  - `.agents/evidence/TASK-074-desktop-tracklist.png` (Tangkapan layar desktop 1920x1080)
  - `.agents/evidence/TASK-074-mobile-tracklist.png` (Tangkapan layar mobile 390x844)

