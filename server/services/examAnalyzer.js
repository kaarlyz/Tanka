// Bedah materi dari soal ujian: topik apa saja yang diuji, mana yang sudah ada materinya di Tanka,
// mana yang bolong. Semua dihitung on-demand dari tabel quizzes + documents — tanpa tabel baru.

const STOPWORDS = new Set([
  "dan", "atau", "yang", "untuk", "dengan", "pada", "dari", "dalam", "akan", "tidak",
  "adalah", "ialah", "jika", "maka", "serta", "juga", "dapat", "bisa", "oleh", "agar",
  "the", "and", "for", "with", "that", "this", "from", "are", "was", "were", "not",
  "cara", "soal", "secara", "suatu", "sebuah", "para", "siswa", "nilai", "jumlah",
]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

function keywordSet(text) {
  return new Set(tokenize(text));
}

function overlapRatio(topicTokens, docTokens) {
  if (topicTokens.size === 0) return 0;
  let hit = 0;
  for (const t of topicTokens) if (docTokens.has(t)) hit++;
  return hit / topicTokens.size;
}

// Ambil topik dari tiap soal: pakai konsep_kunci / formula, fallback ke subtes.
// Rapikan teks rumus supaya bisa dirender KaTeX + jangan pecah 1 rumus jadi 2 topik.
function tidyTopicName(raw) {
  let s = String(raw || "").trim();
  if (!s) return s;

  // a^(m+n) -> a^{m+n};  x^2 -> x^{2};  U_n -> U_{n}
  s = s.replace(/\^\(([^)]{1,20})\)/g, "^{$1}").replace(/\^([A-Za-z0-9])(?![{]|\w)/g, "^{$1}");
  s = s.replace(/_([A-Za-z0-9])(?![{]|\w)/g, "_{$1}");

  const idx = s.indexOf(":");
  const label = idx > 0 ? s.slice(0, idx + 1) : "";
  let math = (idx > 0 ? s.slice(idx + 1) : s).trim();

  // Rumus + prosa dalam satu string = spasi ilang di math mode. Potong di koma pertama,
  // bungkus bagian rumusnya saja, sisanya biarkan teks biasa.
  let tail = "";
  const commaIdx = math.indexOf(", ");
  if (commaIdx > 0) {
    tail = math.slice(commaIdx);
    math = math.slice(0, commaIdx).trim();
  }

  // Sudah ada $ dari generator → jangan dibungkus lagi (bikin $$...$ campur aduk).
  if (s.includes("$")) return s;

  const looksLikeProse = /[A-Za-z]{4,}\s+[A-Za-z]{4,}/.test(math);
  const isFormulaLike =
    math.length > 0 && math.length <= 90 && !/[;]/.test(math) && !looksLikeProse && /[\^_=]|\\|\d/.test(math);
  if (!isFormulaLike) return s;

  const rendered = label ? `${label} $${math}$` : `$${math}$`;
  return tail ? `${rendered}${tail}` : rendered;
}

// Satu soal sering mengembalikan beberapa konsep dipisah ";" atau "|".
// Fragmen yang cuma lanjutan rumus (pendek / mulai kurung) digabung balik ke konsep sebelumnya.
function splitConcepts(formula) {
  const pieces = String(formula || "")
    .split(/;|\|/)
    .map((s) => s.trim())
    .filter(Boolean);

  const merged = [];
  for (const piece of pieces) {
    const isContinuation = merged.length > 0 && (/^[([{]/.test(piece) || piece.length < 14);
    if (isContinuation) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${piece}`;
    } else {
      merged.push(piece);
    }
  }
  return merged.map(tidyTopicName).filter(Boolean);
}

function extractTopics(questions) {
  const topics = [];
  for (const q of questions || []) {
    const konsep = splitConcepts(q.formula);
    for (const k of konsep) {
      topics.push({ name: k, subtes: q.subtes || "lainnya", questionId: q.id });
    }
    if (konsep.length === 0 && q.subtes) {
      topics.push({ name: q.subtes, subtes: q.subtes, questionId: q.id });
    }
  }

  // Dedup per nama (case-insensitive), simpan jumlah soal yang menguji topik itu.
  const byName = new Map();
  for (const t of topics) {
    const key = t.name.toLowerCase();
    if (!byName.has(key)) byName.set(key, { ...t, questionCount: 0 });
    byName.get(key).questionCount++;
  }
  return [...byName.values()];
}

function analyzeGaps(questions, db, excludeDocId = null) {
  const topics = extractTopics(questions);

  const docs = db
    .prepare("SELECT id, title, substr(content, 1, 4000) AS content FROM documents WHERE status = 'completed' AND id != ?")
    .all(excludeDocId || "");

  const docKeywords = docs.map((d) => ({
    ...d,
    keywords: keywordSet(`${d.title} ${d.content}`),
  }));

  const enriched = topics.map((t) => {
    const topicTokens = keywordSet(t.name);
    let best = null;
    for (const d of docKeywords) {
      const ratio = overlapRatio(topicTokens, d.keywords);
      if (ratio > 0.5 && (!best || ratio > best.ratio)) {
        best = { ratio, docId: d.id, docTitle: d.title };
      }
    }
    return {
      name: t.name,
      subtes: t.subtes,
      questionCount: t.questionCount,
      covered: Boolean(best),
      docId: best?.docId || null,
      docTitle: best?.docTitle || null,
      coverage: best ? Math.round(best.ratio * 100) : 0,
    };
  });

  const subtesBreakdown = {};
  for (const t of enriched) {
    const s = t.subtes || "lainnya";
    subtesBreakdown[s] = (subtesBreakdown[s] || 0) + t.questionCount;
  }

  return {
    totalTopics: enriched.length,
    coveredCount: enriched.filter((t) => t.covered).length,
    missingCount: enriched.filter((t) => !t.covered).length,
    subtesBreakdown,
    topics: enriched,
    gaps: enriched.filter((t) => !t.covered),
  };
}

// Ambil soal dari dokumen (quiz terbaru untuk doc itu).
function getQuestionsForDoc(docId, db) {
  const row = db
    .prepare("SELECT questions FROM quizzes WHERE doc_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(docId);
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.questions);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

module.exports = { analyzeGaps, extractTopics, getQuestionsForDoc };
