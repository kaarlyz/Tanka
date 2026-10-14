/**
 * Self-Healing KaTeX / Math Expression Normalizer for Tanka
 *
 * 1. Converts \( and \) to $
 * 2. Converts \[ and \] to $$\n...\n$$
 * 3. Detects environments \begin{(aligned|cases|matrix|pmatrix|bmatrix)}...\end{...}
 *    not enclosed in $$, and wraps them in $$\n...\n$$
 * 4. Protects table pipes: inside markdown tables (| ... |), converts | inside $...$ or $$...$$
 *    to \vert so GFM table columns won't break
 * 5. Normalizes newlines inside inline math $...$
 */

export function normalizeMathExpression(text: string): string {
  if (!text || typeof text !== "string") return "";

  let str = text.replace(/\r\n/g, "\n");

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
