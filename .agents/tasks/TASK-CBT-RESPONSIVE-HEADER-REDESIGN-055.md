# TASK-CBT-RESPONSIVE-HEADER-REDESIGN-055: Sleek Linear-Grade Mobile CBT Sticky Header & Zero-Overflow Ergonomics

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/index.css`
  - `tests/cbtHeaderRedesign.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Root Cause Analysis (Temuan Screenshot Pengguna)

Berdasarkan foto tangkapan layar ponsel pengguna (`img_3d7f5418e20c.jpg`), header atas CBT masih tampak rusak dan kaku:
1. **Header Memakan Ruang Vertikal Berlebihan & Warna Gelap Kusam:**
   Header hitam/hijau tua kaku dengan border-radius besar memakan tinggi layar berharga di ponsel, tampak seperti widget tempelan asing dan tidak menyatu dengan kanvas putih-hijau Tanka.
2. **Elemen Penuh Sesak & Overflow Tepi Kanan:**
   Dalam satu baris sempit ponsel, berkumpul: tombol kembali `←`, timer `00:15`, font selector `Aa`, palette `(0/20)`, dan tombol teks panjang `Selesai Latihan`.
   Akibatnya: tombol `Selesai Latihan` terdorong ke batas paling kanan, terasa berjejal, dan font text size `Aa` tidak proporsional.
3. **Hirarki Tidak Jelas:**
   Tidak ada perbedaan visual yang elegan antara timer yang berdetik dengan tombol kontrol sekunder.

---

## 2. Spesifikasi Implementasi (Acuan Linear / Mintlify Design System)

### A. Redesain Header CBT Mobile: Sticky Floating Header Berprofil Tipis & Elegan
Ubah `.cbt-runner-header` di mobile (`max-width: 768px`) menjadi **Floating Minimalist Bar** yang sangat rapi dan presisi:
1. **Container Styling:**
   - Background: `rgba(24, 34, 31, 0.94)` dengan `backdrop-filter: blur(12px)`.
   - Border: `1px solid rgba(255, 255, 255, 0.08)`.
   - Border Radius: `10px` (atau `0 0 12px 12px` sticky di bagian atas).
   - Padding: `8px 12px` (tinggi total hanya ~42px, hemat ruang vertikal).
   - Margin bawah: `12px`.
   - Shadow: `0 4px 16px rgba(0, 0, 0, 0.12)`.
   - `flex-wrap: nowrap; overflow: hidden; justify-content: space-between; align-items: center;`.

2. **Tata Letak 3-Kolom Proporsional di Mobile (Zero-Overflow Grid/Flex):**
   - **Kiri (Keluar/Kembali & Judul Singkat):**
     - Tombol kembali `←`: Icon `ArrowLeft size={14}`, padding `6px 8px`, rounded `6px`, background `rgba(255, 255, 255, 0.08)`.
     - Teks nomor/paket: sembunyikan nama panjang di header mobile (cukup tampilkan di TopBar utama atau kartu soal).
   - **Tengah (Timer Pill Presisi):**
     - Pill timer dengan latar `rgba(200, 240, 100, 0.12)`, border `1px solid rgba(200, 240, 100, 0.25)`, padding `4px 10px`, radius `9999px`.
     - Icon `Clock size={12}` warna `#c8f064`.
     - Font: `'DM Mono', monospace`, `13.5px`, `font-weight: 800`, `letter-spacing: 0.5px`, color `#c8f064` (atau `#fca5a5` saat sisa waktu < 5 menit).
   - **Kanan (Aksi Penting & Rapi):**
     - Tombol `Daftar Soal`: Icon `LayoutGrid size={13}` + badge kecil `0/20` (tanpa kata "Daftar Soal"), padding `5px 8px`, rounded `6px`.
     - Tombol `Font Size`: Dropdown / stepper ringkas icon `Type size={13}` atau `Aa` (padding `5px 7px`).
     - Tombol `Selesai`: Ganti teks panjang `"Selesai Latihan"` di mobile menjadi icon `Check size={14}` + label ringkas `"Selesai"` (font 11.5px, bold, padding `5px 10px`, radius `6px`, background `#10b981`, warna teks putih).
     - **PENTING:** Seluruh elemen kanan dibungkus `flex; align-items: center; gap: 6px; flex-shrink: 0;` dan tidak ada satupun elemen yang keluar dari `innerWidth: 360px-390px`.

