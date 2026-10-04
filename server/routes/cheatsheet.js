const { db } = require("../db");
const { callRouter } = require("../ai");

async function handleCheatsheetRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. POST /api/ai/extract-formulas - extract cheat sheet formulas from document
  if (req.method === "POST" && pathname === "/api/ai/extract-formulas") {
    const { docId, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    if (!docId) return sendJSON(res, { error: "docId required" }, 400);

    const cached = db.prepare("SELECT * FROM formula_cheatsheets WHERE doc_id = ?").get(docId);
    if (cached && cached.formulas) {
      return sendJSON(res, { success: true, cached: true, formulas: JSON.parse(cached.formulas) });
    }

    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
    if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

    const prompt = `Anda adalah spesialis penyusun lembar rumus (Cheat Sheet) akademik resmi.
Ekstrak SELURUH rumus, persamaan penting, definisi matematis, atau aturan kunci dari materi berikut.
Format output WAJIB HANYA berupa array JSON valid tanpa markdown formatting tambahan:
[
  {
    "name": "Nama Rumus / Konsep (contoh: Rumus Diskriminan)",
    "formula": "$$D = b^2 - 4ac$$ (Gunakan blok LaTeX $$...$$ yang rapi)",
    "meaning": "Keterangan variabel dan fungsi rumus...",
    "category": "Aljabar / Geometri / Teori / Deret / dll"
  }
]

ATURAN RUMUS:
Gunakan sintaks LaTeX standar dengan pecahan \\frac{a}{b}, akar \\sqrt{...}, sigma \\sum, dan eksponen ^2.

Materi:
"""
${doc.content.slice(0, 10000)}
"""`;

    const reply = await callRouter([
      { role: "system", content: "You are an elite formula cheat sheet extractor returning valid JSON arrays." },
      { role: "user", content: prompt }
    ], model, 0.2);

    let cleanJSON = reply.trim();
    if (cleanJSON.startsWith("```json")) cleanJSON = cleanJSON.slice(7);
    else if (cleanJSON.startsWith("```")) cleanJSON = cleanJSON.slice(3);
    if (cleanJSON.endsWith("```")) cleanJSON = cleanJSON.slice(0, -3);
    cleanJSON = cleanJSON.trim();

    let formulas = [];
    try {
      formulas = JSON.parse(cleanJSON);
    } catch (e) {
      const match = cleanJSON.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) formulas = JSON.parse(match[0]);
      else formulas = [];
    }

    if (formulas.length > 0) {
      db.prepare("INSERT OR REPLACE INTO formula_cheatsheets (doc_id, formulas, created_at) VALUES (?, ?, ?)")
        .run(docId, JSON.stringify(formulas), Date.now());
    }

    return sendJSON(res, { success: true, count: formulas.length, formulas });
  }

  // 2. GET /api/documents/:id/formulas - get saved formulas
  if (req.method === "GET" && pathname.startsWith("/api/documents/") && pathname.endsWith("/formulas")) {
    const docId = pathname.split("/")[3];
    const cached = db.prepare("SELECT * FROM formula_cheatsheets WHERE doc_id = ?").get(docId);
    if (cached && cached.formulas) {
      return sendJSON(res, { success: true, formulas: JSON.parse(cached.formulas) });
    }
    return sendJSON(res, { success: true, formulas: [] });
  }

  return false;
}

module.exports = {
  handleCheatsheetRoutes
};
