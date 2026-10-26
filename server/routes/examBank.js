const { db } = require("../db");
const { callRouter } = require("../ai");
const { safeJsonParse } = require("../utils/jsonParser");
const { generateAiDrillPackage, POLA_BLUEPRINT } = require("../services/aiDrillGenerator");

function normalizeStatementValue(val) {
  if (!val) return "";
  const v = String(val).trim().toLowerCase();
  if (["true", "benar", "sesuai", "tepat", "setuju"].includes(v)) return "benar";
  if (["false", "salah", "tidak sesuai", "tidak tepat", "tidak setuju"].includes(v)) return "salah";
  return v;
}

function normalizeAnswer(ans) {
  if (ans === null || ans === undefined) return "";
  const s = String(ans).trim().toLowerCase();
  const parts = s.split(/[;,]/).map((p) => {
    const trimmed = p.trim();
    if (trimmed.includes(":")) {
      const subParts = trimmed.split(":");
      const id = subParts[0].trim();
      const val = subParts.slice(1).join(":").trim();
      return `${id}:${normalizeStatementValue(val)}`;
    }
    return normalizeStatementValue(trimmed);
  }).filter(Boolean);
  if (parts.length > 1) {
    parts.sort();
    return parts.join(";");
  }
  return parts[0] || "";
}

function isAnswerCorrect(userAns, keyAns, tipeSoal) {
  const normUser = normalizeAnswer(userAns);
  const normKey = normalizeAnswer(keyAns);
  if (!normUser || !normKey) return false;
  if (normUser === normKey) return true;

  if (tipeSoal === "pernyataan" || (normKey.includes(":") && normUser.includes(":"))) {
    const parsePairs = (str) => {
      const map = {};
      str.split(";").forEach((p) => {
        const [k, ...v] = p.split(":");
        if (k && v.length) map[k.trim()] = normalizeStatementValue(v.join(":"));
      });
      return map;
    };
    const userMap = parsePairs(normUser);
    const keyMap = parsePairs(normKey);
    const keyEntries = Object.entries(keyMap);
    if (keyEntries.length === 0) return false;
    return keyEntries.every(([k, v]) => userMap[k] === v);
  }

  return false;
}

function calculateEstimatedIRT(correct, total) {
  if (!total || total <= 0) return 200;
  const ratio = Math.max(0, Math.min(1, correct / total));
  if (ratio <= 0) return 250;
  if (ratio >= 1) return 855; // Skor puncak historis (Top 0.1% Nasional / STEI ITB)

  // Kurva Kalibrasi Distribusi Persentil Resmi SNBT/Stekom:
  // Median 50% = 504, 80% = 708, 91.3% = 790 (Zona Aman STEI ITB), 100% = 855
  const irt = Math.round(250 + Math.pow(ratio, 1.25) * 605);
  return Math.min(855, Math.max(250, irt));
}

