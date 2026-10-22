const { db } = require("../db");
const { analyzeGaps, getQuestionsForDoc } = require("../services/examAnalyzer");

async function handleExamResultsRoutes(req, res, pathname, helpers) {
  const { sendJSON } = helpers;

  // GET /api/exam-results/:docId — soal + statistik + bedah materi (gap analysis)
  const match = pathname.match(/^\/api\/exam-results\/([^/]+)$/);
  if (req.method === "GET" && match) {
    const docId = decodeURIComponent(match[1]);

    const doc = db.prepare("SELECT id, title FROM documents WHERE id = ?").get(docId);
    if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

    const questions = getQuestionsForDoc(docId, db);
    if (questions.length === 0) {
      return sendJSON(res, { error: "Belum ada soal terdeteksi di dokumen ini" }, 404);
    }

    const gaps = analyzeGaps(questions, db, docId);

    return sendJSON(res, {
      success: true,
      docId,
      title: doc.title,
      questionCount: questions.length,
      questions,
      analysis: gaps,
    });
  }

  return false;
}

module.exports = { handleExamResultsRoutes };
