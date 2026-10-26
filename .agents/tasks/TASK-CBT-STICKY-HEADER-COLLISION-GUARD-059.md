# TASK-CBT-STICKY-HEADER-COLLISION-GUARD-059: Solid Backdrop Shelf & Visual Occlusion Divider for Mobile CBT Sticky Header

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/cbtHeaderCollisionGuard.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Root Cause Analysis (Temuan Pengguna)

Pengguna menyampaikan:
> *"bagian panel yg ada waktu dll itu yg warna hitam nah jadi pas bawahnya itu di scrool dia kek nembus, keknya lebih baik ad pembatas"*

### Akar Penyebab:
1. **Transparansi Menembus Konten (Ghosting Bleed-Through):**
   - Di `index.css`, `.cbt-runner-header` mobile saat ini dipasangi:
     `background-color: rgba(24, 34, 31, 0.94) !important;`
     `position: sticky !important; top: 0 !important;`
   - Karena kontainer induk `.content-scroll` memiliki `padding-top: 14px`, saat pengguna menggulir halaman ke bawah:
     - Teks pertanyaan dan opsi jawaban meluncur ke atas dan tampak menembus celah 14px di atas header gelap (karena header mengambang dan tidak menempel rapat di tepi atas canvas).
     - Selain itu, transparansi 94% + blur masih memperlihatkan bayangan huruf teks putih yang lewat di belakang header hitam.
2. **Tidak Ada Garis Pembatas Bawah (No Solid Occlusion Divider):**
   - Bagian bawah header hitam mengambang di atas kartu putih tanpa pembatas visual yang solid (*opaque masking shelf*), sehingga batas antara kontrol ujian (waktu/tombol) dengan lembar soal di bawahnya terasa bertubrukan dan "tembus pandang".

---

## 2. Spesifikasi Implementasi

### A. Solid Sticky Shelf Architecture (`src/index.css` & `ExamCbtTab.tsx`)
Bungkus atau ubah `.cbt-runner-header` mobile menjadi **Solid Opaque Sticky Shelf**:
1. **Top Pinning & Zero-Bleed:**
   - Ubah posisi sticky agar menempel kuat ke atas canvas tanpa celah:
     ```css
     .cbt-runner-header {
       position: sticky !important;
       top: -14px !important; /* Mengkompensasi padding-top 14px dari .content-scroll agar tidak ada celah tembus di atas */
       margin-top: -14px !important;
       margin-left: -14px !important;
       margin-right: -14px !important;
       width: calc(100% + 28px) !important;
       box-sizing: border-box !important;
       border-radius: 0 0 14px 14px !important; /* Tepi bawah membulat halus */
       background: #18221f !important; /* Solid 100% opaque, ZERO tembus pandang */
       border: none !important;
       border-bottom: 2px solid rgba(200, 240, 100, 0.35) !important; /* Garis aksen pembatas hijau lime tegas */
       box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22) !important; /* Bayangan elevasi penutup */
       padding: 10px 14px !important;
       z-index: 120 !important;
     }
     ```
2. **Garis Pembatas Bawah (Visual Shelf Divider):**
   - Berikan garis batas solid di bagian bawah header:
     `border-bottom: 2px solid #5b8026` atau `border-bottom: 2px solid rgba(200, 240, 100, 0.4)`.
   - Garis pembatas ini memberikan batas tegas bahwa area atas adalah **kontrol waktu & status**, sedangkan area bawah adalah **lembar pengerjaan soal**.
   - Ketika soal digulir ke atas, konten soal lenyap dengan rapi tepat di bawah garis pembatas tanpa ada huruf yang tembus pandang atau mengintip dari celah atas.

3. **Kompensasi Jarak Lembar Soal:**
   - Tambahkan `margin-top: 14px` pada kartu soal `.cbt-pane` agar saat pertama kali dimuat, posisi soal tetap memiliki jarak nafas yang sempurna di bawah header.

### B. Unit Test (`tests/cbtHeaderCollisionGuard.test.js`)
Buat test suite yang memverifikasi:
1. `.cbt-runner-header` pada mobile menggunakan background solid (100% opaque, bukan transparent/semi-transparan) untuk mencegah content bleed-through.
2. Memiliki `border-bottom` tegas sebagai garis pembatas visual.
3. Posisi sticky mengkompensasi padding container (`top <= 0`, lebar `calc(100% + 28px)`).

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (185+ passing).
2. `npm run build` -> build passing (0 error).
3. Screenshot mobile (390x844) saat di-scroll untuk membuktikan nol teks tembus di `.agents/evidence/TASK-059-mobile-cbt-shelf-divider.png`.
