const fs = require("node:fs");
const path = require("node:path");

// Automatically load .env if process.env.ROUTER_KEY is not yet populated
if (!process.env.ROUTER_KEY) {
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value;
      }
    }
  }
}

const ROUTER_URL = process.env.ROUTER_URL || "http://127.0.0.1:20128/v1";
const ROUTER_KEY = process.env.ROUTER_KEY || "";

async function callRouter(messages, model = "ag/gemini-3.8-flash-low", temperature = 0.3, maxTokens = null, timeoutMs = 180000) {
  const url = `${ROUTER_URL}/chat/completions`;
  const primaryModel = model || "ag/gemini-3.8-flash-low";

  for (let attempt = 0; attempt < 2; attempt++) {
    const curModel = attempt === 0 ? primaryModel : "ag/gemini-3.8-flash-low";
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const payload = {
        model: curModel,
        messages,
        temperature,
        stream: false,
      };
      if (maxTokens && Number.isInteger(maxTokens)) {
        payload.max_tokens = maxTokens;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ROUTER_KEY}`,
          "x-9router-token-saver": "off",
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text();
        if (attempt === 0) {
          console.warn(`callRouter attempt 1 failed with ${curModel}, retrying... ${errText.slice(0, 100)}`);
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw new Error(`9Router error (${res.status}): ${errText}`);
      }

      const rawText = await res.text();
      let fullContent = "";
      if (rawText.trim().startsWith("data:")) {
        for (const line of rawText.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content || "";
            fullContent += delta;
          } catch {}
        }
      } else {
        try {
          const parsed = JSON.parse(rawText);
          fullContent = parsed.choices?.[0]?.message?.content || "";
        } catch {
          fullContent = rawText;
        }
      }

      return fullContent.trim();
    } catch (err) {
      if (attempt === 0) {
        console.warn(`callRouter attempt 1 threw error with ${curModel}, retrying...`, err.message);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }
}

async function search9Router(query, maxResults = 8) {
  try {
    const res = await fetch(`${ROUTER_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ROUTER_KEY}`,
      },
      body: JSON.stringify({ query, max_results: maxResults }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map((r, i) => `${i + 1}. **[${r.title}](${r.url})**\n${r.snippet || r.content || ""}`).join("\n\n");
      }
    }
  } catch (err) {}
  return "";
}

function scoreAcademicRelevance(title, topic, subject = "", extraAliases = []) {
  const tLower = (title || "").toLowerCase();
  const topLower = (topic || "").toLowerCase().trim();
  const subLower = (subject || "").toLowerCase().trim();

  // Reject completely off-topic subjects if searching academic sciences/math/social
  const crossContaminationWords = [
    "teks tanggapan", "teks pidato", "cerpen", "puisi", "pantun", "teks eksplanasi", 
    "teks prosedur", "teks observasi", "surat lamaran", "novel", "drama", "majas"
  ];
  if (!topLower.includes("teks") && !topLower.includes("bahasa") && !topLower.includes("sastra")) {
    for (const bad of crossContaminationWords) {
      if (tLower.includes(bad)) return 0;
    }
  }

  // Database sinonim & akronim istilah pelajaran nasional agar pencarian tidak meleset
  const ACADEMIC_SYNONYMS = {
    "g30s": ["gerakan 30 september", "gestapu", "gestok", "g30s/pki", "pki 1965", "lubang buaya"],
    "pki": ["partai komunis indonesia", "g30s"],
    "voc": ["vereenigde oostindische compagnie", "kongsi dagang belanda"],
    "bpupki": ["badan penyelidik usaha", "dokuritsu junbi cosakai"],
    "ppki": ["panitia persiapan kemerdekaan", "dokuritsu junbi inkai"],
    "dna": ["asam deoksiribonukleat", "genetika"],
    "rna": ["asam ribonukleat"],
    "atp": ["adenosina trifosfat"],
    "kpk": ["kelipatan persekutuan terkecil"],
    "fpb": ["faktor persekutuan terbesar"],
    "spldv": ["sistem persamaan linear dua variabel"],
    "spltv": ["sistem persamaan linear tiga variabel"],
    "glb": ["gerak lurus beraturan"],
    "glbb": ["gerak lurus berubah beraturan"],
    "kimia": ["hukum dasar kimia", "stoikiometri", "lavoisier", "proust", "dalton", "gay lussac", "avogadro"]
  };

  const stopWords = new Set([
    "dan", "yang", "di", "ke", "dari", "untuk", "pada", "adalah", "ini", "itu", "tentang", "kelas", "sma", "smp", "sd",
    "aku", "saya", "kamu", "ingin", "mau", "pengen", "belajar", "tahu", "paham", "tolong", "bikin", "buat", "materi", "soal", "pelajaran"
  ]);

  // Ekstrak keyword dari topik utama + alias dari query pencarian
  const rawWordTokens = [topLower, ...extraAliases.map(a => (a || "").toLowerCase())].join(" ");
  const keywords = Array.from(new Set(
    rawWordTokens.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 2 && !stopWords.has(w))
  ));

  // Kembangkan daftar kata kunci dengan sinonim resmi
  const expandedSynonyms = new Set();
  for (const kw of keywords) {
    if (ACADEMIC_SYNONYMS[kw]) {
      ACADEMIC_SYNONYMS[kw].forEach(syn => expandedSynonyms.add(syn));
    }
  }

  let score = 0;
  let matchedKwCount = 0;

  for (const kw of keywords) {
    if (tLower.includes(kw)) {
      score += 15;
      matchedKwCount++;
    }
  }

  // Berikan skor tinggi jika judul artikel memuat sinonim resmi (misal: judul "Gerakan 30 September" untuk query "G30S")
  for (const syn of expandedSynonyms) {
    if (tLower.includes(syn)) {
      score += 35;
      matchedKwCount += 2;
      break;
    }
  }

  // Reject false positives that only match 1 single generic word when topic has 2+ keywords
  if (keywords.length >= 2 && matchedKwCount < 2 && !tLower.includes(topLower) && !Array.from(expandedSynonyms).some(s => tLower.includes(s))) {
    return 0;
  }

  if (tLower.includes(topLower)) score += 35;

  if (subLower) {
    if (tLower.includes(subLower)) score += 30;
    const allSubjects = ["ekonomi", "sosiologi", "geografi", "sejarah", "matematika", "fisika", "kimia", "biologi", "bahasa indonesia", "bahasa inggris"];
    for (const s of allSubjects) {
      if (s !== subLower && tLower.includes(s)) {
        // Hard filter: jika judul terang-terangan memuat mapel lain yang berbeda, langsung diskualifikasi
        return 0;
      }
    }
  }
  return score;
}

function cleanSegmentText(raw) {
  if (!raw || typeof raw !== "string") return "";
  let s = raw;
  // 1. Strip MathML blocks that clutter Wikipedia text
  s = s.replace(/<math[\s\S]*?<\/math>/gi, "");
  s = s.replace(/<annotation[\s\S]*?<\/annotation>/gi, "");
  // 2. Unescape common HTML entities
  s = s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#038;/g, "&").replace(/&nbsp;/g, " ");
  // 3. Strip remaining raw HTML tags
  s = s.replace(/<[^>]+>/g, " ");
  // 4. Normalize excess whitespace
  s = s.replace(/[ \t]+/g, " ").replace(/\n\s*\n\s*\n+/g, "\n\n").trim();
  return s;
}

async function multiSourceAcademicSearch(topic, subject = "", extraQueries = [], options = {}) {
  const findings = {
    encyclopedia: [],
    textbook: [],
    curriculumLiterature: [],
    ruangguru: [],
    web: []
  };

  const cleanTopic = (topic || "").trim();
  const cleanSubject = (subject || "").trim();
  if (!cleanTopic) return "";

  const isExactScience = /^(?:matematika|fisika)$/i.test(cleanSubject);

  const allQueries = [cleanTopic];
  if (Array.isArray(extraQueries)) {
    extraQueries.forEach(q => {
      const trimmed = (q || "").trim();
      if (trimmed && !allQueries.includes(trimmed)) allQueries.push(trimmed);
    });
  }

  // 1. Wikipedia Indonesia
  try {
    const maxWiki = isExactScience ? 1 : 3;
    for (const q of allQueries) {
      if (findings.encyclopedia.length >= maxWiki) break;
      const sUrl = `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=8&format=json`;
      const sRes = await fetch(sUrl, { headers: { "User-Agent": "TankaAcademicBot/1.0" } });
      if (sRes.ok) {
        const sData = await sRes.json();
        const hits = (sData.query?.search || [])
          .map(h => ({ title: h.title, score: scoreAcademicRelevance(h.title, cleanTopic, cleanSubject, allQueries) }))
          .filter(h => h.score > 0)
          .sort((a, b) => b.score - a.score);

        for (const h of hits.slice(0, maxWiki)) {
          const extUrl = `https://id.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(h.title)}&format=json`;
          const extRes = await fetch(extUrl, { headers: { "User-Agent": "TankaAcademicBot/1.0" } });
          if (extRes.ok) {
            const extData = await extRes.json();
            const page = Object.values(extData.query?.pages || {})[0];
            const cleanedExtract = cleanSegmentText(page?.extract || "");
            if (cleanedExtract.length >= 150 && !findings.encyclopedia.some(e => e.title === page.title)) {
              findings.encyclopedia.push({ title: page.title, snippet: cleanedExtract.slice(0, 8000) });
            }
          }
        }
      }
    }
  } catch (err) {}

  // 2. Wikibooks Indonesia
  try {
    const sUrl = `https://id.wikibooks.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${cleanTopic} ${cleanSubject}`.trim())}&srlimit=6&format=json`;
    const sRes = await fetch(sUrl, { headers: { "User-Agent": "TankaAcademicBot/1.0" } });
    if (sRes.ok) {
      const sData = await sRes.json();
      const hits = (sData.query?.search || [])
        .map(h => ({ title: h.title, score: scoreAcademicRelevance(h.title, cleanTopic, cleanSubject) }))
        .filter(h => h.score > 0)
        .sort((a, b) => b.score - a.score);

      for (const h of hits.slice(0, 3)) {
        const extUrl = `https://id.wikibooks.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(h.title)}&format=json`;
        const extRes = await fetch(extUrl, { headers: { "User-Agent": "TankaAcademicBot/1.0" } });
        if (extRes.ok) {
          const extData = await extRes.json();
          const page = Object.values(extData.query?.pages || {})[0];
          const cleanedExtract = cleanSegmentText(page?.extract || "");
          if (cleanedExtract.length >= 150 && !findings.textbook.some(t => t.title === page.title)) {
            findings.textbook.push({ title: page.title, snippet: cleanedExtract.slice(0, 6000) });
          }
        }
      }
    }
  } catch (err) {}

  // 3. Ruangguru Pedagogical Articles (High Priority for National Curriculum)
  try {
    const rArticles = new Map();
    for (const q of allQueries) {
      const searchUrl = `https://www.ruangguru.com/blog/?s=${encodeURIComponent(q)}`;
      const rRes = await fetch(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
      });
      if (rRes.ok) {
        const rHtml = await rRes.text();
        const cardRegex = /<a[^>]+href="(https:\/\/www\.ruangguru\.com\/blog\/(?!c\/|tag\/)[^"]+)"[^>]*>[\s\S]*?<h2 class="content-title">([\s\S]*?)<\/h2>/gi;
        let m;
        while ((m = cardRegex.exec(rHtml)) !== null) {
          const url = m[1];
          const title = m[2].replace(/<[^>]+>/g, "").replace(/&#038;/g, "&").trim();
          
          // Tolak artikel kompilasi/rangkuman kurikulum satu semester yang terlalu umum
          if (title.toLowerCase().includes("rangkuman materi matematika kelas") || 
              title.toLowerCase().includes("kumpulan materi") ||
              title.toLowerCase().includes("daftar materi")) {
            continue;
          }

          const score = scoreAcademicRelevance(title, cleanTopic, cleanSubject, allQueries);
          if (score > 0 && !rArticles.has(url)) {
            rArticles.set(url, { url, title, score });
          }
        }
      }
    }

    const maxRuangGuru = isExactScience ? 1 : 4;
    const sortedArticles = Array.from(rArticles.values()).sort((a, b) => b.score - a.score);
    for (const art of sortedArticles.slice(0, maxRuangGuru)) {
      try {
        const artRes = await fetch(art.url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
        if (artRes.ok) {
          const artHtml = await artRes.text();
          const bodyText = artHtml
            .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, "")
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
          const paras = [...bodyText.matchAll(/<(?:p|h[234]|li)[^>]*>([\s\S]*?)<\/(?:p|h[234]|li)>/gi)]
            .map(p => cleanSegmentText(p[1]))
            .filter(p => p.length > 25 && 
                         !p.includes("minutes read") && 
                         !p.includes("Download") && 
                         !p.includes("Copyright") && 
                         !p.includes("document.querySelector") &&
                         !p.includes("gtm.start"));
          const fullBody = paras.slice(0, 30).join("\n\n");
          if (fullBody.length >= 150) {
            findings.ruangguru.push({ title: art.title, url: art.url, snippet: fullBody.slice(0, 6000) });
          }
        }
      } catch {}
    }
  } catch (err) {}

  // 4. CrossRef Open Academic API (Protected by Strict Relevance Gate & School Subject Lock)
  // Deactivated by default for general school curricula to prevent off-topic thesis paper contamination
  const schoolSourcesCount = findings.encyclopedia.length + findings.textbook.length + findings.ruangguru.length;
  if (options.allowJournals || schoolSourcesCount === 0) {
    try {
      const url = `https://api.crossref.org/works?query=${encodeURIComponent(`${cleanTopic} ${cleanSubject}`.trim())}&rows=6&select=title,abstract`;
      const res = await fetch(url, { headers: { "User-Agent": "TankaAcademicBot/1.0 (mailto:study@tanka.app)" } });
      if (res.ok) {
        const data = await res.json();
        const items = data.message?.items || [];
        for (const it of items) {
          const title = it.title?.[0];
          if (!title) continue;
          const score = scoreAcademicRelevance(title, cleanTopic, cleanSubject, allQueries);
          if (score < 25) continue; // REJECT unrelated journals like Si Pitung or random theses
          const rawSnippet = it.abstract ? it.abstract.replace(/<[^>]+>/g, "").slice(0, 1500) : "";
          const snippet = cleanSegmentText(rawSnippet);
          if (!findings.curriculumLiterature.some(c => c.title === title) && (snippet.length >= 100 || title.length > 15)) {
            findings.curriculumLiterature.push({ title, snippet });
          }
        }
      }
    } catch (err) {}
  }

  // 5. 9Router Search (Deep Web Search - Free, Unrestricted Queries)
  // Skip external deep web search for exact sciences (Math/Physics) to avoid fractal/thesis noise
  if (!isExactScience) {
    try {
      const [resRaw, resDeep] = await Promise.all([
        search9Router(cleanTopic, 8),
        search9Router(`${cleanTopic} ${cleanSubject} konsep materi penjelasan lengkap`, 8)
      ]);
      if (resRaw) findings.web.push(resRaw);
      if (resDeep && resDeep !== resRaw) findings.web.push(resDeep);
    } catch (err) {}
  }

  let bundle = "";
  const sourceItems = [];

  if (findings.ruangguru.length) {
    bundle += "### 🎒 REFERENSI PEDAGOGIS & POLA AJAR RUANGGURU (Kurikulum Sekolah):\n" +
      findings.ruangguru.map((r, i) => `${i + 1}. **${r.title}**: ${r.snippet}`).join("\n\n") + "\n\n";
    findings.ruangguru.forEach(r => {
      sourceItems.push({ title: r.title, url: r.url, sourceType: "ruangguru", text: r.snippet });
    });
  }
  if (findings.encyclopedia.length) {
    bundle += "### 📚 KONSEP & DEFINISI ENSIKLOPEDIS RESMI (Wikipedia ID):\n" +
      findings.encyclopedia.slice(0, 4).map((e, i) => `${i + 1}. **${e.title}**: ${e.snippet}`).join("\n\n") + "\n\n";
    findings.encyclopedia.slice(0, 4).forEach(e => {
      sourceItems.push({ title: e.title, url: `https://id.wikipedia.org/wiki/${encodeURIComponent(e.title)}`, sourceType: "wikipedia", text: e.snippet });
    });
  }
  if (findings.textbook.length) {
    bundle += "### 📖 MODUL & BUKU TEKS TERBUKA (Wikibuku ID):\n" +
      findings.textbook.slice(0, 2).map((t, i) => `${i + 1}. **${t.title}**: ${t.snippet}`).join("\n\n") + "\n\n";
    findings.textbook.slice(0, 2).forEach(t => {
      sourceItems.push({ title: t.title, url: `https://id.wikibooks.org/wiki/${encodeURIComponent(t.title)}`, sourceType: "wikibooks", text: t.snippet });
    });
  }
  if (findings.curriculumLiterature.length) {
    bundle += "### 🎓 LITERATUR KURIKULUM & KAJIAN BUKU AJAR (CrossRef):\n" +
      findings.curriculumLiterature.slice(0, 3).map((c, i) => `${i + 1}. **${c.title}**${c.snippet ? ": " + c.snippet : ""}`).join("\n\n") + "\n\n";
    findings.curriculumLiterature.slice(0, 3).forEach(c => {
      sourceItems.push({ title: c.title, url: "", sourceType: "crossref", text: c.snippet || c.title });
    });
  }
  if (findings.web.length) {
    bundle += "### 🌐 HASIL PENCARIAN WEB RESMI:\n" + findings.web.join("\n\n") + "\n\n";
    findings.web.forEach((w, idx) => {
      sourceItems.push({ title: `Web Search Reference ${idx + 1}`, url: "", sourceType: "web", text: w });
    });
  }

  const trimmedBundle = bundle.trim();
  return {
    bundle: trimmedBundle,
    sources: sourceItems,
    toString: () => trimmedBundle
  };
}

