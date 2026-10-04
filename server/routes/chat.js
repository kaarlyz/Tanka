const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { db } = require("../db");
const { callRouter, extractTextWithAIVision } = require("../ai");

async function handleChatRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. POST /api/ai/chat - conversational grounded tutor with image & document upload support
  if (req.method === "POST" && pathname === "/api/ai/chat") {
    const { docId, message, attachment, history = [], model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    if (!message && !attachment) return sendJSON(res, { error: "Pesan atau lampiran berkas wajib diisi" }, 400);

    let contextText = "";
    if (docId) {
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (doc) {
        contextText = `Referensi Materi Aktif: "${doc.title}":\n"""\n${doc.content.slice(0, 8000)}\n"""\n\n`;
      }
    }

    let attachmentContext = "";
    let userPromptContent = message || "";

    if (attachment && attachment.fileData) {
      const ext = path.extname(attachment.fileName || "").toLowerCase() || ".txt";
      const isImage = [".png", ".jpg", ".jpeg", ".webp", ".bmp"].includes(ext) || attachment.fileType === "image";

      if (isImage) {
        const mimeMap = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
          ".bmp": "image/bmp"
        };
        const mimeType = mimeMap[ext] || "image/jpeg";
        try {
          console.log(`[Chat-Nara] Mengekstrak visual/teks dari gambar: ${attachment.fileName}...`);
          const visionText = await extractTextWithAIVision(attachment.fileData, mimeType);
          if (visionText && visionText.trim()) {
            attachmentContext = `\n\n[LAMPIRAN GAMBAR DARI SISWA: ${attachment.fileName}]\nHasil Pembacaan AI Vision:\n"""\n${visionText.trim()}\n"""\n`;
          }
        } catch (visionErr) {
          console.warn("[Chat-Nara] Vision extraction error:", visionErr.message);
          attachmentContext = `\n\n[LAMPIRAN GAMBAR DARI SISWA: ${attachment.fileName}] (Gambar terlampir)`;
        }
      } else {
        // Document extraction (PDF, DOCX, PPTX, TXT)
        const scratchDir = "/home/vallencia/.hermes/cache/scratch";
        if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });
        const scriptPath = path.join(__dirname, "..", "..", "extract_text.py");
        const tmpFilePath = path.join(scratchDir, `chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`);
        try {
          fs.writeFileSync(tmpFilePath, Buffer.from(attachment.fileData, "base64"));
          const extractedText = execFileSync("python3", [scriptPath, tmpFilePath], {
            encoding: "utf8",
            maxBuffer: 20 * 1024 * 1024
          }).trim();
          if (extractedText && !extractedText.startsWith("[Error")) {
            attachmentContext = `\n\n[LAMPIRAN DOKUMEN DARI SISWA: ${attachment.fileName}]\nIsi Dokumen Sumber:\n"""\n${extractedText.slice(0, 15000)}\n"""\n`;
          }
        } catch (docErr) {
          console.warn("[Chat-Nara] Doc extraction error:", docErr.message);
        } finally {
          if (fs.existsSync(tmpFilePath)) {
            try { fs.unlinkSync(tmpFilePath); } catch {}
          }
        }
      }

      if (!userPromptContent.trim()) {
        userPromptContent = isImage
          ? "Tolong jelaskan dan bedah soal/materi pada gambar terlampir ini."
          : `Tolong jelaskan dan rangkum poin penting dari dokumen ${attachment.fileName}.`;
      }
    }

    const systemPrompt = `Anda adalah Nara, tutor belajar AI yang ramah, cerdas, adaptif, dan suportif di platform Tanka.
Tugas Anda: Menjelaskan konsep secara to-the-point, interaktif, dan mudah dipahami oleh siswa SMA / persiapan ujian.
Jika ada lampiran gambar/dokumen dari siswa, prioritaskan menjawab dan membedah isi lampiran tersebut dengan runut dan teliti.
Jika siswa mengirimkan jawaban latihan mandiri, koreksi jawaban mereka SATU PER SATU secara teliti dan bersahabat:
- Tunjukkan nomor mana yang sudah 100% tepat.
- Jika ada nomor yang keliru, tunjukkan di mana letak melesetnya dan beri petunjuk cara berpikirnya tanpa memarahi.
- Berikan skor/apresiasi, lalu tawarkan materi lanjutan.
${contextText}Jawab pertanyaan pengguna dengan jelas dan fokus.
ATURAN FORMAT MATEMATIKA: Untuk rumus matematika, pecahan, akar, sigma, kuadrat, atau variabel aljabar, WAJIB bungkus ekspresi dengan tanda dollar ($...$ untuk inline, $$...$$ untuk blok) menggunakan LaTeX standar agar ter-render sempurna oleh KaTeX. JANGAN biarkan rumus mentah tanpa tanda dollar.`;

    const userMessageForAI = attachmentContext
      ? `${userPromptContent}\n${attachmentContext}`
      : userPromptContent;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8),
      { role: "user", content: userMessageForAI }
    ];

    const reply = await callRouter(messages, model);

    const msgId = "msg_" + Date.now();
    const storedUserContent = attachment
      ? `[📎 ${attachment.fileName}]\n${userPromptContent}`
      : userPromptContent;

    db.prepare("INSERT INTO chat_messages (id, doc_id, role, content, model, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(msgId, docId || null, "user", storedUserContent, model, Date.now());
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
