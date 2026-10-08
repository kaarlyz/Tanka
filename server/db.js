const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dbPath = path.join(__dirname, "..", "tanka.sqlite");
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    difficulty TEXT DEFAULT 'new',
    review_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    doc_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    model TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    questions TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mistake_notebook (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    doc_title TEXT,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    user_answer_index INTEGER NOT NULL,
    formula TEXT,
    steps TEXT,
    explanation TEXT,
    pitfall TEXT,
    resolved INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS formula_cheatsheets (
    doc_id TEXT PRIMARY KEY,
    formulas TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    bio TEXT DEFAULT '',
    school_class TEXT DEFAULT '',
    avatar_color TEXT DEFAULT '#10b981',
    target_weekly_days INTEGER DEFAULT 5,
    streak_count INTEGER DEFAULT 1,
    last_active_date TEXT DEFAULT '',
    active_days_json TEXT DEFAULT '[]',
    total_study_minutes INTEGER DEFAULT 0,
    quizzes_completed INTEGER DEFAULT 0,
    quiz_correct_count INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 100,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS study_rooms (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    title TEXT NOT NULL,
    host_user_id TEXT NOT NULL,
    host_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    quiz_count INTEGER DEFAULT 5,
    questions_json TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS room_participants (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    school_class TEXT DEFAULT '',
    avatar_color TEXT DEFAULT '#10b981',
    is_ready INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_answered INTEGER DEFAULT 0,
    joined_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS document_segments (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    segment_index INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    normalized_text TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS document_concepts (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    name TEXT NOT NULL,
    definition TEXT NOT NULL,
    prerequisites TEXT,
    origin TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS learner_events (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    doc_id TEXT NOT NULL,
    concept_id TEXT,
    activity_type TEXT NOT NULL,
    result TEXT NOT NULL,
    payload TEXT,
    created_at INTEGER NOT NULL
  );
`);

console.log("[tanka-db] Database initialized at:", dbPath);

function cleanOrphanedRecords() {
  try {
    db.prepare("DELETE FROM mistake_notebook WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    db.prepare("DELETE FROM flashcards WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    db.prepare("DELETE FROM quizzes WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    db.prepare("DELETE FROM chat_messages WHERE doc_id != 'global' AND doc_id IS NOT NULL AND doc_id NOT IN (SELECT id FROM documents)").run();
    db.prepare("DELETE FROM formula_cheatsheets WHERE doc_id NOT IN (SELECT id FROM documents)").run();
  } catch (e) {
    console.warn("[tanka-db] Orphan cleanup notice:", e.message);
  }
}

cleanOrphanedRecords();

module.exports = {
  db,
  cleanOrphanedRecords
};
