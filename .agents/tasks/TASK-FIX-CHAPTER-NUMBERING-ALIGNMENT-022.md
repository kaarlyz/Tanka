# TASK: TASK-FIX-CHAPTER-NUMBERING-ALIGNMENT-022
## MODE: ENGINEERING
## SURFACE ARCHETYPE: Content Pipeline & Chapter Heading Normalization

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target File: `src/components/tabs/MaterialTab.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pengguna melaporkan:
> *"bug judul, bab nya misal bab3 malah disitu msih bab 2 , dan seterusnya"*

### Analisis Akar Masalah:
Di `src/components/tabs/MaterialTab.tsx` pada partisi bab (`chapters` memo):
1. Regex pemisah bab:
   ```ts
   if (/^#{1,2}\s+(BAB\s+\d+|[A-Z0-9\s:.-]{4,})/i.test(line.trim()) || line.trim().startsWith("## "))
   ```
   Aturan `#{1,2}` menangkap judul dokumen level 1 (`# Judul Dokumen`) sebagai pembuka bab baru.
2. Akibatnya:
   - Header dokumen (`# Matematika Fundamental...`) diangkat menjadi Bab 1 (indeks 0).
   - Bab isi aktual `## Bab 1: Fondasi Semesta...` tergeser menjadi Bab 2 (indeks 1).
   - Bab isi aktual `## Bab 2: Perluasan Bilangan...` tergeser menjadi Bab 3 (indeks 2).
   - Bab isi aktual `## Bab 3: Hierarki Semesta...` tergeser menjadi Bab 4 (indeks 3).
   - Bab isi aktual `## Bab 4: Analisis Operasi...` tergeser menjadi Bab 5 (indeks 4).
3. Pengguna melihat inkonsistensi fatal:
   Badge atas menuliskan: *"Bab 3 dari 5"*, tetapi judul bab di layar bertuliskan: *"Bab 2: Perluasan Bilangan..."*.
   Badge atas menuliskan: *"Bab 4 dari 5"*, tetapi judul bab di layar bertuliskan: *"Bab 3: Hierarki Semesta..."*.

---

## 2. DETAIL SPESIFIKASI PERBAIKAN

Di `src/components/tabs/MaterialTab.tsx`:

### A. Perbaiki Partisi Bab `chapters`
Ganti loop pembagian bab menjadi ketat hanya pada heading level 2 (`## `):
```tsx
    const lines = text.split("\n");
    const list: { id: number; title: string; shortTitle: string; content: string }[] = [];
    let currentTitle = "";
    let buffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Hanya tangkap heading level 2 ('## '), abaikan judul dokumen level 1 ('# ')
      if (/^##\s+(BAB\s+\d+|[^\n]+)/i.test(line.trim())) {
        if (buffer.length > 0 && buffer.some((l) => l.trim().length > 0)) {
          const rawTitle = currentTitle || "Pengantar";
          const short = rawTitle.replace(/^Bab\s+\d+[:.]?\s*/i, "").trim() || rawTitle;
          list.push({
            id: list.length + 1,
            title: rawTitle,
            shortTitle: short,
            content: buffer.join("\n").trim()
          });
          buffer = [];
        }
        currentTitle = line.replace(/^##\s+/, "").replace(/[*_#]/g, "").trim();
      } else {
        buffer.push(line);
      }
    }

    if (buffer.length > 0 && buffer.some((l) => l.trim().length > 0)) {
      const rawTitle = currentTitle || "Rangkuman Inti";
      const short = rawTitle.replace(/^Bab\s+\d+[:.]?\s*/i, "").trim() || rawTitle;
      list.push({
        id: list.length + 1,
        title: rawTitle,
        shortTitle: short,
        content: buffer.join("\n").trim()
      });
    }

    // Jika blok pertama adalah teks pengantar sebelum '## Bab 1', gabungkan ke Bab 1 agar nomor bab 100% selaras
    if (list.length > 1 && !/^Bab\s+\d+/i.test(list[0].title)) {
      const intro = list.shift()!;
      const cleanIntro = intro.content.replace(/\n*---\s*$/, "").trim();
      list[0].content = cleanIntro ? cleanIntro + "\n\n---\n\n" + list[0].content : list[0].content;
      list.forEach((c, idx) => { c.id = idx + 1; });
    }

    // Bersihkan header judul dokumen "# Judul" dan ringkasan pengantar yang bocor ke dalam badan Bab 1
    if (list.length > 0 && list[0].content) {
      list[0].content = list[0].content
        .replace(/^#\s+[^\n]+\n+/, "")
        .replace(/^>\s+[^\n]+(?:\n>[^\n]+)*\n+(?:---\s*\n+)?/, "")
        .trim();
    }

    return list.length > 0 ? list : [{ id: 1, title: activeDocTitle || "Modul Utama", shortTitle: "Materi Utama", content: text }];
```

### B. Sinkronisasi Badge & Judul Bab
Pastikan pada bagian banner heading bab:
```tsx
<span style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#3d541b", fontFamily: "'DM Mono', monospace", backgroundColor: "#f0f6ea", border: "1px solid #cce2a3", padding: "3px 12px", borderRadius: 9999 }}>
  Bab {currentChapterIdx + 1} dari {chapters.length}
</span>
```
Gunakan `currentChapterIdx + 1` agar konsisten dengan `chapters[currentChapterIdx]?.title`.

---

## 3. ACCEPTANCE CRITERIA
- [ ] Dokumen H1 (`# ...`) tidak lagi diparsing sebagai Bab 1 terpisah.
- [ ] Bab 1 selalu memuat judul bab 1 (`## Bab 1...`), Bab 2 memuat bab 2 (`## Bab 2...`), Bab 3 memuat bab 3 (`## Bab 3...`).
- [ ] Nomor badge (*"Bab X dari N"*), dropdown (*"Bab X / N"*), judul H1, dan tombol *"Lanjut ke Bab X+1"* 100% selaras tanpa selisih indeks.
- [ ] `npm run build` sukses.
- [ ] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [ ] DILARANG melakukan `git push` ke remote GitHub.
