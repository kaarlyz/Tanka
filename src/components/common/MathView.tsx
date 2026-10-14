import React, { useMemo } from "react";
import katex from "katex";
import { normalizeMathExpression } from "../../utils/mathNormalizer";

const mathRenderCache = new Map<string, string>();

interface MathViewProps {
  text?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const MathView = React.memo(function MathView({ text, style, className }: MathViewProps) {
  if (!text) return null;

  // Ultra-fast path: If string contains zero math tokens, bypass regexes entirely
  const hasMathTokens = /[\$\\^√∑_±]|\([^)]+\)\s*\/|\\\(|\\\[|\\begin\{|\b\d+\/\d+\b/.test(text);
  if (!hasMathTokens) {
    return <span style={style} className={className}>{text}</span>;
  }

  const renderedHTML = useMemo(() => {
    if (mathRenderCache.has(text)) {
      return mathRenderCache.get(text)!;
    }

    try {
      // 0. Pre-normalize delimiters \(, \[, unclosed \begin{...}, table pipes
      let str = normalizeMathExpression(text);

      // Support basic markdown formatting (bold & linebreaks) in inline MathView
      if (str.includes("**")) {
        str = str.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      }
      if (str.includes("\n")) {
        str = str.replace(/\n\n/g, "<br/><br/>").replace(/([^>\n])\n([^<\n])/g, "$1<br/>$2");
      }

      // 0a. Pre-normalize fractions with slash: (A)/(B) -> $\frac{A}{B}$
      if (str.includes("/")) {
        str = str.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, (_, a, b) => `$\\frac{${a}}{${b}}$`);
        str = str.replace(/\(([^()]+)\)\s*\/\s*([a-zA-Z0-9]+)\b/g, (_, a, b) => `$\\frac{${a}}{${b}}$`);
        str = str.replace(/\b([a-zA-Z0-9]+)\s*\/\s*\(([^()]+)\)/g, (_, a, b) => `$\\frac{${a}}{${b}}$`);
        str = str.replace(/\b([0-9]{1,3})\/([0-9]{1,3})\b/g, (match, a, b) => {
          if (match === "10/10") return match;
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

      // 2. Process inline math $...$ (supports multiline content cleanly)
      if (str.includes("$")) {
        str = str.replace(/\$([^\$]+?)\$/g, (_, math) => {
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
          try {
            return katex.renderToString(`${base}^{${exp}}`, { displayMode: false, throwOnError: false });
          } catch {
            return match;
          }
        });

        // 5. Fallback for carets powers
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
          .replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>");
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
});

import { getSubjectBadge } from "../../utils/subjectBadge";
export { getSubjectBadge };
