const test = require("node:test");
const assert = require("node:assert/strict");
const { db, runMigrations } = require("../server/db");
const { handleRoomsRoutes } = require("../server/routes/rooms");

function createMock(method, path, body = {}, headers = {}) {
  let status = 200;
  let data = null;
  const res = {
    headersSent: false,
    writeHead: (st) => { status = st; },
    end: (content) => {
      try { data = JSON.parse(content); } catch { data = content; }
    }
  };
  const helpers = {
    sendJSON: (r, payload, st = 200) => {
      status = st;
      data = payload;
      return true;
    },
    getBody: async () => body
  };
  const req = {
    method,
    url: path,
    headers: { ...headers }
  };
  return { req, res, helpers, getResult: () => ({ status, data }) };
}

// Logic mirror of isCbtRoom defined in RoomModal.tsx
const isCbtRoom = (room, qList, docs) => {
  if (!room) return false;
  const docId = room.doc_id || room.docId;
  const pkgId = room.package_id || room.packageId;
  const title = room.title || "";

  // 1. Explicit packageId or docId is "cbt"
  if (pkgId || docId === "cbt") return true;

  // 2. Room title contains exam / CBT keywords
  if (/tka|utbk|snbt|cbt|tryout|pusmendik|naskah/i.test(title)) return true;

  // 3. Matched document is exam sheet or exam title
  if (docs && docId) {
    const matched = docs.find(d => d.id === docId);
    if (matched?.is_exam_sheet || /tka|utbk|snbt|cbt|tryout|soal|ujian/i.test(matched?.title || "")) {
      return true;
    }
  }

  // 4. Questions have exam characteristics
  if (Array.isArray(qList) && qList.length > 0) {
    const hasExamAttr = qList.some(q => 
      q.bacaan || 
      (q.tipe_soal && q.tipe_soal !== "pilihan_ganda") || 
      (typeof q.question === "string" && (q.question.includes("exam-bacaan") || q.question.includes("Pusmendik")))
    );
    if (hasExamAttr) return true;
  }

  return false;
};

test("Room CBT Mode Detection: isCbtRoom correctly identifies CBT modes and fallbacks", () => {
  // 1. Explicit packageId or docId === 'cbt'
  assert.equal(isCbtRoom({ id: "r1", docId: "cbt", title: "Room Santai" }), true);
  assert.equal(isCbtRoom({ id: "r2", docId: "global", packageId: "pusmendik_pkg_1", title: "Room Santai" }), true);
  assert.equal(isCbtRoom({ id: "r3", doc_id: "cbt", title: "Room Santai" }), true);
  assert.equal(isCbtRoom({ id: "r4", docId: "global", package_id: "pusmendik_pkg_2", title: "Room Santai" }), true);

  // 2. Title keywords
  assert.equal(isCbtRoom({ id: "r5", docId: "global", title: "⚔️ Adu Tryout CBT: Bahasa Indonesia" }), true);
  assert.equal(isCbtRoom({ id: "r6", docId: "global", title: "Simulasi SNBT HOTS 2026" }), true);
  assert.equal(isCbtRoom({ id: "r7", docId: "global", title: "Naskah Asli TKA Saintek" }), true);

  // 3. Document is_exam_sheet
  const docs = [
    { id: "doc_exam_1", title: "Matematika Dasar", is_exam_sheet: true },
    { id: "doc_normal_1", title: "Pengantar Biologi Sel", is_exam_sheet: false }
  ];
  assert.equal(isCbtRoom({ id: "r8", docId: "doc_exam_1", title: "Kuis Bab 1" }, [], docs), true);
  assert.equal(isCbtRoom({ id: "r9", docId: "doc_normal_1", title: "Kuis Bab 1" }, [], docs), false);

  // 4. Questions with exam characteristics
  const examQuestions = [
    { id: "q1", question: "Siapa penemu...", bacaan: "Sebuah teks panjang..." }
  ];
  assert.equal(isCbtRoom({ id: "r10", docId: "doc_normal_1", title: "Kuis Cepat" }, examQuestions, docs), true);

  // 5. Normal non-CBT room
  assert.equal(isCbtRoom({ id: "r11", docId: "global", title: "Kuis Cepat Tebak Kata" }, [], []), false);
});

