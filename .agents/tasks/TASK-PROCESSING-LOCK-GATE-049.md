# TASK-PROCESSING-LOCK-GATE-049: Lock In-Flight Processing Documents on UI & Prevent Premature Opening

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/tabs/HomeHubTab.tsx`
  - `src/components/tabs/MaterialTab.tsx`
  - `src/hooks/useUploadStaging.ts`
  - `src/hooks/useDocuments.ts`
  - `tests/processingGate.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka
- Status: `VERIFIED`

---

## 1. Problem Statement
Saat dokumen naskah soal atau materi diunggah, pipeline 4-tahap berjalan di latar belakang selama beberapa menit (`status = 'processing'`).
Saat ini, kartu dokumen di beranda (`HomeHubTab.tsx`) langsung menampilkan tombol aktif ("Bedah Soal", "Latihan Soal", "Flashcards") seolah dokumen sudah siap.
Ketika pengguna mengklik tombol tersebut saat status masih `processing`:
1. Pengguna masuk ke materi atau latihan yang masih kosong / separuh jadi, sehingga timbul kebingungan dan persepsi sistem rusak / hilang soal.
2. Pengguna tergoda menekan upload ulang berkas yang sama.

---

## 2. Spesifikasi Implementasi

### A. Lock & Indikator Status di Kartu Beranda (`src/components/tabs/HomeHubTab.tsx`)
1. Periksa `doc.status === 'processing'`.
2. Jika dokumen berstatus `processing`:
   - Tampilkan badge status beranimasi halus di atas kartu:
     `Sedang Dianalisis... (AI Pipeline)` dengan icon Loader/Target berputar atau pulsing dot.
   - **Kunci Semua Tombol Aksi**:
     - Tombol utama ("Bedah Soal" / "Baca Materi"):
       - Label: `Sedang Memproses...`
       - Status: `disabled={true}`, styling `opacity: 0.6`, `cursor: "not-allowed"`, `whiteSpace: "nowrap"`.
       - Klik tidak menjalankan `loadDocument` atau `setActiveTab`.
     - Tombol sekunder ("Latihan Soal", "Flashcards"):
       - Status: `disabled={true}`, styling `opacity: 0.4`, `cursor: "not-allowed"`.
       - Klik tidak bereaksi.
   - Jika kartu memiliki handler klik kontainer, cegah navigasi saat `doc.status === 'processing'`.

### B. Proteksi Halaman Materi (`src/components/tabs/MaterialTab.tsx`)
1. Jika dokumen aktif yang sedang dibuka memiliki `activeDocStatus === 'processing'` atau `doc.status === 'processing'`:
   - Jangan tampilkan reader kosong atau error state.
   - Tampilkan banner/panel informatif terpusat:
     `Materi & Butir Soal Sedang Disiapkan`
     `Pipeline AI sedang membedah naskah soal (Ekstraksi, Solve 3× Multi-Vote, Pembahasan). Modul akan otomatis terbuka begitu analisis selesai.`
   - Sediakan tombol `Kembali ke Beranda` (`setActiveTab("home")`).

### C. Alur Upload Staging (`src/hooks/useUploadStaging.ts`)
1. Setelah berkas selesai diunggah dan respons API berstatus `processing` (belum `completed`):
   - Jangan paksa alihkan tab pengguna ke tab `material` atau `quiz` yang belum matang.
   - Biarkan pengguna tetap di Beranda (`setActiveTab("home")`), sehingga pengguna dapat melihat kartu dokumen mereka dalam kondisi locked dengan animasi processing.
   - Munculkan toast notification jelas:
     `📋 Berkas "${title}" berhasil diunggah! Sedang diproses di latar belakang. Kartu modul akan otomatis aktif setelah selesai.`

### D. Auto-Unlock via Polling (`src/hooks/useDocuments.ts`)
1. Pastikan poller latar belakang secara berkala (tiap 3-4 detik) memperbarui daftar dokumen (`fetchDocuments()`) saat ada dokumen berstatus `processing`.
2. Begitu status dokumen di SQLite berubah menjadi `completed`, state React ter-refresh otomatis, tombol locked di kartu langsung berubah menjadi aktif tanpa user perlu me-refresh halaman web manual.

### E. Unit Test (`tests/processingGate.test.js`)
Buat test suite yang memverifikasi:
1. Logika proteksi status dokumen: dokumen berstatus `processing` ditolak/dicegah dari aksi launch kuis/material sebelum status berubah menjadi `completed`.
2. Respon API upload dokumen menyertakan field `status` yang konsisten (`processing` atau `completed`).
3. Auto-unlock logic mengembalikan status teranyar setelah pipeline selesai.

---

## 3. Verification Protocol & Results
1. `npm test`: 135/135 tests passing (100% PASS).
2. `npm run build`: Vite build passing (0 error).
3. Browser runtime testing via `browser_exec`:
   - Desktop 1920x1080: 0 horizontal overflow elements (`docScrollWidth === innerWidth === 390/1920`).
   - Locked card clicked: no navigation, remains safely on Home.
   - MaterialTab navigation while processing: renders centered protective banner with animated spinner and `Kembali ke Beranda` button.
   - Auto-unlock: on status change to `completed` in SQLite, UI unlocks within 3.5s poller tick without manual page refresh.
   - Evidence screenshots:
     - `TASK-049-desktop-locked-card.png`
     - `TASK-049-mobile-locked-card.png`
     - `TASK-049-material-protection-banner.png`
