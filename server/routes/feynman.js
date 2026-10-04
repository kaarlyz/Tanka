const { db } = require("../db");
const { callRouter } = require("../ai");

async function handleFeynmanRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. POST /api/ai/feynman-evaluate - evaluate student's own explanation using Feynman active recall
  if (req.method === "POST" && pathname === "/api/ai/feynman-evaluate") {
    const { docId, topic, explanation, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    if (!explanation || !explanation.trim()) {
      return sendJSON(res, { error: "Penjelasan tidak boleh kosong" }, 400);
    }

    let docContext = "";
    if (docId) {
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (doc) docContext = `Konteks Materi Rujukan ("${doc.title}"):\n"""\n${doc.content.slice(0, 8000)}\n"""\n\n`;
    }

    const prompt = `Anda adalah evaluator metode Feynman akademik tingkat lanjut.
Siswa sedang melatih active recall dengan menjelaskan suatu konsep dengan bahasanya sendiri.
Tugas Anda: Evaluasi keakuratan penjelasan siswa secara jujur, konstruktif, dan presisi.

${docContext}Topik yang dijelaskan siswa: "${topic || "Konsep Materi"}"
Penjelasan dari siswa:
"""
${explanation.trim()}
"""

ATURAN EVALUASI:
1. Periksa apakah siswa hanya menghafal fakta akhir/prosedur angka tanpa menyebutkan konsep dasar/rumus umumnya. Jika ia melompat langsung ke pengerjaan kasus, ingatkan di bagian "missedOrFlawedPoints" bahwa ia harus paham teori dasar/rumus aslinya terlebih dahulu.
2. Jika ulasan mengandung rumus matematika, pecahan, akar, sigma, aljabar, WAJIB bungkus ekspresi dengan tanda dollar ($...$) menggunakan LaTeX standar.

Format output WAJIB HANYA berupa JSON valid tanpa teks tambahan:
{
  "score": 85,
  "verdict": "Pemahaman Sangat Kuat / Pemahaman Cukup / Ada Miskonsepsi",
  "accuratePoints": ["Poin 1 yang dipahami dengan benar", "Poin 2 yang tepat"],
  "missedOrFlawedPoints": ["Nuansa penting yang terlewat atau definisi yang kurang presisi"],
  "perfectAnalogy": "Analogi singkat, hidup, dan aplikatif sehari-hari untuk mengunci pemahaman ini di memori jangka panjang",
  "feedback": "Ulasan singkat 2-3 kalimat yang ramah, memotivasi, dan langsung ke inti perbaikan."
}`;

    const reply = await callRouter([
      { role: "system", content: "You are an expert Feynman learning evaluator strictly returning valid JSON objects." },
      { role: "user", content: prompt }
    ], model, 0.2);

    let cleanJSON = reply.trim();
    if (cleanJSON.startsWith("```json")) cleanJSON = cleanJSON.slice(7);
    else if (cleanJSON.startsWith("```")) cleanJSON = cleanJSON.slice(3);
    if (cleanJSON.endsWith("```")) cleanJSON = cleanJSON.slice(0, -3);
    cleanJSON = cleanJSON.trim();

    let evalResult = {};
    try {
      evalResult = JSON.parse(cleanJSON);
    } catch (e) {
      const objMatch = cleanJSON.match(/\{[\s\S]*\}/);
      if (objMatch) {
        evalResult = JSON.parse(objMatch[0]);
      } else {
        return sendJSON(res, { error: "Format evaluasi model AI tidak valid", raw: reply }, 500);
      }
    }

    return sendJSON(res, { success: true, evaluation: evalResult });
  }

  return false;
}

module.exports = {
  handleFeynmanRoutes
};