test("Room CBT Backend: POST /api/rooms with packageId creates room with exam_bank_items", async () => {
  runMigrations(db);

  const testPkgId = `cbt_test_pkg_${Date.now()}`;
  db.prepare(`
    INSERT INTO exam_bank_packages (
      id, source, jenjang, kategori, subtes_or_mapel, paket, total_questions, created_at, updated_at
    ) VALUES (?, 'pusmendik_tka', 'SMA', 'wajib', 'Sosiologi', 'Paket 1', 2, ?, ?)
  `).run(testPkgId, Date.now(), Date.now());

  db.prepare(`
    INSERT INTO exam_bank_items (
      id, package_id, source, jenjang, subtes_or_mapel, paket, nomor, tipe_soal, bacaan, soal, options_json, kunci_jawaban, created_at
    ) VALUES (?, ?, 'pusmendik_tka', 'SMA', 'Sosiologi', 'Paket 1', 1, 'pilihan_ganda', 'Teks wacana...', 'Soal nomor satu?', ?, 'b', ?)
  `).run(`item_${Date.now()}_1`, testPkgId, JSON.stringify([{ id: "a", text: "Opsi A" }, { id: "b", text: "Opsi B" }]), Date.now());

  db.prepare(`
    INSERT INTO exam_bank_items (
      id, package_id, source, jenjang, subtes_or_mapel, paket, nomor, tipe_soal, bacaan, soal, options_json, kunci_jawaban, created_at
    ) VALUES (?, ?, 'pusmendik_tka', 'SMA', 'Sosiologi', 'Paket 1', 2, 'pilihan_ganda', '', 'Soal nomor dua?', ?, 'a', ?)
  `).run(`item_${Date.now()}_2`, testPkgId, JSON.stringify([{ id: "a", text: "Opsi 1" }, { id: "b", text: "Opsi 2" }]), Date.now());

  const mock = createMock("POST", "/api/rooms", {
    packageId: testPkgId,
    title: "⚔️ Adu Tryout CBT: Sosiologi (Paket 1)",
    userId: "usr_host_cbt",
    userName: "Host CBT",
    schoolClass: "Kelas XII",
    avatarColor: "#c8f064"
  });

  await handleRoomsRoutes(mock.req, mock.res, "/api/rooms", mock.helpers);
  const result = mock.getResult();

  assert.equal(result.status, 200);
  assert.ok(result.data.success);
  assert.equal(result.data.room.docId, "cbt");
  assert.equal(result.data.room.packageId, testPkgId);
  assert.equal(result.data.room.quizCount, 2);

  const savedRoom = db.prepare("SELECT * FROM study_rooms WHERE id = ?").get(result.data.room.id);
  assert.ok(savedRoom);
  assert.equal(savedRoom.doc_id, "cbt");
  assert.equal(savedRoom.package_id, testPkgId);

  const questions = JSON.parse(savedRoom.questions_json);
  assert.equal(questions.length, 2);
  assert.equal(questions[0].nomor, 1);
  assert.equal(questions[0].bacaan, "Teks wacana...");
  assert.equal(questions[0].answer, "B");
  assert.equal(questions[0].correctIndex, 1);
});

test("Room CBT Backend: GET /api/rooms/:id returns packageId and room status", async () => {
  runMigrations(db);

  const testPkgId = `cbt_test_pkg_get_${Date.now()}`;
  const roomId = `room_cbt_${Date.now()}`;

  db.prepare(`
    INSERT INTO study_rooms (id, doc_id, package_id, title, host_user_id, host_name, status, quiz_count, created_at)
    VALUES (?, 'cbt', ?, '⚔️ Adu Tryout CBT: Ekonomi (Paket 2)', 'usr_host_1', 'Eka', 'waiting', 25, ?)
  `).run(roomId, testPkgId, Date.now());

  const mock = createMock("GET", `/api/rooms/${roomId}`);
  await handleRoomsRoutes(mock.req, mock.res, `/api/rooms/${roomId}`, mock.helpers);
  const result = mock.getResult();

  assert.equal(result.status, 200);
  assert.ok(result.data.success);
  assert.equal(result.data.room.id, roomId);
  assert.equal(result.data.room.docId, "cbt");
  assert.equal(result.data.room.packageId, testPkgId);
  assert.equal(result.data.room.quizCount, 25);
});

test("Room CBT Transition: handleStartRoomExam transforms raw questions to ExamBankItem and sets package metadata", () => {
  const room = {
    id: "TNK-9922",
    docId: "cbt",
    packageId: "pusmendik_bindo_1",
    title: "⚔️ Adu Tryout CBT: Bahasa Indonesia (Paket 1)",
    hostUserId: "usr_eka",
    hostName: "Eka",
    status: "active",
    quizCount: 2,
    createdAt: Date.now()
  };

  const rawQuestions = [
    {
      id: "q_1",
      nomor: 1,
      tipe_soal: "pilihan_ganda",
      bacaan: "Wacana stimulus naskah...",
      question: "Apa simpulan teks?",
      options: ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      answer: "B",
      correctIndex: 1,
      explanation: "Pembahasan soal..."
    }
  ];

  // Transform logic mirror in App.tsx handleStartRoomExam
  const items = rawQuestions.map((q, idx) => {
    const opts = (q.options || []).map((opt, oIdx) => {
      const id = ["a", "b", "c", "d", "e"][oIdx] || String(oIdx);
      return typeof opt === "string" ? { id, text: opt } : { id: opt.id || id, text: opt.text || "" };
    });
    const kunci = (typeof q.answer === "string" ? q.answer.trim().toLowerCase() : ["a", "b", "c", "d", "e"][q.correctIndex || 0]);
    return {
      id: q.id || `room_item_${idx + 1}`,
      nomor: q.nomor || idx + 1,
      tipe_soal: q.tipe_soal || "pilihan_ganda",
      bacaan: q.bacaan || "",
      soal: q.question || q.soal || "",
      options: opts,
      kunci_jawaban: kunci,
      kunci_jawaban_text: q.explanation || ""
    };
  });

  const titleMatch = room.title.match(/(?:Adu Tryout CBT|Battle Tryout|Kompetisi)[:\s]+([^()]+)(?:\(([^)]+)\))?/i);
  const subtesName = titleMatch ? titleMatch[1].trim() : "Arena Kompetisi";
  const paketName = titleMatch && titleMatch[2] ? titleMatch[2].trim() : room.title;

  const pkg = {
    id: `room_${room.id}`,
    source: "arena_kompetisi",
    jenjang: "SMA",
    kategori: "kompetisi",
    subtes_or_mapel: subtesName,
    paket: paketName,
    total_questions: items.length
  };

  assert.equal(items.length, 1);
  assert.equal(items[0].nomor, 1);
  assert.equal(items[0].bacaan, "Wacana stimulus naskah...");
  assert.equal(items[0].kunci_jawaban, "b");
  assert.equal(items[0].options.length, 4);
  assert.equal(pkg.subtes_or_mapel, "Bahasa Indonesia");
  assert.equal(pkg.paket, "Paket 1");
  assert.equal(pkg.total_questions, 1);
});
