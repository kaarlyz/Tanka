# TASK-EXAM-CBT-UX-DRILL-MODE-064: Rich HTML Rendering, Dual Study Modes (Drill vs Exam), & Refined Hierarchical CBT UX

**Status**: VERIFIED
**Assignee**: MARAKA
**Context**: Tanka AI Platform (`~/Projects/tanka`)

---

## 1. Core Problems to Solve
1. **Raw HTML Leak in Stimulus & Questions**:
   - `bacaan` and `soal` containing raw HTML tags like `<p style="text-align: center;"><strong>...</strong></p>` currently render as raw string text on screen because `MathView` renders plaintext when no math tokens exist.
   - **Fix**: Implemented `CbtContentRenderer` component that safely renders rich HTML (paragraphs, bold, tables, lists, linebreaks) while evaluating inline & block KaTeX `$..$` formulas seamlessly via `dangerouslySetInnerHTML`.
2. **Dual Learning Modes (Mode Ujian Timer vs Mode Drill Interaktif)**:
   - User wants two distinct modes:
     * **Mode A: Simulasi Ujian Resmi**: Timer countdown, no answer spoilers during test, official review table & score calculated on submit.
     * **Mode B: Drill Latihan Langsung (Instant Feedback)**: Clicking an option immediately reveals whether it is correct (green) or wrong (red), highlights the official key, reveals official key card, and provides instant **"Tanya Nara AI (Bedah Soal Ini)"** button!
3. **Hierarchical Categorization & Refined UX**:
   - Clean 4-tab segmented control:
     * **Semua** (27)
     * **SMA Wajib** (7: B. Indonesia, B. Inggris, Matematika)
     * **SMA Pilihan** (4: Sosiologi, Ekonomi)
     * **UTBK SNBT** (16: Kuantitatif, Penalaran Umum, Penalaran MTK, PBM, PPU, Literasi)
   - Dual action buttons on each package card: `[▶ Mulai Ujian]` and `[⚡ Latihan Mandiri]`.
4. **Visual Polish & Taste**:
   - Clean card typography, no border clutter, comfortable reading line-height (1.7-1.8), responsive mobile layout (overflow count = 0 on both 1920x1080 and 390x844).

---

## 2. Implementation Specifications

### Step 1: `src/components/common/CbtContentRenderer.tsx`
Created robust content renderer:
- Pre-processes KaTeX formulas (`$...$` and `$$...$$` and `\[...\]` and `\(...\)`) into rendered HTML.
- Sanitizes and allows safe structural HTML: `<p>`, `<strong>`, `<b>`, `<i>`, `<em>`, `<u>`, `<br>`, `<ul>`, `<ol>`, `<li>`, `<table>`, `<tr>`, `<td>`, `<th>`, `<span>`, `<div>`, `<img>`.
- Strips slop: removes `<span xss=removed>`, Microsoft Word artifacts (`mso-*`, `<o:p>`, `<w:...>`), XML tags, script tags, event handlers, and decodes HTML entities (`&nbsp;`).
- Removes orphan closing table tags (`</table>`, `</td>`, `</tr>`) when no opening table exists.
- Renders via `dangerouslySetInnerHTML`.

### Step 2: Updated `src/components/tabs/ExamCbtTab.tsx`
- Added state `studyMode: "exam" | "drill"`.
- Dual action buttons on all package cards: `[Mulai Ujian]` & `[Latihan Mandiri]`.
- Segmented control with tabs: `Semua`, `SMA Wajib`, `SMA Pilihan`, `UTBK SNBT` with counts and subtes pills.
- In **"drill"** mode:
  - Elapsed stopwatch timer (`Waktu Latihan`).
  - Selecting an option immediately shows `BENAR` (emerald) or `SALAH` (rose).
  - Highlights correct key with green border & checkmark.
  - If wrong, highlights user choice with red border & cross.
  - Displays official key card with decoded text.
  - Prominent action button: `💬 Tanya Nara AI (Bedah Soal Ini)`.
  - Question Palette buttons reflect correctness (green for right, red for wrong, blue for active).
- In **"exam"** mode:
  - Retains countdown timer, neutral selection state, submit modal, and score review screen.
- Integrated `CbtContentRenderer` into stimulus, question, options, and review modals.

---

## 3. Verification Criteria
- [x] Stimulus with `<p style="..."><strong>...` renders as centered bold text without raw HTML tags visible on screen.
- [x] User can switch between "Ujian Timer" and "Latihan Mandiri" modes.
- [x] In "Latihan Mandiri" mode, clicking an answer immediately gives instant color feedback and "Tanya Nara AI" button.
- [x] Filter pills correctly group SMA Wajib, SMA Pilihan, and UTBK SNBT.
- [x] `npm test` passes 159/159 (all 154 baseline + 5 new CBT renderer tests).
- [x] `npm run build` succeeds cleanly.
- [x] Layout verification: 0 horizontal overflow elements on Desktop 1920x1080 and Mobile 390x844. Evidence saved to `.agents/evidence/`.
