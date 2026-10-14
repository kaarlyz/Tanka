# TASK: TASK-LANDING-PAGE-007
## STATUS
VERIFIED

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/types/index.ts`
  - `src/hooks/useAppRoute.ts`
  - `src/components/landing/LandingPage.tsx` (New file)
  - `src/App.tsx`
  - `public/assets/landing/` (Aset screenshot sudah disiapkan)
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE
Rancang dan implementasikan Landing Page berkelas dunia untuk Tanka yang menerapkan estetika Minimalist Tech-Student / Bento Grid (terinspirasi dari Linear, Vercel, dan Apple) serta menyematkan screenshot antarmuka aplikasi nyata di dalam frame device mockup.

---

## 2. FILOSOFI DESAIN & PALET (STRICT ANTI-SLOP)
- **Anti-Slop**: Tolak border kotak generik, kartun murah, atau gradien warna-warni SaaS palsu.
- **Warna & Bahan**:
  - Kanvas utama: `#fcfdfa` dengan latar bertekstur grid teknis ultra-halus.
  - Teks Utama: `#18221f` (Deep Ink).
  - Teks Sekunder: `#5f6b66` (Slate Muted).
  - Aksen Utama: `#18221f` / `#283832` (Deep Olive).
  - Micro-accent: `#c8f064` (Electric Lime) untuk badge status dan highlight fokus.
  - Kartu & Kontainer: `#ffffff` dengan border tipis `#e2e8df` dan bayangan lembut `0 8px 30px rgba(24, 34, 31, 0.04)`.
  - Tipografi: `'Plus Jakarta Sans', 'Manrope', sans-serif` dan `'DM Mono', monospace`.

---

## 3. ASET SCREENSHOT PRODUK NYATA (SUDAH TERSEDIA DI REPO)
AURA telah mengambil 4 screenshot nyata resolusi tinggi di folder `/assets/landing/`:
1. `hero-reader.png`: Tampilan antarmuka membaca materi (Book Reader & Chapter Strip).
2. `bento-nara.png`: Panel interaktif Tanya Nara (isolasi input sub-0.2ms & bubble KaTeX rapi).
3. `bento-mindmap.png`: Peta Konsep Radial (Radial Mind Map dengan kurva bezier zaitun).
4. `bento-quiz.png`: Kuis Atomik & Flashcard.

---

## 4. SPESIFIKASI KOMPONEN & STRUKTUR HALAMAN

### A. Tipe & Routing
1. Di `src/types/index.ts`: Tambahkan `"landing"` ke union `ActiveTab`:
   ```ts
   export type ActiveTab =
     | "landing"
     | "home"
     | "material"
     | "quiz"
     | "mistakes"
     | "feynman"
     | "flashcards"
     | "summary";
   ```
2. Di `src/hooks/useAppRoute.ts`: Tambahkan `"landing"` ke array `VALID_TABS`.
3. Di `src/App.tsx`:
   - Import `LandingPage` (bisa static atau lazy).
   - Render `LandingPage` ketika `activeTab === "landing"`:
     ```tsx
     {activeTab === "landing" ? (
       <LandingPage
         onLaunchApp={() => setActiveTab("home")}
         onOpenAuth={handleOpenAuth}
         currentUser={currentUser}
       />
     ) : (
       // Tampilan dashboard Tanka yang ada saat ini
     )}
     ```
   - Tambahkan tombol pintas di Sidebar / TopBar untuk membuka "Halaman Depan" / "Landing Page" jika user ingin kembali melihat landing page.

### B. Komponen `src/components/landing/LandingPage.tsx`
Buat komponen landing page yang mandiri, elegan, dan terstruktur:

1. **Top Navigation Bar (Header)**:
   - Logo Tanka (`tanka.` dengan kotak hijau zaitun khas).
   - Menu Tautan: `#fitur` (Fitur Inti), `#arsitektur` (Bento Grid), `#alur` (Alur Belajar), `#github` (Tautan ke repo).
   - Tombol Aksi:
     - "Masuk" (membuka `onOpenAuth("login")`).
     - "Buka Aplikasi →" (Primary CTA: `onLaunchApp()`).

