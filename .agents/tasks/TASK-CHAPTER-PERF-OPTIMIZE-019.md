# TASK: TASK-CHAPTER-PERF-OPTIMIZE-019
## MODE: ENGINEERING
## SURFACE ARCHETYPE: Reader & Chapter Performance Acceleration

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target Files:
  - `src/utils/katexCache.ts` (new file)
  - `src/main.tsx`
  - `src/components/tabs/MaterialTab.tsx`
  - `src/hooks/useDocuments.ts`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE
Menghilangkan freeze / delay ("diem sesaat") saat membuka materi dan berpindah bab pada pembaca buku Tanka (`MaterialTab.tsx` & `useDocuments.ts`).
Metrik baseline saat ini:
- Long task switching bab: **459ms** (terkunci total di main thread pada 405 formula KaTeX).
- Total delay mutasi DOM: **391.9ms**.
- Rendundansi double render pass saat membuka dokumen dari beranda.

Target perbaikan:
1. **KaTeX In-Memory Formula Cache**: Pasang LRU memory cache pada `katex.renderToString` agar 400+ formula matematika identik/sering muncul langsung diambil dalam $O(1)$ tanpa kompilasi ulang AST.
2. **Eliminasi Double Render di `useDocuments.ts`**: Hindari memanggil `setActiveDocContent` ulang dari hasil `fetch('/api/documents/:id')` jika isinya sudah identik dengan `local.content`.
3. **Concurrent Chapter Transition (`useTransition`) & Tactile Feedback**:
   - Bungkus `setCurrentChapterIdx` di dalam `startChapterTransition`.
   - Berikan feedback sentuh seketika (0ms) pada tombol bab (`opacity: 0.7` saat pending) dan reader container (`opacity: isPendingChapter ? 0.65 : 1`), sehingga layar tidak pernah "mati/freeze".
4. **Bypass Virtual DOM Reconciliation Thrashing**:
   - Pasang `key={`ch-body-${chapters[currentChapterIdx]?.id ?? currentChapterIdx}`}` pada `MemoizedMarkdownBody` agar React langsung mengganti container tanpa membandingkan 2.753 node DOM secara rekursif.
5. **Eliminasi Double Math Normalization**:
   - Ganti `normalizeMathExpression(sanitizeMathMarkdown(content))` menjadi cukup `sanitizeMathMarkdown(content)` karena fungsi tersebut sudah memanggil normalizer di baris pertamanya.

---

## 2. DETAIL SPESIFIKASI TEKNIS

### A. Buat `src/utils/katexCache.ts` & Impor di `src/main.tsx`
Buat file `src/utils/katexCache.ts`:
```ts
import katex from "katex";

const katexCache = new Map<string, string>();
const originalRenderToString = katex.renderToString;

if (!(katex as any).__cached) {
  (katex as any).__cached = true;
  katex.renderToString = function (tex: string, options?: any): string {
    const key = `${options?.displayMode ? "D:" : "I:"}${tex}`;
    const cached = katexCache.get(key);
    if (cached !== undefined) return cached;

    const rendered = originalRenderToString.call(katex, tex, options);
    if (katexCache.size < 8000) {
      katexCache.set(key, rendered);
    }
    return rendered;
  };
}

export { katexCache };
```
Di `src/main.tsx`, tambahkan:
```ts
import "./utils/katexCache";
```

### B. Optimasi `src/hooks/useDocuments.ts` (Cegah Double Render)
Pada fungsi `loadDocument`:
```ts
    try {
      const res = await fetch(`/api/documents/${targetId}`);
      const data = await res.json();
      if (data.document) {
        setActiveDocId(data.document.id);
        if (data.document.title && data.document.title !== local?.title) {
          setActiveDocTitle(data.document.title);
        }
        // Cegah re-render berat jika isi konten sama persis dengan yang sudah dimuat di memori
        if (data.document.content && data.document.content !== local?.content) {
          setActiveDocContent(data.document.content);
        }
        if (data.document.summary && data.document.summary !== local?.summary) {
          setActiveDocSummary(data.document.summary);
        }
        if (!local) {
          if (callback) callback(data.document);
          if (onDocumentLoaded) onDocumentLoaded(data.document);
        }
```

### C. Optimasi `src/components/tabs/MaterialTab.tsx`
1. **Gunakan `useTransition` untuk Navigasi Bab**:
   ```tsx
   const [isPendingChapter, startChapterTransition] = React.useTransition();

   const handleSelectChapter = (idx: number | ((prev: number) => number)) => {
     const scrollContainer = document.querySelector(".content-scroll");
     if (scrollContainer) scrollContainer.scrollTop = 0;
     window.scrollTo(0, 0);

     startChapterTransition(() => {
       setCurrentChapterIdx(idx);
     });
   };
   ```
2. **Pangkas Double Normalization di `MemoizedMarkdownBody`**:
   ```tsx
   const MemoizedMarkdownBody = React.memo(function MemoizedMarkdownBody({
     content,
     components,
     className,
     style
   }: MemoizedMarkdownBodyProps) {
     const sanitized = React.useMemo(() => sanitizeMathMarkdown(content), [content]);
     return (
       <div className={className} style={style}>
         <ReactMarkdown
           remarkPlugins={STATIC_REMARK_PLUGINS}
           rehypePlugins={STATIC_REHYPE_PLUGINS}
           components={components}
         >
           {sanitized}
         </ReactMarkdown>
       </div>
     );
   });
   ```
3. **Bungkus Body dengan Key Dinamis & Indikator Halus**:
   ```tsx
   {/* Literary Reader Markdown Body */}
   <div style={{ opacity: isPendingChapter ? 0.65 : 1, transition: "opacity 0.15s ease" }}>
     <MemoizedMarkdownBody
       key={`chapter-body-${chapters[currentChapterIdx]?.id ?? currentChapterIdx}`}
       className="markdown-body book-reader"
       content={chapters[currentChapterIdx]?.content || ""}
       components={markdownComponents}
     />
   </div>
   ```
4. **Berikan Feedback Visual pada Tombol Navigasi Bab**:
   Pada tombol "Lanjut ke Bab" dan "Bab Sebelumnya", berikan style:
   ```tsx
   disabled={isPendingChapter}
   style={{
     ...
     opacity: isPendingChapter ? 0.75 : 1,
     cursor: isPendingChapter ? "wait" : "pointer"
   }}
   ```

---

## 3. ACCEPTANCE CRITERIA
- [ ] Kompilasi KaTeX menggunakan LRU in-memory cache (`src/utils/katexCache.ts`).
- [ ] Navigasi bab menggunakan `useTransition` dan memberikan respons tactile instan 0ms.
- [ ] `MemoizedMarkdownBody` memiliki `key` unik per bab untuk bypass virtual DOM tree reconciliation thrashing.
- [ ] Double normalization regex di `MemoizedMarkdownBody` dieliminasi.
- [ ] `useDocuments.ts` tidak melakukan double-render `setActiveDocContent` jika konten hasil fetch sama dengan data lokal.
- [ ] Kualitas visual dan keutuhan rumus KaTeX 100% terjaga tanpa distorsi.
- [ ] `npm run build` berhasil tanpa error TypeScript.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
