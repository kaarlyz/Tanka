# TASK-CBT-CLOUD-SESSION-SYNC-AND-DESKTOP-DEDUP-073: Cloud Active CBT Session Sync for Cross-Device Resumption & Desktop Question Deduplication

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `server/db.js`
  - `server/routes/examBank.js`
  - `src/components/tabs/ExamCbtTab.tsx`
  - `src/hooks/useAppRoute.ts`
  - `tests/cbtCloudSessionSync.test.js`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Problem Statement & Root Cause Analysis

### Masalah 1: Progres CBT Tidak Sinkron Antar Perangkat (HP ↔ Laptop)
- **Kondisi Saat Ini:**
  Di `ExamCbtTab.tsx`, penyimpanan progres pengerjaan ujian (`answers`, `currentIndex`, `timeLeft`, `doubtful`, `drillChecked`) disimpan murni di `localStorage` peramban lokal:
  `localStorage.setItem("tanka_cbt_answers", ...)`
- **Dampak:**
  Jika pengguna membuka akun yang sama di HP lalu pindah ke laptop, atau tertekan reload/tutup tab, laptop tidak tahu apa yang sudah dikerjakan di HP karena `localStorage` tidak pernah dikirim ke database cloud.
- **Solusi:**
  1. Buat tabel database `cbt_active_sessions` di SQLite:
     `(user_id, package_id, current_index, answers_json, doubtful_json, drill_checked_json, time_left, study_mode, updated_at)`.
  2. Buat endpoint REST API:
     - `GET /api/exam-bank/session` (ambil sesi pengerjaan aktif milik akun pengguna jika ada).
     - `POST /api/exam-bank/session` (simpan debounced snapshot progres ujian ke server secara berkala).
     - `DELETE /api/exam-bank/session` (hapus sesi aktif saat ujian diselesaikan/di-submit).
  3. Saat pengguna login atau membuka tab CBT di perangkat apa pun (HP atau laptop), sistem otomatis mengecek apakah ada sesi aktif di database cloud. Jika ada, munculkan prompt halus atau langsung lanjutkan pengerjaan tanpa mengulang dari nomor 1.

### Masalah 2: Teks Wacana Terduplikasi di Sisi Kanan (Soal) pada Desktop
- **Kondisi Saat Ini:**
  Pada beberapa naskah atau room kompetisi, `it.soal` masih memuat awalan teks wacana atau tag `<div class="exam-bacaan">...</div>` yang sama persis dengan yang sudah dirender di panel kiri (`currentItem.bacaan`).
- **Dampak:**
  Di desktop, panel kiri sudah menampilkan wacana bacaan, tetapi di panel kanan (soal) teks bacaan tersebut muncul lagi di atas kalimat pertanyaan, sehingga pengguna melihat cerita yang sama dua kali.
- **Solusi:**
  Di `ExamCbtTab.tsx`, saat merender soal di panel kanan desktop (atau saat `shouldShowWacana === true`):
  Jika `currentItem.soal` diawali atau memuat tag wacana yang identik dengan `currentItem.bacaan`, bersihkan teks wacana duplikat tersebut sehingga panel kanan HANYA menampilkan kalimat pertanyaan inti (*pure question prompt*).

---

## 2. Spesifikasi Implementasi

### A. Tabel Database & Endpoints (`server/db.js` & `server/routes/examBank.js`)
1. Di `server/db.js`:
   ```sql
   CREATE TABLE IF NOT EXISTS cbt_active_sessions (
     user_id TEXT PRIMARY KEY,
     package_id TEXT NOT NULL,
     current_index INTEGER DEFAULT 0,
     answers_json TEXT DEFAULT '{}',
     doubtful_json TEXT DEFAULT '{}',
     drill_checked_json TEXT DEFAULT '{}',
     time_left INTEGER NOT NULL,
     study_mode TEXT DEFAULT 'exam',
     updated_at INTEGER NOT NULL
   );
   ```
2. Di `server/routes/examBank.js`:
   - `GET /api/exam-bank/session`: Ambil sesi aktif berdasarkan `userId`. Sertakan metadata paket dan item soal jika paket masih tersedia di `exam_bank_packages`.
   - `POST /api/exam-bank/session`: Upsert data sesi aktif milik `userId`.
   - `DELETE /api/exam-bank/session`: Hapus record sesi saat ujian disubmit (`handleSubmitExam`).

