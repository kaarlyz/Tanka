# TASK-AUDIT-ALL-KATEX-AND-CBT-RENDER-SURFACES-084

## Context
Eka menemukan bahwa formula matematika kompleks (seperti matriks inline `$T = \begin{pmatrix} 30 \\ 4 \end{pmatrix}$` dan formula translasi kurva) sebelumnya sempat gagal ter-render di kartu kunci jawaban CBT karena dirender sebagai teks biasa dan parser auto-wrap regex memotong tanda dollar inline.
Eka menginstruksikan AURA untuk melakukan audit mendalam ke SELURUH permukaan rendering (render surfaces) di Tanka CBT, QuizTab, MaterialTab, dan TanyaNaraPanel untuk memastikan TIDAK ADA LAGI rumus matematika atau simbol KaTeX yang bocor atau tidak ter-render.

## Objectives for AURA & MARAKA
1. **Audit Menyeluruh Seluruh Render Surface di Codebase Frontend**:
   - `ExamCbtTab.tsx`:
     * Header & soal active runner (`currentItem.soal`, `currentItem.bacaan`)
     * Opsi pilihan ganda biasa & kompleks (`opt.text`)
     * Tabel pernyataan 3 baris (`opt.text`, value cells)
     * Kartu evaluasi drill mode (`currentItem.kunci_jawaban_text`)
     * Tabel review hasil ujian (`filteredBreakdown`, expanded row, options breakdown, kunci resmi)
     * Panel modal diagnostik AI Nara Autopsy (`it.pertanyaanRingkas`, `it.buktiTeks`, `it.kunciResmi`)
   - `QuizTab.tsx`:
     * Stimulus wacana kuis, teks pertanyaan, opsi jawaban, pembahasan
   - `TanyaNaraPanel.tsx`:
     * Pesan chat Markdown (inline math `$ ... $`, display math `$$ ... $$`, LaTeX matrices, fraction bars)
   - `MaterialTab.tsx` & `FormulaDrawer.tsx`:
     * Rendering ringkasan rumus dan modul materi
2. **Koreksi Komprehensif pada Engine Parser**:
   - Pastikan `CbtContentRenderer.tsx`, `MathView.tsx`, dan `diagramNormalizer.ts` seragam dalam menangani:
     * Matrix environments: `pmatrix`, `bmatrix`, `matrix`, `cases`, `aligned`
     * Double backslash escaping di JSON string (`\\frac`, `\\sqrt`, `\\\\`)
     * Inline math dengan variabel tunggal (`$c$`, `$x$`, `$y$`, `$a$`)
     * Operator relasi matematika (`\iff`, `\implies`, `\to`, `\le`, `\ge`)
3. **Unit Test Suite Lengkap (`tests/allRenderSurfacesKatexAudit.test.js`)**:
   - Uji setiap permukaan render dengan payload matematika ekstrem: matriks, pecahan bertingkat, akar kuadrat, translasi kurva, dan fungsi invers.
   - Pastikan semua test passing 100% dan zero visual breakage.

## Execution Report by MARAKA
- **Status**: `ACCEPTED` (Audited & Verified by AURA)
- **Date**: 2026-10-26
- **Files Changed / Created**:
  * `src/utils/mathNormalizer.ts`: Masking ganda (`$$...$$` dan `$...$`) mendahului regex naked environment auto-wrapping. Mengamankan inline math matriks `$T = \begin{pmatrix} 30 \\ 4 \end{pmatrix}$`. Menghilangkan newline liar. Menambahkan dukungan unescape operator relasi `\le`, `\ge`.
  * `src/components/common/CbtContentRenderer.tsx`: Sinkronisasi unmasking double-backslash dan relasi operator `\le`, `\ge`.
  * `src/components/common/MathView.tsx`: Penyeragaman masking inline math tanpa cross-line leakage, dukungan relasi operator `\le`, `\ge`.
  * `src/components/tabs/ExamCbtTab.tsx`: Integrasi menyeluruh `CbtContentRenderer` pada modal diagnostik Nara Autopsy (`it.pertanyaanRingkas`, `it.buktiTeks`, `it.analisisJebakan`, `diagnosticData.executiveSummary`, `wp.gejala`, `wp.tipsCepat`) dan baris ringkasan soal tabel review.
  * `tests/mathNormalizer.test.js`: Penambahan test case inline matrix preservation dan AI JSON double-backslash. (11/11 passing).
  * `tests/allRenderSurfacesKatexAudit.test.js`: Suite audit komprehensif menguji seluruh permukaan render dengan payload matriks ekstrem, pecahan bertingkat, akar bersarang, translasi kurva, fungsi invers, operator relasi, AI JSON escaping, dan single variable currency collision guard. (10/10 passing).
- **Verification Results**:
  * Unit Tests: `node --test tests/mathNormalizer.test.js tests/allRenderSurfacesKatexAudit.test.js tests/cbtContentRenderer.test.js tests/mathStimulusRendering.test.js` -> 35/35 passing (100%).
  * Production Build: `npm run build` -> Clean exit code 0 (2675 modules transformed, 448ms).
  * Empirical DOM Probe: Mobile 390x844 (0 overflow), Desktop 1920x1080 (0 overflow). KaTeX rendering verified on active runner.
  * Verdict: `ACCEPTED`.
