# TASK-LANDING-PAGE-REVAMP-013: Revamp Copywriting Landing Page ke Benefit-Driven, Micro-Animations, dan Business Pitch

## 1. Konteks & Akar Masalah
Landing page saat ini (`src/components/landing/LandingPage.tsx`) terlalu sarat dengan jargon teknis backend developer:
- Menuliskan "Arsitektur Bento", "SQLite WAL Engine", "tanya-nara.tsx [sub-0.2ms]", dan "State Colocation".
- Pengguna (pelajar SMA, pejuang TKA/UTBK, mahasiswa) tidak membeli arsitektur database; mereka membeli hasil: kecepatan memahami materi, tutor AI yang ramah, kuis yang tidak ngawur, dan kemudahan belajar mandiri tanpa gangguan iklan.

## 2. Sasaran & Spesifikasi Revisi

### A. Reposisi Nilai & Copywriting (Human-Centric & Selling Superpowers)
1. **Hero Section**:
   - Badge Atas: Ubah menjadi `⚡ Belajar Cepat & Tuntas • 100% Bebas Iklan`.
   - Headline H1:
     `"Ubah Materi Apapun Jadi Paham Seketika."`
     `"Belajar Mandiri Berdaya Tinggi, Bebas Gimmick."`
   - Subheadline:
     `"Pecah PDF tebal, catatan kuliah, atau video YouTube 1 jam menjadi bab bacaan modular dalam hitungan detik. Didampingi tutor Nara AI yang sabar menjelaskan rumus langkah demi langkah."`
   - Tombol CTA:
     - Utama: `Mulai Belajar Sekarang (Gratis) →`
     - Sekunder: `Lihat Sumber Terbuka (GitHub) ⭐`

2. **Navbar**:
   - Ganti `Arsitektur Bento` menjadi `Keunggulan` atau `Fitur`.

3. **Bento Cards (Fokus Manfaat & Solusi Masalah Pelajar)**:
   - **Card 1 (Nara AI)**:
     - Label: `TUTOR PRIBADI 24/7`
     - Title: `Tanya Rumus & Konsep Tanpa Rasa Malu`
     - Desc: `Gak paham satu langkah di soal matematika atau konsep teori rumit? Tanya Nara AI. Dijelaskan dengan analogi sederhana dan penurunan rumus bertahap sampai kamu benar-benar paham.`
     - Chip: `Analog Ramah • Penjelasan Bertahap • Respon Seketika`
   - **Card 2 (Atomic Quiz)**:
     - Label: `LATIHAN TERUJI`
     - Title: `Kuis Pintar 1 Kartu 1 Fakta`
     - Desc: `Bukan kuis tebak-tebakan asal jadi. Setiap soal menguji inti logika materi tanpa soal jebakan halusinasi, dilengkapi pembahasan instan.`
     - Chip: `Anti-Halusinasi • Pembahasan Lengkap • Lacak Bank Salah`
   - **Card 3 (YouTube & Document to Book Reader)**:
     - Label: `INSTANT SUMMARY`
     - Title: `Video YouTube 1 Jam Jadi Rangkuman 3 Menit`
     - Desc: `Cukup tempel link video YouTube atau unggah dokumen. Tanka otomatis merapikannya menjadi modul bab interaktif layaknya buku saku digital.`
     - Chip: `Auto-Chapter • Rangkuman Rumus • Estetika Paper-Ledger`
   - **Card 4 (Peta Konsep)**:
     - Label: `VISUAL RETENTION`
     - Title: `Petakan Hubungan Antar-Konsep`
     - Desc: `Visualisasikan alur keterkaitan materi secara menyeluruh agar tidak ada mata rantai ilmu yang tercecer sebelum ujian.`
     - Chip: `Peta Radial • Navigasi Cepat • Retensi Jangka Panjang`
   - **Card 5 (Offline & Ringan)**:
     - Label: `HEMAT & PRIVAT`
     - Title: `Bisa Dipelajari Offline & Hemat Kuota`
     - Desc: `Semua data materi tersimpan di perangkatmu sendiri. Buka materi di mana saja tanpa pusing jaringan internet putus-nyambung.`
     - Chip: `Local-First • Ringan di HP • Nol Iklan Mengganggu`

### B. Animasi & Interaktivitas Halus (Micro-Motion)
1. **Interactive Hover Cards**:
   - Berikan sentuhan `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)` pada `.bento-card`.
   - Tambahkan efek *subtle border highlight* dan bayangan halus (`box-shadow: 0 12px 32px rgba(18,34,26,0.08)`) saat kursor mengarah ke kartu di desktop.
2. **Badge Pulse**:
   - Titik hijau pada badge hero berdenyut lembut (`pulse 2s infinite`).
3. **Mockup Frame Elevation**:
   - Frame laptop hero memiliki bayangan melayang elegan (`box-shadow: 0 24px 64px -12px rgba(24,34,31,0.12)`).

### C. Verifikasi & Pengujian
- `npm run build` sukses Vite.
- `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` lulus 83/83.
- Restart `systemctl --user restart tanka`.
- Verifikasi visual di browser headless.
- DILARANG `git push`!