2. **Hero Section**:
   - Badge Pill: `"Sistem Studi Otonom Berbasis Bukti • Local-First"` dengan titik hijau lime menyala.
   - Headline Utama:
     `"Belajar Mandiri Tanpa Kebisingan. Sistem Studi Otonom Berbasis Bukti."`
   - Subheadline:
     `"Ubah dokumen tebal, catatan kuliah, atau video YouTube menjadi modul kurikulum terstruktur dalam hitungan detik. Diperkuat tutor AI berlatensi sub-0.2ms, formula KaTeX presisi, dan uji retensi deterministik."`
   - CTA Buttons:
     - Primary: "Buka Aplikasi Sekarang" (`onLaunchApp()`) warna `#18221f` teks `#c8f064`.
     - Secondary: "Lihat di GitHub" (buka tab baru `https://github.com/kaarlyz/Tanka`) dengan ikon bintang GitHub.
   - **Hero Device Mockup Frame**:
     - Frame browser minimalis (bar jendela abu-abu dengan 3 titik dot, URL pill `tanka.app/study/operasi-himpunan`).
     - Menampilkan `/assets/landing/hero-reader.png` dengan radius sudut rapi dan ambient drop shadow.

3. **Bento Grid Showcase (Selling the Engine)**:
   Layout grid responsif (2 kolom / 3 baris di desktop, 1 kolom di mobile):
   - **Card 1 (2 Kolom Lebar)**:
     - Label: `ENGINE PERFORMANCE`
     - Judul: `Sub-0.2ms Input Latency & Zero Frame Drop`
     - Deskripsi: `Engine rendering Markdown & KaTeX terisolasi dengan state colocation. Mengetik rumus dan berdiskusi dengan Nara AI tetap stabil di 60 FPS bahkan di smartphone terendah.`
     - Visual Mockup: Bingkai mini menampilkan `/assets/landing/bento-nara.png`.
   - **Card 2 (1 Kolom)**:
     - Label: `COGNITIVE DRILL`
     - Judul: `Atomic Fact Verification`
     - Deskripsi: `1 kartu 1 fakta atomik. Kuis dirancang dengan rubrik deterministik, menolak halusinasi AI dan melatih retensi kognitif aktif.`
     - Visual Mockup: Bingkai menampilkan `/assets/landing/bento-quiz.png`.
   - **Card 3 (1 Kolom)**:
     - Label: `KNOWLEDGE GRAPH`
     - Judul: `Peta Konsep Radial Interaktif`
     - Deskripsi: `Visualisasi hierarki bab dan keterhubungan materi secara grafis dengan kurva bezier zaitun, memetakan alur prasyarat sebelum ujian.`
     - Visual Mockup: Bingkai menampilkan `/assets/landing/bento-mindmap.png`.
   - **Card 4 (2 Kolom Lebar)**:
     - Label: `PIPELINE & OFFLINE RESILIENCE`
     - Judul: `YouTube to Structured Curriculum & Offline Resilience`
     - Deskripsi: `Keringkan video materi 1 jam menjadi intisari bab terstruktur, tabel rumus, dan flashcards. Didukung database SQLite WAL mode dan PWA.`
     - Chip Metrik: `[ 100% Offline-First ]`, `[ SQLite WAL Engine ]`, `[ Zero Vendor Lock-in ]`, `[ KaTeX Math Native ]`.

4. **Live Interactive Demo / Feature Stepper**:
   Stepper 4 langkah interaktif:
   - Step 1: "Unggah Dokumen / Tempel Tautan YouTube"
   - Step 2: "AI Menyusun Kurikulum Modular Per Bab"
   - Step 3: "Diskusi & Bedah Soal Bersama Nara AI"
   - Step 4: "Uji Retensi Kognitif (Feynman & Bank Salah)"
   (User dapat mengklik step untuk melihat penjelasan ringkas).

5. **Footer & Open Source Commitment**:
   - Teks penutup: "Tanka — Platform Belajar Mandiri Otonom untuk Pelajar & Mahasiswa Berorientasi Bukti."
   - Link: GitHub (`https://github.com/kaarlyz/Tanka`), MIT License, Local Data Privacy.
   - Copyright 2026 Tanka by kaarlyz.

---

## 5. ACCEPTANCE CRITERIA
- [x] Tipe `ActiveTab` dan `useAppRoute` mendukung tab `"landing"`.
- [x] Mengakses `/landing` atau membuka rute awal menampilkan Landing Page yang elegan.
- [x] Terdapat tombol CTA jelas yang membawa user masuk ke Dashboard Aplikasi (`activeTab = "home"`).
- [x] 4 screenshot produk nyata (`hero-reader.png`, `bento-nara.png`, `bento-mindmap.png`, `bento-quiz.png`) tersemat presisi di dalam frame device mockup.
- [x] Estetika desain bersih, bernuansa Linear/Apple, tanpa ornamen norak atau border kartun.
- [x] Responsif sempurna pada layar mobile (390px) maupun layar lebar desktop (1440px).
- [x] Seluruh unit/integration test tetap lolos 100% (`npm test` -> 83/83 passing).
- [x] DILARANG melakukan `git push` ke remote GitHub.

---

## 6. VERIFICATION COMMANDS
```bash
npm run build
env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js
```
