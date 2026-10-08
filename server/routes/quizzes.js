const { db } = require("../db");
const { callRouter } = require("../ai");
const { safeJsonParse } = require("../utils/jsonParser");
const { generateQuestionsCore } = require("../services/quizGenerator");

async function handleQuizzesRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. POST /api/ai/generate-quiz - generate adaptive quizzes (conceptual, beginner, exam, custom prompt, append, variant)
  if (req.method === "POST" && pathname === "/api/ai/generate-quiz") {
    const {
      docId,
      model = "ag/gemini-3.8-flash-low",
      count = 5,
      quizType = "conceptual",
      customInstruction = "",
      mode = "replace",
      referenceQuestions = [],
      lastScore = null
    } = await getBody(req);

    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
    if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

    let questions = [];
    try {
      questions = await generateQuestionsCore({
        docId,
        count,
        quizType,
        model,
        customInstruction,
        referenceQuestions,
        lastScore
      });
    } catch (err) {
      console.error("[Generate-Quiz] Gagal menyusun soal:", err.message);
      return sendJSON(res, { error: "Format JSON soal tidak valid dari model AI: " + err.message }, 500);
    }

    let finalQuestions = questions;
    if (mode === "append") {
      const existingRow = db.prepare("SELECT * FROM quizzes WHERE doc_id = ? ORDER BY created_at DESC LIMIT 1").get(docId);
      if (existingRow && existingRow.questions) {
        try {
          const existingList = JSON.parse(existingRow.questions);
          if (Array.isArray(existingList) && existingList.length > 0) {
            const startId = existingList.length + 1;
            const renumbered = questions.map((q, idx) => ({ ...q, id: startId + idx }));
            finalQuestions = [...existingList, ...renumbered];
          }
        } catch (e) {
          console.warn("Append existing quiz parse error:", e.message);
        }
      }
      const quizId = "quiz_" + Date.now();
      db.prepare("INSERT INTO quizzes (id, doc_id, questions, created_at) VALUES (?, ?, ?, ?)")
        .run(quizId, docId, JSON.stringify(finalQuestions), Date.now());
      return sendJSON(res, { success: true, quizId, questions: finalQuestions, appendedCount: questions.length, mode: "append" });
    } else if (mode === "variant") {
      const newDocId = "doc_var_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
      const shortTag = customInstruction ? ` (${customInstruction.slice(0, 22)})` : " (Paket Soal Baru)";
      const newDocTitle = `${doc.title}${shortTag}`;
      db.prepare("INSERT INTO documents (id, title, content, created_at) VALUES (?, ?, ?, ?)").run(
        newDocId,
        newDocTitle,
        doc.content,
        Date.now()
      );
      const quizId = "quiz_" + Date.now();
      db.prepare("INSERT INTO quizzes (id, doc_id, questions, created_at) VALUES (?, ?, ?, ?)")
        .run(quizId, newDocId, JSON.stringify(finalQuestions), Date.now());
      return sendJSON(res, { success: true, quizId, questions: finalQuestions, isVariant: true, newDocId, newDocTitle, mode: "variant" });
    } else {
      const quizId = "quiz_" + Date.now();
      db.prepare("INSERT INTO quizzes (id, doc_id, questions, created_at) VALUES (?, ?, ?, ?)")
        .run(quizId, docId, JSON.stringify(finalQuestions), Date.now());
      return sendJSON(res, { success: true, quizId, questions: finalQuestions, mode: "replace" });
    }
  }

  // 2. GET /api/documents/:id/quizzes - get last saved quiz
  const quizMatch = pathname.match(/^\/api\/documents\/([^/]+)\/quizzes$/);
  if (req.method === "GET" && quizMatch) {
    const docId = quizMatch[1];
    const row = db.prepare("SELECT * FROM quizzes WHERE doc_id = ? ORDER BY created_at DESC LIMIT 1").get(docId);
    return sendJSON(res, { quiz: row ? { id: row.id, questions: JSON.parse(row.questions) } : null });
  }

  // 3. POST /api/ai/quiz-question-chat - chat with AI tutor about a question
  if (req.method === "POST" && pathname === "/api/ai/quiz-question-chat") {
    const {
      docId,
      question,
      options = [],
      correctIndex,
      userSelectedIndex,
      userMessage,
      chatHistory = [],
      model = "ag/gemini-3.8-flash-low"
    } = await getBody(req);

    if (!userMessage || !userMessage.trim()) {
      return sendJSON(res, { error: "Pertanyaan tidak boleh kosong" }, 400);
    }

    let docContext = "";
    if (docId) {
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (doc) docContext = `Konteks Materi ("${doc.title}"):\n"""\n${doc.content.slice(0, 8000)}\n"""\n\n`;
    }

    const optionsList = options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n");
    const correctLetter = String.fromCharCode(65 + correctIndex);
    const userSelectedLetter = userSelectedIndex !== null && userSelectedIndex !== undefined
      ? String.fromCharCode(65 + userSelectedIndex)
      : "Belum dipilih";

    const systemPrompt = `Anda adalah Nara, tutor AI spesialis bedah soal.
Siswa sedang berlatih pada soal pilihan ganda berikut:

Soal: "${question}"
Pilihan:
${optionsList}

Kunci Jawaban yang Benar: Pilihan ${correctLetter}
Pilihan yang Dipilih Siswa: Pilihan ${userSelectedLetter}

${docContext}Tugas Anda:
1. Jawab pertanyaan siswa secara spesifik, to-the-point, ramah, dan mendidik.
2. Jelaskan logika mengapa opsi tertentu keliru dan mengapa kunci jawaban tepat.
3. Berikan analogi sederhana jika siswa meminta penyederhanaan konsep.
4. Gunakan rumus KaTeX rapi ($...$ atau $$...$$) jika ada perhitungan.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-6),
      { role: "user", content: userMessage.trim() }
    ];

    try {
      const reply = await callRouter(messages, model, 0.3);
      return sendJSON(res, { success: true, reply });
    } catch (err) {
      return sendJSON(res, { error: "Gagal memproses tanya AI: " + err.message }, 500);
    }
  }

  // 4. POST /api/ai/tailor-quiz - Tailor/edit existing quiz JSON
  if (req.method === "POST" && pathname === "/api/ai/tailor-quiz") {
    const { docId, currentQuiz, tailorPrompt, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    
    if (!currentQuiz || !tailorPrompt) {
      return sendJSON(res, { error: "Missing currentQuiz or tailorPrompt" }, 400);
    }

    const prompt = `Anda adalah asisten pembuat soal akademik.
Berikut adalah array JSON berisi soal-soal kuis saat ini. Pengguna meminta penyesuaian:
"${tailorPrompt}"

Kuis saat ini (JSON):
${JSON.stringify(currentQuiz, null, 2)}

Tugas:
Edit/Ubah data JSON soal tersebut agar memenuhi permintaan pengguna. Output WAJIB berupa JSON array valid yang memiliki struktur objek yang sama persis:
[ { "question": "", "options": ["", "", "", ""], "answer": 0, "explanation": "" }, ... ]
Jangan sertakan teks apapun selain JSON murni.`;

    try {
      const completion = await callRouter([
        { role: "system", content: "You output pure valid JSON only." },
        { role: "user", content: prompt }
      ], model);

      const newQuiz = safeJsonParse(completion);
      if (!newQuiz) throw new Error("Format JSON kuis baru tidak valid");

      const quizId = "quiz_" + Date.now();
      db.prepare("INSERT INTO quizzes (id, doc_id, questions, created_at) VALUES (?, ?, ?, ?)")
        .run(quizId, docId, JSON.stringify(newQuiz), Date.now());

      return sendJSON(res, { success: true, quizzes: newQuiz });
    } catch (err) {
      return sendJSON(res, { error: "Gagal menyesuaikan kuis: " + err.message }, 500);
    }
  }

  return false;
}

module.exports = {
  handleQuizzesRoutes,
  generateQuestionsCore
};
