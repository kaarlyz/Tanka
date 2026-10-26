# TASK-CBT-DRILL-PERSISTENCE-AND-STANDARD-UIUX-085

## Context & User Feedback
Eka menemukan dua kendala arsitektural dan UX kritis saat menggunakan CBT Tanka:
1. **Drill Persistence Bug:** Hasil drill Bahasa Inggris (dan pengerjaan paket drill) tidak tersimpan ke riwayat AI Drill / bank riwayat latihan, sehingga progres drill hilang dan tidak tersinkronisasi.
2. **CBT UI/UX Standard Overhaul:** Tampilan antarmuka CBT saat ini dinilai kurang merefleksikan standar website CBT resmi (terlalu menyerupai kartu berantakan dengan filterisasi biasa). Eka menginstruksikan perombakan UI/UX agar mengikuti standar resmi CBT Pusmendik/ANBK/UTBK: tata letak terstruktur berbasis opsi yang elegan, nomor soal dan navigasi bersih, eliminasi kesan card berantakan, dan hierarki visual yang tajam (anti-slop).

## Objectives for AURA (@gikano_bot) & MARAKA (@kavvanaa_bot)
1. **Investigasi & Fix Drill Persistence (AI Drill History & Storage):**
   - Audit alur simpan hasil drill di `ExamCbtTab.tsx` dan backend `/api/exam-bank/*`:
     * Pastikan setiap jawaban drill di-commit ke `learner_events`, `cbt_active_sessions`, atau `exam_bank_items` / riwayat kuis lokal/server.
     * Pastikan paket drill hasil AI atau paket reguler otomatis tercatat di AI Drill history / Mistake Notebook tanpa data drop.
     * Sediakan mekanisme fallback local-storage + SQLite sync agar jika offline/tunnel lag, progres tidak hilang.

2. **Perombakan Desain UI/UX Standar CBT (Pusmendik / UTBK Grade):**
   - Ganti tampilan card bertumpuk dengan tata letak baku CBT:
     * **Area Soal & Stimulus:** Pembagian dua panel (Split Panel Wacana di kiri / atas untuk mobile, Pertanyaan & Opsi di kanan / bawah) atau layout fokus terstruktur.
     * **Pilihan Jawaban Berbasis Opsi (Option-Centric Design):** Baris opsi pilihan ganda A, B, C, D, E yang clean, keyboard-accessible (A-E), dengan indikator radio bulat/kotak khas CBT resmi, bukan card chunky acak.
     * **Panel Navigasi Soal (Number Grid Palette):** Grid nomor soal standar (Hijau = Dijawab, Kuning = Ragu/Tinjau, Abu-abu = Belum Dijawab) dengan lompatan instan.
     * **Bottom Action Bar:** Tombol `[Sebelumnya]`, `[Ragu-Ragu]`, `[Berikutnya / Selesai]` yang konsisten di fixed bottom rail.

3. **Verifikasi & Quality Gate:**
   - Run unit test & build check: `npm run build` wajib 0 error.
   - Audit rendering di viewport mobile (390px) dan desktop (1080p).
   - Pastikan KaTeX rendering tetap 100% terjaga di seluruh komponen baru.
