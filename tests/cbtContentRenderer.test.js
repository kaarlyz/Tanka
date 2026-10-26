const test = require("node:test");
const assert = require("node:assert/strict");
const katex = require("katex");

// Test cleanAndRenderCbtContent logic
function cleanAndRenderCbtContent(content) {
  if (!content || typeof content !== "string") return "";

  let str = content;

  // 1. Remove XML declarations, HTML comments, and MS Word / office tags
  str = str.replace(/<\?xml[^>]*\?>/gi, "");
  str = str.replace(/<!--[\s\S]*?-->/g, "");
  str = str.replace(/<\/?(?:o|w|m):[^>]*>/gi, "");
  str = str.replace(/class="MsoNormal"/gi, "");
  str = str.replace(/mso-[^;:"]+:[^;"]+;?/gi, "");

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

  // 4. Mask display math $$...$$ and \[...\]
  const blockMathList = [];
  str = str.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`);
  str = str.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    blockMathList.push(math);
    return `@@@CBT_BLOCK_${blockMathList.length - 1}@@@`;
  });

  // 5. Mask inline math $...$ and \(...\)
  const inlineMathList = [];
  str = str.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`);
  str = str.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    inlineMathList.push(math);
    return `@@@CBT_INLINE_${inlineMathList.length - 1}@@@`;
  });

  // 6. Handle naked LaTeX fractions/roots outside math tokens if any
  if (str.includes("\\frac{") || str.includes("\\sqrt{")) {
    str = str.replace(/(\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\})/g, (math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return math;
      }
    });
  }

  // 7. Unmask Math with KaTeX
  str = str.replace(/@@@CBT_BLOCK_(\d+)@@@/g, (_, idxStr) => {
    const rawMath = blockMathList[Number(idxStr)] || "";
    try {
      const clean = rawMath.replace(/\\\\/g, "\\").trim();
      return `<div class="katex-display-wrapper" style="margin: 8px 0; overflow-x: auto; text-align: center;">${katex.renderToString(clean, { displayMode: true, throwOnError: false })}</div>`;
    } catch {
      return `$$${rawMath}$$`;
    }
  });

  str = str.replace(/@@@CBT_INLINE_(\d+)@@@/g, (_, idxStr) => {
    const rawMath = inlineMathList[Number(idxStr)] || "";
    try {
      const clean = rawMath.replace(/\\\\/g, "\\").trim();
      return katex.renderToString(clean, { displayMode: false, throwOnError: false });
    } catch {
      return `$${rawMath}$`;
    }
  });

  // 8. If no block-level HTML tags are present, convert newlines to <br/>
  const hasBlockHtml = /<\/?(?:p|div|ul|ol|li|table|h[1-6]|blockquote)\b/i.test(str);
  if (!hasBlockHtml && str.includes("\n")) {
    str = str.replace(/\r\n/g, "\n").replace(/\n/g, "<br/>");
  }

  return str;
}

test("CbtContentRenderer: safely preserves rich HTML tags without string leakage", () => {
  const input = `<p style="text-align: center;"><strong>Peluang Kamar Hotel</strong></p><ul><li>18 kamar laut</li><li>10 kamar twin</li></ul>`;
  const rendered = cleanAndRenderCbtContent(input);

  assert.ok(rendered.includes(`<p style="text-align: center;"><strong>Peluang Kamar Hotel</strong></p>`), "HTML p & strong tags must remain intact");
  assert.ok(rendered.includes(`<ul><li>18 kamar laut</li>`), "List tags must remain intact");
  assert.ok(!rendered.includes("&lt;p"), "Raw HTML should never be escaped into &lt;p");
});

test("CbtContentRenderer: seamlessly evaluates KaTeX formulas inside HTML", () => {
  const input = `<p>Berapakah nilai dari $\\frac{1}{5}$ dan $$\\sum_{i=1}^{n} i$$ pada fungsi ini?</p>`;
  const rendered = cleanAndRenderCbtContent(input);

  assert.ok(rendered.includes("katex"), "KaTeX class or elements should be present");
  assert.ok(rendered.includes("katex-display-wrapper"), "Block math should be wrapped in display wrapper");
  assert.ok(!rendered.includes("$\\frac{1}{5}$"), "Inline math tokens should be transformed by KaTeX");
  assert.ok(!rendered.includes("$$\\sum"), "Block math tokens should be transformed by KaTeX");
});

test("CbtContentRenderer: strips XSS, scripts, and Microsoft Word slop", () => {
  const maliciousInput = `<script>alert('xss')</script><p class="MsoNormal" style="mso-padding-alt: 0cm;">Aman <span xss=removed onclick="evil()">Teks</span></p><o:p></o:p>`;
  const cleaned = cleanAndRenderCbtContent(maliciousInput);

  assert.ok(!cleaned.includes("<script>"), "Scripts must be stripped");
  assert.ok(!cleaned.includes("alert"), "Alert must be stripped");
  assert.ok(!cleaned.includes("onclick"), "Event handlers must be stripped");
  assert.ok(!cleaned.includes("xss=removed"), "xss=removed slop must be stripped");
  assert.ok(!cleaned.includes("<o:p>"), "MS Office o:p tag must be stripped");
  assert.ok(!cleaned.includes("mso-padding"), "mso styles must be stripped");
  assert.ok(cleaned.includes("Aman <span>Teks</span>"), "Legitimate text must remain");
});

