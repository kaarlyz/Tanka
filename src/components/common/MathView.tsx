import React, { useMemo } from "react";
import katex from "katex";
import { normalizeMathExpression, healControlCharsToLatex } from "../../utils/mathNormalizer";

const mathRenderCache = new Map<string, string>();

interface MathViewProps {
  text?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const MathView = React.memo(function MathView({ text, style, className }: MathViewProps) {
  if (!text) return null;

  // Ultra-fast path: If string contains zero math tokens, bypass regexes entirely
  const hasMathTokens = /[\$\\^√∑_±]|\\[a-zA-Z]+|\([^)]+\)\s*\/|\\\(|\\\[|\\begin\{|\b\d+\/\d+\b/.test(text);
  if (!hasMathTokens) {
    return <span style={style} className={className}>{text}</span>;
  }

  const renderedHTML = useMemo(() => {
    if (mathRenderCache.has(text)) {
      return mathRenderCache.get(text)!;
    }

    try {
      // 1. Heal corrupted control characters and normalize delimiters \[...\], \(...\), \begin{...}
      let str = healControlCharsToLatex(text);
      str = normalizeMathExpression(str);

      // 2. Isolated Masking Architecture:
      // Mask Block Math $$...$$
      const blockMathList: string[] = [];
      str = str.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        blockMathList.push(math);
        return `@@@TANKA_BLOCK_${blockMathList.length - 1}@@@`;
      });

      // Mask Inline Math $...$
      const inlineMathList: string[] = [];
      str = str.replace(/\$([^\$]+?)\$/g, (_, math) => {
        inlineMathList.push(math);
        return `@@@TANKA_INLINE_${inlineMathList.length - 1}@@@`;
      });

      // 3. TRANSFORMATIONS ONLY ON TEXT OUTSIDE DELIMITED MATH
      // A. Markdown bold & line breaks
      if (str.includes("**")) {
        str = str.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      }
      if (str.includes("\n")) {
        str = str.replace(/\n\n/g, "<br/><br/>").replace(/([^>\n])\n([^<\n])/g, "$1<br/>$2");
      }

      // B. Naked LaTeX commands (e.g. \frac{1}{2}, \sqrt{3}, \sum_{i=1}^n)
      if (str.includes("\\")) {
        str = str.replace(/(\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\}|\\sum_\{[^{}]+\}\^\{[^{}]+\})/g, (math) => {
          try {
            return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
          } catch {
            return math;
          }
        });
      }

      // C. Naked slash fractions: (A)/(B) or 1/2 -> Direct KaTeX render (no dollar collision)
      if (str.includes("/")) {
        str = str.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, (_, a, b) => {
          try {
            return katex.renderToString(`\\frac{${a}}{${b}}`, { displayMode: false, throwOnError: false });
          } catch {
            return `(${a})/(${b})`;
          }
        });
        str = str.replace(/\(([^()]+)\)\s*\/\s*([a-zA-Z0-9]+)\b/g, (_, a, b) => {
          try {
            return katex.renderToString(`\\frac{${a}}{${b}}`, { displayMode: false, throwOnError: false });
          } catch {
            return `(${a})/${b}`;
          }
        });
        str = str.replace(/\b([a-zA-Z0-9]+)\s*\/\s*\(([^()]+)\)/g, (_, a, b) => {
          try {
            return katex.renderToString(`\\frac{${a}}{${b}}`, { displayMode: false, throwOnError: false });
          } catch {
            return `${a}/(${b})`;
          }
        });
        str = str.replace(/\b([0-9]{1,3})\/([0-9]{1,3})\b/g, (match, a, b) => {
          if (match === "10/10") return match;
          try {
            return katex.renderToString(`\\frac{${a}}{${b}}`, { displayMode: false, throwOnError: false });
          } catch {
            return match;
          }
        });
      }

      // D. Naked Unicode roots: √(expr)
      if (str.includes("√")) {
        str = str.replace(/√\(([^)]+)\)/g, (_, r) => {
          try {
            return katex.renderToString(`\\sqrt{${r}}`, { displayMode: false, throwOnError: false });
          } catch {
            return `√(${r})`;
          }
        });
        str = str.replace(/√([a-zA-Z0-9]+)/g, (_, r) => {
          try {
            return katex.renderToString(`\\sqrt{${r}}`, { displayMode: false, throwOnError: false });
          } catch {
            return `√${r}`;
          }
        });
      }

      // E. Naked Unicode sigma
      if (str.includes("∑")) {
        str = str.replace(/∑_\{([^}]+)\}\^\{([^}]+)\}\s*([a-zA-Z0-9_]+)/g, (_, sub, sup, term) => {
          try {
            return katex.renderToString(`\\sum_{${sub}}^{${sup}} ${term}`, { displayMode: false, throwOnError: false });
          } catch {
            return `∑_{${sub}}^{${sup}} ${term}`;
          }
        });
        str = str.replace(/∑_\{([^}]+)\}\^\{([^}]+)\}/g, (_, sub, sup) => {
          try {
            return katex.renderToString(`\\sum_{${sub}}^{${sup}}`, { displayMode: false, throwOnError: false });
          } catch {
            return `∑_{${sub}}^{${sup}}`;
          }
        });
      }

      // F. Naked algebraic powers (e.g. x^2, y^3)
      if (str.includes("^")) {
        str = str.replace(/\b([a-zA-Z0-9()]+)\^([a-zA-Z0-9()]+)\b/g, (match, base, exp) => {
          try {
            return katex.renderToString(`${base}^{${exp}}`, { displayMode: false, throwOnError: false });
          } catch {
            return match;
          }
        });

        // Fallback for caret powers
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

      // 4. UNMASKING AND RENDERING KATEX
      // Render Block Math
      str = str.replace(/@@@TANKA_BLOCK_(\d+)@@@/g, (_, idxStr) => {
        const idx = Number(idxStr);
        const rawMath = blockMathList[idx] || "";
        try {
          const cleanMath = healControlCharsToLatex(rawMath)
            .replace(/±/g, "\\pm ")
            .replace(/≤/g, "\\le ")
            .replace(/≥/g, "\\ge ")
            .replace(/≠/g, "\\neq ")
            .trim();
          const rendered = katex.renderToString(cleanMath, { displayMode: true, throwOnError: false });
          return `<div class="katex-block-wrapper" style="margin: 10px 0; overflow-x: auto; text-align: center;">${rendered}</div>`;
        } catch {
          return `$$${rawMath}$$`;
        }
      });

      // Render Inline Math
      str = str.replace(/@@@TANKA_INLINE_(\d+)@@@/g, (_, idxStr) => {
        const idx = Number(idxStr);
        const rawMath = inlineMathList[idx] || "";
        try {
          const cleanMath = healControlCharsToLatex(rawMath)
            .replace(/±/g, "\\pm ")
            .replace(/≤/g, "\\le ")
            .replace(/≥/g, "\\ge ")
            .replace(/≠/g, "\\neq ")
            .trim();
          return katex.renderToString(cleanMath, { displayMode: false, throwOnError: false });
        } catch {
          return `$${rawMath}$`;
        }
      });

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
