# TASK: TASK-PERF-TAB-KEEPALIVE-BROTLI-036
## STATUS
ACCEPTED

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Mode: ARCHITECTURE & ENGINEERING SPECIFICATION (Performance & Responsiveness)
- Target Files:
  - `src/App.tsx` (Tab Keep-Alive Container)
  - `server.js` (HTTP Brotli Compression via node:zlib)
  - `tests/serverCompression.test.js` (Automated Verification for Compression)
- Assigned Architect & Auditor: AURA (gikano)
- Assigned Builder & Executor: MARAKA (maraka)
- Manager: Vallencia (default)
- Authority: Eka Restu Syahputra (`kaarlyz`)
- Date: 2026-10-15

---

## 1. OBJECTIVE & ROOT CAUSE ANALYSIS

Berdasarkan audit empiris `TASK-PERF-BASELINE-AUDIT-017`:
1. **Remounting KaTeX & Markdown AST (Stutter 200–400ms di Mobile)**:
   Di `src/App.tsx`, tab konten dirender kondisional:
   `{activeTab === "material" && <MaterialTab ... />}`
   Setiap kali pengguna berpindah antar tab (Home -> Material -> Quiz), komponen `MaterialTab` di-unmount dan di-remount dari nol. Hal ini memaksa React mengurai ulang Markdown AST dan ribuan node rumus KaTeX, menghasilkan jank layout terukur di HP.
   **Solusi:** Terapkan mekanisme Keep-Alive di mana tab yang sudah dimuat (`visitedTabs`) tetap berada di DOM dengan styling visibility/display toggle (`display: activeTab === key ? "block" : "none"`), sehingga perpindahan tab kembali ke Materi berlangsung instan 0ms tanpa re-render pohon KaTeX.

2. **Kompresi HTTP Brotli (`server.js`)**:
   `server.js` saat ini hanya mendukung `gzip`.
   **Solusi:** Tambahkan dukungan kompresi Brotli (`node:zlib` `createBrotliCompress`) saat client mengirimkan header `Accept-Encoding: br`. Brotli menghasilkan ukuran transfer 15–20% lebih hemat daripada Gzip untuk file JS dan CSS di jaringan seluler.

---

## 2. DETAILED IMPLEMENTATION SPECIFICATION

### A. `src/App.tsx` — Tab Keep-Alive Container
1. **State `visitedTabs`**:
   Tambahkan state pelacak tab yang sudah pernah dikunjungi:
   ```tsx
   const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>(() => ({
     [activeTab]: true,
   }));

   useEffect(() => {
     if (activeTab && activeTab !== "landing") {
       setVisitedTabs((prev) => (prev[activeTab] ? prev : { ...prev, [activeTab]: true }));
     }
   }, [activeTab]);
   ```
2. **Reset saat Logout**:
   Di dalam `handleLogoutWithReset`, reset `visitedTabs` ke `{ home: true }` untuk mencegah kebocoran state sesi antar pengguna.
3. **Keep-Alive Tab Panels**:
   Di dalam `<div className="content-scroll" ...>`, bungkus setiap tab panel dengan wrapper:
   ```tsx
   {visitedTabs["home"] && (
     <div
       role="tabpanel"
       id="tabpanel-home"
       aria-labelledby="tab-home"
       style={{ display: activeTab === "home" ? "block" : "none" }}
     >
       <HomeHubTab ... />
     </div>
   )}
   ```
   Lakukan hal yang sama untuk seluruh tab di dalam `<Suspense>`:
   - `visitedTabs["material"] && <div role="tabpanel" id="tabpanel-material" style={{ display: activeTab === "material" ? "block" : "none" }}><MaterialTab ... /></div>`
   - `visitedTabs["quiz"] && <div role="tabpanel" id="tabpanel-quiz" style={{ display: activeTab === "quiz" ? "block" : "none" }}><QuizTab ... /></div>`
   - `visitedTabs["mistakes"] && <div role="tabpanel" id="tabpanel-mistakes" style={{ display: activeTab === "mistakes" ? "block" : "none" }}><MistakesTab ... /></div>`
   - `visitedTabs["feynman"] && <div role="tabpanel" id="tabpanel-feynman" style={{ display: activeTab === "feynman" ? "block" : "none" }}><FeynmanTab ... /></div>`
   - `visitedTabs["flashcards"] && <div role="tabpanel" id="tabpanel-flashcards" style={{ display: activeTab === "flashcards" ? "block" : "none" }}><FlashcardsTab ... /></div>`
   - `visitedTabs["summary"] && <div role="tabpanel" id="tabpanel-summary" style={{ display: activeTab === "summary" ? "block" : "none" }}><SummaryTab ... /></div>`