### B. Polish Ergonomi Kartu Soal & Pilihan Jawaban
1. Pastikan kartu soal memiliki jarak bernapas yang pas di bawah header (`margin-top: 4px`).
2. Tombol opsi pilihan ganda A s/d E:
   - Padding mobile: `12px 14px` (touch target nyaman 48px).
   - Border radius: `10px`.
   - Saat terpilih: background halus `#f0fdf4`, border `1.5px solid #16a34a`, badge huruf (A, B, C...) berwarna hijau segar.
3. Tombol navigasi bawah ("Sebelumnya" & "Berikutnya"):
   - Sticky bar melayang di bawah (`.cbt-action-footer`):
     - Background: `rgba(255, 255, 255, 0.95)`, `backdrop-filter: blur(8px)`.
     - Border: `1px solid #e2e8f0`.
     - Tombol "Sebelumnya": ghost button abu-abu halus.
     - Tombol "Berikutnya": primary button hijau zaitun tajam (`#18221f`, teks `#c8f064`).

### C. Unit Test (`tests/cbtHeaderRedesign.test.js`)
Buat test suite yang memverifikasi:
1. Header CBT mobile merender kontrol dalam batas ringkas (label "Selesai" ringkas tanpa overflow).
2. Kelas CSS `.cbt-runner-header` mengunci layout single-row tanpa wrapping kaku di layar kecil.
3. Timer pill terpusat dan memiliki styling monospaced yang presisi.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (170+ passing).
2. `npm run build` -> build passing (0 error).
3. Screenshot mobile (390x844) disimpan di `.agents/evidence/TASK-055-mobile-cbt-header-redesign.png`.

---

## 4. Execution & Verification Report
- **Status:** `VERIFIED`
- **Executor:** MARAKA (`maraka`)
- **Diff Changes:**
  1. `src/components/tabs/ExamCbtTab.tsx`:
     - Tombol submit header: render `<span className="cbt-mobile-only">Selesai</span>` dan `<span className="cbt-desktop-only">...</span>` dengan icon Check `size={14}`.
     - Tombol palette: icon LayoutGrid `size={13}`, font ringkas, format `({answeredCount}/{total})`.
     - Timer pill: class `.cbt-timer-digits`, icon Clock `size={12}`, alert status `< 300s`.
     - Opsi pilihan ganda: terpilih background `#f0fdf4`, border `1.5px solid #16a34a`, badge `#16a34a`.
     - Footer: tombol "Berikutnya" tajam `#18221f` teks `#c8f064`, tombol "Sebelumnya" ghost button `#e2e8f0`.
  2. `src/index.css`:
     - Mobile `.cbt-runner-header`: floating bar `rgba(24, 34, 31, 0.94)`, `backdrop-filter: blur(12px)`, border `1px solid rgba(255, 255, 255, 0.08)`, border-radius `10px`, padding `8px 12px`, margin-bottom `12px`, shadow `0 4px 16px rgba(0, 0, 0, 0.12)`.
     - Layout flex locked: `flex-wrap: nowrap`, `overflow: hidden`, `justify-content: space-between`, `align-items: center`.
     - Centered timer pill: `.cbt-runner-timer-wrap` flex center, `.cbt-header-timer-pill` radius `9999px`, background `rgba(200, 240, 100, 0.12)`, font `'DM Mono', monospace`, `13.5px`, `#c8f064`.
     - Touch targets: `.cbt-option-btn` padding `12px 14px`, border-radius `10px`, `.cbt-pane` margin-top `4px`.
     - Action footer: background `rgba(255, 255, 255, 0.95)`, `backdrop-filter: blur(8px)`, border `1px solid #e2e8f0`.
  3. `tests/cbtHeaderRedesign.test.js`:
     - 4 unit test mencakup label ringkas mobile vs desktop, CSS single-row lock, centered timer pill monospaced styling, dan ergonomi kartu soal + opsi di 360px-390px.
- **Verification Evidence:**
  1. `npm test`: 173 tests passing (0 failing).
  2. `npm run build`: built in ~550ms with 0 errors.
  3. Runtime DOM probe (`getBoundingClientRect().right > viewportWidth`):
     - 390px: 0 overflowing elements.
     - 360px: 0 overflowing elements.
  4. Screenshot verified via visual analysis:
     - Path: `.agents/evidence/TASK-055-mobile-cbt-header-redesign.png`.
     - Semua kontrol selaras dalam 1 baris, nol teks terpotong, kontras dan touch target nyaman.
