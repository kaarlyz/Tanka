const ROUTER_URL = process.env.ROUTER_URL || "http://127.0.0.1:20128/v1";
const ROUTER_KEY = process.env.ROUTER_KEY || "";

async function callRouter(messages, model = "ag/gemini-3.8-flash-low", temperature = 0.3) {
  const url = `${ROUTER_URL}/chat/completions`;
  const primaryModel = model || "ag/gemini-3.8-flash-low";

  for (let attempt = 0; attempt < 2; attempt++) {
    const curModel = attempt === 0 ? primaryModel : "ag/gemini-3.8-flash-low";
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ROUTER_KEY}`,
        },
        body: JSON.stringify({
          model: curModel,
          messages,
          temperature,
          stream: false,
        }),
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

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
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

async function search9Router(query) {
  try {
    const res = await fetch(`${ROUTER_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ROUTER_KEY}`,
      },
      body: JSON.stringify({ query, max_results: 4 }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map((r, i) => `${i + 1}. [${r.title}](${r.url}): ${r.snippet}`).join("\n\n");
      }
    }
  } catch (err) {}
  return "";
}

function scoreAcademicRelevance(title, topic, subject = "") {
  const tLower = (title || "").toLowerCase();
  const topLower = (topic || "").toLowerCase().trim();
  const subLower = (subject || "").toLowerCase().trim();

  const stopWords = new Set(["dan", "yang", "di", "ke", "dari", "untuk", "pada", "adalah", "ini", "itu", "tentang", "kelas", "sma", "smp", "sd"]);
  const keywords = topLower.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 2 && !stopWords.has(w));

  let score = 0;
  for (const kw of keywords) {
    if (tLower.includes(kw)) score += 10;
  }
  if (tLower.includes(topLower)) score += 30;

  if (subLower) {
    if (tLower.includes(subLower)) score += 25;
    const allSubjects = ["ekonomi", "sosiologi", "geografi", "sejarah", "matematika", "fisika", "kimia", "biologi"];
    for (const s of allSubjects) {
      if (s !== subLower && tLower.includes(s)) {
        score -= 40;
      }
    }
  }
  return score;
}

async function multiSourceAcademicSearch(topic, subject = "") {
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

  // 1. Wikipedia Indonesia
  try {
    const sUrl = `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanTopic)}&srlimit=4&format=json`;
    const sRes = await fetch(sUrl, { headers: { "User-Agent": "TankaAcademicBot/1.0" } });
    if (sRes.ok) {
      const sData = await sRes.json();
      const hits = (sData.query?.search || [])
        .map(h => ({ title: h.title, score: scoreAcademicRelevance(h.title, cleanTopic, cleanSubject) }))
        .filter(h => h.score > 0)
        .sort((a, b) => b.score - a.score);

      for (const h of hits.slice(0, 2)) {
        const extUrl = `https://id.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(h.title)}&format=json`;
        const extRes = await fetch(extUrl, { headers: { "User-Agent": "TankaAcademicBot/1.0" } });
        if (extRes.ok) {
          const extData = await extRes.json();
          const page = Object.values(extData.query?.pages || {})[0];
          if (page?.extract && page.extract.length > 50 && !findings.encyclopedia.some(e => e.title === page.title)) {
            findings.encyclopedia.push({ title: page.title, snippet: page.extract.slice(0, 3500) });
          }
        }
      }
    }
  } catch (err) {}

  // 2. Wikibooks Indonesia
  try {
    const sUrl = `https://id.wikibooks.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${cleanTopic} ${cleanSubject}`.trim())}&srlimit=3&format=json`;
    const sRes = await fetch(sUrl, { headers: { "User-Agent": "TankaAcademicBot/1.0" } });
    if (sRes.ok) {
      const sData = await sRes.json();
      const hits = (sData.query?.search || [])
        .map(h => ({ title: h.title, score: scoreAcademicRelevance(h.title, cleanTopic, cleanSubject) }))
        .filter(h => h.score > 0)
        .sort((a, b) => b.score - a.score);

      for (const h of hits.slice(0, 1)) {
        const extUrl = `https://id.wikibooks.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(h.title)}&format=json`;
        const extRes = await fetch(extUrl, { headers: { "User-Agent": "TankaAcademicBot/1.0" } });
        if (extRes.ok) {
          const extData = await extRes.json();
          const page = Object.values(extData.query?.pages || {})[0];
          if (page?.extract && page.extract.length > 50 && !findings.textbook.some(t => t.title === page.title)) {
            findings.textbook.push({ title: page.title, snippet: page.extract.slice(0, 2500) });
          }
        }
      }
    }
  } catch (err) {}

  // 3. CrossRef Open Academic API
  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(`${cleanTopic} Kurikulum Merdeka SMA ${cleanSubject}`.trim())}&rows=3&select=title,abstract`;
    const res = await fetch(url, { headers: { "User-Agent": "TankaAcademicBot/1.0 (mailto:study@tanka.app)" } });
    if (res.ok) {
      const data = await res.json();
      const items = data.message?.items || [];
      for (const it of items) {
        const title = it.title?.[0];
        const snippet = it.abstract ? it.abstract.replace(/<[^>]+>/g, "").slice(0, 500) : "";
        if (title && !findings.curriculumLiterature.some(c => c.title === title)) {
          findings.curriculumLiterature.push({ title, snippet });
        }
      }
    }
  } catch (err) {}

  // 4. Ruangguru Pedagogical Articles
  try {
    const queries = [cleanTopic];
    const simplified = cleanTopic.replace(/^(faktor\s+(?:pendorong|penghambat|penyebab)?|teori|pengertian|konsep|macam-macam|bentuk-bentuk)\s+/i, "").trim();
    if (simplified && simplified.toLowerCase() !== cleanTopic.toLowerCase()) {
      queries.push(simplified);
    }

    const rArticles = new Map();
    for (const q of queries) {
      const searchUrl = `https://www.ruangguru.com/blog/?s=${encodeURIComponent(q)}`;
      const rRes = await fetch(searchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
      });
      if (rRes.ok) {
        const rHtml = await rRes.text();
        const cardRegex = /<a[^>]+href="(https:\/\/www\.ruangguru\.com\/blog\/[^"]+)"[^>]*>[\s\S]*?<h2 class="content-title">([\s\S]*?)<\/h2>/gi;
        let m;
        while ((m = cardRegex.exec(rHtml)) !== null) {
          const url = m[1];
          if (url.includes("/blog/c/") || url.includes("/tag/")) continue;
          const title = m[2].replace(/<[^>]+>/g, "").replace(/&#038;/g, "&").trim();
          const score = scoreAcademicRelevance(title, cleanTopic, cleanSubject);
          if (score > 0 && !rArticles.has(url)) {
            rArticles.set(url, { url, title, score });
          }
        }
      }
    }

    const sortedArticles = Array.from(rArticles.values()).sort((a, b) => b.score - a.score);
    for (const art of sortedArticles.slice(0, 2)) {
      try {
        const artRes = await fetch(art.url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
        if (artRes.ok) {
          const artHtml = await artRes.text();
          const bodyText = artHtml
            .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, "")
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
          const paras = [...bodyText.matchAll(/<(?:p|h[234]|li)[^>]*>([\s\S]*?)<\/(?:p|h[234]|li)>/gi)]
            .map(p => p[1].replace(/<[^>]+>/g, "").replace(/&#038;/g, "&").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').trim())
            .filter(p => p.length > 25 && 
                         !p.includes("minutes read") && 
                         !p.includes("Download") && 
                         !p.includes("Copyright") &&
                         !p.includes("document.querySelector") &&
                         !p.includes("gtm.start"));
          const fullBody = paras.slice(0, 22).join("\n\n");
          if (fullBody.length > 80) {
            findings.ruangguru.push({ title: art.title, url: art.url, snippet: fullBody.slice(0, 3500) });
          }
        }
      } catch {}
    }
  } catch (err) {}

  // 5. 9Router Search
  try {
    const res9 = await search9Router(`${cleanTopic} ${cleanSubject} silabus SMA kurikulum merdeka`);
    if (res9) {
      findings.web.push(res9);
    }
  } catch (err) {}

  let bundle = "";
  if (findings.ruangguru.length) {
    bundle += "### 🎒 REFERENSI PEDAGOGIS & POLA AJAR RUANGGURU (Kurikulum Sekolah):\n" +
      findings.ruangguru.map((r, i) => `${i + 1}. **${r.title}**: ${r.snippet}`).join("\n\n") + "\n\n";
  }
  if (findings.encyclopedia.length) {
    bundle += "### 📚 KONSEP & DEFINISI ENSIKLOPEDIS RESMI (Wikipedia ID):\n" +
      findings.encyclopedia.slice(0, 4).map((e, i) => `${i + 1}. **${e.title}**: ${e.snippet}`).join("\n\n") + "\n\n";
  }
  if (findings.textbook.length) {
    bundle += "### 📖 MODUL & BUKU TEKS TERBUKA (Wikibuku ID):\n" +
      findings.textbook.slice(0, 2).map((t, i) => `${i + 1}. **${t.title}**: ${t.snippet}`).join("\n\n") + "\n\n";
  }
  if (findings.curriculumLiterature.length) {
    bundle += "### 🎓 LITERATUR KURIKULUM & KAJIAN BUKU AJAR (CrossRef):\n" +
      findings.curriculumLiterature.slice(0, 3).map((c, i) => `${i + 1}. **${c.title}**${c.snippet ? ": " + c.snippet : ""}`).join("\n\n") + "\n\n";
  }
  if (findings.web.length) {
    bundle += "### 🌐 HASIL PENCARIAN WEB RESMI:\n" + findings.web.join("\n\n") + "\n\n";
  }

  return bundle.trim();
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

async function extractTextWithAIVision(base64Data, mimeType = "image/jpeg") {
  const prompt = `Anda adalah asisten akademik cerdas yang ahli dalam membaca dokumen dan catatan belajar.
Tugas Anda: Baca dan transkripsikan SELURUH konten pada gambar ini dengan sangat teliti dan akurat.
Gambar ini bisa berupa:
- Tulisan tangan (catatan buku, coretan rumus, ringkasan belajar)
- Teks cetak buku pelajaran, lembar soal, atau modul
- Rumus matematika atau lambang eksak (WAJIB gunakan notasi LaTeX/KaTeX rapi seperti $x^2$, $\\frac{a}{b}$, $\\sqrt{x}$)
- Diagram, bagan alur, atau mindmap (transkripsikan dalam bentuk teks hierarkis/poin berurutan)

Aturan:
1. Jika tulisan tangan agak miring atau sulit dibaca, gunakan konteks kalimat akademik untuk mengenali kata yang paling tepat. Jangan halusinasi.
2. Jika ada soal latihan, transkripsikan pertanyaan beserta semua pilihan gandanya (A, B, C, D, E) jika ada.
3. HANYA berikan teks transkripsi materi yang terbaca. Jangan tambahkan kata pengantar seperti "Berikut adalah hasil transkripsi" atau kalimat penutup.`;

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
    const result = await callRouter(messages, "ag/gemini-3.8-flash-low", 0.1);
    return result ? result.trim() : "";
  } catch (err) {
    console.error("AI Vision extraction failed:", err.message);
    return "";
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
