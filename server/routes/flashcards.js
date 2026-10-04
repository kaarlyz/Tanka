const { db } = require("../db");
const { callRouter } = require("../ai");

async function handleFlashcardsRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. POST /api/ai/generate-flashcards - generate comprehensive atomic flashcards
  if (req.method === "POST" && pathname === "/api/ai/generate-flashcards") {
    const { docId, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
    if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

    const prompt = `Anda adalah spesialis metode Active Recall & Spaced Repetition (standar SuperMemo / Anki).
Lakukan AUDIT MENYELURUH terhadap seluruh isi dokumen materi di bawah ini.
Identifikasi SELURUH konsep inti, kaidah operasional, rumus & variabel, aturan baku, perbedaan konsep yang sering tertukar, dan contoh aplikasi cepat.
Jangan batasi jumlah kartu secara artifisial — buat kartu sebanyak yang dibutuhkan agar MENCENGKERAM SELURUH KONSEP POKOK dokumen (biasanya antara 8 hingga 20+ kartu tergantung kekayaan materi), tanpa kartu pengisi.

ATURAN STRUKTUR KARTU (PRINSIP ATOMIK SUPERMEMO / ANKI):
1. PRINSIP 1 KARTU = 1 FAKTA ATOMIK TUNGGAL:
   - DILARANG KERAS menggabungkan dua topik atau daftar panjang dalam satu kartu.
   - JIKA SATU TOPIK MEMILIKI BEBERAPA CABANG/POIN, WAJIB DIPISAH MENJADI BEBERAPA KARTU ATOMIK.
2. DISTRIBUSI SEIMBANG DARI AWAL HINGGA AKHIR MATERI:
   - Kartu 1–4: FONDASI & DEFINISI DASAR bab pembuka.
   - Kartu 5–8: Perkembangan konsep, konteks, aturan di bab tengah.
   - Kartu 9–dst: Tokoh kunci, teknik khusus, pembeda konsep di bab akhir.
3. SISI DEPAN (Front) - Pertanyaan Spesifik & Langsung ke Sasaran (3-10 kata).
4. SISI BELAKANG (Back) - Jawaban Padat, Konkret & Manusiawi (1-2 kalimat). Jika materi eksak, gunakan LaTeX ($...$).

Format output WAJIB HANYA berupa array JSON murni tanpa markdown fence:
[
  {"front": "Pertanyaan stimulus atomik tunggal", "back": "Jawaban ringkas 1-2 kalimat konkret atau nilai rumus"}
]

Materi:
"""
${doc.content.slice(0, 25000)}
"""`;

    const aiResponse = await callRouter([
      { role: "system", content: "You are an educational AI that extracts high-yield atomic flashcards in strict JSON." },
      { role: "user", content: prompt }
    ], model);

    let cleanJson = aiResponse.trim();
    if (cleanJson.startsWith("```json")) cleanJson = cleanJson.slice(7);
    else if (cleanJson.startsWith("```")) cleanJson = cleanJson.slice(3);
    if (cleanJson.endsWith("```")) cleanJson = cleanJson.slice(0, -3);
    cleanJson = cleanJson.trim();

    let parsedCards = [];
    try {
      parsedCards = JSON.parse(cleanJson);
    } catch (parseErr) {
      const jsonMatch = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        try {
          parsedCards = JSON.parse(jsonMatch[0]);
        } catch {
          return sendJSON(res, { error: "AI produced invalid JSON", raw: aiResponse }, 500);
        }
      } else {
        return sendJSON(res, { error: "AI produced invalid JSON", raw: aiResponse }, 500);
      }
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
