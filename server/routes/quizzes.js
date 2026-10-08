const crypto = require("node:crypto");
const { db } = require("../db");
const { callRouter, detectRealMath } = require("../ai");
const { safeJsonParse } = require("../utils/jsonParser");

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

    const parsedCount = parseInt(count, 10);
    const finalCount = Number.isFinite(parsedCount) ? Math.max(1, Math.min(30, parsedCount)) : 5;
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
    if (!doc) return sendJSON(res, { error: "Document not found" }, 404);

    const isMathDomain = detectRealMath(doc.content);

    let typeGuidance = "";
    if (isMathDomain) {
      if (quizType === "beginner") {
        typeGuidance = `TIPE KUIS: EKSAK / KUANTITATIF - PEMULA & FONDASI BERTAHAP
- PRINSIP: Mulai dari angka kecil konkret dan pembacaan notasi dasar, bukan rumus abstrak yang menakutkan pemula.
- URUTAN TANGGA KESULITAN:
  * Soal 1 (Pemanasan Fondasi): Identifikasi variabel/elemen, membaca grafik/tabel, atau pemahaman dimensi/ordo.
  * Soal 2–3 (Operasi Tunggal Sederhana): Satu langkah pengerjaan dasar (substitusi langsung nilai angka kecil).
  * Soal 4–5 (Operasi Terarah Bertahap): Operasi 2 tahap pengerjaan (penyederhanaan, eliminasi bertahap, atau penerapan rumus inti).
- OPSI JAWABAN (A, B, C, D, E): WAJIB berupa angka bulat, nilai pecahan sederhana, atau notasi variabel yang ringkas.`;
      } else if (quizType === "conceptual") {
        typeGuidance = `TIPE KUIS: EKSAK / KUANTITATIF - STANDAR UJIAN SEKOLAH
- Uji sifat-sifat matematis, pemecahan persamaan standar, hubungan antar-variabel, dan penerapan aturan baku materi.
- Soal to-the-point dengan angka bulat rapi. Pembahasan menjabarkan langkah hitung tuntas.`;
      } else {
        typeGuidance = `TIPE KUIS: EKSAK / KUANTITATIF - HOTS & SELEKSI TINGGI
- Penalaran tingkat tinggi: penggabungan multi-aturan, pemecahan parameter variabel tak diketahui, atau pembuktian sifat non-rutin.`;
      }
    } else {
      if (quizType === "beginner") {
        typeGuidance = `TIPE KUIS: KONSEPTUAL / ILMU SOSIAL / TEORI - PEMULA & ULANGAN HARIAN
- Soal diambil langsung dari materi sumber (definisi dasar istilah pokok, klasifikasi fungsi, latar belakang).
- OPSI JAWABAN (A, B, C, D, E): WAJIB SINGKAT, PADAT, DAN LANGSUNG KE INTI.`;
      } else if (quizType === "conceptual") {
        typeGuidance = `TIPE KUIS: KONSEPTUAL / ILMU SOSIAL / TEORI - STANDAR UJIAN SEMESTER
- Uji penguasaan konsep menyeluruh: hubungan sebab-akibat, perbandingan antar-kategori, dan analisis pembeda istilah.`;
      } else {
        typeGuidance = `TIPE KUIS: KONSEPTUAL / ILMU SOSIAL / TEORI - ANALISIS MENDALAM (HOTS)
- Analisis kritis antar-teori, evaluasi studi kasus kontekstual, dan keterkaitan multi-variabel fenomena materi.`;
      }
    }

    let customDirective = "";
    if (customInstruction && customInstruction.trim()) {
      customDirective = `
ARAHAN KHUSUS & KEINGINAN SISWA MENGENAI SOAL INI:
"${customInstruction.trim()}"
PENTING:
- Jika siswa meminta "buat soal sejenis / kloning": ambil pola soal yang sudah ada tetapi ubah angka/variabelnya agar siswa bisa melatih konsep yang sama berulang kali.
- Jika siswa meminta topik tertentu diperbanyak: jadikan topik tersebut fokus utama pada seluruh butir soal.
- Jika siswa meminta soal penalaran/HOTS: rancang pertanyaan berbasis analisis mendalam atau stimulus cerita/kasus.
- Jika siswa meminta soal pemahaman fondasi: rancang pertanyaan logika konsep tanpa perhitungan rumit yang membingungkan.
`;
    }

    let referenceContext = "";
    if (Array.isArray(referenceQuestions) && referenceQuestions.length > 0) {
      referenceContext = `
CONTOH BUTIR SOAL ACUAN DARI MATERI SAAT INI:
${JSON.stringify(referenceQuestions.slice(0, 4).map((q) => ({ question: q.question, options: q.options, explanation: q.explanation })), null, 2)}
Gunakan acuan di atas untuk membuat soal sejenis/variasi sesuai arahan siswa.
`;
    }

    const unresolvedMistakes = db.prepare(
      "SELECT question, pitfall, formula FROM mistake_notebook WHERE doc_id = ? AND resolved = 0 LIMIT 5"
    ).all(docId);

    let weaknessContext = "";
    if (unresolvedMistakes && unresolvedMistakes.length > 0) {
      weaknessContext = `\nCATATAN EVALUASI & TITIK LEMAH PEMBELAJAR (PRIORITAS REMEDIAL):
Pembelajar sebelumnya pernah keliru pada konsep/soal berikut:
${unresolvedMistakes.map((m, i) => `${i + 1}. Soal Terkait: "${m.question}" | Analisis Jebakan: ${m.pitfall || "Miskonsepsi pemahaman"}`).join("\n")}
PRIORITAS: Alokasikan 1 atau 2 butir soal variasi baru yang menyasar konsep di atas. Buat opsi pengecoh yang dirancang persis dengan miskonsepsi (jebakan) tersebut agar kita tahu apakah dia jatuh ke lubang yang sama.\n`;
    }

    let adaptiveContext = "";
    if (lastScore !== null && lastScore !== undefined) {
      const s = parseInt(lastScore, 10);
      if (s < 40) {
         adaptiveContext = `\n[SISTEM ADAPTIF - SKOR TERAKHIR: ${s}/100]\nPengguna sangat kesulitan pada tes sebelumnya.\nINSTRUKSI KHUSUS:\n1. SCAFFOLDING MUNDUR: Turunkan tingkat kesulitan 1 level. Awali dengan 2 soal fundamental / konsep paling dasar sebelum ke hitungan kompleks.\n2. DRILL ISOMORFIK: Buat soal identik (isomorphic) dengan kesalahan sebelumnya tapi dengan angka/situasi yang diubah, agar ia membiasakan jalan pikiran yang benar.\n`;
      } else if (s < 75) {
         adaptiveContext = `\n[SISTEM ADAPTIF - SKOR TERAKHIR: ${s}/100]\nPengguna masih ragu di beberapa konsep menengah.\nINSTRUKSI KHUSUS: Pertahankan level ini, tapi pastikan bagian 'explanation' (pembahasan) dijabarkan jauh lebih mendetail dan asyik. Jelaskan *kenapa* opsi lain salah secara psikologis.\n`;
      } else if (s >= 85) {
         adaptiveContext = `\n[SISTEM ADAPTIF - SKOR TERAKHIR: ${s}/100]\nPengguna telah menguasai materi ini dengan baik!\nINSTRUKSI KHUSUS: Naikkan tingkat kesulitan (HOTS). Berikan soal sintesis/gabungan multi-aturan, atau studi kasus nyata yang menantang pemikiran kritisnya. Buat pengecoh (distractors) yang lebih halus.\n`;
      }
    }

    // Pull canonical concepts & raw segments to ground questions in source facts, not LLM stories
    const concepts = db.prepare("SELECT * FROM document_concepts WHERE doc_id = ?").all(docId);
    const segments = db.prepare("SELECT raw_text FROM document_segments WHERE doc_id = ? ORDER BY segment_index ASC").all(docId);

    let factsContext = "";
    if (concepts && concepts.length > 0) {
      factsContext = "DAFTAR KONSEP KANONIKAL RESMI (SUMBER UTAMA):\n" +
        concepts.map((c, i) => `${i + 1}. [${c.name}]: ${c.definition}`).join("\n") + "\n\n";
    }
    if (segments && segments.length > 0) {
      factsContext += "SUMBER FAKTA ASLI:\n" + segments.map(s => s.raw_text).join("\n\n").slice(0, 5000);
    } else {
      factsContext += "TEKS MATERI:\n" + doc.content.slice(0, 5000);
    }

    const mathRule = isMathDomain
      ? `ATURAN FORMAT MATEMATIKA:
Jika materi/soal mengandung rumus atau hitungan, WAJIB gunakan KaTeX LaTeX ($...$ inline atau $$...$$ blok), contoh: $\\frac{a}{b}$, $\\sqrt{x}$, $x^2$.`
      : `ATURAN MATERI NON-HITUNGAN:
Materi ini adalah materi konseptual/teori non-matematika. Kosongkan field "formula": "" dan fokus pada pemahaman konsep/fakta. DILARANG MENGARANG RUMUS FISIKA/MATEMATIKA PADA ILMU SOSIAL.`;

    // Fungsi pembantu generate batch kecil (maksimal 7-8 soal per panggilan AI agar JSON utuh & anti-truncation)
    const generateQuizBatch = async (batchCount, offsetId = 1) => {
      const prompt = `Anda adalah pembuat soal ujian akademik profesional berstandar tinggi (UTBK & Ujian Sekolah).
Buatkan TEPAT ${batchCount} butir soal pilihan ganda dengan 5 PILIHAN JAWABAN (A, B, C, D, E) mulai nomor urut ID ${offsetId}.

${typeGuidance}
${customDirective}
${referenceContext}
${weaknessContext}
${adaptiveContext}

STANDAR KUALITAS SOAL (UTBK/ASESMEN NASIONAL):
1. ATURAN "SCENARIO-DEPENDENT" (ANTI-HAFALAN DEFINISI):
   - Soal menghadirkan dinamika kasus, sebab-akibat, atau analisis teks kontekstual.
2. SEMANTIC SYMMETRY PADA DISTRAKTOR:
   - Pilihan pengecoh (distraktor) mewakili kesalahan berpikir/miskonsepsi nyata siswa.
3. KESEIMBANGAN PANJANG OPSI:
   - Kelima opsi A-E memiliki tingkat kedalaman dan panjang kalimat yang seimbang.
4. KUNCI JAWABAN: correctIndex 0=A, 1=B, 2=C, 3=D, 4=E.
5. FORMAT TEKS OPSI: DILARANG menyertakan prefix huruf seperti "A.", "B." di teks options.

${mathRule}

Format output WAJIB HANYA berupa array JSON valid tanpa markdown fence:
[
  {
    "id": ${offsetId},
    "question": "...",
    "options": ["...", "...", "...", "...", "..."],
    "correctIndex": 1,
    "formula": "",
    "steps": [
      {"step": 1, "title": "Identifikasi", "desc": "..."},
      {"step": 2, "title": "Operasi/Penalaran", "desc": "..."},
      {"step": 3, "title": "Kesimpulan", "desc": "..."}
    ],
    "explanation": "...",
    "pitfall": "..."
  }
]

Fakta & Konsep Sumber:
"""
${factsContext}
"""`;

      const tokenBudget = Math.min(8192, Math.max(2048, batchCount * 800));
      const reply = await callRouter([
        { role: "system", content: "You are an expert exam question generator that strictly outputs valid JSON arrays." },
        { role: "user", content: prompt }
      ], model, 0.2, tokenBudget);

      const parsed = safeJsonParse(reply);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      throw new Error("Format JSON soal tidak valid dari model AI");
    };

    let questions = [];
    try {
      if (finalCount <= 8) {
        questions = await generateQuizBatch(finalCount, 1);
      } else {
        // Jika diminta >8 soal (misal 10, 15, 20 soal), pecah jadi batch paralel agar output token aman & cepat
        const batchSize = 7;
        const tasks = [];
        let remaining = finalCount;
        let currentOffset = 1;
        while (remaining > 0) {
          const take = Math.min(batchSize, remaining);
          tasks.push({ count: take, offset: currentOffset });
          currentOffset += take;
          remaining -= take;
        }

        const results = await Promise.all(
          tasks.map(t => generateQuizBatch(t.count, t.offset))
        );
        questions = results.flat();
      }
    } catch (err) {
      console.error("[Generate-Quiz] Gagal menyusun soal:", err.message);
      return sendJSON(res, { error: "Format JSON soal tidak valid dari model AI: " + err.message }, 500);
    }

    const letters = ["A", "B", "C", "D", "E"];
    questions.forEach((q) => {
      if (Array.isArray(q.options) && q.options.length >= 2) {
        // Strip any hardcoded "A. ", "B. ", "C) " prefix from LLM options
        q.options = q.options.map(opt => typeof opt === "string" ? opt.replace(/^[A-Ea-e][\.\)]\s*/, "").trim() : opt);

        const oldCorrectIdx = typeof q.correctIndex === "number" && q.correctIndex >= 0 ? q.correctIndex : 0;
        const originalCorrect = q.options[oldCorrectIdx];
        const oldLetter = letters[oldCorrectIdx] || "A";

        // 1. Shuffle all options with Fisher-Yates
        for (let i = q.options.length - 1; i > 0; i--) {
          const j = crypto.randomInt(0, i + 1);
          [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
        }

        // 2. Assign independent random target slot per question
        const targetSlot = crypto.randomInt(0, q.options.length);
        const currPos = q.options.indexOf(originalCorrect);
        if (currPos !== -1 && targetSlot < q.options.length) {
          [q.options[currPos], q.options[targetSlot]] = [q.options[targetSlot], q.options[currPos]];
          q.correctIndex = targetSlot;
        } else {
          q.correctIndex = q.options.indexOf(originalCorrect);
        }

        const newLetter = letters[q.correctIndex] || "A";

        // Bersihkan penyebutan huruf acak yang kontradiktif dari pembahasan AI
        if (q.explanation) {
          q.explanation = q.explanation
            .replace(/(?:Koreksi data|Mari sesuaikan data|Q2 harus|Kita ubah agar)[^.]*\./gi, "")
            .replace(/Pilihan\s+[A-E]\s+benar(?:\s+karena)?/gi, "Jawaban yang tepat adalah")
            .replace(/Opsi\s+[A-E]\s+benar(?:\s+karena)?/gi, "Jawaban yang tepat adalah")
            .replace(/Pilihan\s+[A-E]\s+tepat/gi, "Jawaban yang tepat")
            .replace(/Opsi\s+[A-E]\s+tepat/gi, "Jawaban yang tepat")
            .trim();
        }

        if (Array.isArray(q.steps)) {
          q.steps = q.steps.map((s) => {
            let desc = s.desc || "";
            desc = desc
              .replace(/pilihan\s+[A-E]\s+benar/gi, "jawaban yang tepat")
              .replace(/opsi\s+[A-E]\s+benar/gi, "jawaban yang tepat");
            return { ...s, desc };
          });
        }
      }
    });

    // Deterministic Machine Validation (KaTeX syntax parity & empty braces cleanup)
    const sanitizeMathString = (t) => {
      if (!t || typeof t !== "string") return t;
      let cleaned = t;
      const dollarCount = (cleaned.match(/(?<!\\)\$/g) || []).length;
      if (dollarCount % 2 !== 0) {
        cleaned += "$";
      }
      return cleaned.replace(/\{\}/g, "");
    };

    questions.forEach((q) => {
      q.question = sanitizeMathString(q.question);
      if (Array.isArray(q.options)) {
        q.options = q.options.map(sanitizeMathString);
      }
      if (q.explanation) {
        q.explanation = sanitizeMathString(q.explanation);
      }
    });

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
  handleQuizzesRoutes
};
