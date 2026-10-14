# TASK: TASK-LANDING-PAGE-MOTION-014
## STATUS
READY

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/components/landing/LandingPage.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE
Transformasikan Landing Page Tanka (`src/components/landing/LandingPage.tsx`) dari halaman statis biasa menjadi **Experience Web Interaktif Kelas Dunia (Linear/Raycast/Apple standard)** yang kaya akan *organic micro-motion*, efek visual ambient glow, demo interaktif yang bisa diklik langsung oleh pengunjung, perbandingan "Sebelum vs Sesudah Tanka", dan simulasi tanya-jawab Nara AI secara langsung di halaman depan.

---

## 2. LATAR BELAKANG & KRITIK
Pengguna mengkritik bahwa tampilan landing page saat ini masih terasa kurang kreatif, minim gerak (*motionless*), dan terasa kaku seperti template biasa.
Landing page modern kelas atas (seperti Linear, Stripe, Raycast, Vercel) memiliki:
1. **Latar Ambient Glow Dinamis**: Cahaya radial hijau zaitun & lime lembut yang bernapas (*breathing aura*) di belakang hero dan kartu bento.
2. **Widget Demo Interaktif Nyata**: Pengunjung bisa langsung mencoba mengklik simulasi pertanyaan Nara AI, mencoba memilih jawaban kuis atomik dengan feedback warna hijau instan, dan melihat alur rangkuman YouTube.
3. **Statistik & Metrik Berjiwa**: Angka-angka hidup dengan pill highlight (0.2ms respons instan, 100% offline, 0 iklan).
4. **Perbandingan "Cara Lama vs Cara Tanka"**: Interactive toggle / tab yang memperlihatkan frustrasi belajar konvensional (buka PDF 200 halaman, tonton video 2 jam ngantuk) vs belajar dengan Tanka (modular, 3 menit bab, ada tutor pendamping).
5. **Micro-Motion & Shimmer Hover**: Card border yang bereaksi terhadap kursor dengan pendaran halus (`linear-gradient` border shimmer), tombol kenyal, dan transisi silky.

---

## 3. SPESIFIKASI IMPLEMENTASI (FOR MARAKA)

Perbarui `src/components/landing/LandingPage.tsx` dengan komponen dan fitur berikut:

### A. Ambient Background Lighting & Grid Teknis
Tambahkan efek ambient aura pada background:
```css
/* Ambient Glowing Orbs */
.landing-ambient-orb-1 {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  width: 680px;
  height: 380px;
  background: radial-gradient(ellipse at center, rgba(200, 240, 100, 0.14) 0%, rgba(75, 102, 35, 0.06) 50%, transparent 75%);
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
  animation: orbFloat 8s ease-in-out infinite alternate;
}

@keyframes orbFloat {
  0% { transform: translateX(-50%) translateY(0) scale(1); }
  100% { transform: translateX(-48%) translateY(25px) scale(1.08); }
}
```

### B. Live Interactive Nara AI Simulator di Hero
Tepat di bawah subheadline dan CTA, sebelum frame mockup atau di dalam kartu unggulan, sediakan **Mini Live Simulator "Coba Tanya Nara AI Sekarang"**:
- Pengunjung bisa mengklik 3 chip pertanyaan contoh:
  1. `Bagaimana cara mencari irisan himpunan A ∩ B?`
  2. `Jelaskan hukum fotosintesis secara singkat`
  3. `Kenapa rumus pythagoras a² + b² = c²?`
- Ketika chip diklik:
  - Kotak simulasi chat Nara mengetik respons secara animasi bertahap (efek ketikan halus) lengkap dengan formula KaTeX terformat rapi (`$A \cap B = \{x \mid x \in A \land x \in B\}$`).
  - Menampilkan lencana respons: `⚡ Dijawab dalam 0.18ms • Nara AI Model 3.8`.

### C. Bento Cards yang Bisa Diklik & Berinteraksi Nyata
1. **Card 1 (Nara AI Simulator)**:
   - Terintegrasi dengan demo interaktif di atas atau tombol chip pertanyaan cepat.