### B. `server.js` — HTTP Brotli Compression
1. Di `server.js`, pada handler static file serving dan SPA index.html fallback:
   - Deteksi `accept-encoding`:
     ```js
     const acceptEncoding = (req.headers && req.headers["accept-encoding"]) || "";
     const useBr = isCompressible && /\bbr\b/.test(acceptEncoding);
     const useGzip = !useBr && isCompressible && /\bgzip\b/.test(acceptEncoding);
     ```
   - Jika `useBr`:
     ```js
     headers["Content-Encoding"] = "br";
     headers["Vary"] = "Accept-Encoding";
     if (req.method === "HEAD") {
       res.writeHead(200, headers);
       return res.end();
     }
     res.writeHead(200, headers);
     return fs.createReadStream(filePath).pipe(zlib.createBrotliCompress()).pipe(res);
     ```
   - Jika `useGzip`:
     Tetap menggunakan `zlib.createGzip()`.
   - Lakukan logika yang sama untuk index.html SPA fallback.

### C. `tests/serverCompression.test.js` — Automated Test Suite
Tambahkan test suite mandiri untuk menguji kompresi Brotli & Gzip di `server.js`:
- Request file static dengan `Accept-Encoding: br` menghasilkan header `Content-Encoding: br` dan dapat didekompresi dengan `zlib.brotliDecompressSync`.
- Request dengan `Accept-Encoding: gzip` menghasilkan `Content-Encoding: gzip`.
- Request dengan `Accept-Encoding: gzip, deflate, br` memprioritaskan `br`.
- Request tanpa header kompresi melayani raw file tanpa header `Content-Encoding`.

---

## 3. BOUNDED IMPLEMENTATION CONTRACT UNTUK MARAKA

```bash
maraka -z "Kerjakan implementasi performa TASK-PERF-TAB-KEEPALIVE-BROTLI-036 sesuai spesifikasi di .agents/tasks/TASK-PERF-TAB-KEEPALIVE-BROTLI-036.md:
1. Di src/App.tsx:
   - Tambahkan state visitedTabs dan sinkronisasi dengan activeTab.
   - Bungkus tab-tab utama (home, material, quiz, mistakes, feynman, flashcards, summary) dengan tabpanel container yang menggunakan display toggle: display: activeTab === key ? 'block' : 'none'.
   - Reset visitedTabs di handleLogoutWithReset.
2. Di server.js:
   - Tambahkan kompresi Brotli (zlib.createBrotliCompress) untuk file static dan index.html fallback jika Accept-Encoding mengandung 'br'.
   - Utamakan 'br' daripada 'gzip'. Tetap sediakan fallback ke gzip jika client hanya mendukung gzip.
   - Atur headers Content-Encoding dan Vary: Accept-Encoding secara tepat.
3. Di tests/serverCompression.test.js:
   - Buat test otomatis menggunakan node:test dan node:assert untuk memverifikasi serving static & index.html dengan kompresi br, gzip, dan raw fallback.
4. Verifikasi seluruh pengujian:
   - npm run build (wajib sukses <1s)
   - env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js (wajib seluruh test passing)
5. Zero visual and functional regression."
```

---

## 4. ACCEPTANCE CRITERIA
- [x] Tab `MaterialTab`, `QuizTab`, `SummaryTab`, dan `HomeHubTab` tidak di-unmount setelah pertama kali dibuka (State scroll & posisi membaca awet).
- [x] Ganti tab bolak-balik di ponsel tidak memicu re-render ulang pohon KaTeX (0ms stutter).
- [x] `server.js` melayani kompresi Brotli (`Content-Encoding: br`) jika didukung peramban, dengan fallback aman ke `gzip`.
- [x] `npm run build` sukses (<1s, actual 306ms).
- [x] `env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js` seluruh test lulus (85/85 pass).
- [x] Zero regression visual & fungsional.

---

## 5. INDEPENDENT AUDIT EVIDENCE (AURA)
1. **Automated Verification**:
   - `npm run build`: 306ms (0 error).
   - `tests/serverCompression.test.js`: 138ms (2/2 pass).
   - Full test suite: `tests/*.test.js`: 85/85 pass (56.4s).
2. **HTTP Live Server Benchmark (port 3001)**:
   - Asset: `dist/assets/AIProcessLoader-B-jnNF7-.js` (5.309 B raw).
   - `Content-Encoding: gzip`: 2.052 B.
   - `Content-Encoding: br`: 1.899 B (7.5% saving over gzip, 64.2% over raw).
3. **Keep-Alive Browser DOM Probe**:
   - Home -> Material -> Quiz -> Material.
   - Container keeps 3 panes mounted: active `display: block`, inactive `display: none`.
   - Re-entry latency: 1.00ms. Zero unmounting. All KaTeX math formula nodes stay in DOM.
   - Scroll position preserved via `tabScrollMap` and `useLayoutEffect`.
4. **Mobile 390px Viewport**:
   - Window horizontal scroll check: `hasHorizontalScroll: false` (htmlScrollWidth = 390px).
   - Evidence screenshots:
     - `.agents/evidence/perf-keepalive-desktop-1920x1080.png`
     - `.agents/evidence/perf-keepalive-mobile-390x844.png`
