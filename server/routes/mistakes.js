const { db } = require("../db");

async function handleMistakesRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. POST /api/mistakes/record - record or update a mistake
  if (req.method === "POST" && pathname === "/api/mistakes/record") {
    const {
      docId,
      docTitle = "",
      question,
      options = [],
      correctIndex,
      userAnswerIndex,
      formula = "",
      steps = [],
      explanation = "",
      pitfall = ""
    } = await getBody(req);

    if (!question) return sendJSON(res, { error: "Question required" }, 400);

    const existing = db.prepare("SELECT id FROM mistake_notebook WHERE doc_id = ? AND question = ?").get(docId, question);
    const now = Date.now();
    if (existing) {
      db.prepare("UPDATE mistake_notebook SET user_answer_index = ?, resolved = 0, updated_at = ? WHERE id = ?")
        .run(userAnswerIndex, now, existing.id);
      return sendJSON(res, { success: true, id: existing.id, updated: true });
    } else {
      const id = "mistake_" + now + "_" + Math.random().toString(36).slice(2, 6);
      db.prepare("INSERT INTO mistake_notebook (id, doc_id, doc_title, question, options, correct_index, user_answer_index, formula, steps, explanation, pitfall, resolved, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)")
        .run(id, docId || "", docTitle, JSON.stringify(options), correctIndex, userAnswerIndex, formula, JSON.stringify(steps), explanation, pitfall, now, now);
      return sendJSON(res, { success: true, id, created: true });
    }
  }

  // 2. GET /api/mistakes - list unresolved mistakes
  if (req.method === "GET" && pathname === "/api/mistakes") {
    const urlObj = new URL(req.url, "http://localhost");
    const docId = urlObj.searchParams.get("docId");
    let query = "SELECT * FROM mistake_notebook WHERE resolved = 0";
    const params = [];
    if (docId) {
      query += " AND doc_id = ?";
      params.push(docId);
    }
    query += " ORDER BY updated_at DESC";
    const rows = db.prepare(query).all(...params);
    const mistakes = rows.map((r) => ({
      id: r.id,
      docId: r.doc_id,
      docTitle: r.doc_title,
      question: r.question,
      options: JSON.parse(r.options || "[]"),
      correctIndex: r.correct_index,
      userAnswerIndex: r.user_answer_index,
      formula: r.formula,
      steps: r.steps ? JSON.parse(r.steps) : [],
      explanation: r.explanation,
      pitfall: r.pitfall,
      resolved: r.resolved,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    return sendJSON(res, { success: true, count: mistakes.length, mistakes });
  }

  // 3. POST /api/mistakes/:id/resolve - mark a mistake as resolved
  if (req.method === "POST" && pathname.startsWith("/api/mistakes/") && pathname.endsWith("/resolve")) {
    const mistakeId = pathname.split("/")[3];
    db.prepare("UPDATE mistake_notebook SET resolved = 1, updated_at = ? WHERE id = ?").run(Date.now(), mistakeId);
    return sendJSON(res, { success: true, id: mistakeId, resolved: true });
  }

  // 4. DELETE /api/mistakes/:id - delete a single mistake
  if (req.method === "DELETE" && pathname.startsWith("/api/mistakes/") && pathname.split("/").length === 4) {
    const mistakeId = pathname.split("/")[3];
    db.prepare("DELETE FROM mistake_notebook WHERE id = ?").run(mistakeId);
    return sendJSON(res, { success: true, id: mistakeId });
  }

  // 5. Clear mistakes (all or by docId)
  if ((req.method === "POST" && pathname === "/api/mistakes/clear") || (req.method === "DELETE" && pathname === "/api/mistakes")) {
    const urlObj = new URL(req.url, "http://localhost");
    const docId = urlObj.searchParams.get("docId");
    if (docId) {
      db.prepare("DELETE FROM mistake_notebook WHERE doc_id = ?").run(docId);
    } else {
      db.prepare("DELETE FROM mistake_notebook").run();
    }
    return sendJSON(res, { success: true });
  }

  return false;
}

module.exports = {
  handleMistakesRoutes
};
