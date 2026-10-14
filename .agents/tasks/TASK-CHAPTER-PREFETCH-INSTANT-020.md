# TASK: TASK-CHAPTER-PREFETCH-INSTANT-020
## MODE: ENGINEERING
## SURFACE ARCHETYPE: Reader Pipeline & Zero-Latency Chapter Navigation

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target File: `src/components/tabs/MaterialTab.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pengguna melaporkan:
> *"pas pindah bab, dri bab 1 ke bab lain misal yg pake next itu dia kek pas dipencet tombolnya diem dlu, terus bru masuk, lumayan lama jedanya, kamu udh fix tadi katamu kenapa masih terasa lambat juga?"*

### Analisis Akar Masalah Nyata:
1. **`useTransition` Menunda Perpindahan Halaman**:
   Penggunaan `startChapterTransition` pada pergantian bab menyebabkan React sengaja menahan commit DOM. Layar tetap menampilkan Bab 1 lama dalam keadaan tombol teredup (`opacity: 0.75`) selama ~540ms hingga kompilasi Bab 2 selesai di background. Pengguna melihat halaman seolah "stuck/diem" sebelum tiba-tiba loncat.
2. **Cold Switch Destruction & Rebuild**:
   Pada kode saat ini, hanya 1 bab yang dirender ke DOM. Saat pindah ke bab berikutnya yang memuat 100+ formula matematika baru, React menghancurkan seluruh DOM lama lalu menyusun 2.750 node DOM baru secara sinkron di main thread saat tombol diklik.
3. **Solusi Definitif (Virtual Multi-Chapter Mounting & CSS Toggle)**:
   - Buat state `mountedChapters` (Set angka indeks bab). Saat dokumen dibuka, inisialisasi `{ 0, 1 }` (Bab 1 dan Bab 2 langsung ter-mount).
   - Di background (setelah 100ms idle), mount bab berikutnya (`currentChapterIdx + 1`).
   - Setiap bab yang sudah ter-mount disimpan di dalam pembungkus `<div style={{ display: isActive ? "block" : "none" }}>`.
   - Cabut `useTransition` dari `handleSelectChapter` agar `currentChapterIdx` berubah secara sinkron dan instan (0ms).
   - Efek: Saat pengguna mengklik "Lanjut ke Bab 2", Bab 2 **sudah ada di DOM**. Browser hanya mengubah `display: none` menjadi `display: block` dalam **0.1 ms (true instant page flip, 0 latency)**.

---

## 2. SPESIFIKASI IMPLEMENTASI

Di `src/components/tabs/MaterialTab.tsx`:

### A. Cabut `useTransition` dan Buat `mountedChapters`
1. Hapus:
   ```tsx
   const [isPendingChapter, startChapterTransition] = React.useTransition();
   ```
2. Tambahkan:
   ```tsx
   const [mountedChapters, setMountedChapters] = React.useState<Set<number>>(() => new Set([0, 1]));

   // Reset saat dokumen berganti
   React.useEffect(() => {
     setMountedChapters(new Set([0, 1]));
   }, [activeDocId]);

   // Background pre-mount bab berikutnya saat idle
   React.useEffect(() => {
     const nextIdx = currentChapterIdx + 1;
     if (nextIdx < chapters.length && !mountedChapters.has(nextIdx)) {
       const timer = setTimeout(() => {
         setMountedChapters((prev) => {
           const next = new Set(prev);
           next.add(nextIdx);
           return next;
         });
       }, 150);
       return () => clearTimeout(timer);
     }
   }, [currentChapterIdx, chapters.length, mountedChapters]);
   ```
3. Sederhanakan `handleSelectChapter` menjadi instan:
   ```tsx
   const handleSelectChapter = (idx: number | ((prev: number) => number)) => {
     const scrollContainer = document.querySelector(".content-scroll");
     if (scrollContainer) scrollContainer.scrollTop = 0;
     window.scrollTo(0, 0);

     setCurrentChapterIdx(idx);
   };
   ```

### B. Render Chapters dengan CSS Toggle Container
Ganti blok reader tunggal:
```tsx
{/* Literary Reader Markdown Body */}
<div className="chapters-viewport" style={{ maxWidth: 820, margin: "0 auto" }}>
  {chapters.map((ch, idx) => {
    const isMounted = mountedChapters.has(idx) || idx === currentChapterIdx;
    if (!isMounted) return null;

    const isActive = idx === currentChapterIdx;
    return (
      <div
        key={`chapter-pane-${ch.id ?? idx}`}
        style={{
          display: isActive ? "block" : "none"
        }}
      >
        <MemoizedMarkdownBody
          className="markdown-body book-reader"
          content={ch.content || ""}
          components={markdownComponents}
        />
      </div>
    );
  })}
</div>
```

### C. Bersihkan Sisa `isPendingChapter` pada Tombol
- Cabut properti `disabled={isPendingChapter}`, `cursor: isPendingChapter ? "wait" : ...`, dan `opacity: isPendingChapter ? 0.75 : 1` pada tombol:
  - Tombol `< 1/5 >` di header strip
  - Tombol drawer bab
  - Tombol `← Bab Sebelumnya` di footer
  - Tombol `Lanjut ke Bab X →` di footer
Semua tombol kembali bersih, aktif, dan merespons klik seketika tanpa jeda semu.

---

## 3. ACCEPTANCE CRITERIA
- [ ] Tombol ganti bab merespons seketika tanpa jeda `startTransition`.
- [ ] Bab berikutnya sudah ter-mount di background (`display: none`).
- [ ] Pergantian bab saat diklik berjalan instan (< 5ms) melalui CSS display toggle.
- [ ] Navigasi bolak-balik antar bab yang sudah dibuka berjalan 0 ms.
- [ ] `npm run build` sukses.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
