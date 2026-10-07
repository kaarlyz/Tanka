const { db } = require("../db");

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
      const { docId, title, userId, userName, schoolClass, avatarColor, quizCount = 5 } = body;

      if (!userId || !userName) {
        return sendJSON(res, { error: "User ID dan nama diperlukan untuk membuat room" }, 400);
      }

      // Check document & get questions
      let questions = [];
      if (docId) {
        const rows = db.prepare("SELECT * FROM quizzes WHERE doc_id = ?").all(docId);
        if (rows && rows.length > 0) {
          questions = rows.slice(0, quizCount).map(r => {
            let options = [];
            try { options = JSON.parse(r.options); } catch { options = []; }
            return {
              id: r.id,
              question: r.question,
              options,
              answer: r.answer,
              explanation: r.explanation || ""
            };
          });
        }
      }

      // Fallback if no questions in DB for docId
      if (questions.length === 0) {
        const randomQuizzes = db.prepare("SELECT * FROM quizzes LIMIT 10").all();
        if (randomQuizzes.length > 0) {
          questions = randomQuizzes.slice(0, quizCount).map(r => {
            let options = [];
            try { options = JSON.parse(r.options); } catch { options = []; }
            return {
              id: r.id,
              question: r.question,
              options,
              answer: r.answer,
              explanation: r.explanation || ""
            };
          });
        }
      }

      const roomId = generateRoomCode();
      const roomTitle = title || "Kompetisi Kuis Cepat";
      const now = Date.now();

      db.prepare(`
        INSERT INTO study_rooms (id, doc_id, title, host_user_id, host_name, status, quiz_count, questions_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(roomId, docId || "global", roomTitle, userId, userName, "waiting", questions.length, JSON.stringify(questions), now);

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
        ORDER BY score DESC, correct_answers DESC, joined_at ASC
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
            ...room,
            status: "active"
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
          ORDER BY score DESC, correct_answers DESC, total_answered DESC
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
