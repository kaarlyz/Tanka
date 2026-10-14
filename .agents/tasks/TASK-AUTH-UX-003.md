# TASK: TASK-AUTH-UX-003
## STATUS
VERIFIED

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Assigned: MARAKA (maraka)
- Reviewer: AURA (gikano)
- Authority: Eka

## OBJECTIVE
Sempurnakan UX holistik pada modal autentikasi (`AuthModal.tsx`), perbaiki layout tombol tutup, eliminasi navigasi ganda, dan tingkatkan batas keamanan minimal password menjadi standar 8 karakter (frontend & backend).

## SCOPE
1. **Eliminasi Navigasi Dobel**:
   - Hilangkan ambiguitas dua pengalih mode di layar yang sama.
   - Pilih satu pola tunggal yang bersih (Rekomendasi Pola Linear/Supabase):
     * Hapus bilah segmented tab bar `[ Masuk | Daftar Akun ]` di atas form (menghemat 45px vertical height, dialog lebih lapang).
     * Judul modal berubah dinamis: "Masuk ke Akun" vs "Buat Akun Baru".
     * Pengalihan mode dipusatkan murni pada link footer bawah yang kontekstual:
       - Mode Masuk: "Belum punya akun? Daftar gratis"
       - Mode Daftar: "Sudah punya akun? Masuk di sini"
2. **Pelegaan & Target Sentuh Tombol Tutup (`✕`)**:
   - Posisikan tombol close secara optis sejajar dengan header (`top: 20px; right: 20px`).
   - Berikan ukuran target sentuh yang nyaman: `width: 36px; height: 36px; border-radius: 10px; background: #f4f6f2;` dengan transisi hover/active agar tidak mepet ke sudut luar dialog.
3. **Peningkatan Keamanan Password (Standar OWASP/NIST Minimal 8 Karakter)**:
   - Backend `server/routes/auth.js`: perbarui validasi register dari `password.length < 4` menjadi `password.length < 8` dengan pesan error: `"Password minimal 8 karakter demi keamanan akun"`.
   - Frontend `src/hooks/useAuth.ts`: tambahkan validasi client-side `authPassword.trim().length < 8` sebelum fetch.
   - Frontend `src/components/modals/AuthModal.tsx`: perbarui label helper text dan placeholder menjadi `"Minimal 8 karakter"`.

## NON-GOALS
- Jangan mengubah struktur tabel `users` di database SQLite.
- Jangan mengubah sesi auth yang sudah tersimpan di localStorage.

## ACCEPTANCE CRITERIA
- [x] Navigasi ganda tereliminasi: hanya ada satu cara bersih untuk berganti mode (link kontekstual di bawah).
- [x] Tombol tutup memiliki breathing room nyaman (`top: 20px, right: 20px`, ukuran 36x36px).
- [x] Pendaftaran dengan password < 8 karakter ditolak dengan pesan error yang jelas di client dan server.
- [x] `npm run build` sukses 100%.
- [x] `npm test` lolos semua tes tanpa regresi.

## VERIFICATION COMMANDS
- `npm run build`
- `npm test`

## VERIFICATION RESULTS
- `npm test`: 83 passed, 0 failed (termasuk 4 tes baru pada `tests/auth.test.js` untuk rute autentikasi dan validasi password).
- `npm run build`: vite build sukses 100% tanpa error.

