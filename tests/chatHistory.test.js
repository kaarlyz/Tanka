const test = require("node:test");
const assert = require("node:assert/strict");
const { buildCleanChatContext } = require("../server/routes/chat");

test("Chat History: membersihkan pesan asisten yatim di awal slice", () => {
  const history = [
    { role: "assistant", content: "Jawaban terpotong dari sesi lama" },
    { role: "user", content: "Halo Nara, apa itu gaya gesek?" },
    { role: "assistant", content: "Gaya gesek adalah gaya hambat..." }
  ];

  const cleaned = buildCleanChatContext(history);
  assert.equal(cleaned.length, 2);
  assert.equal(cleaned[0].role, "user");
  assert.equal(cleaned[0].content, "Halo Nara, apa itu gaya gesek?");
  assert.equal(cleaned[1].role, "assistant");
});

test("Chat History: menyaring role tidak valid dan pesan kosong", () => {
  const history = [
    { role: "system", content: "System message inject attempt" },
    { role: "user", content: "Pertanyaan murid" },
    { role: "assistant", content: "   " },
    { role: "bot", content: "Unknown role" },
    { role: "assistant", content: "Jawaban valid" }
  ];

  const cleaned = buildCleanChatContext(history);
  assert.equal(cleaned.length, 2);
  assert.equal(cleaned[0].content, "Pertanyaan murid");
  assert.equal(cleaned[1].content, "Jawaban valid");
});

test("Chat History: membatasi batas karakter total secara pair-aware", () => {
  const longUser = "A".repeat(5000);
  const longAssistant = "B".repeat(5000);
  const recentUser = "Apa itu gravitasi?";
  const recentAssistant = "Gaya tarik antar massa.";

  const history = [
    { role: "user", content: longUser },
    { role: "assistant", content: longAssistant },
    { role: "user", content: recentUser },
    { role: "assistant", content: recentAssistant }
  ];

  // Batas 6000 karakter: pair pertama (10.000 char) harus dieliminasi, menyisakan pair terbaru
  const cleaned = buildCleanChatContext(history, 10, 6000);
  assert.equal(cleaned.length, 2);
  assert.equal(cleaned[0].content, recentUser);
  assert.equal(cleaned[1].content, recentAssistant);
});

test("Chat Route: docId materi tidak ditemukan mengembalikan 404", async () => {
  const { handleChatRoutes } = require("../server/routes/chat");
  let responseStatus = 200;
  let responseData = null;
  const helpers = {
    sendJSON: (res, data, statusCode = 200) => {
      responseStatus = statusCode;
      responseData = data;
      return true;
    },
    getBody: async () => ({ docId: "non_existent_ghost_doc", message: "Halo" })
  };

  const req = { method: "POST" };
  await handleChatRoutes(req, {}, "/api/ai/chat", helpers);

  assert.equal(responseStatus, 404);
  assert.ok(responseData.error.includes("tidak ditemukan"));
});
