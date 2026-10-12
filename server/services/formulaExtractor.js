const { callRouter } = require("../ai");
const { safeJsonParse } = require("../utils/jsonParser");

/**
 * Sanitizes LaTeX math formula notation
 */
function sanitizeFormulaLatex(formulaStr) {
  if (!formulaStr || typeof formulaStr !== "string") return "";
  let cleaned = formulaStr.trim();

  // Pastikan formula terbungkus dalam $$...$$ jika belum ada tanda $
  if (!cleaned.includes("$")) {
    cleaned = `$$${cleaned}$$`;
  }

  // Cek keseimbangan tanda dollar tunggal
  const dollarCount = (cleaned.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    cleaned += "$";
  }

  return cleaned.replace(/\{\}/g, "");
}

/**
 * Chunk a document content by chapter headings or length boundaries
 */
function chunkDocumentForFormulas(doc, dbInstance) {
  const chunks = [];

  // 1. Coba ambil dari chapter_plans jika tersedia
  if (dbInstance && doc.id) {
    try {
      const chapters = dbInstance.prepare(`
        SELECT chapter_number, title, content
        FROM chapter_plans
        WHERE doc_id = ? AND content != ''
        ORDER BY chapter_number ASC
      `).all(doc.id);

      if (chapters && chapters.length > 0) {
        chapters.forEach((ch) => {
          chunks.push({
            label: `Bab ${ch.chapter_number}: ${ch.title}`,
            text: ch.content
          });
        });
        return chunks;
      }
    } catch {}
  }

  // 2. Coba pisahkan berdasarkan heading markdown ## Bab / ## Bagian
  const content = doc.content || "";
  const parts = content.split(/(?=\n##\s+)/);
  if (parts.length > 1) {
    parts.forEach((p, idx) => {
      const trimmed = p.trim();
      if (trimmed.length > 20) {
        const firstLine = trimmed.split("\n")[0].replace(/^#+\s*/, "").slice(0, 50);
        chunks.push({
          label: firstLine || `Bagian ${idx + 1}`,
          text: trimmed
        });
      }
    });
    if (chunks.length > 0) return chunks;
  }

  // 3. Fallback: Windowing ~15.000 karakter dengan overlap 1.000 karakter
  const CHUNK_SIZE = 15000;
  const OVERLAP = 1000;
  let offset = 0;
  let partNum = 1;

  while (offset < content.length) {
    const slice = content.slice(offset, offset + CHUNK_SIZE);
    chunks.push({
      label: `Bagian ${partNum++}`,
      text: slice
    });
    if (offset + CHUNK_SIZE >= content.length) break;
    offset += CHUNK_SIZE - OVERLAP;
  }

  return chunks.length > 0 ? chunks : [{ label: "Seluruh Materi", text: content }];
}

/**
 * Extracts and deduplicates formulas from all chunks of a document.
 */
async function extractFormulasFromDocument(doc, dbInstance, model = "ag/gemini-3.8-flash-low") {
  const chunks = chunkDocumentForFormulas(doc, dbInstance);
  const rawFormulas = [];
  let partialFailure = false;

  for (const chunk of chunks) {
    // Lewati chunk yang terlalu pendek atau jelas tidak ada matematika/rumus
    if (!chunk.text || chunk.text.trim().length < 50) continue;

    const prompt = `Anda adalah spesialis penyusun lembar rumus (Cheat Sheet) akademik resmi.
Ekstrak SELURUH rumus, persamaan penting, definisi matematis, atau aturan kunci dari teks berikut.
Format output WAJIB HANYA berupa array JSON valid tanpa markdown formatting tambahan:
[
  {
    "name": "Nama Rumus / Konsep (contoh: Rumus Kuadrat)",
    "formula": "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$ (Gunakan blok LaTeX $$...$$ yang rapi)",
    "meaning": "Keterangan variabel dan syarat batas penggunaan...",
    "category": "Aljabar / Geometri / Kalkulus / Fisika / dll"
  }
]

ATURAN RUMUS:
Gunakan sintaks LaTeX standar dengan pecahan \\frac{a}{b}, akar \\sqrt{...}, sigma \\sum, dan eksponen ^2.

Materi (${chunk.label}):
"""
${chunk.text.slice(0, 20000)}
"""`;

    try {
      const reply = await callRouter([
        { role: "system", content: "You are an elite formula cheat sheet extractor returning valid JSON arrays." },
        { role: "user", content: prompt }
      ], model, 0.2);

      const parsed = safeJsonParse(reply);
      const items = Array.isArray(parsed) ? parsed : (parsed && parsed.formulas ? parsed.formulas : []);

      items.forEach((item) => {
        if (item && (item.formula || item.name)) {
          rawFormulas.push({
            name: typeof item.name === "string" ? item.name.trim() : "Rumus",
            formula: sanitizeFormulaLatex(item.formula || ""),
            meaning: typeof item.meaning === "string" ? item.meaning.trim() : "",
            category: typeof item.category === "string" ? item.category.trim() : "Umum",
            sourceChunk: chunk.label
          });
        }
      });
    } catch (err) {
      console.warn(`[Formula-Extraction] Gagal mengekstrak chunk "${chunk.label}":`, err.message);
      partialFailure = true;
    }
  }

  // Deduplikasi cerdas: pertahankan urutan kemunculan pertama,
  // jangan hapus formula berbeda yang kebetulan memiliki nama serupa
  const seenKeys = new Set();
  const uniqueFormulas = [];

  for (const f of rawFormulas) {
    const normFormula = f.formula.replace(/\s+/g, "").toLowerCase();
    const normName = f.name.replace(/\s+/g, "").toLowerCase();
    const dedupKey = `${normName}:::${normFormula}`;

    if (!seenKeys.has(dedupKey) && f.formula.length > 2) {
      seenKeys.add(dedupKey);
      uniqueFormulas.push(f);
    }
  }

  return {
    formulas: uniqueFormulas,
    isPartial: partialFailure,
    chunkCount: chunks.length
  };
}

module.exports = {
  sanitizeFormulaLatex,
  chunkDocumentForFormulas,
  extractFormulasFromDocument
};