function detectRealMath(content) {
  if (!content) return false;
  const cleaned = content
    .replace(/Slide\s*\d+/gi, "")
    .replace(/\b\d{4}\s*[-–]\s*\d{4}\b/g, "")
    .replace(/\b(bab|ch|chapter|page|halaman|vol|no)\.?\s*\d+/gi, "");

  if (/[√∑∫≤≥±≠πθλαβγΔ∂∞≈≡]/.test(cleaned)) return true;
  if (/\\(frac|sqrt|lim|int|sum|prod|alpha|beta|theta|pi|partial|infty|approx|times|div)\b/.test(cleaned)) return true;

  const hasAlgebraicKeywords = /(rumus|persamaan|kalkulasi|perhitungan|fungsi kuadrat|trigonometri|aljabar|matematika|derivatif|integral|vektor)/i.test(cleaned);
  const hasAlgebraicPattern = /\b[a-zA-Z]\s*=\s*[\d\w\(\)\+\-\*\/\^]+/i.test(cleaned);
  return hasAlgebraicKeywords && hasAlgebraicPattern;
}

// True Academic Title Detector: extracts a real topic title (e.g. "Komposisi Transformasi Parabola")
async function detectDocumentTitle(content, fallback = "Dokumen Materi") {
  try {
    const prompt = `Tentukan topik pembelajaran atau judul materi yang paling akurat, spesifik, dan ringkas (3 sampai 6 kata) berdasarkan isi materi berikut.
PENTING:
- DILARANG menggunakan nama file berkas seperti "img_...", "scan_...", atau "dokumen 1".
- DILARANG menggunakan tanda kutip, kata pengantar, kurung, atau emotikon.
- HANYA tuliskan judul singkatnya saja dalam bahasa Indonesia baku (misal: "Komposisi Transformasi Translasi dan Dilatasi", "Struktur Sosial dan Diferensiasi", "Hukum Permintaan dan Penawaran").\n\nIsi materi:\n"""\n${(content || "").slice(0, 3500)}\n"""`;

    const reply = await callRouter([
      { role: "system", content: "Anda adalah asisten kurikulum akademik. Tugas Anda memberikan judul topik materi yang akurat, baku, dan singkat (3-6 kata) berdasarkan isi materi teks." },
      { role: "user", content: prompt }
    ], "ag/gemini-3.8-flash-low", 0.1);

    const clean = (reply || "").replace(/["'\n\r*#]/g, "").trim();
    if (clean && clean.length > 3 && clean.length < 65 && !/^(img|image|scan|doc|file|whatsapp|telegram)[_\d\s]/i.test(clean)) {
      return clean;
    }
  } catch (err) {
    console.error("Auto title detection failed:", err.message);
  }
  return fallback;
}

async function extractTextWithAIVision(base64Data, mimeType = "image/jpeg", model = "ag/gemini-3.8-flash-high") {
  const prompt = `Anda adalah asisten OCR akademik presisi tinggi untuk buku pelajaran, lembar soal, dan catatan belajar siswa.
Tugas Anda: Baca dan transkripsikan SELURUH konten pada gambar ini dengan sangat teliti dan akurat.

JENIS KONTEN YANG HARUS DITRANSKRIPSI:
1. Teks Cetak & Tulisan Tangan: Transkripsikan kata per kata sesuai susunan visual aslinya. Jika tulisan tangan miring atau buram, gunakan konteks kalimat akademik tanpa mengarang.
2. Rumus Matematika / Eksak: WAJIB gunakan notasi KaTeX rapi ($...$ untuk sebaris, $$...$$ untuk blok rumus, misal $x^2$, $\\frac{a}{b}$, $\\sqrt{x}$). Untuk koma desimal Indonesia dalam rumus, gunakan format kurung kurawal seperti $0{,}5$.
3. Soal Latihan & Pilihan Ganda: Tuliskan nomor soal, teks pertanyaan, lalu letakkan masing-masing opsi jawaban (A, B, C, D, E) pada baris baru yang terpisah.
4. Tabel: Transkripsikan dalam format Markdown Table rapi (| Kolom 1 | Kolom 2 |).
5. Diagram / Bagan Alur: Transkripsikan hubungan alur secara hierarkis menggunakan tanda panah (➔) atau poin bersarang.

ATURAN KELUARAN:
- HANYA berikan teks transkripsi materi yang terbaca.
- DILARANG menambahkan kata pengantar seperti "Berikut adalah hasil transkripsi" atau kalimat penutup.`;

  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Data}`
          }
        }
      ]
    }
  ];

  try {
    const targetModel = model || "ag/gemini-3.8-flash-high";
    const result = await callRouter(messages, targetModel, 0.1);
    return result ? result.trim() : "";
  } catch (err) {
    console.error("AI Vision extraction failed:", err.message);
    // Fallback to flash-low if flash-high errors out
    try {
      const fallbackResult = await callRouter(messages, "ag/gemini-3.8-flash-low", 0.1);
      return fallbackResult ? fallbackResult.trim() : "";
    } catch (e2) {
      return "";
    }
  }
}

function detectQuestionPatterns(text) {
  if (!text || typeof text !== "string") return false;
  const optionMatches = text.match(/(?:^|\n|\s)[A-Ea-e][\.\)]\s+[^\n]+/g);
  const questionNumberMatches = text.match(/(?:^|\n)\s*(?:\d+[\.\)]|\bSoal\s*\d+|\bNo\.?\s*\d+)/g);
  const hasKeywords = /\b(kisi-kisi|pilihan ganda|pilihlah|berikut ini yang|manakah|latihan soal|ulangan harian|ujian sekolah|try out|pertanyaan berikut)\b/i.test(text);

  if (optionMatches && optionMatches.length >= 3) return true;
  if (questionNumberMatches && questionNumberMatches.length >= 2 && ((optionMatches && optionMatches.length >= 2) || hasKeywords)) return true;
  if (hasKeywords && optionMatches && optionMatches.length >= 2) return true;
  return false;
}

module.exports = {
  ROUTER_URL,
  ROUTER_KEY,
  callRouter,
  search9Router,
  scoreAcademicRelevance,
  multiSourceAcademicSearch,
  detectRealMath,
  detectDocumentTitle,
  extractTextWithAIVision,
  detectQuestionPatterns
};
