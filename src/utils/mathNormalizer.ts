/**
 * Self-Healing KaTeX / Math Expression Normalizer for Tanka
 *
 * 1. Heals corrupted control characters (\u000c -> \f, \u0008 -> \b)
 * 2. Converts \( and \) to $
 * 3. Converts \[ and \] to $$\n...\n$$
 * 4. Detects environments \begin{(aligned|cases|matrix|pmatrix|bmatrix)}...\end{...}
 *    not enclosed in $$, and wraps them in $$\n...\n$$
 * 5. Protects table pipes: inside markdown tables (| ... |), converts | inside $...$ or $$...$$
 *    to \vert so GFM table columns won't break
 * 6. Normalizes newlines inside inline math $...$
 */

export function healControlCharsToLatex(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/\u000c/g, "\\f")
    .replace(/\u0008/g, "\\b")
    .replace(/\t(imes|ext|heta|an|au)\b/g, "\\t$1")
    .replace(/\r(ight|ho|angle)\b/g, "\\r$1")
    .replace(/\n(eq|abla|ot|u)\b/g, "\\n$1");
}

export function normalizeMathExpression(text: string): string {
  if (!text || typeof text !== "string") return "";

  let str = healControlCharsToLatex(text).replace(/\r\n/g, "\n");

  // 0. Fix double-escaped backslashes from AI JSON output:
  //    \\\\frac -> \\frac, \\\\sqrt -> \\sqrt, etc.
  //    Only inside math delimiters ($...$, $$...$$) or before known LaTeX commands
  str = str.replace(/\\\\(frac|sqrt|sum|prod|int|log|ln|sin|cos|tan|cot|sec|csc|text|mathrm|mathbf|mathit|mathcal|mathbb|operatorname|left|right|begin|end|cdot|times|div|pm|mp|leq|geq|neq|approx|equiv|subset|supset|infty|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|omega|phi|psi|to|rightarrow|leftarrow|iff|implies|forall|exists|nabla|partial|lim|max|min|sup|inf|binom|choose|overline|underline|hat|bar|vec|dot|ddot|tilde|widehat|widetilde|not|in|notin|cup|cap|vee|wedge|oplus|otimes|vert|lvert|rvert|lVert|rVert|quad|qquad|hspace|vspace|displaystyle|textstyle|boxed|cancel|bcancel|xcancel|overset|underset|stackrel)\b/g, "\\$1");

  // Escape bare $ yang benar-benar mata uang. JANGAN escape kalau di baris itu ada pasangan $
  // yang isinya rumus — dulu "$4, 7, 10, \dots$" ikut di-escape jadi "\$4, ... \$" dan
  // tampil sebagai teks mentah ber-backslash.
  const looksLikeMathSpan = (s: string): boolean => {
    const withoutCommands = s.replace(/\\[a-zA-Z]+/g, ""); // \dots, \quad, \frac bukan prosa
    return !/[A-Za-z]{4,}/.test(withoutCommands) && (/\\/.test(s) || /[=^_{}()+\-*/]/.test(s) || /^\s*[\d\s,.]+\s*$/.test(s));
  };
  str = str
    .split("\n")
    .map((line) => {
      if (line.includes("$$")) return line; // display math, jangan disentuh
      const dollars = (line.match(/(?<!\\)\$/g) || []).length;
      if (dollars >= 2 && dollars % 2 === 0) {
        const spans: string[] = [];
        line.replace(/(?<!\\)\$([^$\n]*)(?<!\\)\$/g, (_, inner) => {
          spans.push(inner);
          return "";
        });
        if (spans.length > 0 && spans.every(looksLikeMathSpan)) return line;
      }
      return line.replace(
        /\$(\d[\d,.]*(?:\s*(?:juta|ribu|miliar|rb|jt|M|K|B|triliun|billion|million|thousand))?)\b(?!\$)/g,
        (_, num) => `\\$${num}`
      );
    })
    .join("\n");

  // 1. Convert display math \[ ... \] to $$\n...\n$$
  str = str.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    return `$$\n${math.trim()}\n$$`;
  });

  // 2. Convert inline math \( ... \) to $ ... $
  str = str.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    return `$${math.trim()}$`;
  });

  // 3. Auto-wrap naked environments: \begin{(aligned|cases|matrix|pmatrix|bmatrix)}...\end{...}
  // Mask existing $$...$$ blocks first so we don't double wrap environments already inside $$
  const blockPlaceholders: string[] = [];
  str = str.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    blockPlaceholders.push(match);
    return `@@@TANKA_BLOCK_MATH_${blockPlaceholders.length - 1}@@@`;
  });

  // Strip optional single $ if someone wrapped an environment in single $ (e.g. $\begin{aligned}...\end{aligned}$)
  const envPattern = /(?:\$\s*)?(\\begin\{(aligned|cases|matrix|pmatrix|bmatrix)\}[\s\S]*?\\end\{\2\})(?:\s*\$)?/g;
  str = str.replace(envPattern, (_, env) => {
    return `$$\n${env.trim()}\n$$`;
  });

  // Restore existing $$...$$ blocks
  str = str.replace(/@@@TANKA_BLOCK_MATH_(\d+)@@@/g, (_, idx) => {
    return blockPlaceholders[Number(idx)];
  });

  // 4. Protect table pipes: if text contains markdown table rows (| ... |),
  // replace | inside $ ... $ or $$ ... $$ with \vert
  const hasTable = /\|.+\|/.test(str);
  if (hasTable) {
    // In block math $$...$$
    str = str.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      const safeMath = math.replace(/(?<!\\)\|/g, "\\vert ");
      return `$$${safeMath}$$`;
    });

    // In inline math $...$
    str = str.replace(/(?<!\$)\$(?!\$)((?:[^\$\n]|\n(?!\s*\n))+?)(?<!\$)\$(?!\$)/g, (_, math) => {
      const safeMath = math.replace(/(?<!\\)\|/g, "\\vert ");
      return `$${safeMath}$`;
    });
  }

  // 5. Normalize newlines inside inline math $...$
  str = str.replace(/(?<!\$)\$(?!\$)((?:[^\$\n]|\n(?!\s*\n))+?)(?<!\$)\$(?!\$)/g, (_, math) => {
    if (math.includes("\n")) {
      const normalizedMath = math.replace(/\n\s*/g, " ").trim();
      return `$${normalizedMath}$`;
    }
    return `$${math}$`;
  });

  return str;
}
