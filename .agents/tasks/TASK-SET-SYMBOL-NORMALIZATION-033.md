# TASK: TASK-SET-SYMBOL-NORMALIZATION-033
## MODE: HYBRID
## SURFACE ARCHETYPE: Mathematical Set Symbol Normalization & Mobile Touch Polish

## METADATA
- Project: Tanka (/home/vallencia/Projects/tanka)
- Target File: `src/components/common/DiagramRenderer.tsx`
- Assigned: MARAKA (maraka)
- Reviewer & Auditor: AURA (gikano)
- Authority: Eka

---

## 1. OBJECTIVE & ROOT CAUSE EXPLANATION
Pada audit visual `brave_matematika_numbered_flow.png`:
Badge notasi matematika di sebelah kanan masih menampilkan huruf Latin biasa (`[R]`, `[Q]`, `[Z]`, `[N]`) bukannya simbol blackboard bold matematika resmi (`[ℝ]`, `[ℚ]`, `[ℤ]`, `[ℕ]`).
Tambahkan normalizer otomatis `normalizeSetSymbol` di `parseConceptLabelAndSymbol` agar huruf himpunan standar otomatis terkonversi ke glif blackboard bold kanonikal.

---

## 2. DETAIL SPESIFIKASI IMPLEMENTASI

Di `src/components/common/DiagramRenderer.tsx`:

```tsx
function normalizeSetSymbol(sym: string): string {
  if (!sym) return sym;
  const map: Record<string, string> = {
    R: "ℝ",
    Q: "ℚ",
    Z: "ℤ",
    N: "ℕ",
    C: "ℂ",
    "Z-": "ℤ⁻",
    "Z⁻": "ℤ⁻",
    "Z+": "ℤ⁺",
    "Z⁺": "ℤ⁺",
    N0: "ℕ₀",
    N₀: "ℕ₀",
    "Q'": "ℚ'",
    I: "𝕀"
  };
  return map[sym] || sym;
}

export function parseConceptLabelAndSymbol(text: string): { label: string; symbol: string | null } {
  const clean = text.replace(/^[┌└├│─┬┴┼┐┘┤┴┬│─╔╚╠║═╦╩╬╗╝╣+=•↳\s\-–—]+/g, "").trim();
  // Cek notasi simbol di dalam kurung siku
  const bracketMatch = clean.match(/^(.*?)\s*\[([^\[\]]+)\]$/);
  if (bracketMatch && bracketMatch[1].trim().length > 0 && bracketMatch[2].length <= 15) {
    return { label: bracketMatch[1].trim(), symbol: normalizeSetSymbol(bracketMatch[2].trim()) };
  }
  // Cek notasi simbol di dalam tanda kurung
  const parenMatch = clean.match(/^(.*?)\s*\(([^()]+)\)$/);
  if (parenMatch && parenMatch[1].trim().length > 0 && parenMatch[2].length <= 15) {
    return { label: parenMatch[1].trim(), symbol: normalizeSetSymbol(parenMatch[2].trim()) };
  }
  // Cek notasi simbol dengan tanda sama dengan
  const eqMatch = clean.match(/^(.*?)\s*=\s*(.+)$/);
  if (eqMatch && eqMatch[1].trim().length > 0 && eqMatch[2].length <= 20) {
    return { label: eqMatch[1].trim(), symbol: normalizeSetSymbol(eqMatch[2].trim()) };
  }
  return { label: clean, symbol: null };
}
```

---

## 3. ACCEPTANCE CRITERIA
- [x] Badge notasi matematika di kartu hierarki konsep menampilkan glif blackboard bold resmi (`[ℝ]`, `[ℚ]`, `[ℤ]`, `[ℕ]`).
- [x] `npm run build` sukses.
- [x] `env TANKA_DB_PATH=:memory: node --test tests/*.test.js` 83/83 pass.
- [x] DILARANG melakukan `git push` ke remote GitHub.

---

## 4. VERIFICATION EVIDENCE
- Status: `VERIFIED` (Siap audit AURA)
- Files Modified: `src/components/common/DiagramRenderer.tsx`
- Normalizer: `normalizeSetSymbol` aktif di `parseConceptLabelAndSymbol` (bracket, paren, eq notation).
- Live DOM Probing: Menemukan glif resmi `[ℝ]`, `[ℚ]`, `[ℤ]`, `[ℤ⁻]`, `[ℕ₀]`, `[ℤ⁺]`, `[ℕ]`, `[ℂ]`, `[ℚ']`, `[𝕀]` pada dokumen Matematika Fundamental.
- Leaking elements within `.concept-stepper-card`: 0 (Desktop & Mobile 390x844).
- Tests: 83/83 pass (`env TANKA_DB_PATH=:memory: node --test tests/*.test.js`).
- Build: `npm run build` sukses (379ms).
