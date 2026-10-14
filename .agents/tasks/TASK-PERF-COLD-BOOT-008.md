# TASK: TASK-PERF-COLD-BOOT-008
## STATUS
ACCEPTED & VERIFIED

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `index.html`
  - `src/App.tsx`
  - `server/routes/models.js`
  - `server/routes/documents.js`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE
Optimalkan kecepatan muat awal (cold boot & initial page load) Tanka di perangkat mobile/tunnel hingga di bawah 1 detik tanpa menurunkan kualitas render KaTeX atau memperlambat pembukaan materi bab.

---

## 2. LATAR BELAKANG & AUDIT FORENSIK (AKAR MASALAH)
1. **KaTeX & Markdown Ter-bundle ke Halaman Awal**:
   - `MaterialTab` di-import statis di `src/App.tsx`. Vite menyertakan `vendor-katex` (508 kB) dan `vendor-markdown` (172 kB) ke dalam `<link rel="modulepreload">` di `index.html`. Browser mobile mengunduh 1.13 MB JS sebelum halaman Beranda tampil.
2. **Double Load & Render-Blocking CSS KaTeX**:
   - Di `<head>` `index.html`, terdapat `<link rel="stylesheet" href="https://cdn.jsdelivr.net/.../katex.min.css">`. Padahal KaTeX CSS sudah di-bundle lokal oleh Vite. Jaringan mobile harus handshake TLS ke CDN eksternal sebelum First Contentful Paint.
3. **Latensi Blocking API `/api/models`**:
   - Tiap kali halaman dibuka, server Tanka memanggil live HTTP ke upstream router eksternal tanpa in-memory cache (latensi 328 ms).
4. **Ukuran JSON Dokumen Mentah Tanpa Gzip**:
   - Endpoint `GET /api/documents` mengirim 358 kB JSON teks mentah tanpa kompresi gzip. Di koneksi tunnel mobile, 358 kB memakan waktu transfer 1-2 detik.

---

## 3. SPESIFIKASI IMPLEMENTASI (FOR MARAKA)

### A. Hapus Render-Blocking CDN KaTeX di `index.html`
Hapus baris:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" />
```
*(Catatan: Jangan sentuh Google Fonts; KaTeX CSS lokal sudah di-impor di `src/main.tsx`).*

### B. Lazy-Load `MaterialTab` + Idle Prefetch di `src/App.tsx`
1. Ganti import statis `MaterialTab` menjadi:
   ```tsx
   const MaterialTab = lazy(() =>
     import("./components/tabs/MaterialTab").then((m) => ({ default: m.MaterialTab }))
   );
   ```
2. Bungkus penggunaan `<MaterialTab ... />` di dalam `<Suspense fallback={<TabFallbackSkeleton />}>`.
3. Pasang **Idle Prefetch** agar chunk KaTeX dan MaterialTab diunduh diam-diam di latar belakang setelah Beranda selesai tampil (sehingga saat user klik *"Baca Materi"*, modul sudah ada di cache):
   ```tsx
   useEffect(() => {
     const prefetch = () => {
       import("./components/tabs/MaterialTab");
     };
     if (typeof window !== "undefined") {
       if ("requestIdleCallback" in window) {
         const id = (window as any).requestIdleCallback(prefetch, { timeout: 2500 });
         return () => (window as any).cancelIdleCallback(id);
       } else {
         const timer = setTimeout(prefetch, 800);
         return () => clearTimeout(timer);
       }
     }
   }, []);
   ```

### C. In-Memory Cache untuk `/api/models` di `server/routes/models.js`
Tambahkan cache 5 menit agar tidak memanggil router eksternal setiap reload halaman:
```javascript
let cachedModels = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

// Di dalam handleModelsRoutes:
if (req.method === "GET" && pathname === "/api/models") {
  if (cachedModels && (Date.now() - lastFetchTime < CACHE_TTL)) {
    return sendJSON(res, cachedModels);
  }
  try {
    const resp = await fetch(`${ROUTER_URL}/models`, {
      headers: { Authorization: `Bearer ${ROUTER_KEY}` },
    });
    const data = await resp.json();
    cachedModels = data;
    lastFetchTime = Date.now();
    return sendJSON(res, data);
  } catch (err) {
    if (cachedModels) return sendJSON(res, cachedModels);
    return sendJSON(res, { models: ["ag/gemini-3.8-flash-low"] });
  }
}
```

### D. Kompresi Gzip untuk `GET /api/documents` di `server/routes/documents.js`
Gunakan Node stdlib `zlib.gzipSync` khusus untuk endpoint dokumen (JANGAN terapkan ke endpoint streaming `/api/chat`):
```javascript
const zlib = require("zlib");

// Pada handler GET /api/documents:
if (req.method === "GET" && pathname === "/api/documents") {
  const docs = db.prepare("SELECT * FROM documents ORDER BY created_at DESC").all();
  const acceptEncoding = req.headers["accept-encoding"] || "";
  if (acceptEncoding.includes("gzip")) {
    const jsonStr = JSON.stringify({ ok: true, success: true, documents: docs });
    const compressed = zlib.gzipSync(Buffer.from(jsonStr));
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Encoding": "gzip",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    });
    return res.end(compressed);
  }
  return sendJSON(res, { documents: docs });
}
```

---

## 4. ACCEPTANCE CRITERIA
- [ ] Render-blocking CDN jsDelivr KaTeX dihapus dari `<head>` `index.html`.
- [ ] `MaterialTab` di-load via `React.lazy()` dengan `<Suspense>` dan idle prefetch.
- [ ] Initial bundle entry pada `index.html` TIDAK LAGI mem-preload KaTeX/Markdown saat baru buka Beranda.
- [ ] `/api/models` mengembalikan cache seketika (< 5 ms).
- [ ] `/api/documents` mengembalikan gzip JSON terkompresi (~45 kB) saat header `Accept-Encoding: gzip` dikirim.
- [ ] Chat AI streaming tetap lancar tanpa buffering.
- [ ] Seluruh unit & integration test lolos 100% (`npm test` -> 83/83 passing).
- [ ] DILARANG melakukan `git push` ke remote GitHub.

---

## 5. VERIFICATION COMMANDS
```bash
npm run build
env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js
```
