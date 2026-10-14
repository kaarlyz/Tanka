# TASK: TASK-PERF-MOBILE-OPTIMIZATION-012
## STATUS
REVIEW_REQUIRED

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `server.js`
  - `public/sw.js`
  - `src/index.css`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE
Selesaikan 3 akar masalah laten performa mobile pada Tanka:
1. Kompresi streaming Gzip pada seluruh aset teks/JS/CSS statis di `server.js`.
2. Invalidation & auto-bust cache PWA ke `tanka-pwa-v2` dengan `self.clients.claim()` di `public/sw.js`.
3. Eliminasi animasi bab dan isolasi hover touchscreen di `src/index.css`.

---

## 2. LATAR BELAKANG & AKAR MASALAH
1. **Transfer Aset JS Mentah (~1 MB)**: File `vendor-katex.js` (509 KB), `vendor-react.js` (206 KB), dan `vendor-markdown.js` (172 KB) dikirim tanpa kompresi gzip di `server.js`, membebani latensi jaringan seluler via tunnel.
2. **Cache Service Worker Usang (`public/sw.js`)**: Versi cache `tanka-pwa-v1` menahan file lama di perangkat seluler tanpa auto-refresh aset ber-hash baru.
3. **Sisa Animasi & Hover Glitch**: Class `.chapter-content-fade` masih menjalankan animasi `chapterCrossfade 0.2s`, dan pseudo-class `button:hover { transform: translateY(-1.5px) }` aktif di layar sentuh sehingga tombol tampak tersangkut/loncat saat disentuh.

---

## 3. SPESIFIKASI IMPLEMENTASI (FOR MARAKA)

### A. Kompresi Gzip Streaming Bawaan di `server.js`
1. Gunakan modul bawaan Node.js `const zlib = require("node:zlib");` (atau `require("zlib")`).
2. Pada static file handler di `server.js` (sekitar baris 140-185):
   - Cek apakah client mengirim header `req.headers["accept-encoding"]` yang memuat `"gzip"`.
   - Cek apakah ekstensi file adalah teks kompresibel:
     ```javascript
     const isCompressible = [".js", ".css", ".html", ".json", ".svg"].includes(ext);
     const acceptEncoding = (req.headers && req.headers["accept-encoding"]) || "";
     const useGzip = isCompressible && acceptEncoding.includes("gzip");
     ```
   - Jika `useGzip`:
     - Set header `Content-Encoding: gzip`.
     - JANGAN set `Content-Length` (karena ukuran stream terkompresi berbeda dari `fileSize` disk) atau biarkan Node streaming chunked.
     - Pipe melalui `zlib.createGzip()`:
       ```javascript
       res.writeHead(200, headers);
       return fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(res);
       ```
   - Pastikan juga handling untuk fallback `index.html` (baris ~183) menggunakan gzip jika didukung.

### B. Upgrade Cache & Auto-Bust di `public/sw.js`
1. Tingkatkan `CACHE_NAME` menjadi:
   ```javascript
   const CACHE_NAME = "tanka-pwa-v2";
   ```
2. Pada event `install`:
   - Tambahkan `self.skipWaiting();` agar worker baru langsung aktif tanpa menunggu worker lama mati.
3. Pada event `activate`:
   - Pastikan semua cache yang bukan `tanka-pwa-v2` langsung dihapus via `caches.delete(cacheName)`.
   - Panggil `self.clients.claim();` agar service worker langsung mengontrol halaman aktif:
     ```javascript
     self.addEventListener("activate", (event) => {
       event.waitUntil(
         caches.keys().then((cacheNames) => {
           return Promise.all(
             cacheNames.map((cacheName) => {
               if (cacheName !== CACHE_NAME) {
                 return caches.delete(cacheName);
               }
             })
           );
         }).then(() => self.clients.claim())
       );
     });
     ```

### C. Pembersihan CSS Layar Sentuh di `src/index.css`
1. Nonaktifkan animasi `.chapter-content-fade`:
   ```css
   .chapter-content-fade {
     animation: none !important;
   }
   ```
2. Isolasi aturan `:hover` tombol agar HANYA berlaku di perangkat mouse/pointer (`@media (hover: hover) and (pointer: fine)`), bukan di layar sentuh mobile:
   ```css
   @media (hover: hover) and (pointer: fine) {
     button:hover:not(:disabled) {
       transform: translateY(-1.5px);
     }
     .home-docs-grid > div:hover {
       transform: translateY(-2.5px);
       box-shadow: 0 8px 24px rgba(24, 34, 31, 0.06);
     }
   }
   ```
   Hapus deklarasi `button:hover:not(:disabled)` yang berada di luar media query tersebut.
3. Pastikan seluruh tombol memiliki `touch-action: manipulation !important;` dan `-webkit-tap-highlight-color: transparent !important;`.

---

## 4. ACCEPTANCE CRITERIA
- [ ] Static asset handler di `server.js` mengembalikan `Content-Encoding: gzip` untuk `.js`, `.css`, `.html`, `.json`, `.svg` ketika client mengirim `Accept-Encoding: gzip`.
- [ ] Transfer asset vendor (`vendor-katex`, `vendor-react`, `vendor-markdown`) menyusut ~70% lewat jaringan.
- [ ] `public/sw.js` menggunakan cache name `tanka-pwa-v2`, membersihkan cache v1 di event `activate`, dan memanggil `self.clients.claim()`.
- [ ] `.chapter-content-fade` di-set `animation: none !important;` di `src/index.css`.
- [ ] `button:hover` diisolasi di dalam `@media (hover: hover) and (pointer: fine)`.
- [ ] `npm run build` berhasil tanpa error.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [ ] Uji curl `curl -I -H "Accept-Encoding: gzip" http://localhost:3001/assets/vendor-katex-*.js` mengembalikan `Content-Encoding: gzip`.
- [ ] DILARANG melakukan `git push` ke remote GitHub.

---

## 5. VERIFICATION COMMANDS
```bash
npm run build
env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js
systemctl --user restart tanka
curl -I -H "Accept-Encoding: gzip" http://localhost:3001/assets/vendor-katex-g6y2NZt4.js
```
