const { db } = require("../db");
const { callRouter } = require("../ai");
const { safeJsonParse } = require("../utils/jsonParser");

async function handleFeynmanRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 1. POST /api/ai/feynman-evaluate - evaluate student's own explanation using Feynman active recall
  if (req.method === "POST" && pathname === "/api/ai/feynman-evaluate") {
    const { docId, topic, explanation, model = "ag/gemini-3.8-flash-low" } = await getBody(req);
    if (!explanation || !explanation.trim()) {
      return sendJSON(res, { error: "Penjelasan tidak boleh kosong" }, 400);
    }

    let docContext = "";
    let conceptsList = [];
    if (docId) {
      const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
      if (!doc) {
        return sendJSON(res, { error: "Dokumen rujukan tidak ditemukan" }, 404);
      }
      docContext = `Konteks Materi Rujukan ("${doc.title}"):\n"""\n${doc.content.slice(0, 12000)}\n"""\n\n`;
      const dbConcepts = db.prepare("SELECT * FROM document_concepts WHERE doc_id = ?").all(docId);
      if (dbConcepts && dbConcepts.length > 0) {
        conceptsList = dbConcepts.map(c => ({ id: c.id, name: c.name, definition: c.definition }));
      }
    }

    const conceptsDirective = conceptsList.length > 0
      ? `DAFTAR KONSEP KUNCI DOKUMEN:
${JSON.stringify(conceptsList, null, 2)}
Tugas: Cocokkan penjelasan siswa dengan konsep-konsep kunci di atas. Tentukan status tiap konsep: "mastered" (dipahami dengan baik), "partial" (disebut tapi kurang tepat), atau "gap" (sama sekali tidak dipahami/terlewat).`
      : (docContext ? `Tugas: Evaluasi pemahaman siswa secara kritis terhadap substansi isi teks materi rujukan di atas. Identifikasi konsep-konsep inti yang dijelaskan dan tentukan statusnya ("mastered", "partial", atau "gap").` : "");

    const prompt = `Anda adalah evaluator metode Feynman yang fleksibel dan mengapresiasi cara berpikir mandiri.
Siswa sedang melatih active recall dengan menjelaskan materi dengan BAHASANYA SENDIRI (menggunakan analogi sehari-hari, bahasa santai, perumpamaan kreatif, atau bahkan istilah rumit/tidak biasa).

PRINSIP METODE FEYNMAN:
1. Yang dinilai adalah LOGIKA, SUBSTANSI, dan KAUSALITASNYA, BUKAN formalitas bahasa buku.
2. Jika siswa menjelaskan konsep fisika/ekonomi/sosiologi/matematika dengan analogi kopi, game, pertemanan, atau istilah gaul/unik, tapi logikanya benar → NYATAKAN "mastered" (paham penuh).
3. Jangan menuntut siswa menggunakan definisi buku teks persis kata per kata. Justru kemampuan menyederhanakan ide rumit menjadi perumpamaan konkret adalah bukti penguasaan tertinggi.

${docContext}
${conceptsDirective}
Topik yang dijelaskan siswa: "${topic || "Konsep Materi"}"
Penjelasan dari siswa:
"""
${explanation.trim()}
"""

Format output WAJIB HANYA berupa JSON valid tanpa teks tambahan:
{
  "conceptsEvaluated": [
    {
      "name": "Nama Konsep",
      "status": "mastered",
      "evidenceQuote": "Kutipan kalimat siswa yang membuktikan",
      "gapNote": ""
    }
  ],
  "accuratePoints": ["Poin yang dipahami dengan benar"],
  "missedOrFlawedPoints": ["Bagian yang keliru atau terlewat"],
  "perfectAnalogy": "Analogi sederhana dan hidup untuk membantu siswa mengunci konsep ini",
  "feedback": "Ulasan 2-3 kalimat dari Nara yang hangat, menyemangati, dan to-the-point."
}`;

    const reply = await callRouter([
      { role: "system", content: "You are an expert Feynman learning evaluator strictly returning valid JSON objects." },
      { role: "user", content: prompt }
    ], model, 0.2);

    let evalResult = safeJsonParse(reply);
    if (!evalResult) {
      return sendJSON(res, { error: "Format evaluasi model AI tidak valid", raw: reply }, 500);
    }

    // Deterministic rubric-based score calculation in code (not hallucinatory LLM integers)
    let calculatedScore = 70;
    if (conceptsList.length > 0) {
      // Map AI returned concepts against canonical conceptsList
      const canonicalMap = new Map();
      conceptsList.forEach(c => {
        canonicalMap.set(c.name.toLowerCase().trim(), c);
      });

      let totalPoints = 0;
      const evaluatedNames = new Set();
      const normalizedConceptsEvaluated = [];

      if (Array.isArray(evalResult.conceptsEvaluated)) {
        evalResult.conceptsEvaluated.forEach((c) => {
          const normName = String(c.name || "").toLowerCase().trim();
          const canonicalMatch = canonicalMap.get(normName);
          if (canonicalMatch) {
            evaluatedNames.add(normName);
            const st = String(c.status || "").toLowerCase().trim();
            const points = st === "mastered" ? 100 : (st === "partial" ? 50 : 0);
            totalPoints += points;
            normalizedConceptsEvaluated.push({
              id: canonicalMatch.id,
              name: canonicalMatch.name,
              status: points === 100 ? "mastered" : (points === 50 ? "partial" : "gap"),
              evidenceQuote: c.evidenceQuote || "",
              gapNote: c.gapNote || ""
            });
          }
        });
      }

      // Any canonical concepts omitted by student are scored as 0 (gap)
      conceptsList.forEach(c => {
        const normName = c.name.toLowerCase().trim();
        if (!evaluatedNames.has(normName)) {
          normalizedConceptsEvaluated.push({
            id: c.id,
            name: c.name,
            status: "gap",
            evidenceQuote: "",
            gapNote: "Konsep ini belum dibahas dalam penjelasan siswa."
          });
        }
      });

      evalResult.conceptsEvaluated = normalizedConceptsEvaluated;
      calculatedScore = Math.round(totalPoints / conceptsList.length);
    } else if (Array.isArray(evalResult.conceptsEvaluated) && evalResult.conceptsEvaluated.length > 0) {
      let totalPoints = 0;
      evalResult.conceptsEvaluated.forEach((c) => {
        const st = String(c.status || "").toLowerCase().trim();
        if (st === "mastered") totalPoints += 100;
        else if (st === "partial") totalPoints += 50;
        else totalPoints += 0;
      });
      calculatedScore = Math.round(totalPoints / evalResult.conceptsEvaluated.length);
    } else {
      // Fallback rubric if no concepts array
      const accurateCount = (evalResult.accuratePoints || []).length;
      const flawedCount = (evalResult.missedOrFlawedPoints || []).length;
      calculatedScore = Math.max(30, Math.min(95, 60 + (accurateCount * 12) - (flawedCount * 10)));
    }

    evalResult.score = calculatedScore;
    evalResult.verdict = calculatedScore >= 80 ? "Pemahaman Sangat Kuat" : calculatedScore >= 60 ? "Pemahaman Cukup" : "Ada Miskonsepsi Kritis";

    // Persist learner event to database with idempotency protection
    try {
      if (docId) {
        const docExists = db.prepare("SELECT id FROM documents WHERE id = ?").get(docId);
        if (docExists) {
          const recentThreshold = Date.now() - 10000;
          const existingEvent = db.prepare(`
            SELECT id FROM learner_events
            WHERE doc_id = ? AND activity_type = 'feynman' AND concept_id = ? AND created_at > ?
          `).get(docId, topic || "Feynman", recentThreshold);

          if (!existingEvent) {
            const eventId = `event_feynman_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
            const insertEvent = db.prepare("INSERT INTO learner_events (id, user_id, doc_id, concept_id, activity_type, result, payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            insertEvent.run(
              eventId,
              null,
              docId,
              topic || "Feynman",
              "feynman",
              calculatedScore >= 70 ? "mastered" : "gap",
              JSON.stringify({ score: calculatedScore, gaps: evalResult.missedOrFlawedPoints || [] }),
              Date.now()
            );
          }
        }
      }
    } catch (dbErr) {
      console.warn("[tanka] Failed to record Feynman learner event:", dbErr.message);
    }

    return sendJSON(res, { success: true, evaluation: evalResult });
  }

  // 2. POST /api/ai/transcribe-audio - ultra-fast offline STT via faster-whisper
  if (req.method === "POST" && pathname === "/api/ai/transcribe-audio") {
    const { audioBase64, language = "id" } = await getBody(req);
    if (!audioBase64) {
      return sendJSON(res, { error: "No audio data provided" }, 400);
    }
    const fs = require("fs");
    const path = require("path");
    const { execFile } = require("child_process");

    const tempFile = path.join("/tmp", `feynman_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.webm`);
    try {
      const buffer = Buffer.from(audioBase64, "base64");
      fs.writeFileSync(tempFile, buffer);

      const sttScript = path.join(__dirname, "../services/stt.py");
      execFile("uv", ["run", "--python", "3.12", "--with", "faster-whisper", "--with", "av<14", "python3", sttScript, tempFile, language], (err, stdout, stderr) => {
        try { fs.unlinkSync(tempFile); } catch {}
        if (err) {
          console.error("[tanka-stt] Error:", err, stderr);
          return sendJSON(res, { error: "Transkripsi audio gagal", detail: stderr }, 500);
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          return sendJSON(res, parsed);
        } catch {
          return sendJSON(res, { success: true, text: stdout.trim() });
        }
      });
    } catch (e) {
      try { fs.unlinkSync(tempFile); } catch {}
      return sendJSON(res, { error: e.message }, 500);
    }
    return true;
  }

  return false;
}

module.exports = {
  handleFeynmanRoutes
};
