# TASK: TASK-CHAPTER-SMOOTH-PAGINATION-021
## MODE: VISUAL_PRODUCT & INTERACTION DESIGN
## SURFACE ARCHETYPE: Reading Canvas & Chapter Micro-Transition (Apple/Kindle Style)

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target File: `src/components/tabs/MaterialTab.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE SOLVED
Pengguna memberi arahan:
> *"sama aja, mungkin emg butuh jeda ya?"*

### Diagnosis Masalah:
1. **Ketiadaan Umpan Balik Sentuh (Zero Feedback)**:
   Saat tombol *"Lanjut ke Bab"* ditekan, tombol tidak memberikan perubahan status sama sekali (tidak ada teks memuat, tidak ada micro-spinner), membuat pengguna merasa tombol tidak bereaksi atau macet.
2. **Lonjakan Scroll Salah Sasaran**:
   Fungsi navigasi sebelumnya memanggil `scrollTop = 0` dan `window.scrollTo(0, 0)`, membanting pandangan pengguna jauh ke atas (ke kartu overview "Catatan Belajar", "Unggah Baru", "Salin"). Isi bab baru berada ~500px di bawah lipatan layar sehingga pengguna mengira halaman tidak berganti.
3. **Ketiadaan Motion Alami (Butuh Jeda Terarah ~250ms)**:
   Aplikasi membaca modern (Kindle, Apple Books, Linear) tidak membanting DOM dalam 0ms tanpa animasi. Mereka menyisipkan jeda mikro terarah 180ms–270ms agar mata pengguna punya jangkar visual yang nyaman saat lembar bab berganti.

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

Di file `src/components/tabs/MaterialTab.tsx`:

### A. State Transisi & Ref Penanda Bab
1. Tambahkan state dan ref:
   ```tsx
   const [isTransitioningChapter, setIsTransitioningChapter] = React.useState(false);
   const [targetChapterIdx, setTargetChapterIdx] = React.useState<number | null>(null);
   const readerCardRef = React.useRef<HTMLDivElement>(null);
   ```

2. Sematkan `ref={readerCardRef}` pada kartu pembaca utama:
   ```tsx
   <div className="reader-chapter-card" ref={readerCardRef}>
   ```

### B. Handler `handleSelectChapter` Beranimasi Halus
Perbarui fungsi `handleSelectChapter`:
```tsx
const handleSelectChapter = (idxOrFn: number | ((prev: number) => number)) => {
  const nextIdx = typeof idxOrFn === "function" ? idxOrFn(currentChapterIdx) : idxOrFn;
  if (nextIdx === currentChapterIdx || nextIdx < 0 || nextIdx >= chapters.length) return;

  setIsTransitioningChapter(true);
  setTargetChapterIdx(nextIdx);

  // 1. Scroll mulus terarah ke kartu judul bab (bukan membanting ke paling atas dokumen)
  const scrollContainer = document.querySelector(".content-scroll");
  const readerCard = readerCardRef.current || document.querySelector(".reader-chapter-card");
  if (readerCard && scrollContainer) {
    const topOffset = readerCard.getBoundingClientRect().top + scrollContainer.scrollTop - 40;
    scrollContainer.scrollTo({ top: Math.max(0, topOffset), behavior: "smooth" });
  }

  // 2. Jeda mikro fade-out 120ms
  setTimeout(() => {
    setCurrentChapterIdx(nextIdx);
    setMountedChapters((prev) => {
      const next = new Set(prev);
      next.add(nextIdx);
      if (nextIdx + 1 < chapters.length) next.add(nextIdx + 1);
      return next;
    });

    // 3. Fade-in bab baru dalam 150ms
    setTimeout(() => {
      setIsTransitioningChapter(false);
      setTargetChapterIdx(null);
    }, 150);
  }, 120);
};
```
*Catatan: Hapus pemanggilan `scrollContainer.scrollTop = 0; window.scrollTo(0, 0);` yang membanting viewport ke header teratas.*

### C. Animasi Kontainer Bab (`chapters-viewport`)
Bungkus kontainer bab dengan gaya transisi Apple:
```tsx
<div
  className="chapters-viewport"
  style={{
    maxWidth: 820,
    margin: "0 auto",
    opacity: isTransitioningChapter ? 0.2 : 1,
    transform: isTransitioningChapter ? "translateY(8px)" : "translateY(0)",
    transition: "opacity 0.14s cubic-bezier(0.16, 1, 0.3, 1), transform 0.14s cubic-bezier(0.16, 1, 0.3, 1)"
  }}
>
```

### D. Umpan Balik Tombol Navigasi Instan (0 ms)
Pada tombol footer *"Lanjut ke Bab"* (baris ~1235):
```tsx
{currentChapterIdx < chapters.length - 1 ? (
  <button
    disabled={isTransitioningChapter}
    onClick={() => {
      const chId = chapters[currentChapterIdx]?.id;
      if (chId) setCompletedChapters((prev) => ({ ...prev, [chId]: true }));
      handleSelectChapter((i) => Math.min(chapters.length - 1, i + 1));
    }}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 22px",
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 700,
      border: "none",
      backgroundColor: "#18221f",
      color: "#c8f064",
      cursor: isTransitioningChapter ? "wait" : "pointer",
      opacity: isTransitioningChapter ? 0.85 : 1,
      transform: isTransitioningChapter ? "scale(0.97)" : "none",
      transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: "0 2px 8px rgba(24, 34, 31, 0.12)"
    }}
  >
    {isTransitioningChapter ? (
      <>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: "#c8f064",
            display: "inline-block",
            animation: "pulse 1s infinite"
          }}
        />
        <span>Membuka Bab {(targetChapterIdx ?? currentChapterIdx + 1) + 1}...</span>
      </>
    ) : (
      <>
        <span>Lanjut ke Bab {currentChapterIdx + 2}</span>
        <ArrowRight size={14} />
      </>
    )}
  </button>
) : ...
```
Dan pada tombol `"← Bab Sebelumnya"`:
```tsx
<button
  disabled={currentChapterIdx === 0 || isTransitioningChapter}
  onClick={() => handleSelectChapter((i) => Math.max(0, i - 1))}
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 18px",
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 600,
    border: "1px solid #dce1da",
    backgroundColor: currentChapterIdx === 0 ? "#f4f6f2" : "#ffffff",
    color: currentChapterIdx === 0 ? "#a3ada8" : "#17201d",
    cursor: currentChapterIdx === 0 || isTransitioningChapter ? "not-allowed" : "pointer",
    opacity: isTransitioningChapter ? 0.6 : 1,
    transition: "all 0.15s ease"
  }}
>
  ← Bab Sebelumnya
</button>
```

---

## 3. ACCEPTANCE CRITERIA
- [ ] Klik *"Lanjut ke Bab"* langsung mengubah status tombol seketika (0 ms): menampilkan dot animasi dan label *"Membuka Bab X..."*.
- [ ] Kontainer bab melakukan fade-out lembut (120ms) dan fade-in mulus (150ms).
- [ ] Viewport scroll meluncur anggun (*smooth scroll*) mengarah ke kepala bab (`.reader-chapter-card`), bukan membanting ke puncak dokumen.
- [ ] Tidak ada lagi sensasi layar membeku / macet ("diem sesaat"). Transisi terasa organik dan sengaja dirancang layaknya Apple Books.
- [ ] `npm run build` sukses.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