2. **Card 2 (Interactive Atomic Quiz Card)**:
   - Tampilkan 1 butir soal interaktif nyata:
     *Pertanyaan:* "Jika himpunan $A = \{2, 4, 6\}$ dan $B = \{4, 6, 8\}$, maka anggota $A \cap B$ adalah..."
     *Pilihan (Dapat diklik):*
     - [A] $\{2, 8\}$
     - [B] $\{4, 6\}$ (Klik ini -> Border langsung hijau terang `#c8f064`, muncul badge centang `✓ Jawaban Benar! Irisan adalah elemen yang ada di kedua himpunan`)
     - [C] $\{2, 4, 6, 8\}$
3. **Card 3 (Interactive YouTube to Summary Preview)**:
   - Kolom input pura-pura yang menampilkan URL YouTube dengan tombol "Simulasikan Rangkum".
   - Saat diklik, progress bar menyala cepat 1 detik $\rightarrow$ menampilkan 3 bab hasil rangkuman otomatis beserta durasi baca.
4. **Card 4 (Radial Knowledge Graph Visualizer)**:
   - Kanvas SVG mini dengan titik-titik simpul materi yang berdenyut lembut (pulsing node links) dengan garis bezier hijau zaitun.
5. **Card 5 (Perbandingan Offline vs Online)**:
   - Switch toggle sederhana: `Mode Online` vs `Mode Pesawat / Offline`.
   - Menggambarkan data tetap terbuka instan 0 ms walau offline.

### D. Perbandingan "Cara Lama vs Cara Tanka" (Interactive Comparison)
Tambahkan section interaktif:
- Tab / Switcher: `Belajar Cara Lama (Bikin Pusing)` vs `Belajar Cara Tanka (Otonom & Cepat)`.
- **Cara Lama**:
  - ❌ Nonton video 2 jam, baru paham 1 rumus di menit 45.
  - ❌ Buka PDF 200 halaman, scroll tanpa arah dan hilang fokus.
  - ❌ Tanya guru/teman malu takut dikira tidak menyimak.
  - ❌ Belajar terdistraksi pop-up iklan dan notifikasi media sosial.
- **Dengan Tanka**:
  - ✅ Video 2 jam langsung diringkas jadi 4 bab modul baca 3 menit.
  - ✅ PDF tebal otomatis dipotong per topik logis + penurunan rumus KaTeX rapi.
  - ✅ Tanya Nara AI 24 jam tanpa rasa malu, dijelaskan dari dasar sampai paham.
  - ✅ 100% bebas iklan, local-first, hemat kuota dan fokus terjaga.

### E. Social Proof & Persona Pelajar
Sertakan 3 kartu persona pelajar:
1. **Dafa (Siswa Kelas XII / Pejuang UTBK)**: "Paling kebantu sama Bank Salah dan kuis 1 kartu 1 fakta. Gak ada soal jebakan ngaco, rumus matematika langsung diterjemahin step by step."
2. **Nadia (Mahasiswi Biologi)**: "Kuliah sering dikasih jurnal 40 halaman. Dimasukin ke Tanka langsung jadi bab-bab kecil yang gampang dicerna sebelum kuis mingguan."
3. **Rian (Gap Year)**: "Bisa belajar offline di cafe atau perpus tanpa takut kuota jebol. Tampilannya bersih banget kayak aplikasi luar negeri."

### F. Micro-Motion & Shimmer Hover CSS
Tambahkan CSS interaktif:
- Border highlight pendar halus:
  ```css
  .bento-card {
    position: relative;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s ease;
  }
  @media (hover: hover) and (pointer: fine) {
    .bento-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(24, 34, 31, 0.09) !important;
      border-color: #8da868 !important;
    }
  }
  ```
- Tombol CTA bernapas (*subtle glow breathing*).

---

## 4. ACCEPTANCE CRITERIA
- [ ] Landing page terasa hidup, dinamis, dan premium (Linear/Raycast aesthetic).
- [ ] Ambient radial lighting lembut terpasang di latar belakang.
- [ ] Live Simulator Tanya Nara AI berfungsi interaktif (klik chip -> muncul jawaban berformat KaTeX).
- [ ] Kuis interaktif 1 kartu 1 fakta di kartu bento bisa diklik langsung oleh pengunjung dan memberikan feedback visual instan.
- [ ] Section perbandingan "Cara Lama vs Cara Tanka" interaktif dan komunikatif.
- [ ] 3 testimonial persona pelajar terpasang rapi.
- [ ] Copywriting 100% human-centric tanpa jargon developer.
- [ ] `npm run build` sukses tanpa error.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.

---

## 5. VERIFICATION COMMANDS
```bash
npm run build
env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js
systemctl --user restart tanka
```
