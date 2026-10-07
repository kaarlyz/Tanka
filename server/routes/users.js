const { db } = require("../db");

function getTodayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function getDayOfWeekIndex() {
  const d = new Date();
  const day = d.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  // Normalize so Monday is 0, Sunday is 6
  return (day + 6) % 7;
}

async function handleUsersRoutes(req, res, pathname, { sendJSON, getBody }) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  // 1. GET /api/users/profile - Get profile by id or username
  if (pathname === "/api/users/profile" && req.method === "GET") {
    try {
      const id = parsedUrl.searchParams.get("id");
      const username = parsedUrl.searchParams.get("username");

      if (!id && !username) {
        return sendJSON(res, { error: "ID atau username diperlukan" }, 400);
      }

      let user = null;
      if (id) {
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      } else if (username) {
        user = db.prepare("SELECT * FROM users WHERE username = ?").get(username.toLowerCase());
      }

      if (!user) {
        return sendJSON(res, { error: "Pengguna tidak ditemukan" }, 404);
      }

      let activeDays = [];
      try {
        activeDays = JSON.parse(user.active_days_json || "[]");
      } catch {
        activeDays = [];
      }

      const todayStr = getTodayStr();
      const currentDayIdx = getDayOfWeekIndex();
      
      // Auto-check if today is active
      if (!activeDays.includes(currentDayIdx) && user.last_active_date === todayStr) {
        activeDays.push(currentDayIdx);
      }

      const level = Math.floor((user.xp || 100) / 100);
      const safeUser = {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
        bio: user.bio || "",
        school_class: user.school_class || "Kelas XII",
        avatar_color: user.avatar_color || "#10b981",
        target_weekly_days: user.target_weekly_days || 5,
        streak_count: user.streak_count || 1,
        active_days_this_week: activeDays,
        total_study_minutes: user.total_study_minutes || 0,
        quizzes_completed: user.quizzes_completed || 0,
        quiz_correct_count: user.quiz_correct_count || 0,
        xp: user.xp || 100,
        level,
        created_at: user.created_at
      };

      return sendJSON(res, { success: true, user: safeUser });
    } catch (err) {
      console.error("[users-profile-get] error:", err);
      return sendJSON(res, { error: "Gagal mengambil data profil" }, 500);
    }
  }

  // 2. PATCH /api/users/profile - Update profile details & weekly target
  if (pathname === "/api/users/profile" && req.method === "PATCH") {
    try {
      const body = await getBody(req);
      const id = body.id;
      if (!id) {
        return sendJSON(res, { error: "ID pengguna diperlukan" }, 400);
      }

      const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      if (!existing) {
        return sendJSON(res, { error: "Pengguna tidak ditemukan" }, 404);
      }

      const name = body.name !== undefined ? body.name.trim() : existing.name;
      const bio = body.bio !== undefined ? body.bio.trim() : existing.bio;
      const schoolClass = body.school_class !== undefined ? body.school_class.trim() : existing.school_class;
      const avatarColor = body.avatar_color !== undefined ? body.avatar_color.trim() : existing.avatar_color;
      const targetWeeklyDays = body.target_weekly_days !== undefined ? Number(body.target_weekly_days) : existing.target_weekly_days;

      db.prepare(`
        UPDATE users 
        SET name = ?, bio = ?, school_class = ?, avatar_color = ?, target_weekly_days = ?
        WHERE id = ?
      `).run(name, bio, schoolClass, avatarColor, targetWeeklyDays, id);

      const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      let activeDays = [];
      try { activeDays = JSON.parse(updated.active_days_json || "[]"); } catch {}

      return sendJSON(res, {
        success: true,
        user: {
          id: updated.id,
          username: updated.username,
          name: updated.name,
          bio: updated.bio,
          school_class: updated.school_class,
          avatar_color: updated.avatar_color,
          target_weekly_days: updated.target_weekly_days,
          streak_count: updated.streak_count,
          active_days_this_week: activeDays,
          total_study_minutes: updated.total_study_minutes,
          quizzes_completed: updated.quizzes_completed,
          quiz_correct_count: updated.quiz_correct_count,
          xp: updated.xp,
          level: Math.floor((updated.xp || 100) / 100),
          created_at: updated.created_at
        }
      });
    } catch (err) {
      console.error("[users-profile-patch] error:", err);
      return sendJSON(res, { error: "Gagal memperbarui profil" }, 500);
    }
  }

  // 3. POST /api/users/activity - Record study activity (pomodoro, reading, quiz)
  if (pathname === "/api/users/activity" && req.method === "POST") {
    try {
      const body = await getBody(req);
      const userId = body.userId;
      if (!userId) {
        return sendJSON(res, { error: "ID pengguna diperlukan" }, 400);
      }

      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      if (!user) {
        return sendJSON(res, { error: "Pengguna tidak ditemukan" }, 404);
      }

      const todayStr = getTodayStr();
      const currentDayIdx = getDayOfWeekIndex();
      let activeDays = [];
      try {
        activeDays = JSON.parse(user.active_days_json || "[]");
      } catch {
        activeDays = [];
      }

      if (!activeDays.includes(currentDayIdx)) {
        activeDays.push(currentDayIdx);
        activeDays.sort((a, b) => a - b);
      }

      // Calculate streak
      let streak = user.streak_count || 1;
      if (user.last_active_date && user.last_active_date !== todayStr) {
        const lastDate = new Date(user.last_active_date);
        const todayDate = new Date(todayStr);
        const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak += 1;
        } else if (diffDays > 1) {
          streak = 1; // streak reset
        }
      }

      const addMinutes = Number(body.minutes || 0);
      const isQuiz = body.activityType === "quiz";
      const addQuizzes = isQuiz ? 1 : 0;
      const addCorrect = isQuiz ? Number(body.correctAnswers || 0) : 0;
      
      // Calculate XP bonus
      let xpBonus = 15; // standard activity
      if (addMinutes >= 10) xpBonus += Math.floor(addMinutes * 1.5);
      if (isQuiz) xpBonus += (addCorrect * 10) + 20;

      const newStudyMinutes = (user.total_study_minutes || 0) + addMinutes;
      const newQuizzes = (user.quizzes_completed || 0) + addQuizzes;
      const newCorrect = (user.quiz_correct_count || 0) + addCorrect;
      const newXp = (user.xp || 100) + xpBonus;

      db.prepare(`
        UPDATE users 
        SET total_study_minutes = ?, quizzes_completed = ?, quiz_correct_count = ?,
            xp = ?, streak_count = ?, last_active_date = ?, active_days_json = ?
        WHERE id = ?
      `).run(
        newStudyMinutes,
        newQuizzes,
        newCorrect,
        newXp,
        streak,
        todayStr,
        JSON.stringify(activeDays),
        userId
      );

      // Record event in learner_events table
      try {
        const eventId = "evt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
        db.prepare(`
          INSERT INTO learner_events (id, user_id, doc_id, activity_type, result, payload, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          eventId,
          userId,
          body.docId || "global",
          body.activityType || "study",
          "success",
          JSON.stringify({ minutes: addMinutes, correct: addCorrect, xpGained: xpBonus }),
          Date.now()
        );
      } catch (e) {
        console.warn("[users-activity-event] notice:", e.message);
      }

      return sendJSON(res, {
        success: true,
        streak,
        activeDays,
        xpGained: xpBonus,
        totalXp: newXp,
        level: Math.floor(newXp / 100)
      });
    } catch (err) {
      console.error("[users-activity] error:", err);
      return sendJSON(res, { error: "Gagal mencatat aktivitas" }, 500);
    }
  }

  // 4. GET /api/users/leaderboard - Get leaderboard rankings
  if (pathname === "/api/users/leaderboard" && req.method === "GET") {
    try {
      const rows = db.prepare(`
        SELECT id, username, name, school_class, avatar_color, xp, streak_count, 
               quizzes_completed, quiz_correct_count, total_study_minutes
        FROM users
        ORDER BY xp DESC, quiz_correct_count DESC, streak_count DESC
        LIMIT 20
      `).all();

      const leaderboard = rows.map((r, idx) => ({
        rank: idx + 1,
        id: r.id,
        username: r.username,
        name: r.name || r.username,
        school_class: r.school_class || "Kelas XII",
        avatar_color: r.avatar_color || "#10b981",
        xp: r.xp || 100,
        level: Math.floor((r.xp || 100) / 100),
        streak_count: r.streak_count || 1,
        quizzes_completed: r.quizzes_completed || 0,
        quiz_correct_count: r.quiz_correct_count || 0,
        accuracy: r.quizzes_completed > 0 ? Math.round((r.quiz_correct_count / (r.quizzes_completed * 5)) * 100) : 90
      }));

      return sendJSON(res, { success: true, leaderboard });
    } catch (err) {
      console.error("[users-leaderboard] error:", err);
      return sendJSON(res, { error: "Gagal mengambil data leaderboard" }, 500);
    }
  }

  return false;
}

module.exports = { handleUsersRoutes };
