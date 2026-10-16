# TASK-KATEX-HOTS-RESILIENCE-040: Comprehensive KaTeX Self-Healing & HOTS Quiz Generation Resilience

## METADATA
- Project: Tanka (`/home/vallencia/Projects/tanka`)
- Target Files:
  - `server/utils/jsonParser.js`
  - `server/services/quizGenerator.js`
  - `src/components/common/MathView.tsx`
  - `src/utils/diagramNormalizer.ts`
  - `src/index.css`
- Executor: MARAKA (`maraka`)
- Auditor: AURA (`gikano`)
- Authority: Eka

---

## 1. Root Cause Analysis (Hasil Investigasi Empiris AURA)

### Masalah 1: Quiz Gagal di Type HOTS ("Format JSON soal tidak valid dari model AI")
1. **Truncation pada Paket Besar**: Soal HOTS sangat panjang (skenario kasus, 5 opsi LaTeX, steps penalaran 4 tahap, explanation, pitfall). Batch 5–8 soal HOTS menelan 3.500–5.500 token. Saat model AI terpotong sebelum kurung tutup `]`, `safeJsonParse` mengembalikan `null` karena tidak mereparasi array terpotong.
2. **Ketiadaan Retry**: `quizGenerator.js` langsung melempar error HTTP 500 tanpa mekanisme retry bila panggilan pertama gagal parse.
3. **Ukuran Batch Kaku**: `finalCount <= 8` dipaksakan dalam 1 batch tunggal, terlalu berisiko untuk soal analitikal panjang.

### Masalah 2: Banyak Formula KaTeX Gagal Render / Tampil Rusak / Merah
1. **Kerusakan Karakter Kontrol JSON (`\u000c`, `\u0008`)**:
   Saat model menghasilkan `\frac`, `\begin`, `\beta`, `\times`, `\neq`, `\right`: parser standar JSON menafsirkan `\f` sebagai Formfeed (`\u000c`) dan `\b` sebagai Backspace (`\u0008`).
   Bukti empiris di database (`quiz_1792129931232`): `$27^{\u000crac{2}{3}}$`. KaTeX menolak karakter `\u000c` dengan error `Unexpected character: '\f'` dan gagal me-render rumus (muncul teks merah mentah).
2. **Tabrakan Delimiter Dollar ($) pada Pre-normalizer `MathView.tsx`**:
   Regresi regex slash (`(A)/(B) -> $\frac{A}{B}$` dan `1/2 -> $\frac{1}{2}$`) serta akar (`√`) berjalan secara global *sebelum* pemisahan math. Jika teks sudah memiliki `$2/3$` atau `$(a+1)/(a-2)$`, regex menyuntikkan `$` di dalam `$`, menghasilkan `$$\frac{a+1}{a-2}$$` yang merusak pairing seluruh dokumen (teks biasa seperti " jika " ter-render sebagai matematika, dan rumus asli tertinggal).
3. **Penyusupan Tag `<br/>` ke Rumus Multiline**:
   Penggantian `\n` menjadi `<br/>` di `MathView.tsx` terjadi sebelum block math `$$ ... $$`, sehingga `\begin{aligned}` disusupi `<br/>` yang dirender KaTeX sebagai variabel aljabar aneh (`< b r / >`).
4. **Bypass Regex Token Cepat**:
   `hasMathTokens` di `MathView.tsx` tidak memeriksa perintah LaTeX tanpa pembungkus (`\\[a-zA-Z]+`), sehingga rumus telanjang seperti `\frac{1}{2}` dilewati begitu saja.
5. **Whitespace Delimiter pada `remark-math`**:
   `remark-math` mengabaikan inline math yang memiliki spasi di awal/akhir delimiter (misal `$ 2^3 $`).

---

## 2. Spesifikasi Implementasi untuk MARAKA

### A. Perbaikan `server/utils/jsonParser.js`
1. Tambahkan fungsi pra-escape perintah LaTeX sebelum `JSON.parse` agar tidak berubah menjadi control char:
```javascript
function preprocessLatexJson(raw) {
  if (!raw || typeof raw !== "string") return raw;
  // Lindungi backslash LaTeX yang diawali huruf escape JSON (f, b, t, r, n)
  return raw.replace(/\\(frac|forall|flat|begin|beta|bar|binom|boxed|bold|bullet|bf|times|text|theta|tan|tau|right|rho|rangle|neq|nabla|not|nu)\b/g, "\\\\$1");
}
```
2. Tambahkan pemulihan array JSON terpotong (truncated array repair):
Jika parsing gagal dan string diawali `[` tetapi tidak ditutup `]`, cari kurung kurawal penutup terakhir `}` dan tambahkan `]` untuk menyelamatkan butir soal yang sudah selesai digenerate.
3. Tambahkan fungsi pembersihan control character `healControlCharsToLatex(str)` untuk membersihkan `\u000c` kembali ke `\f`, `\u0008` kembali ke `\b`.

