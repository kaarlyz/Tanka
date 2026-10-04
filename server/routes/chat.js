const { db } = require("../db");
const { callRouter } = require("../ai");

async function handleChatRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. POST /api/ai/chat - conversational grounded tutor
  if (req.method === "POST" && pathname === "/api/ai/chat") {
    const { docId, message, history = [], model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    if (!message) return sendJSON(res, { error: "Message required" }, 400);

    let contextText = "";
    if (docId) {
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (doc) {
        contextText = `Referensi Materi Aktif: "${doc.title}":\n"""\n${doc.content.slice(0, 8000)}\n"""\n\n`;
      }
    }

    const systemPrompt = `Anda adalah Nara, tutor belajar AI yang ramah, cerdas, adaptif, dan suportif.
Tugas Anda: Menjelaskan konsep secara to-the-point, interaktif, dan mudah dipahami.
Jika pengguna mengirimkan jawaban latihan mandiri, koreksi jawaban mereka SATU PER SATU secara teliti dan bersahabat:
- Tunjukkan nomor mana yang sudah 100% tepat.
- Jika ada nomor yang keliru, tunjukkan di mana letak melesetnya dan beri petunjuk cara berpikirnya tanpa memarahi.
- Berikan skor/apresiasi, lalu tawarkan materi lanjutan.
${contextText}Jawab pertanyaan pengguna dengan jelas dan fokus.
ATURAN FORMAT MATEMATIKA: Untuk rumus matematika, pecahan, akar, sigma, kuadrat, atau variabel aljabar, WAJIB bungkus ekspresi dengan tanda dollar ($...$ untuk inline, $$...$$ untuk blok) menggunakan LaTeX standar agar ter-render sempurna oleh KaTeX. JANGAN biarkan rumus mentah tanpa tanda dollar.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8),
      { role: "user", content: message }
    ];

    const reply = await callRouter(messages, model);

    const msgId = "msg_" + Date.now();
    db.prepare("INSERT INTO chat_messages (id, doc_id, role, content, model, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(msgId, docId || null, "user", message, model, Date.now());
    db.prepare("INSERT INTO chat_messages (id, doc_id, role, content, model, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(msgId + "_r", docId || null, "assistant", reply, model, Date.now());

    return sendJSON(res, { reply, model });
  }

  // 2. GET /api/documents/:id/chat - get chat history
  const chatHistMatch = pathname.match(/^\/api\/documents\/([^/]+)\/chat$/);
  if (chatHistMatch && req.method === "GET") {
    const docId = chatHistMatch[1];
    const rows = db.prepare("SELECT * FROM chat_messages WHERE doc_id = ? ORDER BY created_at ASC").all(docId);
    return sendJSON(res, { messages: rows });
  }

  // 3. DELETE /api/documents/:id/chat - clear chat history
  if (chatHistMatch && req.method === "DELETE") {
    const docId = chatHistMatch[1];
    db.prepare("DELETE FROM chat_messages WHERE doc_id = ?").run(docId);
    return sendJSON(res, { success: true });
  }

  return false;
}

module.exports = {
  handleChatRoutes
};
