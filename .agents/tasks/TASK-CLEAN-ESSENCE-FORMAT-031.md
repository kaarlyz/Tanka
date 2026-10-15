# TASK: TASK-CLEAN-ESSENCE-FORMAT-031
## MODE: HYBRID
## SURFACE ARCHETYPE: Content Pipeline & Module Essence Normalization

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target File: `src/components/tabs/MaterialTab.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pengguna melaporkan:
> *"liat di esensi module, itu kenapa ad format yg belum kerender ntah ad kek simbol" gitu msih"*

### Temuan Cacat Riil:
1. Di `src/components/tabs/MaterialTab.tsx` baris ~1195, kartu `Esensi Modul Pembelajaran` merender teks mentah `activeDocSummary` ke dalam tag `<p>` biasa tanpa parsing Markdown.
2. Pada beberapa dokumen, `activeDocSummary` memuat respons mentah AI berupa sapaan (`Halo! Senang sekali bisa menjadi mentor...`), header (`# Modul Belajar...`), pembatas (`---`), dan kutipan (`> 🎯 **Misi...`).
3. Pemotongan karakter mentah `.slice(0, 350) + "..."` membelah token markdown di tengah kata (contoh: `**Mis...`), memunculkan simbol bintang dan garis pagar yang tidak kerender.
4. Teks tesis 350 karakter terpotong elipsis di tengah kalimat. Dengan menaikkan batas deteksi titik ke 380 karakter, kedua kalimat intisari dapat tuntas sempurna dengan tanda titik.

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

Di `src/components/tabs/MaterialTab.tsx`:

### A. Perbarui `extractCleanSummary`
Sesuaikan batas titik agar kalimat tuntas utuh tanpa terpotong elipsis di tengah jalan:
```tsx
function extractCleanSummary(summary: string, content: string): string {
  // 1. Prioritaskan intisari kurikulum resmi jika tercatat di konten dokumen atau rangkuman
  const thesisMatch = (content + "\n" + (summary || "")).match(/>\s*📌\s*\*\*Tesis & Esensi Modul:\*\*\s*([^\n]+(?:\n>[^\n]+)*)/i);
  if (thesisMatch) {
    let cleanThesis = thesisMatch[1]
      .replace(/\n>\s*/g, " ")
      .replace(/[*_#`~>]/g, "")
      .replace(/[🎯📌]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    while (/^(?:Halo|Senang sekali|Berikut adalah|Kita akan|Siapkan catatanmu)[^.!?]*[.!?]\s*/i.test(cleanThesis)) {
      cleanThesis = cleanThesis.replace(/^(?:Halo|Senang sekali|Berikut adalah|Kita akan|Siapkan catatanmu)[^.!?]*[.!?]\s*/i, "").trim();
    }
    cleanThesis = cleanThesis.replace(/^[:\-–—]\s*/, "");

    if (cleanThesis.length > 380) {
      const periodIdx = cleanThesis.indexOf(".", 250);
      if (periodIdx !== -1 && periodIdx <= 380) {
        return cleanThesis.slice(0, periodIdx + 1).trim();
      }
      const spaceIdx = cleanThesis.lastIndexOf(" ", 360);
      return cleanThesis.slice(0, spaceIdx > 250 ? spaceIdx : 360).trim() + "...";
    }
    return cleanThesis;
  }

  if (!summary || !summary.trim()) return "";

  // 2. Bersihkan sapaan percakapan dan markup Markdown
  let clean = summary
    .replace(/^(?:Halo!?[^\n]*|Senang sekali[^\n]*|Berikut adalah[^\n]*|Kita akan[^\n]*|Siapkan catatanmu[^\n]*)\n+/gi, "")
    .replace(/^#+\s+[^\n]+(?:\n+|$)/gm, "")
    .replace(/^---\s*(?:\n+|$)/gm, "")
    .replace(/^>\s*[^\n]*(?:\n+|$)/gm, "")
    .replace(/\n*```[\s\S]*?```/g, "")
    .replace(/[*_#`~>]/g, "")
    .replace(/[🎯📌]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean && summary) {
    clean = summary
      .replace(/\n*```[\s\S]*?```/g, "")
      .replace(/^#+\s*/gm, "")
      .replace(/^---\s*/gm, "")
      .replace(/^>\s*/gm, "")
      .replace(/[*_#`~>]/g, "")
      .replace(/[🎯📌]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  while (/^(?:Halo|Senang sekali|Berikut adalah|Kita akan|Siapkan catatanmu)[^.!?]*[.!?]\s*/i.test(clean)) {
    clean = clean.replace(/^(?:Halo|Senang sekali|Berikut adalah|Kita akan|Siapkan catatanmu)[^.!?]*[.!?]\s*/i, "").trim();
  }
  clean = clean.replace(/^[:\-–—]\s*/, "");

  if (clean.length > 380) {
    const periodIdx = clean.indexOf(".", 250);
    if (periodIdx !== -1 && periodIdx <= 380) {
      return clean.slice(0, periodIdx + 1).trim();
    }
    const spaceIdx = clean.lastIndexOf(" ", 360);
    return clean.slice(0, spaceIdx > 250 ? spaceIdx : 360).trim() + "...";
  }
  return clean.trim();
}
```

---

## 3. ACCEPTANCE CRITERIA
- [x] Kalimat pada "Esensi Modul Pembelajaran" tuntas utuh dengan tanda titik tanpa terpotong elipsis di tengah kata.
- [x] Simbol mentah Markdown (`---`, `#`, `>`, `**`, `🎯`) hilang 100%.
- [x] `npm run build` sukses.
- [x] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [x] DILARANG melakukan `git push` ke remote GitHub.
