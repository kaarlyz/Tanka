# TASK: TASK-KATEX-CHAT-002
## STATUS
READY

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Assigned: MARAKA (maraka)
- Reviewer: AURA (gikano)
- Authority: Eka

## OBJECTIVE
1. Implementasi Self-Healing KaTeX Rendering Pipeline agar semua rumus (delimiters LaTeX `\(`, `\[`, lingkungan `\begin{aligned}`, pipa tabel `|`, dan CSS lokal) ter-render 100% konsisten tanpa perlu pelaporan manual.
2. Perbaiki ketahanan koneksi AI pada Tanya Nara (`useChat.ts` & `server/routes/chat.js`) agar tidak gagal timeout saat menggunakan model berat/Cloudflare tunnel dan memberikan penanganan error yang jelas dan ramah.

## SCOPE
1. Buat `src/utils/mathNormalizer.ts`:
   - Fungsi `normalizeMathExpression(text: string): string`:
     * Ubah `\\(` dan `\\)` menjadi `$`.
     * Ubah `\\[` dan `\\]` menjadi `$$\n...\n$$`.
     * Deteksi lingkungan `\\begin{(aligned|cases|matrix|pmatrix|bmatrix)}...\\end{...}` yang tidak dibungkus `$$`, otomatis bungkus dengan `$$\n...\n$$`.
     * Proteksi pipa tabel: jika teks mengandung baris tabel `| ... |`, ganti karakter `|` di dalam ekspresi `$ ... $` atau `$$ ... $$` menjadi `\\vert ` agar tabel GFM tidak terbelah/rusak.
     * Normalisasi baris baru di dalam inline math `$ ... $`.
2. Update `src/components/common/MathView.tsx`:
   - Import dan gunakan `normalizeMathExpression`.
   - Hapus pembatas kaku `[^\$\n]` agar inline math dengan enter tetap ter-render.
   - Hapus guard `<>` yang memblokir rendering pangkat setelah KaTeX span pertama terbuat.
3. Update `src/main.tsx`:
   - Tambahkan `import "katex/dist/katex.min.css";` agar styling KaTeX di-bundle lokal oleh Vite (tahan offline/PWA, tidak bergantung CDN semata).
4. Update `src/components/tabs/SummaryTab.tsx` & `src/components/tabs/MaterialTab.tsx`:
   - Pastikan teks markdown melewati `normalizeMathExpression` sebelum masuk ke `ReactMarkdown`.
5. Update `src/hooks/useChat.ts`:
   - Batasi riwayat chat yang dikirim ke server maksimal 10 pesan (bukan 20) agar payload ringkas dan tidak memicu timeout 100s Cloudflare.
   - Tangani respons non-JSON (misal Cloudflare HTML 524/502) dengan aman: baca text dulu, parse JSON dengan aman. Jika status tidak ok, tampilkan pesan ramah: "Server AI sedang sibuk atau respon melebihi batas waktu. Silakan kirim ulang."
6. Update `server/routes/chat.js`:
   - Tambahkan `try ... catch` pada `callRouter` dengan fallback otomatis ke `ag/gemini-3.8-flash-low` jika model yang dipilih user gagal atau timeout.
   - Tambahkan log diagnostik: `console.log("[Chat-Nara] Menerima pesan chat...")`.
7. Buat test unit di `tests/mathNormalizer.test.js`:
   - Uji normalisasi delimiter `\(`, `\[`, tabel math dengan pipa `|`, dan lingkungan `\begin{aligned}`.

## NON-GOALS
- Jangan mengubah skema database SQLite.
- Jangan mengubah autentikasi user.

## ACCEPTANCE CRITERIA
- [ ] `src/utils/mathNormalizer.ts` terbuat dan mengekspor `normalizeMathExpression`.
- [ ] `tests/mathNormalizer.test.js` dibuat dan lulus 100%.
- [ ] `katex/dist/katex.min.css` diimpor di `src/main.tsx`.
- [ ] `MathView.tsx` dan `SummaryTab.tsx` memakai `normalizeMathExpression`.
- [ ] `useChat.ts` dan `server/routes/chat.js` memiliki safe error handling & logging.
- [ ] `npm run build` sukses 100%.
- [ ] `npm test` lolos semua tes tanpa regresi.

## VERIFICATION COMMANDS
- `npm run build`
- `npm test`
