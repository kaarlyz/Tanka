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
        // Naikkan batas referensi modul aktif agar Nara paham seluruh isi bab (hingga 30.000 karakter)
        contextText = `Referensi Materi Aktif: "${doc.title}":\n"""\n${doc.content.slice(0, 30000)}\n"""\n\n`;
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

    const { NARA_GLOBAL_PERSONA } = require("../prompts/nara");

    const systemPrompt = `${NARA_GLOBAL_PERSONA}

PERAN ANDA SAAT DISKUSI INTERAKTIF (TANYA NARA):
1. Gaya Percakapan yang Hidup & Luwes:
   - Bersikaplah seperti sahabat tutor yang cerdas, suportif, dan asyik diajak berdiskusi.
   - Bicaralah dengan luwes dan alami, JANGAN kaku seperti robot ensiklopedia atau birokrat.
   - Jangan takut memberikan penjelasan yang panjang, mendalam, dan kaya contoh jika memang topik atau pertanyaannya membutuhkan uraian menyeluruh (jangan dipotong-potong pelit, tapi juga jangan bertele-tele tanpa isi).
2. Memori & Kesinambungan Obrolan:
   - Selalu ingat dan kaitkan dengan pertanyaan atau pernyataan murid di pesan-pesan sebelumnya.
   - Perhatikan konteks dokumen aktif yang sedang dibuka murid agar jawabanmu menyambung dengan bab bacaannya.
3. Pendampingan & Koreksi:
   - Jika siswa mengirim jawaban latihan atau mengeluh bingung, bedah poin demi poin dengan sabar. Berikan analogi konkret baru yang membuka logika mereka.
4. Format Matematika & Rumus:
   - Rumus atau variabel matematika WAJIB dibungkus tanda dollar KaTeX ($...$ atau $$...$$) rapi.

${contextText}`;

    const userMessageForAI = attachmentContext
      ? `${userPromptContent}\n${attachmentContext}`
      : userPromptContent;

    // Perluas memori percakapan: ambil hingga 20 riwayat chat terakhir (sebelumnya hanya 8)
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-20),
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