### B. Perbaikan `server/services/quizGenerator.js`
1. Partisi ukuran batch lebih aman untuk mode analitikal:
```javascript
const maxBatch = quizType === "analytical" || quizType === "hots" ? 3 : 5;
```
Jika `finalCount > maxBatch`, jalankan secara modular paralel.
2. Tambahkan auto-retry (maksimal 2x percobaan) pada `generateQuizBatch` jika parsing menghasilkan array kosong/null.
3. Sebelum mengembalikan soal, terapkan `healControlCharsToLatex` pada `question`, `options`, `formula`, `explanation`, `steps`, dan `pitfall`.

### C. Overhaul `src/components/common/MathView.tsx`
1. Perbarui `hasMathTokens`:
```typescript
const hasMathTokens = /[\$\\^√∑_±]|\\[a-zA-Z]+|\([^)]+\)\s*\/|\\\(|\\\[|\\begin\{|\b\d+\/\d+\b/.test(text);
```
2. Terapkan arsitektur **Masking Terisolasi**:
   - Pulihkan karakter kontrol (`healControlCharsToLatex`).
   - Normalisasi `\[ ... \]` ke `$$ ... $$` dan `\( ... \)` ke `$ ... $`.
   - **Masking Blok Math (`$$...$$`)** ke placeholder `@@@TANKA_BLOCK_${idx}@@@`.
   - **Masking Inline Math (`$...$`)** ke placeholder `@@@TANKA_INLINE_${idx}@@@`.
   - **HANYA PADA TEKS DI LUAR MATH**:
     * Format markdown `**bold**` dan `\n` ke `<br/>`.
     * Konversi slash bebas `(a)/(b)` atau `\b\d+/\d+\b` ke KaTeX string langsung (tanpa tanda `$`).
     * Konversi simbol akar bebas `√(x)` ke KaTeX string langsung (tanpa tanda `$`).
     * Konversi pangkat bebas `x^2` ke KaTeX string langsung (tanpa tanda `$`).
   - **Unmasking & Render KaTeX**:
     * Render inline math dengan `katex.renderToString(clean, { displayMode: false, throwOnError: false })`.
     * Render block math dengan `katex.renderToString(clean, { displayMode: true, throwOnError: false })` terbungkus `.katex-block-wrapper`.

### D. Penyelarasan `src/utils/diagramNormalizer.ts`
Pastikan spasi berlebih pada inline math dirapikan:
```typescript
str = str.replace(/(?<!\$)\$(?!\$)\s*([^\$\n]+?)\s*(?<!\$)\$(?!\$)/g, "$$$1$$");
```

### E. Polish Tipografi & Ergonomi KaTeX di `src/index.css`
Tambahkan styling elegan publikasi agar rumus nyaman dibaca:
```css
/* Publication-grade KaTeX Typography */
.katex {
  font-size: 1.05em !important;
  text-rendering: auto !important;
}

.katex-display {
  margin: 14px 0 !important;
  padding: 10px 16px !important;
  background: #fafbf8 !important;
  border-radius: 8px !important;
  border: 1px solid #edf1eb !important;
  box-shadow: 0 1px 3px rgba(24, 34, 31, 0.02) !important;
}

.katex-display > .katex {
  font-size: 1.12em !important;
}

.question-formula {
  background: #f4f6f1;
  border: 1px solid #dce2da;
  border-radius: 8px;
  padding: 10px 14px;
  margin: 12px 0;
  text-align: center;
}
```

---

## 3. Acceptance Criteria
- [ ] Endpoint `/api/ai/generate-quiz` berhasil memproses `quizType: "analytical"` (HOTS) 5 soal tanpa error "Format JSON soal tidak valid".
- [ ] Karakter control `\u000c` (formfeed) dan `\u0008` (backspace) dari output model tereliminasi 100%.
- [ ] Formula pecahan, akar, dan pangkat tidak mengalami tabrakan tanda `$`.
- [ ] Blok multiline math `\begin{aligned}` ter-render rapi tanpa kebocoran `<br/>`.
- [ ] `npm run build` sukses.
- [ ] Automated tests 85/85 pass: `env TANKA_DB_PATH=:memory: node --test --test-concurrency=1 tests/*.test.js`.
- [ ] Layanan `tanka.service` di-restart dan aktif.
- [ ] DILARANG melakukan `git push` ke GitHub remote.
