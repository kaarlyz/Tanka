const { db } = require("../db");
const { callRouter } = require("../ai");
const { safeJsonParse } = require("../utils/jsonParser");
const { extractFormulasFromDocument } = require("../services/formulaExtractor");

async function handleCheatsheetRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. POST /api/ai/extract-formulas - extract cheat sheet formulas from document
  if (req.method === "POST" && pathname === "/api/ai/extract-formulas") {
    const { docId, model = "ag/gemini-3.8-flash-low", force = false } = await getBody(req);
    if (!docId) return sendJSON(res, { error: "docId required" }, 400);

    if (!force) {
      const cached = db.prepare("SELECT * FROM formula_cheatsheets WHERE doc_id = ?").get(docId);
      if (cached && cached.formulas) {
        const parsed = safeJsonParse(cached.formulas);
        if (Array.isArray(parsed)) {
          return sendJSON(res, { success: true, cached: true, formulas: parsed });
        }
      }
    }

    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
    if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

    try {
      const { formulas, isPartial, chunkCount } = await extractFormulasFromDocument(doc, db, model);

      if (formulas.length > 0) {
        db.prepare("INSERT OR REPLACE INTO formula_cheatsheets (doc_id, formulas, created_at) VALUES (?, ?, ?)")
          .run(docId, JSON.stringify(formulas), Date.now());
      }

      return sendJSON(res, {
        success: true,
        count: formulas.length,
        formulas,
        partial: isPartial,
        chunkCount
      });
    } catch (err) {
      console.error("[Cheatsheet] Gagal ekstrak rumus:", err.message);
      return sendJSON(res, { error: "Gagal mengekstrak rumus: " + err.message }, 500);
    }
  }

  // 2. GET /api/documents/:id/formulas - get saved formulas
  if (req.method === "GET" && pathname.startsWith("/api/documents/") && pathname.endsWith("/formulas")) {
    const docId = pathname.split("/")[3];
    const cached = db.prepare("SELECT * FROM formula_cheatsheets WHERE doc_id = ?").get(docId);
    if (cached && cached.formulas) {
      const parsed = safeJsonParse(cached.formulas);
      if (Array.isArray(parsed)) {
        return sendJSON(res, { success: true, formulas: parsed });
      }
    }
    return sendJSON(res, { success: true, formulas: [] });
  }

  return false;
}

module.exports = {
  handleCheatsheetRoutes
};
