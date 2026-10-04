const { db } = require("../db");
const { callRouter } = require("../ai");

async function handleFlashcardsRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. POST /api/ai/generate-flashcards - generate comprehensive atomic flashcards
  if (req.method === "POST" && pathname === "/api/ai/generate-flashcards") {
    const { docId, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
    if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

    // Architectural Rule: Flashcards read from Canonical Concepts & Source Segments to prevent cascade hallucinations
    const concepts = db.prepare("SELECT * FROM document_concepts WHERE doc_id = ?").all(docId);
    const segments = db.prepare("SELECT raw_text FROM document_segments WHERE doc_id = ? ORDER BY segment_index ASC").all(docId);

    let factsContext = "";
    if (concepts && concepts.length > 0) {
      factsContext += "DAFTAR KONSEP KANONIKAL RESMI (SUMBER UTAMA):\n" +
        concepts.map((c, i) => `${i + 1}. [${c.name}]: ${c.definition} ${c.prerequisites ? `(Detail: ${c.prerequisites})` : ""}`).join("\n") + "\n\n";
    }
    if (segments && segments.length > 0) {
      factsContext += "TEKS SUMBER ASLI:\n" + segments.map(s => s.raw_text).join("\n\n").slice(0, 16000);
    } else {
      factsContext += "TEKS MATERI:\n" + doc.content.slice(0, 20000);
    }

    const prompt = `Anda adalah spesialis metode Active Recall & Spaced Repetition (standar SuperMemo / Anki).
Lakukan AUDIT MENYELURUH terhadap FAKTA & KONSEP KANONIKAL di bawah ini.
HANYA buat flashcard dari konsep, definisi, dan aturan baku yang sahih.
DILARANG membuat kartu dari analogi cerita fiktif, dongeng pengayaan, atau rumus matematika yang tidak ada di teks sumber!

ATURAN STRUKTUR KARTU (PRINSIP ATOMIK SUPERMEMO / ANKI):
1. PRINSIP 1 KARTU = 1 FAKTA ATOMIK TUNGGAL:
   - DILARANG KERAS menggabungkan dua topik dalam satu kartu.
2. DISTRIBUSI SEIMBANG DARI AWAL HINGGA AKHIR MATERI:
   - Kartu 1–4: FONDASI & DEFINISI BAKU konsep pembuka.
   - Kartu 5–8: Hubungan sebab-akibat, aturan, dan variabel.
   - Kartu 9–dst: Pembeda konsep yang sering tertukar dan rumus resmi.
3. SISI DEPAN (Front) - Pertanyaan Spesifik & Langsung ke Sasaran (3-10 kata).
4. SISI BELAKANG (Back) - Jawaban Padat, Konkret & Presisi (1-2 kalimat). Jika rumus, gunakan LaTeX ($...$).

Format output WAJIB HANYA berupa array JSON murni tanpa markdown fence:
[
  {"front": "Pertanyaan stimulus atomik tunggal", "back": "Jawaban ringkas 1-2 kalimat konkret atau nilai rumus"}
]

Fakta & Sumber Materi:
"""
${factsContext}
"""`;

    const aiResponse = await callRouter([
      { role: "system", content: "You are an educational AI that extracts high-yield atomic flashcards from canonical facts in strict JSON." },
      { role: "user", content: prompt }
    ], model);

    function parseJsonWithFallback(raw) {
      let s = raw.trim();
      if (s.startsWith("```json")) s = s.slice(7);
      else if (s.startsWith("```")) s = s.slice(3);
      if (s.endsWith("```")) s = s.slice(0, -3);
      s = s.trim();

      try {
        return JSON.parse(s);
      } catch {}

      try {
        const repaired = s.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
        return JSON.parse(repaired);
      } catch {}

      try {
        const noTrailing = s.replace(/,\s*([\]\}])(?=(?:[^"]*"[^"]*")*[^"]*$)/g, "$1");
        const repaired = noTrailing.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
        return JSON.parse(repaired);
      } catch {}

      const match = s.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          const matchRepaired = match[0].replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
          return JSON.parse(matchRepaired);
        }
      }
      throw new Error("Invalid JSON structure");
    }

    let parsedCards = [];
    try {
      parsedCards = parseJsonWithFallback(aiResponse);
    } catch {
      return sendJSON(res, { error: "AI produced invalid JSON", raw: aiResponse }, 500);
    }

    db.prepare("DELETE FROM flashcards WHERE doc_id = ?").run(docId);

    const insertCard = db.prepare("INSERT INTO flashcards (id, doc_id, front, back, created_at) VALUES (?, ?, ?, ?, ?)");
    const savedCards = [];
    for (const card of parsedCards) {
      if (card.front && card.back) {
        const cardId = "card_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
        const createdAt = Date.now();
        insertCard.run(cardId, docId, card.front, card.back, createdAt);
        savedCards.push({ id: cardId, doc_id: docId, front: card.front, back: card.back, difficulty: "new" });
      }
    }

    return sendJSON(res, { success: true, count: savedCards.length, flashcards: savedCards });
  }

  // 2. PATCH /api/flashcards/:id/review - update flashcard score/status
  const cardMatch = pathname.match(/^\/api\/flashcards\/([^/]+)\/review$/);
  if (req.method === "POST" && cardMatch) {
    const cardId = cardMatch[1];
    const { difficulty } = await getBody(req);
    db.prepare("UPDATE flashcards SET difficulty = ?, review_count = review_count + 1 WHERE id = ?").run(difficulty || "good", cardId);
    return sendJSON(res, { success: true });
  }

  return false;
}

module.exports = {
  handleFlashcardsRoutes
};
