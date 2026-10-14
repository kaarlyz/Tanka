# TASK-PERF-MOBILE-OPTIMIZATION-012: Kompresi Gzip Server, Invalidation Service Worker, dan Eliminasi Touch Jank

## 1. Konteks & Akar Masalah
Pengujian di perangkat seluler via Cloudflare tunnel mengidentifikasi tiga hambatan performa utama:
1. **Transfer Aset JS Mentah (~1 MB)**: File `vendor-katex.js` (509 KB), `vendor-react.js` (206 KB), dan `vendor-markdown.js` (172 KB) dikirim tanpa kompresi gzip di `server.js`, membebani latensi jaringan seluler.
2. **Cache Service Worker Usang (`sw.js`)**: Versi cache `tanka-pwa-v1` menahan file lama di perangkat seluler tanpa auto-refresh aset ber-hash baru.
3. **Sisa Animasi & Hover Glitch**: Class `.chapter-content-fade` masih menjalankan animasi `chapterCrossfade 0.2s`, dan pseudo-class `button:hover { transform: translateY(-1.5px) }` aktif di layar sentuh sehingga tombol tampak tersangkut/loncat saat disentuh.

## 2. Sasaran & Spesifikasi Implementasi
1. **Kompresi Gzip Bawaan di `server.js`**:
   - Gunakan modul bawaan Node.js `node:zlib`.
   - Pada static file handler di `server.js`, cek header `req.headers["accept-encoding"]`.
   - Jika mendukung `gzip` dan file bertipe teks (`.js`, `.css`, `.html`, `.json`, `.svg`), kompres stream dengan `zlib.createGzip()` dan tambahkan header `Content-Encoding: gzip`. Hapus atau sesuaikan `Content-Length`.
2. **Upgrade Cache & Auto-Bust di `public/sw.js`**:
   - Tingkatkan versi cache ke `tanka-pwa-v2`.
   - Pastikan pada event `activate`, seluruh cache selain versi aktif langsung dihapus via `caches.delete()`.
   - Panggil `self.clients.claim()` agar worker baru langsung mengendalikan klien tanpa perlu tutup tab.
3. **Pembersihan CSS Layar Sentuh**:
   - Nonaktifkan animasi `.chapter-content-fade` (`animation: none !important;`).
   - Isolasi aturan `:hover` tombol agar hanya berlaku di perangkat dengan mouse/pointer:
     ```css
     @media (hover: hover) and (pointer: fine) {
       button:hover:not(:disabled) {
         transform: translateY(-1.5px);
       }
     }
     ```
   - Pastikan seluruh tombol navigasi mobile memiliki `touch-action: manipulation !important;`.
4. **Verifikasi Kualitas**:
   - `npm run build` sukses.
   - `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
   - Restart `systemctl --user restart tanka`.
   - Uji via `curl -I -H "Accept-Encoding: gzip" http://localhost:3001/assets/vendor-katex-*.js` -> wajib mengembalikan `Content-Encoding: gzip`.
5. **Batasan Mutlak**:
   - DILARANG `git push` ke remote GitHub!
