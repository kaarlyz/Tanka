import { normalizeMathExpression } from "./mathNormalizer.ts";

export function sanitizeMathMarkdown(md: string): string {
  if (!md) return "";

  let text = normalizeMathExpression(md).replace(/\r\n/g, "\n");

  const lines = text.split("\n");
  const processedLines: string[] = [];
  let inMultiLineMath = false;
  let currentIndent = "";

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Count $$ occurrences on this line
    const dollarMatches = line.match(/\$\$/g) || [];
    const dollarCount = dollarMatches.length;

    // 1. Single-line balanced block math ($$ ... $$) -> LEAVE UNTOUCHED
    if (dollarCount >= 2 && dollarCount % 2 === 0) {
      processedLines.push(line);
      continue;
    }

    // 2. Line has an odd number of $$ (opener or closer of multiline math block)
    if (dollarCount % 2 === 1) {
      if (!inMultiLineMath) {
        // OPENING multiline block
        inMultiLineMath = true;
        const indent = line.match(/^(\s*)/)?.[1] || "";
        currentIndent = indent;

        const trimmed = line.trim();
        if (trimmed === "$$") {
          processedLines.push(line);
        } else if (trimmed.startsWith("$$")) {
          // e.g. "   $$\begin{aligned}" -> "   $$" and "   \begin{aligned}"
          const content = line.replace(/^\s*\$\$\s*/, "");
          processedLines.push(indent + "$$");
          processedLines.push(indent + content);
        } else {
          // e.g. "Text $$"
          const parts = line.split("$$");
          processedLines.push(parts[0]);
          processedLines.push(indent + "$$");
          if (parts[1]?.trim()) processedLines.push(indent + parts[1].trim());
        }
      } else {
        // CLOSING multiline block
        inMultiLineMath = false;
        const indent = currentIndent || (line.match(/^(\s*)/)?.[1] || "");

        const trimmed = line.trim();
        if (trimmed === "$$") {
          processedLines.push(indent + "$$");
        } else if (trimmed.endsWith("$$")) {
          // e.g. "   \end{aligned}$$" -> "   \end{aligned}" and "   $$"
          const before = line.replace(/\s*\$\$\s*$/, "");
          processedLines.push(before);
          processedLines.push(indent + "$$");
        } else {
          const parts = line.split("$$");
          if (parts[0]?.trim()) processedLines.push(indent + parts[0].trim());
          processedLines.push(indent + "$$");
          if (parts[1]?.trim()) processedLines.push(indent + parts[1].trim());
        }
        currentIndent = "";
      }
      continue;
    }

    // 3. Safety: If inside multiline math and hit markdown heading, divider, or table, force-close math block
    if (inMultiLineMath && (line.trim().startsWith("#") || line.trim().startsWith("---") || line.trim().startsWith("|"))) {
      processedLines.push((currentIndent || "") + "$$");
      inMultiLineMath = false;
      currentIndent = "";
    }

    processedLines.push(line);
  }

  if (inMultiLineMath) {
    processedLines.push((currentIndent || "") + "$$");
  }

  let result = processedLines.join("\n");

  // Fix unmatched inline math: single unclosed $ pada satu baris.
  // JANGAN asal tutup — kalau isinya bukan LaTeX (mis. "harga $50"), escape $ jadi \$ supaya
  // tidak terbaca sebagai math mode.
  result = result.split("\n").map((l) => {
    if (l.includes("$$")) return l;
    const count = (l.match(/(?<!\\)\$/g) || []).length;
    if (count % 2 === 1) {
      const lastIdx = l.search(/(?<!\\)\$(?![\s\S]*?(?<!\\)\$)/);
      const tail = lastIdx >= 0 ? l.slice(lastIdx + 1) : "";
      if (/\\[a-zA-Z]+/.test(tail)) {
        return l + "$";
      }
      return lastIdx >= 0
        ? l.slice(0, lastIdx) + "\\$" + l.slice(lastIdx + 1)
        : l;
    }
    return l;
  }).join("\n");

  // Trim excessive whitespace inside inline math delimiters for remark-math compatibility
  // Only trim when there's actual LaTeX content (has backslash, exponent, or math operator)
  result = result.replace(/(?<!\$)\$(?!\$)\s+([^\$\n]*[\\^_{}=+\-*/][^\$\n]*?)\s+(?<!\$)\$(?!\$)/g, "$$$1$$");

  // Escape remaining currency $ patterns that normalizeMathExpression might have missed
  // Pattern: $ then digits with optional currency suffixes, at word boundary
  result = result.replace(/(?<!\\)\$(\d[\d,.]*)\s+(juta|ribu|miliar|rb|jt)\b/g, "\\$$1 $2");

  // Normalize leaked technical jargon in table headers or text
  result = result.replace(/\|\s*Notasi\s+KaTeX\s*\|/gi, "| Notasi Simbol |");
  result = result.replace(/\|\s*KaTeX\s*\|/gi, "| Notasi Simbol |");
  result = result.replace(/\bNotasi\s+KaTeX\b/gi, "Notasi Simbol");

  return result;
}

export function normalizeDiagramsInMarkdown(rawMd: string): string {
  if (!rawMd) return "";
  const md = sanitizeMathMarkdown(rawMd);
  const lines = md.split("\n");
  const result: string[] = [];
  let inCode = false;
  let inAsciiBlock = false;
  let asciiBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      if (inAsciiBlock) {
        result.push("```");
        result.push(...asciiBuffer);
        result.push("```");
        asciiBuffer = [];
        inAsciiBlock = false;
      }
      inCode = !inCode;
      result.push(line);
      continue;
    }

    if (inCode) {
      result.push(line);
      continue;
    }

    const isDiagramLine = /[┌└├│─┬┴┼]|\+[-=]{2,}|\/\\|\\\/|\[Lahir|ARAH PERUBAHAN|PENGGERAK SISTEM/.test(line);
    if (isDiagramLine) {
      inAsciiBlock = true;
      asciiBuffer.push(line);
    } else {
      if (inAsciiBlock) {
        if (line.trim() === "" && i + 1 < lines.length && (/[┌└├│─┬┴┼]|\+[-=]{2,}/.test(lines[i + 1]) || lines[i + 1].includes("SIKLUS"))) {
          asciiBuffer.push(line);
        } else {
          result.push("```");
          result.push(...asciiBuffer);
          result.push("```");
          asciiBuffer = [];
          inAsciiBlock = false;
          result.push(line);
        }
      } else {
        result.push(line);
      }
    }
  }

  if (inAsciiBlock) {
    result.push("```");
    result.push(...asciiBuffer);
    result.push("```");
  }

  return result.join("\n");
}