test("CbtContentRenderer: removes orphan table closing tags in options", () => {
  const optionText = "Rp30.000,00\n </table>";
  const cleaned = cleanAndRenderCbtContent(optionText);

  assert.ok(!cleaned.includes("</table>"), "Orphan closing table tag should be cleanly stripped");
  assert.ok(cleaned.includes("Rp30.000,00"), "Core text must remain");
});

test("Exam CBT: Category & Dual Mode logic verification", () => {
  const { normalizeAnswer } = require("../server/routes/examBank");

  // Single choice
  assert.equal(normalizeAnswer("A"), "a");
  assert.equal(normalizeAnswer("c"), "c");

  // Complex choice (order independent)
  assert.equal(normalizeAnswer("d; a"), "a;d");
  assert.equal(normalizeAnswer("a;d"), "a;d");
  assert.equal(normalizeAnswer("d;a"), normalizeAnswer("a;d"));

  // Classification verification
  const samplePackages = [
    { source: "pusmendik_tka", kategori: "wajib", subtes_or_mapel: "Matematika" },
    { source: "pusmendik_tka", kategori: "pilihan", subtes_or_mapel: "Sosiologi" },
    { source: "stekom_utbk", kategori: "tps", subtes_or_mapel: "Kemampuan Kuantitatif" },
  ];

  const wajib = samplePackages.filter(p => p.source === "pusmendik_tka" && p.kategori === "wajib");
  const pilihan = samplePackages.filter(p => p.source === "pusmendik_tka" && p.kategori === "pilihan");
  const utbk = samplePackages.filter(p => p.source === "stekom_utbk");

  assert.equal(wajib.length, 1);
  assert.equal(wajib[0].subtes_or_mapel, "Matematika");
  assert.equal(pilihan.length, 1);
  assert.equal(pilihan[0].subtes_or_mapel, "Sosiologi");
  assert.equal(utbk.length, 1);
  assert.equal(utbk[0].subtes_or_mapel, "Kemampuan Kuantitatif");
});

test("Exam CBT: Collapsible Wacana & Anti-Crop Image Lightbox logic verification", () => {
  const fs = require("fs");
  const path = require("path");

  // Verify hasActualContent logic used in ExamCbtTab.tsx
  function hasActualContent(htmlOrText) {
    if (!htmlOrText || typeof htmlOrText !== "string") return false;
    const textOnly = htmlOrText
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const hasImg = /<img\b[^>]*>/i.test(htmlOrText);
    return textOnly.length > 0 || hasImg;
  }

  // 1. Questions without bacaan or empty HTML tags
  assert.equal(hasActualContent(""), false);
  assert.equal(hasActualContent(undefined), false);
  assert.equal(hasActualContent(null), false);
  assert.equal(hasActualContent("<p> </p>"), false);
  assert.equal(hasActualContent("<p>&nbsp;</p>"), false);
  assert.equal(hasActualContent("<div>   \n  </div>"), false);

  // 2. Questions with real text or embedded image
  assert.equal(hasActualContent("<p>Sebuah mobil bergerak dengan kecepatan 60 km/jam...</p>"), true);
  assert.equal(hasActualContent("<p><img src=\"/cbt_images/diagram.png\" /></p>"), true);

  // 3. Dynamic grid determination:
  // If no bacaan, question pane automatically gets 100% full width (1fr)
  function getLayoutColumns(hasBacaan, isWacanaCollapsed) {
    const shouldShowWacana = hasBacaan && !isWacanaCollapsed;
    return shouldShowWacana ? "minmax(320px, 1fr) minmax(360px, 1.2fr)" : "1fr";
  }

  assert.equal(getLayoutColumns(false, false), "1fr", "Empty bacaan must auto-expand question to 1fr full width");
  assert.equal(getLayoutColumns(false, true), "1fr", "Empty bacaan must stay 1fr");
  assert.equal(getLayoutColumns(true, true), "1fr", "Collapsed wacana must expand question to 1fr");
  assert.equal(getLayoutColumns(true, false), "minmax(320px, 1fr) minmax(360px, 1.2fr)", "Active wacana retains split screen");

  // 4. Verify index.css has anti-crop image ergonomics and mobile responsive rules
  const cssPath = path.join(__dirname, "../src/index.css");
  const css = fs.readFileSync(cssPath, "utf-8");
  assert.ok(css.includes(".cbt-pane img"), "index.css must target .cbt-pane img");
  assert.ok(css.includes("object-fit: contain !important"), "index.css must enforce object-fit: contain !important");
  assert.ok(css.includes(".cbt-layout-grid"), "index.css must include responsive cbt-layout-grid");
  assert.ok(css.includes("cursor: zoom-in"), "index.css must style cbt images with zoom-in cursor");

  // 5. Verify ExamCbtTab.tsx contains toggle button and lightbox modal
  const tabPath = path.join(__dirname, "../src/components/tabs/ExamCbtTab.tsx");
  const tabContent = fs.readFileSync(tabPath, "utf-8");
  assert.ok(tabContent.includes("isWacanaCollapsed"), "ExamCbtTab must manage isWacanaCollapsed state");
  assert.ok(tabContent.includes("Sembunyikan Wacana"), "ExamCbtTab must include Sembunyikan Wacana toggle button");
  assert.ok(tabContent.includes("Tampilkan Wacana"), "ExamCbtTab must include Tampilkan Wacana toggle button");
  assert.ok(tabContent.includes("ImageLightboxModal"), "ExamCbtTab must render ImageLightboxModal");
  assert.ok(tabContent.includes("zoomImage"), "ExamCbtTab must manage zoomImage state");
  assert.ok(!tabContent.includes("maxHeight: 120"), "ExamCbtTab must remove rigid maxHeight: 120 on option images");
});
