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
`);

console.log("[tanka-db] Database initialized at:", dbPath);

function cleanOrphanedRecords() {
  try {
    db.prepare("DELETE FROM mistake_notebook WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    db.prepare("DELETE FROM flashcards WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    db.prepare("DELETE FROM quizzes WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    db.prepare("DELETE FROM chat_messages WHERE doc_id NOT IN (SELECT id FROM documents)").run();
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
