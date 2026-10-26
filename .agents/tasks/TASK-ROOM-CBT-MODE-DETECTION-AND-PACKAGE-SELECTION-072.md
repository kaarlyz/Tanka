# TASK-ROOM-CBT-MODE-DETECTION-AND-PACKAGE-SELECTION-072: Integrated CBT Package Ingestion & Automatic CBT Mode Detection in Multiplayer Room Challenge

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `src/components/modals/RoomModal.tsx`
  - `src/App.tsx`
  - `server/routes/rooms.js`
  - `tests/roomCbtModeDetection.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & Root Cause Analysis

Pengguna menyampaikan:
> *"ayo perbaikan sedikit di bagian adu tryout bersama teman, seprtinya kemarin ad dibuat kek menu event ini bisa detek kalau cbt, nah tadi ku test dia ga detek gitu ... dia seperti masih pake funct yang lama"*

### Temuan Empiris di Codebase:
1. **Dropdown Materi di `RoomModal.tsx` Hanya Berisi Dokumen Modul Biasa:**
   - Di `RoomModal.tsx` baris 953:
     Input pilihan materi kuis HANYA me-looping daftar `documents`:
     `<option value="">Pilih dari modul tersimpan...</option>{documents.map(d => ...)}`
   - Daftar 26 Paket Resmi Bank Soal CBT Pusmendik/SNBT (`/api/exam-bank/packages`) sama sekali **tidak pernah di-fetch atau dimasukkan ke pilihan materi room**!
   - Pengguna yang ingin membuat Room Adu Tryout dari paket CBT tidak bisa memilih paket CBT dari modal Room.
2. **Ketiadaan Parameter `packageId` Saat Membuat Room:**
   - Saat submit `handleCreateRoom` (baris 452), payload yang dikirim HANYA `{ docId: selectedDocId || "global", ... }`.
   - Field `packageId` tidak pernah dikirim, sehingga backend `/api/rooms` menganggap room sebagai kuis reguler (bukan CBT).
3. **Penyusupan Format CBT di `App.tsx` Mengabaikan Indikator Dokumen CBT:**
   - Di `App.tsx`, fungsi `handleStartRoomExam` (baris 407) sudah mengonversi soal ke `setRoomCbtSession` dan membuka `setActiveTab("cbt")`.
   - Namun, jika room dibuat dari dokumen modul bertipe `is_exam_sheet` (lembar naskah ujian) atau judul memuat `TKA/UTBK`, room tidak mencatat flag bahwa ini adalah sesi CBT resmi, sehingga fallback ke tampilan kuis lama (`viewState === 'playing'`) terjadi pada kondisi tertentu.

---

## 2. Spesifikasi Implementasi

### A. Integrasikan Pilihan Paket CBT Resmi di `RoomModal.tsx`
1. Fetch daftar paket CBT resmi dari `/api/exam-bank/packages` saat modal Room dibuka:
   ```tsx
   const [cbtPackages, setCbtPackages] = useState<ExamBankPackage[]>([]);
   const [sourceType, setSourceType] = useState<"doc" | "cbt">("doc");
   const [selectedPackageId, setSelectedPackageId] = useState<string>("");
   ```
2. Di form pembuatan room (`hubTab === "create"`):
   Sediakan pemilih sumber kuis yang jelas:
   - **Tab Sumber Materi:**
     `[ 📄 Modul & Ringkasan Saya ]` | `[ 🏛️ Paket Bank Soal CBT Resmi ]`
   - Jika `sourceType === "cbt"`:
     - Tampilkan dropdown daftar 26 paket naskah resmi:
       `<select value={selectedPackageId} onChange={...}>`
       Memuat opsi: *Bahasa Indonesia (Paket 1 s/d 6), Sosiologi, Ekonomi, Penalaran Matematika, dll.*
     - Otomatis pasang judul room: `⚔️ Adu Tryout CBT: ${pkg.subtes_or_mapel} (${pkg.paket})`.
     - Kunci badge status: `🔒 Format Resmi CBT Terdeteksi (Mode 1:1 Ujian)`.
     - Kunci tipe & jumlah soal sesuai total soal paket (`pkg.total_questions`).
3. Payload `handleCreateRoom`:
   Jika `sourceType === "cbt"`:
   Kirim `{ packageId: selectedPackageId, title: roomTitle, ... }`.
   Backend `/api/rooms` sudah mendukung `packageId` dan akan otomatis mengambil butir soal dari `exam_bank_items`!

### B. Sinkronisasi Peluncuran Adu Soal Langsung ke CBT Cockpit
1. Di `RoomModal.tsx`:
   Ketika room berstatus CBT (`currentRoom.doc_id === "cbt"` atau `currentRoom.packageId` atau judul memuat `TKA/CBT/Tryout`):
   Saat countdown tuntas (`triggerMatchCountdown`):
   Pastikan selalu memanggil `onStartRoomExam(room, quizQuestions)` dan menutup modal (`onClose()`), sehingga peserta langsung berpindah ke **CBT Cockpit resmi (`ExamCbtTab`)** dengan timer tersinkronisasi, layout 1:1, dan fitur canggih CBT (bukan modal pop-up kuis jadul!).

### C. Unit Test (`tests/roomCbtModeDetection.test.js`)
Buat test suite yang memverifikasi:
1. `RoomModal` me-load dan menampilkan paket CBT resmi pada pilihan materi.
2. Pembuatan room dari paket CBT mengirimkan parameter `packageId` yang valid ke backend.
3. Event `onStartRoomExam` terpanggil dengan format item CBT dan memindahkan pengguna ke tab CBT.

---

## 3. Verification Protocol
1. `npm test` passing (215+ passing).
2. `npm run build` passing.
3. Screenshot mobile (390x844) membuktikan pemilih paket CBT resmi tampil di pembuatan room di `.agents/evidence/TASK-072-mobile-room-cbt-selector.png`.