function getDeduplicatedSoalText(soal, bacaan) {
  if (!soal || typeof soal !== "string") return "";
  if (!bacaan || typeof bacaan !== "string" || !bacaan.trim()) return soal;

  let cleaned = soal;

  // 1. Remove any <div class="exam-bacaan"[^>]*>...</div> or <div class="wacana"[^>]*>...</div>
  cleaned = cleaned.replace(/<div\s+class=["'](?:exam-bacaan|wacana)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, "").trim();

  // Helper to extract clean plain text for comparison
  const stripTags = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const plainBacaan = stripTags(bacaan);
  const plainSoal = stripTags(cleaned);

  if (!plainBacaan || !plainSoal) return cleaned || soal;

  // 2. Check if soal has paragraphs (<p>...</p>) where initial paragraph(s) match bacaan
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const pMatches = [...cleaned.matchAll(pRegex)];

  if (pMatches.length > 1) {
    let removeCount = 0;
    for (let i = 0; i < pMatches.length - 1; i++) {
      const pText = stripTags(pMatches[i][1]);
      if (pText.length > 15 && plainBacaan.includes(pText)) {
        removeCount++;
      } else {
        break;
      }
    }
    if (removeCount > 0 && removeCount < pMatches.length) {
      let remaining = cleaned;
      for (let i = 0; i < removeCount; i++) {
        remaining = remaining.replace(pMatches[i][0], "");
      }
      const trimmed = remaining.trim();
      if (trimmed) return trimmed;
    }
  }

  // 3. Check if soal is separated by double newlines (\n\n)
  const lines = cleaned.split(/\n\s*\n/);
  if (lines.length > 1) {
    let removeCount = 0;
    for (let i = 0; i < lines.length - 1; i++) {
      const lineText = stripTags(lines[i]);
      if (lineText.length > 15 && plainBacaan.includes(lineText)) {
        removeCount++;
      } else {
        break;
      }
    }
    if (removeCount > 0 && removeCount < lines.length) {
      const trimmed = lines.slice(removeCount).join("\n\n").trim();
      if (trimmed) return trimmed;
    }
  }

  // 4. Check if cleaned begins with plainBacaan prefix
  const minPrefix = 30;
  if (plainBacaan.length >= minPrefix) {
    const bacaanPrefix = plainBacaan.slice(0, Math.min(100, plainBacaan.length));
    if (plainSoal.startsWith(bacaanPrefix)) {
      const bacaanWords = plainBacaan.split(/\s+/);
      const soalWords = plainSoal.split(/\s+/);
      let matchIdx = 0;
      while (matchIdx < bacaanWords.length && matchIdx < soalWords.length && bacaanWords[matchIdx].toLowerCase() === soalWords[matchIdx].toLowerCase()) {
        matchIdx++;
      }
      if (matchIdx >= 5 && matchIdx < soalWords.length) {
        const remainingWords = soalWords.slice(matchIdx).join(" ");
        if (remainingWords.trim().length > 0) {
          const qMarkIdx = cleaned.lastIndexOf("?");
          if (qMarkIdx !== -1) {
            const beforeQ = cleaned.slice(0, qMarkIdx + 1);
            const lastPeriod = Math.max(beforeQ.lastIndexOf(". "), beforeQ.lastIndexOf("</p>"), beforeQ.lastIndexOf("\n"));
            if (lastPeriod !== -1) {
              const questionPrompt = cleaned.slice(lastPeriod).replace(/^[\.\s<\/p>]+/, "").trim();
              if (questionPrompt.length > 10) return questionPrompt;
            }
          }
          return remainingWords;
        }
      }
    }
  }

  return cleaned || soal;
}

async function handleExamBankRoutes(req, res, pathname, helpers) {
  const { sendJSON, getBody } = helpers;

  // 0. Sesi Aktif CBT (GET / POST / DELETE /api/exam-bank/session)
  if (pathname === "/api/exam-bank/session") {
    // GET /api/exam-bank/session
    if (req.method === "GET") {
      try {
        const sessionUser = helpers.getSessionUser ? helpers.getSessionUser(req) : null;
        const urlObj = new URL(req.url, "http://localhost");
        const userId = sessionUser ? sessionUser.id : (helpers.getUserId ? helpers.getUserId(req) : (urlObj.searchParams.get("userId") || "anon"));

        if (!userId || userId === "anon") {
          return sendJSON(res, { session: null }, 200);
        }

        const row = db.prepare("SELECT * FROM cbt_active_sessions WHERE user_id = ?").get(userId);
        if (!row) {
          return sendJSON(res, { session: null }, 200);
        }

        let parsedAnswers = {};
        let parsedDoubtful = {};
        let parsedDrillChecked = {};
        try { parsedAnswers = JSON.parse(row.answers_json || "{}"); } catch {}
        try { parsedDoubtful = JSON.parse(row.doubtful_json || "{}"); } catch {}
        try { parsedDrillChecked = JSON.parse(row.drill_checked_json || "{}"); } catch {}

        const pkg = db.prepare("SELECT id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions FROM exam_bank_packages WHERE id = ?").get(row.package_id);
        let formattedItems = [];
        if (pkg) {
          const rawItems = db.prepare(
            "SELECT id, nomor, tipe_soal, bacaan, soal, soal_img, options_json, kunci_jawaban, kunci_jawaban_text FROM exam_bank_items WHERE package_id = ? ORDER BY nomor ASC"
          ).all(row.package_id);
          formattedItems = rawItems.map((item) => {
            let options = [];
            try { options = item.options_json ? JSON.parse(item.options_json) : []; } catch {}
            return {
              id: item.id,
              nomor: item.nomor,
              tipe_soal: item.tipe_soal,
              bacaan: item.bacaan || "",
              soal: item.soal,
              soal_img: item.soal_img || "",
              options,
              kunci_jawaban: item.kunci_jawaban,
              kunci_jawaban_text: item.kunci_jawaban_text || "",
            };
          });
        }

        return sendJSON(res, {
          session: {
            userId: row.user_id,
            user_id: row.user_id,
            packageId: row.package_id,
            package_id: row.package_id,
            currentIndex: row.current_index,
            current_index: row.current_index,
            answers: parsedAnswers,
            answers_json: row.answers_json,
            doubtful: parsedDoubtful,
            doubtful_json: row.doubtful_json,
            drillChecked: parsedDrillChecked,
            drill_checked_json: row.drill_checked_json,
            timeLeft: row.time_left,
            time_left: row.time_left,
            studyMode: row.study_mode || "exam",
            study_mode: row.study_mode || "exam",
            updatedAt: row.updated_at,
            updated_at: row.updated_at,
            package: pkg || null,
            items: formattedItems
          }
        }, 200);
      } catch (err) {
        console.error("[examBank] Gagal memuat sesi aktif:", err);
        return sendJSON(res, { error: err.message }, 500);
      }
    }

    // POST /api/exam-bank/session
    if (req.method === "POST") {
      try {
        const body = await getBody(req);
        const sessionUser = helpers.getSessionUser ? helpers.getSessionUser(req) : null;
        const userId = sessionUser ? sessionUser.id : (body.userId || body.user_id || (helpers.getUserId ? helpers.getUserId(req, body) : null));

        if (!userId || userId === "anon") {
          return sendJSON(res, { error: "User tidak terautentikasi atau userId tidak valid" }, 401);
        }

        const packageId = body.packageId || body.package_id;
        if (!packageId) {
          return sendJSON(res, { error: "packageId wajib disertakan" }, 400);
        }

        const currentIndex = Number(body.currentIndex ?? body.current_index ?? 0) || 0;
        const answersJson = typeof body.answers === "object" ? JSON.stringify(body.answers) : (body.answers_json || String(body.answers || "{}"));
        const doubtfulJson = typeof body.doubtful === "object" ? JSON.stringify(body.doubtful) : (body.doubtful_json || String(body.doubtful || "{}"));
        const drillCheckedJson = typeof body.drillChecked === "object" ? JSON.stringify(body.drillChecked) : (body.drill_checked_json || String(body.drillChecked || "{}"));
        const timeLeft = Math.max(0, Math.round(Number(body.timeLeft ?? body.time_left ?? 0) || 0));
        const studyMode = body.studyMode || body.study_mode || "exam";
        const now = Date.now();

        db.prepare(`
          INSERT INTO cbt_active_sessions (
            user_id, package_id, current_index, answers_json, doubtful_json, drill_checked_json, time_left, study_mode, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            package_id = excluded.package_id,
            current_index = excluded.current_index,
            answers_json = excluded.answers_json,
            doubtful_json = excluded.doubtful_json,
            drill_checked_json = excluded.drill_checked_json,
            time_left = excluded.time_left,
            study_mode = excluded.study_mode,
            updated_at = excluded.updated_at
        `).run(userId, packageId, currentIndex, answersJson, doubtfulJson, drillCheckedJson, timeLeft, studyMode, now);

        return sendJSON(res, { success: true, message: "Sesi CBT aktif berhasil disimpan", updated_at: now }, 200);
      } catch (err) {
        console.error("[examBank] Gagal menyimpan sesi aktif:", err);
        return sendJSON(res, { error: err.message }, 500);
      }
    }

    // DELETE /api/exam-bank/session
    if (req.method === "DELETE") {
      try {
        let body = {};
        try { body = await getBody(req); } catch {}
        const sessionUser = helpers.getSessionUser ? helpers.getSessionUser(req) : null;
        const urlObj = new URL(req.url, "http://localhost");
        const userId = sessionUser ? sessionUser.id : (body.userId || body.user_id || (helpers.getUserId ? helpers.getUserId(req, body) : (urlObj.searchParams.get("userId") || null)));

        if (userId && userId !== "anon") {
          db.prepare("DELETE FROM cbt_active_sessions WHERE user_id = ?").run(userId);
        }

        return sendJSON(res, { success: true, message: "Sesi CBT aktif dibersihkan" }, 200);
      } catch (err) {
        console.error("[examBank] Gagal menghapus sesi aktif:", err);
        return sendJSON(res, { error: err.message }, 500);
      }
    }
  }

  // 1. GET /api/exam-bank/packages
  if (req.method === "GET" && pathname === "/api/exam-bank/packages") {
    try {
      const urlObj = new URL(req.url, "http://localhost");
      const source = urlObj.searchParams.get("source");
      const jenjang = urlObj.searchParams.get("jenjang");

      let query = "SELECT id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions FROM exam_bank_packages";
      const conditions = [];
      const params = [];

      if (source) {
        conditions.push("source = ?");
        params.push(source);
      }
      if (jenjang) {
        conditions.push("jenjang = ?");
        params.push(jenjang);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
      query += " ORDER BY source ASC, subtes_or_mapel ASC, paket ASC";

      const packages = db.prepare(query).all(...params);
      return sendJSON(res, packages, 200);
    } catch (err) {
      console.error("[examBank] Gagal memuat daftar paket:", err);
      return sendJSON(res, { error: err.message }, 500);
    }
  }

  // 1b. GET /api/exam-bank/submissions
  if (req.method === "GET" && pathname === "/api/exam-bank/submissions") {
    try {
      const sessionUser = helpers.getSessionUser ? helpers.getSessionUser(req) : null;
      const urlObj = new URL(req.url, "http://localhost");
      const qUserId = urlObj.searchParams.get("userId") || (sessionUser ? sessionUser.id : (helpers.getUserId ? helpers.getUserId(req) : null));
      const packageId = urlObj.searchParams.get("packageId");
      const limit = Math.min(100, Math.max(1, parseInt(urlObj.searchParams.get("limit") || "50", 10)));

      let query = "SELECT * FROM exam_bank_submissions";
      const conds = [];
      const params = [];

      if (qUserId && qUserId !== "all") {
        conds.push("(user_id = ? OR user_id = 'anon')");
        params.push(qUserId);
      }
      if (packageId) {
        conds.push("package_id = ?");
        params.push(packageId);
      }

      if (conds.length > 0) {
        query += " WHERE " + conds.join(" AND ");
      }
      query += " ORDER BY created_at DESC LIMIT ?";
      params.push(limit);

      const rows = db.prepare(query).all(...params);
      const submissions = rows.map((r) => {
        let parsedAnswers = {};
        let parsedBreakdown = [];
        try { parsedAnswers = JSON.parse(r.answers_json || "{}"); } catch {}
        try { parsedBreakdown = JSON.parse(r.breakdown_json || "[]"); } catch {}
        return {
          id: r.id,
          userId: r.user_id,
          user_id: r.user_id,
          packageId: r.package_id,
          package_id: r.package_id,
          packageTitle: r.package_title,
          package_title: r.package_title,
          totalQuestions: r.total_questions,
          total_questions: r.total_questions,
          answeredCount: r.answered_count,
          answered_count: r.answered_count,
          correctCount: r.correct_count,
          correct_count: r.correct_count,
          scorePercent: r.score_percent,
          score_percent: r.score_percent,
          estimatedIrt: r.estimated_irt,
          estimated_irt: r.estimated_irt,
          studyMode: r.study_mode,
          study_mode: r.study_mode,
          answers: parsedAnswers,
          breakdown: parsedBreakdown,
          createdAt: r.created_at,
          created_at: r.created_at,
        };
      });

      return sendJSON(res, { submissions, success: true }, 200);
    } catch (err) {
      console.error("[examBank] Gagal memuat riwayat submission:", err);
      return sendJSON(res, { error: err.message }, 500);
    }
  }

  // 1c. POST /api/exam-bank/generate-ai-drill
  if (req.method === "POST" && pathname === "/api/exam-bank/generate-ai-drill") {
    try {
      const body = await getBody(req);
      const { subject = "Bahasa Indonesia", pola = "all", count = 5, topic = "", tier = "standard", model = "ag/gemini-3.8-flash-low" } = body;

      const aiData = await generateAiDrillPackage({ subject, pola, count, topic, tier, model });
      const now = Date.now();
      const pkgId = `ai_drill_${now}_${Math.random().toString(36).slice(2, 7)}`;
      const paketTitle = pola === "all"
        ? `Simulasi Pusmendik [${count} Butir - Campuran]`
        : `Drill Khusus Pola ${pola} [${count} Butir]`;
      const kategori = ["Ekonomi", "Sosiologi"].includes(subject) ? "pilihan" : "wajib";

      db.exec("BEGIN");
      try {
        db.prepare(`
          INSERT INTO exam_bank_packages (
            id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions, status, metadata_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          pkgId,
          "ai_drill",
          "SMA",
          kategori,
          subject,
          paketTitle,
          aiData.items.length,
          "completed",
          JSON.stringify({ generated_by: "tanka_nara_ai", pola, topic, tier, model, created_at: now }),
          now,
          now
        );

        const insertItem = db.prepare(`
          INSERT INTO exam_bank_items (
            id, package_id, source, jenjang, subtes_or_mapel, paket, nomor, tipe_soal, bacaan, soal, options_json, kunci_jawaban, kunci_jawaban_text, metadata_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of aiData.items) {
          const itemId = `${pkgId}_item_${item.nomor}`;
          insertItem.run(
            itemId,
            pkgId,
            "ai_drill",
            "SMA",
            subject,
            paketTitle,
            item.nomor,
            item.tipe_soal || "pilihan_ganda",
            item.bacaan || aiData.bacaan || "",
            item.soal || "",
            JSON.stringify(item.options || []),
            item.kunci_jawaban || "",
            item.kunci_jawaban_text || "",
            JSON.stringify({ pola: item.pola || null }),
            now
          );
        }
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }

      const createdPkg = db.prepare("SELECT id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions FROM exam_bank_packages WHERE id = ?").get(pkgId);
      return sendJSON(res, { package: createdPkg, success: true }, 201);
    } catch (err) {
      console.error("[examBank] Gagal generate AI drill:", err);
      return sendJSON(res, { error: err.message || "Gagal mencetak soal drill AI" }, 500);
    }
  }

  // 1c. POST /api/exam-bank/diagnostic-autopsy
  if (req.method === "POST" && pathname === "/api/exam-bank/diagnostic-autopsy") {
    try {
      const body = await getBody(req);
      const { packageId, scorePercent, estimatedIrt, wrongItems = [] } = body;

      const pkg = db.prepare("SELECT * FROM exam_bank_packages WHERE id = ?").get(packageId);
      const pkgTitle = pkg ? `${pkg.subtes_or_mapel} (${pkg.paket})` : "Simulasi Ujian";

      const promptSystem = `Kamu adalah Nara, pakar diagnostik pedagogis ujian Pusmendik dan SNBT.
Tugasmu adalah melakukan bedah diagnostik mendalam terhadap butir-butir soal yang dijawab SALAH oleh siswa, mengacu pada 6 Pola Baku Pusmendik dan 5 Pola Jebakan Opsi.

FORMAT OUTPUT WAJIB JSON MURNI:
{
  "executiveSummary": "Ringkasan tajam dan bersahabat tentang pola kelemahan kognitif siswa dalam 2-3 kalimat.",
  "weaknessPatterns": [
    {
      "pola": "Nama Pola (misal: Pola 2 - Ide Pokok)",
      "gejala": "Penyebab siswa keliru di pola ini",
      "tipsCepat": "Cara eksekusi cepat menghindari jebakan di pola ini"
    }
  ],
  "items": [
    {
      "nomor": 1,
      "pola": "Pola 1 s/d 6",
      "pertanyaanRingkas": "Inti yang ditanyakan",
      "jawabanSiswa": "Apa yang dipilih siswa",
      "kunciResmi": "Kunci yang benar",
      "buktiTeks": "Kutipan kalimat pembuktian di wacana",
      "analisisJebakan": "Bongkar kenapa opsi siswa salah (apakah asumsi liar, rincian sempit, kata mutlak, atau kausalitas terbalik)"
    }
  ],
  "actionPlan": [
    "Langkah perbaikan 1",
    "Langkah perbaikan 2",
    "Langkah perbaikan 3"
  ]
}`;

      const itemsStr = wrongItems.map((w) => {
        let cleanKey = w.kunci_jawaban_text || w.kunci_jawaban;
        let cleanAns = w.user_answer || "Kosong / Tidak Menjawab";
        if (w.tipe_soal === "pernyataan") {
          // Format human-readable: Baris 1: Sesuai, Baris 2: Tidak Sesuai, dst.
          cleanKey = cleanKey
            .replace(/a:/gi, "Baris 1: ")
            .replace(/;b:/gi, " | Baris 2: ")
            .replace(/;c:/gi, " | Baris 3: ");
          cleanAns = cleanAns
            .replace(/a:/gi, "Baris 1: ")
            .replace(/;b:/gi, " | Baris 2: ")
            .replace(/;c:/gi, " | Baris 3: ");
        }
        return `
Soal Nomor ${w.nomor} (Tipe: ${w.tipe_soal || "Pilihan Ganda"}):
Pertanyaan: ${(w.soal || "").replace(/<[^>]+>/g, " ").trim()}
Pilihan Siswa: ${cleanAns}
Kunci Jawaban Resmi: ${cleanKey}
Wacana: ${(w.bacaan || "").replace(/<[^>]+>/g, " ").slice(0, 300)}...
`;
      }).join("\n---\n");

      const promptUser = `Lakukan bedah diagnostik untuk paket: ${pkgTitle}
Skor Siswa: ${scorePercent}% (Estimasi IRT: ${estimatedIrt})
Daftar Butir Soal yang Salah (${wrongItems.length} butir):
${itemsStr}

Hasilkan JSON evaluasi lengkap sesuai skema format yang diminta sekarang!`;

      const aiRes = await callRouter([
        { role: "system", content: promptSystem },
        { role: "user", content: promptUser }
      ], "ag/gemini-3.8-flash-low", 0.2);

      const parsed = safeJsonParse(aiRes);
      return sendJSON(res, { diagnostic: parsed, success: true }, 200);
    } catch (err) {
      console.error("[examBank] Gagal generate diagnostic autopsy:", err);
      return sendJSON(res, { error: err.message || "Gagal membuat bedah diagnostik" }, 500);
    }
  }

  // 2. POST /api/exam-bank/packages/:id/submit
  const submitMatch = pathname.match(/^\/api\/exam-bank\/packages\/([^/]+)\/submit$/);
  if (req.method === "POST" && submitMatch) {
    try {
      const packageId = decodeURIComponent(submitMatch[1]);
      const body = await getBody(req);
      const userAnswers = body.answers || {};

      const pkg = db.prepare("SELECT * FROM exam_bank_packages WHERE id = ?").get(packageId);
      if (!pkg) {
        return sendJSON(res, { error: "Paket ujian tidak ditemukan" }, 404);
      }

      const items = db.prepare(
        "SELECT id, nomor, tipe_soal, bacaan, soal, soal_img, options_json, kunci_jawaban, kunci_jawaban_text FROM exam_bank_items WHERE package_id = ? ORDER BY nomor ASC"
      ).all(packageId);

      const total = items.length;
      let answered = 0;
      let correct = 0;

      const breakdown = items.map((item) => {
        const rawUserAns = userAnswers[String(item.nomor)] ?? userAnswers[item.nomor] ?? userAnswers[item.id] ?? "";
        const normUser = normalizeAnswer(rawUserAns);
        const hasAnswered = normUser.length > 0;
        const is_correct = hasAnswered && isAnswerCorrect(rawUserAns, item.kunci_jawaban, item.tipe_soal);

        if (hasAnswered) answered++;
        if (is_correct) correct++;

        let options = [];
        try {
          options = item.options_json ? JSON.parse(item.options_json) : [];
        } catch {
          options = [];
        }

        return {
          id: item.id,
          nomor: item.nomor,
          tipe_soal: item.tipe_soal,
          soal: item.soal,
          bacaan: item.bacaan || "",
          soal_img: item.soal_img || "",
          options,
          user_answer: rawUserAns,
          kunci_jawaban: item.kunci_jawaban,
          kunci_jawaban_text: item.kunci_jawaban_text || `(${item.kunci_jawaban.toUpperCase()})`,
          is_correct,
        };
      });

      const score_percent = total > 0 ? Number(((correct / total) * 100).toFixed(1)) : 0;
      const estimated_irt = calculateEstimatedIRT(correct, total);

      // Sesi aktif terhapus bersih saat ujian di-submit
      const sessionUser = helpers.getSessionUser ? helpers.getSessionUser(req) : null;
      const subUserId = (sessionUser ? sessionUser.id : (body.userId || body.user_id || (helpers.getUserId ? helpers.getUserId(req, body) : null))) || "anon";
      if (subUserId && subUserId !== "anon") {
        try {
          db.prepare("DELETE FROM cbt_active_sessions WHERE user_id = ?").run(subUserId);
        } catch {}
      }

      const now = Date.now();
      const submissionId = "sub_" + now + "_" + Math.random().toString(36).slice(2, 7);
      const packageTitle = `${pkg.subtes_or_mapel}${pkg.paket ? ` (${pkg.paket})` : ""}`;
      const studyMode = body.study_mode || body.studyMode || "exam";

      // 1. Persist submission ke exam_bank_submissions
      try {
        db.prepare(`
          INSERT INTO exam_bank_submissions (
            id, user_id, package_id, package_title, total_questions, answered_count,
            correct_count, score_percent, estimated_irt, study_mode, answers_json,
            breakdown_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          submissionId,
          subUserId,
          packageId,
          packageTitle,
          total,
          answered,
          correct,
          score_percent,
          estimated_irt,
          studyMode,
          JSON.stringify(userAnswers),
          JSON.stringify(breakdown),
          now
        );
      } catch (subErr) {
        console.warn("[examBank] Failed to persist exam submission:", subErr.message);
      }

      // 2. Catat butir yang salah ke mistake_notebook
      try {
        for (const item of breakdown) {
          if (!item.is_correct) {
            const questionText = (item.soal || "").trim();
            if (!questionText) continue;

            const existingMistake = db.prepare(
              "SELECT id FROM mistake_notebook WHERE doc_id = ? AND question = ? AND (user_id = ? OR user_id IS NULL)"
            ).get(packageId, questionText, subUserId);

            const opts = Array.isArray(item.options) ? item.options : [];
            let correctIdx = -1;
            let userAnsIdx = -1;
            if (item.tipe_soal !== "pernyataan") {
              const normKey = normalizeAnswer(item.kunci_jawaban);
              const normUser = normalizeAnswer(item.user_answer);
              if (normKey && normKey.length === 1 && normKey >= "a" && normKey <= "z") {
                correctIdx = normKey.charCodeAt(0) - 97;
              }
              if (normUser && normUser.length === 1 && normUser >= "a" && normUser <= "z") {
                userAnsIdx = normUser.charCodeAt(0) - 97;
              }
            }

            const steps = item.kunci_jawaban_text ? [item.kunci_jawaban_text] : [];
            const explanation = item.kunci_jawaban_text || "";
            const pitfall = item.tipe_soal === "pernyataan"
              ? "Ketelitian verifikasi pernyataan"
              : "Pilihan jawaban tidak sesuai kunci jawaban resmi";

            if (existingMistake) {
              db.prepare(`
                UPDATE mistake_notebook
                SET user_answer_index = ?, resolved = 0, updated_at = ?
                WHERE id = ?
              `).run(userAnsIdx, now, existingMistake.id);
            } else {
              const mId = "mistake_" + now + "_" + item.nomor + "_" + Math.random().toString(36).slice(2, 6);
              db.prepare(`
                INSERT INTO mistake_notebook (
                  id, doc_id, user_id, doc_title, question, options, correct_index,
                  user_answer_index, formula, steps, explanation, pitfall, resolved,
                  created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
              `).run(
                mId,
                packageId,
                subUserId,
                packageTitle,
                questionText,
                JSON.stringify(opts),
                correctIdx,
                userAnsIdx,
                "",
                JSON.stringify(steps),
                explanation,
                pitfall,
                now,
                now
              );
            }
          }
        }
      } catch (mErr) {
        console.warn("[examBank] Failed to record mistakes to mistake_notebook:", mErr.message);
      }

      // 3. Catat learner_events
      try {
        const eventId = "evt_" + now + "_" + Math.random().toString(36).slice(2, 6);
        const actType = studyMode === "drill" ? "exam_drill" : "cbt_exam";
        db.prepare(`
          INSERT INTO learner_events (id, user_id, doc_id, activity_type, result, payload, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          eventId,
          subUserId,
          packageId,
          actType,
          score_percent >= 60 ? "pass" : "fail",
          JSON.stringify({
            submission_id: submissionId,
            package_title: packageTitle,
            total,
            answered,
            correct,
            score_percent,
            estimated_irt,
            study_mode: studyMode
          }),
          now
        );
      } catch (evErr) {
        console.warn("[examBank] Failed to record learner_events:", evErr.message);
      }

      return sendJSON(res, {
        submission_id: submissionId,
        submissionId,
        total,
        answered,
        correct,
        score_percent,
        estimated_irt,
        breakdown,
      });
    } catch (err) {
      console.error("[examBank] Gagal mengevaluasi ujian:", err);
      return sendJSON(res, { error: err.message }, 500);
    }
  }

  // 3. GET /api/exam-bank/packages/:id
  const getMatch = pathname.match(/^\/api\/exam-bank\/packages\/([^/]+)$/);
  if (req.method === "GET" && getMatch) {
    try {
      const packageId = decodeURIComponent(getMatch[1]);
      const pkg = db.prepare("SELECT id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions FROM exam_bank_packages WHERE id = ?").get(packageId);
      if (!pkg) {
        return sendJSON(res, { error: "Paket ujian tidak ditemukan" }, 404);
      }

      const items = db.prepare(
        "SELECT id, nomor, tipe_soal, bacaan, soal, soal_img, options_json, kunci_jawaban, kunci_jawaban_text FROM exam_bank_items WHERE package_id = ? ORDER BY nomor ASC"
      ).all(packageId);

      const formattedItems = items.map((item) => {
        let options = [];
        try {
          options = item.options_json ? JSON.parse(item.options_json) : [];
        } catch {
          options = [];
        }
        return {
          id: item.id,
          nomor: item.nomor,
          tipe_soal: item.tipe_soal,
          bacaan: item.bacaan || "",
          soal: item.soal,
          soal_img: item.soal_img || "",
          options,
          kunci_jawaban: item.kunci_jawaban,
          kunci_jawaban_text: item.kunci_jawaban_text || "",
        };
      });

      return sendJSON(res, {
        package: pkg,
        items: formattedItems,
      });
    } catch (err) {
      console.error("[examBank] Gagal memuat butir soal:", err);
      return sendJSON(res, { error: err.message }, 500);
    }
  }

  // 4. DELETE /api/exam-bank/packages/:id (Delete package & items)
  const deleteMatch = pathname.match(/^\/api\/exam-bank\/packages\/([^/]+)$/);
  if (req.method === "DELETE" && deleteMatch) {
    try {
      const packageId = decodeURIComponent(deleteMatch[1]);
      db.exec("BEGIN");
      try {
        db.prepare("DELETE FROM exam_bank_items WHERE package_id = ?").run(packageId);
        db.prepare("DELETE FROM exam_bank_packages WHERE id = ?").run(packageId);
        db.exec("COMMIT");
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
      return sendJSON(res, { success: true, message: "Paket berhasil dihapus" }, 200);
    } catch (err) {
      console.error("[examBank] Gagal menghapus paket:", err);
      return sendJSON(res, { error: err.message }, 500);
    }
  }

  return false;
}

module.exports = { handleExamBankRoutes, normalizeAnswer, isAnswerCorrect, calculateEstimatedIRT, getDeduplicatedSoalText };
