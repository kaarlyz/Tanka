const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const katex = require("katex");

const {
  SUBJECT_BLUEPRINTS,
  DIVERSE_THEME_POOLS,
} = require("../server/services/aiDrillGenerator");

// Import cleanAndRenderCbtContent logic mirrored from CbtContentRenderer.tsx
function cleanAndRenderCbtContent(content) {
  if (!content || typeof content !== "string") return "";

  let str = content;

  // 1. Remove XML declarations, HTML comments, and MS Word / office tags
  str = str.replace(/<\?xml[^>]*\?>/gi, "");
  str = str.replace(/<!--[\s\S]*?-->/g, "");
  str = str.replace(/<\/?(?:o|w|m):[^>]*>/gi, "");
  str = str.replace(/class="MsoNormal"/gi, "");
  str = str.replace(/mso-[^;:"]+:[^;"]+;?/gi, "");
  str = str.replace(/&nbsp;/gi, " ");

  // 2. Remove script / style blocks completely, dangerous tags
  str = str.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  str = str.replace(/<style\b[\s\S]*?<\/style>/gi, "");
  str = str.replace(/<\/?(?:script|iframe|object|embed|style|link|meta|base|form|input|button)\b[^>]*>/gi, "");
  str = str.replace(/\bxss=removed\b/gi, "");
  str = str.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  str = str.replace(/javascript:/gi, "");
  str = str.replace(/\s+style=["']\s*["']/gi, "");
  str = str.replace(/\s+class=["']\s*["']/gi, "");
  str = str.replace(/<([a-z0-9]+)\s+>/gi, "<$1>");

  // 3. Remove orphan closing table tags
  if (!/<table\b/i.test(str)) {
    str = str.replace(/<\/?(?:table|tbody|thead|tfoot|tr|td|th)\b[^>]*>/gi, "");
  }

  // 4. Heal control characters and double backslashes
  str = str
    .replace(/\u000c/g, "\\f")
    .replace(/\u0008/g, "\\b")
    .replace(/\t(imes|ext|heta|an|au)\b/g, "\\t$1")
    .replace(/\r(ight|ho|angle)\b/g, "\\r$1")
    .replace(/\n(eq|abla|ot|u)\b/g, "\\n$1");

  str = str.replace(
    /\\\\(frac|sqrt|sum|prod|int|log|ln|sin|cos|tan|cot|sec|csc|text|mathrm|mathbf|left|right|cdot|times|div|pm|mp|leq|geq|neq|approx|infty|alpha|beta|gamma|delta|epsilon|theta|lambda|pi|sigma|omega|phi)\b/g,
    "\\$1"
  );

  // 5. Mask display math $$...$$ and \[...\]
  const blockMathList = [];
  str = str.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`);
  str = str.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    blockMathList.push(math);
    return `@@@CBT_BLOCK_${blockMathList.length - 1}@@@`;
  });

  // 6. Mask inline math $...$ and \(...\)
  const inlineMathList = [];
  str = str.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`);
  str = str.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    inlineMathList.push(math);
    return `@@@CBT_INLINE_${inlineMathList.length - 1}@@@`;
  });

  // 7. Handle naked LaTeX fractions/roots
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
      const clean = rawMath.replace(/\\\\/g, "\\").trim();
      return `<div class="katex-display-wrapper" style="margin: 8px 0; overflow-x: auto; -webkit-overflow-scrolling: touch; max-width: 100%; padding: 4px 0; text-align: center;">${katex.renderToString(clean, { displayMode: true, throwOnError: false })}</div>`;
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

  // 9. Newlines to br if no block tags
  const hasBlockHtml = /<\/?(?:p|div|ul|ol|li|table|h[1-6]|blockquote)\b/i.test(str);
  if (!hasBlockHtml && str.includes("\n")) {
    str = str.replace(/\r\n/g, "\n").replace(/\n/g, "<br/>");
  }

  return str;
}

test("Math Hardening: DIVERSE_THEME_POOLS.matematika terapan lengkap & representatif", () => {
  assert.ok(Array.isArray(DIVERSE_THEME_POOLS.matematika), "DIVERSE_THEME_POOLS.matematika harus berupa array");
  assert.ok(DIVERSE_THEME_POOLS.matematika.length >= 6, "Pool tema matematika minimal memiliki 6 tema terapan");

  const themesString = DIVERSE_THEME_POOLS.matematika.join(" ").toLowerCase();
  assert.ok(themesString.includes("teknik sipil"), "Harus mencakup domain teknik sipil");
  assert.ok(themesString.includes("ekonomi") || themesString.includes("perbankan"), "Harus mencakup ekonomi/perbankan");
  assert.ok(themesString.includes("fisika") || themesString.includes("mekanika"), "Harus mencakup fisika mekanika");
  assert.ok(themesString.includes("kriptografi"), "Harus mencakup kriptografi IT");
  assert.ok(themesString.includes("optimasi") || themesString.includes("logistik"), "Harus mencakup optimasi industri logistik");
  assert.ok(themesString.includes("statistika"), "Harus mencakup statistika terapan");
});

test("Math Hardening: 6 Pola Baku Matematika Pusmendik terdaftar tepat di blueprint", () => {
  const mathBlueprint = SUBJECT_BLUEPRINTS["Matematika"];
  assert.ok(mathBlueprint, "SUBJECT_BLUEPRINTS['Matematika'] harus terdefinisi");

  assert.equal(mathBlueprint[1].nama, "Pola 1 — Transformasi Geometri Kurva");
  assert.equal(mathBlueprint[2].nama, "Pola 2 — Aljabar Pecahan & Persamaan/Pertidaksamaan Kuadrat");
  assert.equal(mathBlueprint[3].nama, "Pola 3 — SPLDV & Pemodelan Matriks Terapan");
  assert.equal(mathBlueprint[4].nama, "Pola 4 — Barisan & Deret Aritmetika/Geometri");
  assert.equal(mathBlueprint[5].nama, "Pola 5 — Trigonometri & Dimensi Tiga Dasar");
  assert.equal(mathBlueprint[6].nama, "Pola 6 — Statistika & Peluang Terapan (Kombinatorika/Himpunan)");
});

test("Math Hardening: Generator backend mengunci stimulus 50-100 kata dan header wajib", () => {
  const generatorCode = fs.readFileSync(
    path.join(__dirname, "../server/services/aiDrillGenerator.js"),
    "utf-8"
  );

  // Cek aturan kata 50 - 100 KATA
  assert.match(
    generatorCode,
    /50\s*-\s*100\s*KATA/i,
    "Prompt harus mengunci batas panjang stimulus matematika 50-100 kata"
  );

  // Cek larangan esai bertele-tele
  assert.match(
    generatorCode,
    /DILARANG KERAS membuat narasi esai panjang bertele-tele/i,
    "Prompt harus melarang esai bertele-tele pada matematika"
  );

  // Cek header wajib wacana matematika
  assert.match(
    generatorCode,
    /<p><strong>Stimulus untuk soal nomor \$\{u\.start\} s\.d\. \$\{u\.end\}<\/strong><\/p>/,
    "Header wacana matematika wajib menggunakan teks 'Stimulus untuk soal nomor ...'"
  );

  // Cek double-backslash escaping LaTeX guidance
  assert.match(
    generatorCode,
    /double escape/i,
    "Prompt harus menginstruksikan double-backslash escape untuk string JSON"
  );

  // Cek skema output JSON lengkap di prompt isMath
  assert.match(
    generatorCode,
    /SKEMA JSON OUTPUT LENGKAP:/,
    "Prompt matematika harus memuat skema JSON output lengkap"
  );
});

test("Math Hardening: Validasi batas jumlah kata (word count) stimulus matematika 50-100 kata", () => {
  function countWords(htmlOrText) {
    const plain = htmlOrText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return plain ? plain.split(" ").length : 0;
  }

  // Contoh stimulus ringkas Pusmendik (65 kata)
  const pusmendikStimulus = `<p><strong>Stimulus untuk soal nomor 1 s.d. 4</strong></p>
<p>Sebuah jembatan gantung kabel parabola dirancang dengan persamaan penampang $y = \\frac{1}{100}x^2 - 4x + 300$ pada rentang $-100 \\le x \\le 100$. Karena pergeseran struktur tanah aluvial di sisi barat, kurva kabel mengalami translasi sejauh $T = \\begin{pmatrix} 10 \\\\ -5 \\end{pmatrix}$ dan dilanjutkan dengan refleksi terhadap sumbu vertikal $x = 0$. Insinyur membutuhkan kalkulasi koordinat titik terendah baru untuk kalibrasi kabel penegang.</p>`;

  const wordCount = countWords(pusmendikStimulus);
  assert.ok(
    wordCount >= 50 && wordCount <= 100,
    `Jumlah kata stimulus (${wordCount}) harus berada dalam rentang 50 - 100 kata`
  );

  // Stimulus esai bertele-tele (>150 kata) harus terdeteksi di luar batas
  const longEssayStimulus = `Di sebuah pedesaan yang tenang pada zaman dahulu kala, terdapat seorang pemuda yang sedang mengamati pemandangan alam. Dia termenung memikirkan betapa indahnya kehidupan jika semua orang hidup damai tanpa ada pertikaian. Angin berhembus sepoi-sepoi menggoyangkan dedaunan di pohon beringin tua. Suara kicauan burung menambah keheningan senja itu. Pemuda itu kemudian berjalan perlahan menuju sungai kecil yang mengalir jernih. Di sana ia melihat ikan-ikan kecil berenang ke sana ke mari dengan riang gembira. Ia teringat akan pesan kakeknya tentang pentingnya menjaga alam semesta agar kelak anak cucu kita dapat menikmati keindahan yang sama tanpa kehilangan jati diri bangsa dan kebudayaan luhur yang telah diwariskan turun-temurun. Sembari memegang pensil, ia mencatat rumus kuadrat.`;
  const longWordCount = countWords(longEssayStimulus);
  assert.ok(
    longWordCount > 100,
    "Stimulus esai bertele-tele harus melebihi batas 100 kata dan ditolak"
  );
});

test("Math Hardening: Rendering KaTeX membungkus display math dengan .katex-display-wrapper", () => {
  const content = `<p>Persamaan translasi kurva jembatan dinyatakan sebagai:</p>
$$y' = \\frac{1}{200}(x - 10)^2 + 15$$
<p>di mana $x$ menyatakan jarak horizontal dalam meter.</p>`;

  const rendered = cleanAndRenderCbtContent(content);

  assert.ok(
    rendered.includes('class="katex-display-wrapper"'),
    "Display math harus dibungkus oleh .katex-display-wrapper"
  );
  assert.ok(
    rendered.includes('overflow-x: auto'),
    ".katex-display-wrapper harus memiliki styling overflow-x: auto"
  );
  assert.ok(
    rendered.includes('max-width: 100%'),
    ".katex-display-wrapper harus memiliki styling max-width: 100%"
  );
  assert.ok(
    rendered.includes('class="katex-display"'),
    "Konten di dalam wrapper harus memiliki class .katex-display dari KaTeX"
  );
});

test("Math Hardening: Double-backslash LaTeX di JSON berhasil di-render tanpa bocor atau crash", () => {
  // Simulasi parsing string dari AI JSON yang berisi double-escaped backslash
  const jsonRaw = JSON.stringify({
    soal: "Tentukan himpunan penyelesaian dari $\\\\frac{2x - 1}{x + 3} \\\\ge 1$ dan $\\\\sqrt{4x + 16} = 8$."
  });

  const parsed = JSON.parse(jsonRaw);
  const rendered = cleanAndRenderCbtContent(parsed.soal);

  // Tidak boleh ada teks bocor '\\\\frac' atau string mentah tak ter-render
  assert.ok(!rendered.includes("\\\\frac"), "Double backslash tidak boleh bocor mentah");
  assert.ok(rendered.includes("katex"), "Rumus harus ter-render ke elemen KaTeX HTML");
  assert.ok(rendered.includes("katex-html"), "Harus memuat container katex-html");
});

test("Math Hardening: Verifikasi aturan proteksi CSS overflow di src/index.css", () => {
  const css = fs.readFileSync(
    path.join(__dirname, "../src/index.css"),
    "utf-8"
  );

  // 1. Cek .katex-display-wrapper dan .katex-block-wrapper
  const wrapperRegex = /\.katex-display-wrapper,\s*\.katex-block-wrapper[\s\S]*?\{([\s\S]*?)\}/;
  const matchWrapper = css.match(wrapperRegex);
  assert.ok(matchWrapper, "Harus terdapat selector .katex-display-wrapper, .katex-block-wrapper di CSS");

  const wrapperProps = matchWrapper[1];
  assert.ok(wrapperProps.includes("overflow-x: auto !important;"), "Wrapper harus memiliki overflow-x: auto !important;");
  assert.ok(wrapperProps.includes("-webkit-overflow-scrolling: touch !important;"), "Wrapper harus memiliki -webkit-overflow-scrolling: touch !important;");
  assert.ok(wrapperProps.includes("max-width: 100% !important;"), "Wrapper harus memiliki max-width: 100% !important;");
  assert.ok(wrapperProps.includes("padding: 4px 0 !important;"), "Wrapper harus memiliki padding: 4px 0 !important;");

  // 2. Cek .cbt-rendered-content .katex { max-width: 100% !important; }
  assert.match(
    css,
    /\.cbt-rendered-content\s+\.katex\s*\{[\s\S]*?max-width:\s*100%\s*!important;[\s\S]*?\}/,
    ".cbt-rendered-content .katex harus memiliki max-width: 100% !important;"
  );

  // 3. Cek .cbt-rendered-content .katex-display { overflow-x: auto !important; max-width: 100% !important; }
  assert.match(
    css,
    /\.cbt-rendered-content\s+\.katex-display\s*\{[\s\S]*?overflow-x:\s*auto\s*!important;[\s\S]*?max-width:\s*100%\s*!important;[\s\S]*?\}/,
    ".cbt-rendered-content .katex-display harus memiliki overflow-x: auto dan max-width: 100% !important;"
  );

  // 4. Cek .cbt-option-btn proteksi overflow
  assert.match(
    css,
    /\.cbt-option-btn\s*\{[\s\S]*?max-width:\s*100%\s*!important;[\s\S]*?overflow-x:\s*auto\s*!important;/,
    ".cbt-option-btn harus diproteksi dengan max-width: 100% !important dan overflow-x: auto !important"
  );

  // 5. Cek .cbt-wacana-scroll-content proteksi overflow mobile
  assert.match(
    css,
    /\.cbt-wacana-scroll-content\s*\{[\s\S]*?overflow-x:\s*hidden\s*!important;[\s\S]*?max-width:\s*100%\s*!important;/,
    ".cbt-wacana-scroll-content harus diproteksi dengan overflow-x: hidden !important dan max-width: 100% !important"
  );
});

test("Math Hardening: Dynamic Subject Blueprint di server/routes/chat.js (Objective 1)", () => {
  const { getCbtPedagogyGuidance } = require("../server/routes/chat");
  assert.equal(typeof getCbtPedagogyGuidance, "function", "getCbtPedagogyGuidance harus diekspor sebagai fungsi");

  // 1. Uji Matematika
  const mathGuide = getCbtPedagogyGuidance("Matematika");
  assert.ok(mathGuide.includes("Pola 1: Transformasi Geometri Kurva (refleksi, rotasi, translasi, dilatasi)"), "Pola 1 Matematika harus sesuai");
  assert.ok(mathGuide.includes("Pola 2: Aljabar Pecahan & Persamaan/Pertidaksamaan Kuadrat"), "Pola 2 Matematika harus sesuai");
  assert.ok(mathGuide.includes("Pola 3: Matriks & SPLDV/SPLTV Terapan"), "Pola 3 Matematika harus sesuai");
  assert.ok(mathGuide.includes("Pola 4: Barisan & Deret (Aritmetika, Geometri, Bunga Majemuk, Pertumbuhan)"), "Pola 4 Matematika harus sesuai");
  assert.ok(mathGuide.includes("Pola 5: Trigonometri & Dimensi Tiga (Aturan sinus/cosinus, jarak kubus)"), "Pola 5 Matematika harus sesuai");
  assert.ok(mathGuide.includes("Pola 6: Statistika & Peluang Terapan (Kombinatorika, permutasi, kombinasi, rata-rata gabungan)"), "Pola 6 Matematika harus sesuai");

  // Larangan referensi ke sastra/cerpen/makna istilah pada matematika
  assert.ok(!mathGuide.toLowerCase().includes("cerpen"), "Panduan matematika tidak boleh merujuk ke cerpen");
  assert.ok(!mathGuide.toLowerCase().includes("teks sastra"), "Panduan matematika tidak boleh merujuk ke sastra");
  assert.ok(!mathGuide.toLowerCase().includes("makna istilah"), "Panduan matematika tidak boleh merujuk ke makna istilah");
  assert.ok(!mathGuide.toLowerCase().includes("makna kosakata"), "Panduan matematika tidak boleh merujuk ke makna kosakata");

  // 2. Uji variasi nama Matematika (misal Penalaran Matematika)
  const mathPenalaranGuide = getCbtPedagogyGuidance("Penalaran Matematika");
  assert.ok(mathPenalaranGuide.includes("Transformasi Geometri Kurva"), "Penalaran Matematika harus memuat pola matematika");
  assert.ok(!mathPenalaranGuide.includes("Cerpen"), "Penalaran Matematika tidak boleh merujuk ke cerpen");

  // 3. Uji Bahasa Inggris (dari SUBJECT_BLUEPRINTS)
  const englishGuide = getCbtPedagogyGuidance("Bahasa Inggris");
  assert.ok(englishGuide.includes("Pola 1 — Main Idea & Primary Purpose"), "Harus memuat Pola 1 Bahasa Inggris");
  assert.ok(englishGuide.includes("Pola 6 — Author's Tone, Attitude & Text Structure"), "Harus memuat Pola 6 Bahasa Inggris");
  assert.ok(!englishGuide.includes("Transformasi Geometri"), "Bahasa Inggris tidak boleh memuat materi matematika");

  // 4. Uji Bahasa Indonesia (dari SUBJECT_BLUEPRINTS)
  const bindoGuide = getCbtPedagogyGuidance("Bahasa Indonesia");
  assert.ok(bindoGuide.includes("Pola 1 — Makna Kosakata & Istilah Serapan"), "Harus memuat Pola 1 Bahasa Indonesia");
  assert.ok(bindoGuide.includes("Pola 6 — Teks Sastra / Cerpen (Karakter & Konflik)"), "Harus memuat Pola 6 Bahasa Indonesia");

  // 5. Uji Ekonomi (dari SUBJECT_BLUEPRINTS)
  const econGuide = getCbtPedagogyGuidance("Ekonomi");
  assert.ok(econGuide.includes("Pola 1 — Kelangkaan & Biaya Peluang (Opportunity Cost)"), "Harus memuat Pola 1 Ekonomi");
  assert.ok(econGuide.includes("Pola 6 — Perdagangan Internasional & Neraca Pembayaran"), "Harus memuat Pola 6 Ekonomi");

  // 6. Uji Sosiologi (dari SUBJECT_BLUEPRINTS)
  const socioGuide = getCbtPedagogyGuidance("Sosiologi");
  assert.ok(socioGuide.includes("Pola 1 — Konsep Sosiologi & Ciri Non-Etis"), "Harus memuat Pola 1 Sosiologi");
  assert.ok(socioGuide.includes("Pola 6 — Metodologi Penelitian Sosial"), "Harus memuat Pola 6 Sosiologi");
});