### B. Sinkronisasi Otomatis di Frontend (`src/components/tabs/ExamCbtTab.tsx`)
1. **Cloud Auto-Save (Debounced):**
   Setiap kali pengguna menjawab soal (`answers`), berpindah nomor (`currentIndex`), atau timer berjalan, kirimkan snapshot ke `POST /api/exam-bank/session` setiap 3–5 detik jika pengguna sudah login.
2. **Cloud Resume on Mount:**
   Saat `ExamCbtTab` dimuat dan pengguna memiliki sesi aktif di cloud dengan `package_id` valid:
   Pulihkan `currentPackage`, `items`, `currentIndex`, `answers`, `timeLeft`, dan `studyMode` langsung ke state React. Pengguna langsung melanjutkan soal yang sama persis di HP maupun laptop.
3. **Pembersihan Wacana Duplikat di Panel Kanan:**
   Buat helper `getDeduplicatedSoalText(soal: string, bacaan?: string | null)`:
   - Jika `shouldShowWacana && bacaan`:
     Hapus tag `<div class="exam-bacaan"[^>]*>[\s\S]*?<\/div>` dari `soal`.
     Jika paragraf awal `soal` identik kata-per-kata dengan awal `bacaan`, potong bagian yang terduplikasi dan sisakan hanya kalimat pertanyaan.

### C. Unit Test (`tests/cbtCloudSessionSync.test.js`)
Buat test suite yang memverifikasi:
1. Endpoint `GET/POST/DELETE /api/exam-bank/session` menyimpan dan mengembalikan state sesi ujian antar perangkat.
2. Helper `getDeduplicatedSoalText` membersihkan wacana duplikat di panel kanan saat panel kiri wacana aktif.
3. Sesi aktif terhapus bersih saat ujian di-submit.

---

## 3. Verification Protocol
1. `npm test` -> semua test passing (215+ passing).
2. `npm run build` -> Vite build passing (0 error).
3. Uji integrasi database: pengerjaan di satu sesi tersimpan di SQLite dan dapat diambil oleh sesi lain.

---

## 4. Execution Evidence & Verification Results
- **Status:** `REVIEW_REQUIRED` (Siap diaudit AURA)
- **Files Modified/Created:**
  - `server/db.js`: Tabel `cbt_active_sessions` & index `idx_cbt_active_sessions_pkg` dibuat, idempotensi & orphan cleanup terintegrasi.
  - `server/routes/examBank.js`: REST endpoints `GET /api/exam-bank/session`, `POST /api/exam-bank/session` (upsert), `DELETE /api/exam-bank/session`, auto-cleanup on submit, dan helper `getDeduplicatedSoalText`.
  - `src/components/tabs/ExamCbtTab.tsx`: Cloud Auto-Save debounced 3.5s, Cloud Auto-Resume on Mount, auto-delete cloud session on submit, dan penerapan `getDeduplicatedSoalText` di panel kanan desktop saat `shouldShowWacana` aktif.
  - `tests/cbtCloudSessionSync.test.js`: 5 unit tests lengkap mencakup skema DB, cross-device sync (HP ↔ Laptop), deduplikasi wacana, auto-cleanup on submit, dan integrasi frontend.
- **Verification Evidence:**
  1. `npm test`: 224 passed (0 fail, duration ~31.5s).
  2. `npm run build`: Vite build sukses (0 error, build time 444ms).
  3. Live runtime API test: `GET/POST/DELETE /api/exam-bank/session` diverifikasi aktif via curl di server port 3001.
  4. DOM Overflow probe via `browser_exec`:
     - Desktop 1920x1080: 0 horizontal overflow elements (`getBoundingClientRect().right > vw + 1` = 0).
     - Mobile 390x844: 0 horizontal overflow elements (`getBoundingClientRect().right > vw + 1` = 0).
  5. Screenshots tersimpan di:
     - `.agents/evidence/TASK-073-desktop-cbt-cloud-sync-1920x1080.png`
     - `.agents/evidence/TASK-073-mobile-cbt-cloud-sync-390x844.png`
