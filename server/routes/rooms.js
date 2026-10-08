const { db } = require("../db");
const { generateQuestionsCore } = require("../services/quizGenerator");

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TNK-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function handleRoomsRoutes(req, res, pathname, { sendJSON, getBody }) {
  // 1. POST /api/rooms - Create Room for a Document / Quiz
  if (pathname === "/api/rooms" && req.method === "POST") {
    try {
      const body = await getBody(req);
      const { docId, title, userId, userName, schoolClass, avatarColor, quizCount = 5, quizType = "conceptual", maxParticipants = 0 } = body;

      if (!userId || !userName) {
        return sendJSON(res, { error: "User ID dan nama diperlukan untuk membuat room" }, 400);
      }

      // Check document & get questions
      let questions = [];
      const extractQuestionsFromRows = (rows) => {
        let extracted = [];
        for (const row of rows) {
          if (!row || !row.questions) continue;
          try {
            const parsed = JSON.parse(row.questions);
            if (Array.isArray(parsed)) {
              for (const q of parsed) {
                if (!q || !q.question) continue;
                let options = Array.isArray(q.options) ? q.options : [];
                let correctIdx = 0;
                if (typeof q.correctIndex === "number") correctIdx = q.correctIndex;
                else if (typeof q.correct_index === "number") correctIdx = q.correct_index;
                else if (typeof q.answer === "string" && ["A", "B", "C", "D", "E"].includes(q.answer.trim().toUpperCase())) {
                  correctIdx = ["A", "B", "C", "D", "E"].indexOf(q.answer.trim().toUpperCase());
                }
                extracted.push({
                  id: q.id || `q_${Math.random().toString(36).slice(2, 8)}`,
                  question: q.question,
                  options,
                  answer: q.answer || ["A", "B", "C", "D", "E"][correctIdx],
                  correctIndex: correctIdx,
                  correct_index: correctIdx,
                  explanation: q.explanation || "",
                  formula: q.formula || "",
                  steps: q.steps || []
                });
              }
            }
          } catch (e) {
            console.error("[rooms] parse questions json error:", e);
          }
        }
        return extracted;
      };

      if (docId && docId !== "global") {
        const targetDoc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId);
        if (targetDoc) {
          // 1. Ambil dari bank soal yang sudah tersimpan khusus untuk materi ini
          const rows = db.prepare("SELECT * FROM quizzes WHERE doc_id = ?").all(docId);
          if (rows && rows.length > 0) {
            const extracted = extractQuestionsFromRows(rows);
            if (extracted.length >= quizCount) {
              questions = extracted.slice(0, quizCount);
            } else if (extracted.length > 0) {
              questions = extracted;
            }
          }

          // 2. Jika belum ada kuis untuk materi ini (atau kurang), GENERATE KHUSUS DARI MATERI INI!
          // DILARANG KERAS MENGAMBIL MATERI LAIN / PREVIOUS MATERIAL!
          if (questions.length === 0) {
            try {
              console.log(`[rooms] Men-generate ${quizCount} butir soal baru khusus dokumen: ${targetDoc.title} (${docId})`);
              const freshQuestions = await generateQuestionsCore({
                docId,
                count: quizCount,
                quizType: quizType || "conceptual"
              });
              if (Array.isArray(freshQuestions) && freshQuestions.length > 0) {
                questions = freshQuestions;
                const quizId = "quiz_" + Date.now();
                db.prepare("INSERT INTO quizzes (id, doc_id, questions, created_at) VALUES (?, ?, ?, ?)")
                  .run(quizId, docId, JSON.stringify(questions), Date.now());
                console.log(`[rooms] Berhasil menyimpan ${questions.length} soal untuk materi ${targetDoc.title}`);
              }
            } catch (genErr) {
              console.error(`[rooms] Gagal auto-generate soal materi ${docId}:`, genErr);
            }
          }

          // 3. Fallback cerdas dari Canonical Concepts dokumen ITU SENDIRI (anti-lintas materi)
          if (questions.length === 0) {
            const concepts = db.prepare("SELECT * FROM document_concepts WHERE doc_id = ? LIMIT 10").all(docId);
            if (concepts && concepts.length >= 2) {
              questions = concepts.slice(0, quizCount).map((c, idx) => {
                const distractors = concepts.filter(other => other.id !== c.id).map(o => o.definition).slice(0, 4);
                const allOpts = [c.definition, ...distractors];
                const shuffled = [...allOpts].sort(() => Math.random() - 0.5);
                const correctIdx = shuffled.indexOf(c.definition);
                return {
                  id: idx + 1,
                  question: `Berdasarkan materi ${targetDoc.title}, manakah penjelasan yang paling tepat mengenai konsep "${c.name}"?`,
                  options: shuffled,
                  answer: ["A", "B", "C", "D", "E"][correctIdx >= 0 ? correctIdx : 0],
                  correctIndex: correctIdx >= 0 ? correctIdx : 0,
                  correct_index: correctIdx >= 0 ? correctIdx : 0,
                  explanation: `Konsep "${c.name}" didefinisikan secara resmi sebagai: ${c.definition}.`
                };
              });
            }
          }
        }
      }

      // Fallback HANYA jika memang user memilih "global" atau tanpa dokumen spesifik:
      if (questions.length === 0 && (!docId || docId === "global")) {
        const randomQuizzes = db.prepare("SELECT * FROM quizzes ORDER BY created_at DESC LIMIT 5").all();
        if (randomQuizzes.length > 0) {
          questions = extractQuestionsFromRows(randomQuizzes).slice(0, quizCount);
        }
      }

      // Ultimate fallback if database has zero quizzes
      if (questions.length === 0) {
        questions = [
          {
            id: "q_room_1",
            question: "Manakah prinsip utama dari active recall dalam metode pembelajaran mandiri?",
            options: [
              "A. Membaca ulang materi berulang kali hingga hafal secara pasif",
              "B. Menguji daya ingat secara mandiri tanpa melihat contekan atau ringkasan",
              "C. Menulis catatan dengan pulpen warna-warni tanpa evaluasi pemahaman",
              "D. Mendengarkan rekaman suara sambil beristirahat",
              "E. Menghafal seluruh kamus istilah dalam satu malam sebelum ujian"
            ],
            answer: "B",
            correctIndex: 1,
            correct_index: 1,
            explanation: "Active recall memaksa otak merekonstruksi ingatan dari memori jangka panjang tanpa bantuan visual contekan."
          },
          {
            id: "q_room_2",
            question: "Teknik Feynman menekankan bahwa tolak ukur penguasaan suatu konsep adalah...",
            options: [
              "A. Kemampuan menggunakan jargon akademik yang rumit di depan audiens",
              "B. Kecepatan menulis rumus di atas papan tulis",
              "C. Kemampuan menjelaskan konsep secara sederhana menggunakan bahasa orang awam",
              "D. Menghafal seluruh teorema tanpa memahami analogi dasarnya",
              "E. Mengumpulkan nilai sempurna pada ujian pilihan ganda"
            ],
            answer: "C",
            correctIndex: 2,
            correct_index: 2,
            explanation: "Richard Feynman merumuskan bahwa jika kita tidak dapat menjelaskan suatu konsep kepada anak berusia 9 tahun, kita belum benar-benar memahaminya."
          }
        ];
      }

      const roomId = generateRoomCode();
      const roomTitle = title || "Kompetisi Kuis Cepat";
      const now = Date.now();
      const maxLimit = Math.max(0, parseInt(maxParticipants, 10) || 0);

      db.prepare(`
        INSERT INTO study_rooms (id, doc_id, title, host_user_id, host_name, status, quiz_count, max_participants, questions_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(roomId, docId || "global", roomTitle, userId, userName, "waiting", questions.length, maxLimit, JSON.stringify(questions), now);

      // Add Host as first participant (ready = 1)
      const partId = `part_${roomId}_${userId}`;
      db.prepare(`
        INSERT INTO room_participants (id, room_id, user_id, user_name, school_class, avatar_color, is_ready, score, correct_answers, total_answered, joined_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(partId, roomId, userId, userName, schoolClass || "Kelas XII", avatarColor || "#10b981", 1, 0, 0, 0, now);

      const participants = db.prepare("SELECT * FROM room_participants WHERE room_id = ? ORDER BY joined_at ASC").all(roomId);

      return sendJSON(res, {
        success: true,
        room: {
          id: roomId,
          docId: docId || "global",
          title: roomTitle,
          hostUserId: userId,
          hostName: userName,
          status: "waiting",
          quizCount: questions.length,
          maxParticipants: maxLimit,
          createdAt: now
        },
        participants
      });
    } catch (err) {
      console.error("[rooms-create] error:", err);
      return sendJSON(res, { error: "Gagal membuat room kompetisi" }, 500);
    }
  }

  // 2. GET /api/rooms - List all active/waiting rooms
  if (pathname === "/api/rooms" && req.method === "GET") {
    try {
      const rooms = db.prepare(`
        SELECT r.*, COUNT(p.id) as participant_count
        FROM study_rooms r
        LEFT JOIN room_participants p ON r.id = p.room_id
        WHERE r.status != 'archived'
        GROUP BY r.id
        ORDER BY r.created_at DESC
        LIMIT 20
      `).all();

      return sendJSON(res, { success: true, rooms });
    } catch (err) {
      console.error("[rooms-list] error:", err);
      return sendJSON(res, { error: "Gagal mengambil daftar room" }, 500);
    }
  }

  // 3. Match /api/rooms/:id routes
  const roomMatch = pathname.match(/^\/api\/rooms\/([^/]+)(\/(join|ready|start|submit))?$/);
  if (roomMatch) {
    const roomId = roomMatch[1];
    const action = roomMatch[3]; // undefined, 'join', 'ready', 'start', 'submit'

    const room = db.prepare("SELECT * FROM study_rooms WHERE id = ?").get(roomId);
    if (!room) {
      return sendJSON(res, { error: "Room tidak ditemukan atau sudah ditutup" }, 404);
    }

    // A. GET /api/rooms/:id - Detail room & participants
    if (req.method === "GET" && !action) {
      const participants = db.prepare(`
        SELECT * FROM room_participants 
        WHERE room_id = ? 
        ORDER BY (total_answered > 0) DESC, score DESC, correct_answers DESC, joined_at ASC
      `).all(roomId);

      let questions = [];
      try { questions = JSON.parse(room.questions_json || "[]"); } catch {}

      return sendJSON(res, {
        success: true,
        room: {
          id: room.id,
          docId: room.doc_id,
          title: room.title,
          hostUserId: room.host_user_id,
          hostName: room.host_name,
          status: room.status,
          quizCount: room.quiz_count,
          maxParticipants: room.max_participants || 0,
          createdAt: room.created_at
        },
        participants,
        // Only share questions when active or finished
        questions: room.status !== "waiting" ? questions : []
      });
    }

    // B. POST /api/rooms/:id/join - Join a room
    if (req.method === "POST" && action === "join") {
      try {
        const body = await getBody(req);
        const { userId, userName, schoolClass, avatarColor } = body;

        if (!userId || !userName) {
          return sendJSON(res, { error: "User ID dan nama diperlukan untuk bergabung" }, 400);
        }

        const existing = db.prepare("SELECT * FROM room_participants WHERE room_id = ? AND user_id = ?").get(roomId, userId);

        if (!existing && room.max_participants > 0) {
          const count = db.prepare("SELECT COUNT(*) as cnt FROM room_participants WHERE room_id = ?").get(roomId).cnt;
          if (count >= room.max_participants) {
            return sendJSON(res, { error: `Room sudah penuh (maksimal ${room.max_participants} peserta)` }, 403);
          }
        }

        if (!existing) {
          const partId = `part_${roomId}_${userId}`;
          db.prepare(`
            INSERT INTO room_participants (id, room_id, user_id, user_name, school_class, avatar_color, is_ready, score, correct_answers, total_answered, joined_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(partId, roomId, userId, userName, schoolClass || "Kelas XII", avatarColor || "#6366f1", 0, 0, 0, 0, Date.now());
        }

        const participants = db.prepare("SELECT * FROM room_participants WHERE room_id = ? ORDER BY joined_at ASC").all(roomId);

        return sendJSON(res, {
          success: true,
          room: {
            id: room.id,
            docId: room.doc_id,
            title: room.title,
            hostUserId: room.host_user_id,
            hostName: room.host_name,
            status: room.status,
            quizCount: room.quiz_count,
            maxParticipants: room.max_participants || 0,
            createdAt: room.created_at
          },
          participants
        });
      } catch (err) {
        console.error("[rooms-join] error:", err);
        return sendJSON(res, { error: "Gagal bergabung ke room" }, 500);
      }
    }

    // C. POST /api/rooms/:id/ready - Toggle Ready ("Siap atau Tidak")
    if (req.method === "POST" && action === "ready") {
      try {
        const body = await getBody(req);
        const { userId, isReady } = body;

        if (!userId) {
          return sendJSON(res, { error: "User ID diperlukan" }, 400);
        }

        const readyVal = isReady ? 1 : 0;
        db.prepare("UPDATE room_participants SET is_ready = ? WHERE room_id = ? AND user_id = ?").run(readyVal, roomId, userId);

        const participants = db.prepare("SELECT * FROM room_participants WHERE room_id = ? ORDER BY joined_at ASC").all(roomId);
        return sendJSON(res, { success: true, participants });
      } catch (err) {
        console.error("[rooms-ready] error:", err);
        return sendJSON(res, { error: "Gagal memperbarui status siap" }, 500);
      }
    }

    // D. POST /api/rooms/:id/start - Host starts the challenge
    if (req.method === "POST" && action === "start") {
      try {
        const body = await getBody(req);
        const { userId } = body;

        if (room.host_user_id !== userId) {
          return sendJSON(res, { error: "Hanya pembuat room (host) yang dapat memulai kompetisi" }, 403);
        }

        db.prepare("UPDATE study_rooms SET status = 'active' WHERE id = ?").run(roomId);

        let questions = [];
        try { questions = JSON.parse(room.questions_json || "[]"); } catch {}

        const participants = db.prepare("SELECT * FROM room_participants WHERE room_id = ? ORDER BY joined_at ASC").all(roomId);

        return sendJSON(res, {
          success: true,
          room: {
            id: room.id,
            docId: room.doc_id,
            title: room.title,
            hostUserId: room.host_user_id,
            host_user_id: room.host_user_id,
            hostName: room.host_name,
            host_name: room.host_name,
            status: "active",
            quizCount: room.quiz_count,
            maxParticipants: room.max_participants || 0,
            createdAt: room.created_at
          },
          questions,
          participants
        });
      } catch (err) {
        console.error("[rooms-start] error:", err);
        return sendJSON(res, { error: "Gagal memulai kompetisi" }, 500);
      }
    }

    // E. POST /api/rooms/:id/submit - Submit answers & update room leaderboard
    if (req.method === "POST" && action === "submit") {
      try {
        const body = await getBody(req);
        const { userId, score = 0, correctAnswers = 0, totalAnswered = 0 } = body;

        if (!userId) {
          return sendJSON(res, { error: "User ID diperlukan" }, 400);
        }

        db.prepare(`
          UPDATE room_participants 
          SET score = ?, correct_answers = ?, total_answered = ?
          WHERE room_id = ? AND user_id = ?
        `).run(score, correctAnswers, totalAnswered, roomId, userId);

        // Add bonus XP to user profile
        try {
          const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
          if (user) {
            const xpGained = 40 + (correctAnswers * 15);
            db.prepare(`
              UPDATE users 
              SET xp = xp + ?, quiz_correct_count = quiz_correct_count + ?, quizzes_completed = quizzes_completed + 1
              WHERE id = ?
            `).run(xpGained, correctAnswers, userId);
          }
        } catch (e) {
          console.warn("[rooms-xp-grant] notice:", e.message);
        }

        const participants = db.prepare(`
          SELECT * FROM room_participants 
          WHERE room_id = ? 
          ORDER BY (total_answered > 0) DESC, score DESC, correct_answers DESC, joined_at ASC
        `).all(roomId);

        // Check if all participants answered
        const allAnswered = participants.every(p => p.total_answered > 0);
        if (allAnswered && participants.length > 0) {
          db.prepare("UPDATE study_rooms SET status = 'finished' WHERE id = ?").run(roomId);
        }

        return sendJSON(res, {
          success: true,
          status: allAnswered ? "finished" : "active",
          leaderboard: participants
        });
      } catch (err) {
        console.error("[rooms-submit] error:", err);
        return sendJSON(res, { error: "Gagal mengirim jawaban kompetisi" }, 500);
      }
    }
  }

  return false;
}

module.exports = { handleRoomsRoutes };
