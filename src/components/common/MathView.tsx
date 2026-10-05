import React, { useMemo } from "react";
import katex from "katex";

const mathRenderCache = new Map<string, string>();

interface MathViewProps {
  text?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function MathView({ text, style, className }: MathViewProps) {
  if (!text) return null;

  // Ultra-fast path: If string contains zero math tokens, bypass regexes entirely
  const hasMathTokens = /[\$\\^√∑_±]|\([^)]+\)\s*\//.test(text);
  if (!hasMathTokens) {
    return <span style={style} className={className}>{text}</span>;
  }

  const renderedHTML = useMemo(() => {
    if (mathRenderCache.has(text)) {
      return mathRenderCache.get(text)!;
    }

    try {
      let str = text;

      // 0. Pre-normalize fractions with slash: (A)/(B) -> $\frac{A}{B}$
      if (str.includes("/")) {
        str = str.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, (_, a, b) => `$\\frac{${a}}{${b}}$`);
        str = str.replace(/\(([^()]+)\)\s*\/\s*([a-zA-Z0-9]+)\b/g, (_, a, b) => `$\\frac{${a}}{${b}}$`);
        str = str.replace(/\b([a-zA-Z0-9]+)\s*\/\s*\(([^()]+)\)/g, (_, a, b) => `$\\frac{${a}}{${b}}$`);
        str = str.replace(/\b([a-zA-Z0-9]{1,3})\/([a-zA-Z0-9]{1,3})\b/g, (match, a, b) => {
          if (a === "dan" || a === "atau" || a === "and" || a === "or" || match === "10/10") return match;
          return `$\\frac{${a}}{${b}}$`;
        });
      }

      // 0b. Pre-normalize Unicode roots: √(expr) -> $\sqrt{expr}$
      if (str.includes("√")) {
        str = str.replace(/√\(([^)]+)\)/g, (_, r) => `$\\sqrt{${r}}$`);
        str = str.replace(/√([a-zA-Z0-9]+)/g, (_, r) => `$\\sqrt{${r}}$`);
      }

      // 0c. Pre-normalize Unicode sigma: ∑_{i=1}^{n} -> $\sum_{i=1}^{n}$
      if (str.includes("∑")) {
        str = str.replace(/∑_\{([^}]+)\}\^\{([^}]+)\}\s*([a-zA-Z0-9_]+)/g, (_, sub, sup, term) => `$\\sum_{${sub}}^{${sup}} ${term}$`);
        str = str.replace(/∑_\{([^}]+)\}\^\{([^}]+)\}/g, (_, sub, sup) => `$\\sum_{${sub}}^{${sup}}$`);
      }

      // 1b. Normalize any raw LaTeX environment \begin{...} without enclosing $$ or $
      if (str.includes("\\begin{") && !str.includes("$$")) {
        str = str.replace(/\\begin\{([a-zA-Z*]+)\}[\s\S]*?\\end\{\1\}/g, (m) => `$$${m}$$`);
      }

      // 1. Process block math $$...$$
      if (str.includes("$$")) {
        str = str.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
          try {
            let cleanMath = math
              .replace(/±/g, "\\pm ")
              .replace(/≤/g, "\\le ")
              .replace(/≥/g, "\\ge ")
              .replace(/≠/g, "\\neq ");
            return `<div class="katex-block-wrapper" style="margin: 10px 0; overflow-x: auto; text-align: center;">${katex.renderToString(cleanMath.trim(), { displayMode: true, throwOnError: false })}</div>`;
          } catch {
            return `$$${math}$$`;
          }
        });
      }

      // 2. Process inline math $...$
      if (str.includes("$")) {
        str = str.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
          try {
            let cleanMath = math
              .replace(/±/g, "\\pm ")
              .replace(/≤/g, "\\le ")
              .replace(/≥/g, "\\ge ")
              .replace(/≠/g, "\\neq ");
            return katex.renderToString(cleanMath.trim(), { displayMode: false, throwOnError: false });
          } catch {
            return `$${math}$`;
          }
        });
      }

      // 3. Process naked LaTeX commands like \frac{...}{...}, \sqrt{...}, \sum_{...}^{...}
      if (str.includes("\\")) {
        str = str.replace(/(\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\}|\\sum_\{[^{}]+\}\^\{[^{}]+\})/g, (math) => {
          try {
            return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
          } catch {
            return math;
          }
        });
      }

      // 4. Process simple algebraic powers (e.g. x^2, y^3) without catastrophic backtracking
      if (str.includes("^")) {
        str = str.replace(/\b([a-zA-Z0-9()]+)\^([a-zA-Z0-9()]+)\b/g, (match, base, exp) => {
          // Jangan proses jika karakter berada di dalam tag HTML
          if (str.includes("<") && str.includes(">")) return match;
          try {
            return katex.renderToString(`${base}^{${exp}}`, { displayMode: false, throwOnError: false });
          } catch {
            return match;
          }
        });

        // 5. Fallback for carets
        str = str
          .replace(/\^2\b/g, "²")
          .replace(/\^3\b/g, "³")
          .replace(/\^4\b/g, "⁴")
          .replace(/\^5\b/g, "⁵")
          .replace(/\^6\b/g, "⁶")
          .replace(/\^7\b/g, "⁷")
          .replace(/\^8\b/g, "⁸")
          .replace(/\^9\b/g, "⁹")
          .replace(/\^0\b/g, "⁰")
          .replace(/\^n\b/g, "ⁿ")
          .replace(/\^x\b/g, "ˣ")
          .replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>")
          .replace(/\^([0-9a-zA-Z]+)/g, "<sup>$1</sup>");
      }

      if (mathRenderCache.size > 2000) mathRenderCache.clear();
      mathRenderCache.set(text, str);
      return str;
    } catch {
      return text;
    }
  }, [text]);

  return (
    <span
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: renderedHTML }}
    />
  );
}

export function getSubjectBadge(title: string) {
  const t = (title || "").toLowerCase();
  if (t.includes("sosiologi") || t.includes("sosial") || t.includes("masyarakat") || t.includes("konflik") || t.includes("perubahan")) {
    return { label: "Sosiologi", color: "#566b36", bg: "#edf4e3", border: "#d7e5c5" };
  }
  if (t.includes("ekonomi") || t.includes("pasar") || t.includes("harga") || t.includes("uang") || t.includes("permintaan") || t.includes("elastisitas") || t.includes("perdagangan")) {
    return { label: "Ekonomi", color: "#7c5545", bg: "#f7eee8", border: "#ebd7cd" };
  }
  if (t.includes("matematika") || t.includes("aljabar") || t.includes("matriks") || t.includes("hitung") || t.includes("fungsi") || t.includes("persamaan") || t.includes("trigonometri") || t.includes("kalkulus")) {
    return { label: "Matematika", color: "#284439", bg: "#e6ede9", border: "#c5d6cc" };
  }
  if (t.includes("indonesia") || t.includes("inggris") || t.includes("bahasa") || t.includes("paragraf") || t.includes("teks") || t.includes("literasi")) {
    return { label: "Bahasa", color: "#455668", bg: "#e9edf3", border: "#cbd5e1" };
  }
  return { label: "Umum", color: "#4a5550", bg: "#edf1ee", border: "#d8dedb" };
}
