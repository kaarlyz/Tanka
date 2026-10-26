import React, { useMemo } from "react";
import katex from "katex";
import { normalizeMathExpression, healControlCharsToLatex } from "../../utils/mathNormalizer";

const cbtRenderCache = new Map<string, string>();

export function cleanAndRenderCbtContent(content?: string): string {
  if (!content || typeof content !== "string") return "";

  if (cbtRenderCache.has(content)) {
    return cbtRenderCache.get(content)!;
  }

  let str = content;

  // 1. Remove XML declarations, HTML comments, and MS Word / office tags
  str = str.replace(/<\?xml[^>]*\?>/gi, "");
  str = str.replace(/<!--[\s\S]*?-->/g, "");
  str = str.replace(/<\/?(?:o|w|m):[^>]*>/gi, "");
  str = str.replace(/class="MsoNormal"/gi, "");
  str = str.replace(/mso-[^;:"]+:[^;"]+;?/gi, "");
  str = str.replace(/&nbsp;/gi, " ");

  // 2. Remove script / style blocks completely, dangerous tags, attributes, and script injection
  str = str.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  str = str.replace(/<style\b[\s\S]*?<\/style>/gi, "");
  str = str.replace(/<\/?(?:script|iframe|object|embed|style|link|meta|base|form|input|button)\b[^>]*>/gi, "");
  str = str.replace(/\bxss=removed\b/gi, "");
  str = str.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  str = str.replace(/javascript:/gi, "");
  str = str.replace(/\s+style=["']\s*["']/gi, "");
  str = str.replace(/\s+class=["']\s*["']/gi, "");
  str = str.replace(/<([a-z0-9]+)\s+>/gi, "<$1>");

  // 3. Remove orphan closing table tags when no opening table exists
  if (!/<table\b/i.test(str)) {
    str = str.replace(/<\/?(?:table|tbody|thead|tfoot|tr|td|th)\b[^>]*>/gi, "");
  }

  // 4. Heal control characters and normalize math formulas
  str = healControlCharsToLatex(str);
  str = normalizeMathExpression(str);

  // 4b. Apply comprehensive unmasking logic like MathView
  const cleanMathStr = (raw: string): string => {
    let m = healControlCharsToLatex(raw);
    m = m.replace(/\\\\(frac|sqrt|sum|prod|int|log|ln|sin|cos|tan|cot|sec|csc|text|mathrm|mathbf|mathit|mathcal|mathbb|operatorname|left|right|begin|end|cdot|times|div|pm|mp|leq|geq|le|ge|neq|approx|equiv|subset|supset|infty|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|omega|phi|psi|to|rightarrow|leftarrow|iff|implies|forall|exists|nabla|partial|lim|max|min|sup|inf|binom|choose|overline|underline|hat|bar|vec|dot|ddot|tilde|widehat|widetilde|not|in|notin|cup|cap|vee|wedge|oplus|otimes|vert|lvert|rvert|lVert|rVert|quad|qquad|hspace|vspace|displaystyle|textstyle|boxed|cancel|bcancel|xcancel|overset|underset|stackrel)\b/g, "\\$1");
    m = m.replace(/\\+\s*$/, "").trim();
    m = m.replace(/±/g, "\\pm ")
      .replace(/≤/g, "\\le ")
      .replace(/≥/g, "\\ge ")
      .replace(/≠/g, "\\neq ")
      .replace(/×/g, "\\times ")
      .replace(/÷/g, "\\div ")
      .replace(/∞/g, "\\infty ")
      .replace(/∈/g, "\\in ")
      .replace(/∉/g, "\\notin ")
      .replace(/⊂/g, "\\subset ")
      .replace(/⊃/g, "\\supset ")
      .replace(/∪/g, "\\cup ")
      .replace(/∩/g, "\\cap ")
      .replace(/→/g, "\\to ")
      .replace(/⇒/g, "\\Rightarrow ")
      .replace(/⇔/g, "\\iff ")
      .replace(/∀/g, "\\forall ")
      .replace(/∃/g, "\\exists ");
    return m.trim();
  };

  // 5. Mask display math $$...$$ and \[...\]
  const blockMathList: string[] = [];
  str = str.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`);
  str = str.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    blockMathList.push(math);
    return `@@@CBT_BLOCK_${blockMathList.length - 1}@@@`;
  });

  // 6. Mask inline math $...$ and \(...\)
  const inlineMathList: string[] = [];
  str = str.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`);
  str = str.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    inlineMathList.push(math);
    return `@@@CBT_INLINE_${inlineMathList.length - 1}@@@`;
  });

  // 7. Handle naked LaTeX fractions/roots outside math tokens if any
  if (str.includes("\\frac{") || str.includes("\\sqrt{")) {
    str = str.replace(/(\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\})/g, (math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return math;
      }
    });
  }

  // 8. Unmask Math with KaTeX
  str = str.replace(/@@@CBT_BLOCK_(\d+)@@@/g, (_, idxStr) => {
    const rawMath = blockMathList[Number(idxStr)] || "";
    try {
      const clean = cleanMathStr(rawMath);
      return `<div class="katex-display-wrapper" style="margin: 8px 0; overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%; padding: 4px 0; text-align: center;">${katex.renderToString(clean, { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `$$${rawMath}$$`;
    }
  });

  str = str.replace(/@@@CBT_INLINE_(\d+)@@@/g, (_, idxStr) => {
    const rawMath = inlineMathList[Number(idxStr)] || "";
    try {
      const clean = cleanMathStr(rawMath);
      return katex.renderToString(clean, { displayMode: false, throwOnError: false });
    } catch {
      return `$${rawMath}$`;
    }
  });

  // 9. If no block-level HTML tags are present, convert newlines to <br/>
  const hasBlockHtml = /<\/?(?:p|div|ul|ol|li|table|h[1-6]|blockquote)\b/i.test(str);
  if (!hasBlockHtml && str.includes("\n")) {
    str = str.replace(/\r\n/g, "\n").replace(/\n/g, "<br/>");
  }

  if (cbtRenderCache.size > 2000) cbtRenderCache.clear();
  cbtRenderCache.set(content, str);
  return str;
}

export interface CbtContentRendererProps {
  content?: string;
  className?: string;
  style?: React.CSSProperties;
  inline?: boolean;
  onImageClick?: (src: string, alt?: string) => void;
}

export const CbtContentRenderer = React.memo(function CbtContentRenderer({
  content,
  className,
  style,
  inline = false,
  onImageClick,
}: CbtContentRendererProps) {
  const renderedHTML = useMemo(() => {
    return cleanAndRenderCbtContent(content);
  }, [content]);

  if (!content) return null;

  const handleContainerClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === "IMG") {
      const img = target as HTMLImageElement;
      if (onImageClick) {
        onImageClick(img.currentSrc || img.src, img.alt);
      }
    }
  };

  const combinedClassName = className ? `cbt-rendered-content ${className}` : "cbt-rendered-content";

  if (inline) {
    return (
      <span
        className={combinedClassName}
        style={{
          maxWidth: "100%",
          wordBreak: "break-word",
          ...style,
        }}
        onClick={handleContainerClick}
        dangerouslySetInnerHTML={{ __html: renderedHTML }}
      />
    );
  }

  return (
    <div
      className={combinedClassName}
      style={{
        lineHeight: 1.75,
        wordBreak: "break-word",
        maxWidth: "100%",
        ...style,
      }}
      onClick={handleContainerClick}
      dangerouslySetInnerHTML={{ __html: renderedHTML }}
    />
  );
});
