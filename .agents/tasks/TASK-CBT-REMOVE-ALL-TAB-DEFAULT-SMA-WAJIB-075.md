# TASK-CBT-REMOVE-ALL-TAB-DEFAULT-SMA-WAJIB-075: Remove Redundant 'Semua' Filter & Set 'SMA Wajib' as Default Category in CBT Hub

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/ExamCbtTab.tsx`
  - `tests/cbtRemoveAllTab.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & User Direction

Pengguna menginstruksikan:
> *"himpunan smua itu hapus aja, gakepake juga"*
(Dikonfirmasi via klarifikasi: Hapus tab filter 'Semua' di Simulasi CBT dan langsung mulai dari kategori resmi 'SMA Wajib').

### Alasan Desain:
Tab "Semua" mencampurkan puluhan paket dari berbagai jenjang dan kurikulum berbeda (Wajib, Pilihan, UTBK SNBT, AI Drill) ke dalam satu wadah raksasa tanpa filter fokus. Pengguna yang membuka CBT selalu ingin fokus pada jalur seleksi tertentu: **SMA Wajib**, **SMA Pilihan**, atau **UTBK SNBT**. Menghapus tab "Semua" mengurangi cognitive overload dan langsung mengarahkan pengguna ke naskah utama Pusmendik TKA Wajib.

---

## 2. Spesifikasi Implementasi

### A. Perubahan di `src/components/tabs/ExamCbtTab.tsx`
1. **Ubah State Awal `selectedCategory`**:
   - Dari: `useState<"semua" | "sma_wajib" | ...>("semua")`
   - Menjadi: `useState<"sma_wajib" | "sma_pilihan" | "utbk_snbt" | "ai_drill" | "history">("sma_wajib")`
2. **Hapus Tombol Tab `id: "semua"`**:
   - Di daftar tab kategori (baris ~1755):
     Hapus `{ id: "semua" as const, label: "Semua", icon: LayoutGrid }`.
     Daftar tab kini dimulai langsung dari:
     - `[ 📖 SMA Wajib ]` (Default terpilih)
     - `[ 📚 SMA Pilihan ]`
     - `[ 🏆 UTBK SNBT ]`
     - `[ ✨ AI Drill ]`
     - `[ 🕒 Riwayat ]`
3. **Pembersihan Logika Fallback `selectedCategory === "semua"`**:
   - Hapus percabangan `tab.id === "semua"` dan `selectedCategory === "semua"` yang tidak lagi digunakan.
   - Tombol "Semua Subtes" pada filter subtes diubah labelnya menjadi lebih kontekstual: `"Semua Mapel (${filteredPackages.length})"`.

### B. Unit Test (`tests/cbtRemoveAllTab.test.js`)
Buat unit test yang memverifikasi:
1. Tab `id: "semua"` tidak lagi ada di daftar tab kategori CBT.
2. Default kategori awal adalah `"sma_wajib"`.
3. Paket-paket SMA Wajib ter-filter secara otomatis saat pertama kali tab dibuka.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (termasuk 252+ test sebelumnya).
2. `npm run build` -> build Vite sukses tanpa error.
3. DOM probe layout mobile: `0` overflow element.

---

## 4. Execution Report (MARAKA)
- **Status**: `VERIFIED`
- **Files Changed**:
  - `src/components/tabs/ExamCbtTab.tsx`:
    - `CbtCategory` type: `"sma_wajib" | "sma_pilihan" | "utbk_snbt" | "ai_drill" | "history"` (tab 'semua' dieliminasi).
    - Initial `selectedCategory` state: `"sma_wajib"`.
    - Daftar tab kategori: dimulai langsung dari SMA Wajib (`[ 📖 SMA Wajib ]`).
    - Filter logic & fallback: percabangan `tab.id === 'semua'` dan `selectedCategory === 'semua'` dibersihkan.
    - Tombol fallback riwayat kosong dialihkan ke `"sma_wajib"`.
    - Tombol filter subtes: label kontekstual `"Semua Mapel (${filteredPackages.length})"`.
    - Selector outer padding: `padding: "8px 0 96px 0"` untuk clearance mobile bottom navigation.
  - `tests/cbtRemoveAllTab.test.js`:
    - Validasi ketiadaan tab `"semua"` di definisi type, state, tab bar, dan fallback.
    - Validasi initial state `"sma_wajib"`.
    - Validasi logika isolasi filter paket SMA Wajib (pusmendik_tka + ai_drill wajib).
- **Test Evidence**:
  - `node --test tests/cbtRemoveAllTab.test.js`: 2/2 PASS.
  - `npm test`: 254/254 PASS (0 fail).
  - `npm run build`: Vite build sukses (2675 modules transformed, exit code 0).
- **DOM Probe Evidence**:
  - Desktop (1920x1080): `overflowCount: 0`. Screenshot: `.agents/evidence/TASK-075-desktop-cbt-default-sma-wajib.png`.
  - Mobile (390x844): `overflowCount: 0`. Screenshot: `.agents/evidence/TASK-075-mobile-cbt-default-sma-wajib.png`.

