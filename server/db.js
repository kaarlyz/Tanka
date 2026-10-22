const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const dbPath = process.env.TANKA_DB_PATH || path.join(__dirname, "..", "tanka.sqlite");
const db = new DatabaseSync(dbPath);

try {
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA busy_timeout = 5000;");
} catch (e) {
  // pragma notice
}

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    content_hash TEXT,
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
    quiz_type TEXT DEFAULT 'conceptual',
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
    phone TEXT UNIQUE,
    auth_provider TEXT DEFAULT 'local',
    is_verified INTEGER DEFAULT 0,
    google_id TEXT UNIQUE,
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

  CREATE TABLE IF NOT EXISTS user_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS auth_verifications (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER DEFAULT 0,
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

  CREATE TABLE IF NOT EXISTS chapter_plans (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    trigger_question TEXT DEFAULT '',
    target_goal TEXT DEFAULT '',
    key_concept_ids TEXT NOT NULL DEFAULT '[]',
    content TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'planned',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(doc_id, chapter_number)
  );

  CREATE TABLE IF NOT EXISTS concept_edges (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    relation_label TEXT NOT NULL,
    relation_type TEXT NOT NULL DEFAULT 'association',
    evidence_quote TEXT DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_chapter_plans_doc_id ON chapter_plans(doc_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_plans_doc_num ON chapter_plans(doc_id, chapter_number);
  CREATE INDEX IF NOT EXISTS idx_concept_edges_doc_id ON concept_edges(doc_id);
  CREATE INDEX IF NOT EXISTS idx_concept_edges_nodes ON concept_edges(source_id, target_id);
  CREATE INDEX IF NOT EXISTS idx_document_concepts_doc_id ON document_concepts(doc_id);
  CREATE INDEX IF NOT EXISTS idx_document_segments_doc_id ON document_segments(doc_id);
  CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_auth_verifications_phone ON auth_verifications(phone);
`);

console.log("[tanka-db] Database initialized at:", dbPath);

function hasTable(targetDb, tableName) {
  try {
    const row = targetDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
    return Boolean(row);
  } catch {
    return false;
  }
}

function cleanOrphanedRecords(targetDb = db) {
  if (!hasTable(targetDb, "documents")) return;
  try {
    if (hasTable(targetDb, "mistake_notebook")) targetDb.prepare("DELETE FROM mistake_notebook WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    if (hasTable(targetDb, "flashcards")) targetDb.prepare("DELETE FROM flashcards WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    if (hasTable(targetDb, "quizzes")) targetDb.prepare("DELETE FROM quizzes WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    if (hasTable(targetDb, "chat_messages")) targetDb.prepare("DELETE FROM chat_messages WHERE doc_id != 'global' AND doc_id IS NOT NULL AND doc_id NOT IN (SELECT id FROM documents)").run();
    if (hasTable(targetDb, "formula_cheatsheets")) targetDb.prepare("DELETE FROM formula_cheatsheets WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    if (hasTable(targetDb, "chapter_plans")) targetDb.prepare("DELETE FROM chapter_plans WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    if (hasTable(targetDb, "concept_edges")) targetDb.prepare("DELETE FROM concept_edges WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    if (hasTable(targetDb, "document_concepts")) targetDb.prepare("DELETE FROM document_concepts WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    if (hasTable(targetDb, "document_segments")) targetDb.prepare("DELETE FROM document_segments WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    if (hasTable(targetDb, "learner_events")) targetDb.prepare("DELETE FROM learner_events WHERE doc_id NOT IN (SELECT id FROM documents)").run();
    if (hasTable(targetDb, "user_sessions") && hasTable(targetDb, "users")) targetDb.prepare("DELETE FROM user_sessions WHERE user_id NOT IN (SELECT id FROM users)").run();
  } catch (e) {
    console.warn("[tanka-db] Orphan cleanup notice:", e.message);
  }
}

function runMigrations(targetDb = db) {
  try {
    if (hasTable(targetDb, "documents")) {
      const docColumns = targetDb.prepare("PRAGMA table_info(documents)").all().map(c => c.name);
      if (!docColumns.includes("status")) {
        targetDb.prepare("ALTER TABLE documents ADD COLUMN status TEXT DEFAULT 'completed'").run();
        console.log("[tanka-db] Added status column to documents table");
      }
      if (!docColumns.includes("content_hash")) {
        targetDb.prepare("ALTER TABLE documents ADD COLUMN content_hash TEXT").run();
        targetDb.prepare("CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(content_hash)").run();
        console.log("[tanka-db] Added content_hash column to documents table");
      }
    }
  } catch (err) {
    console.warn("[tanka-db] documents migration notice:", err.message);
  }

  try {
    if (hasTable(targetDb, "chat_messages")) {
      const chatColumns = targetDb.prepare("PRAGMA table_info(chat_messages)").all().map(c => c.name);
      if (!chatColumns.includes("user_id")) {
        targetDb.prepare("ALTER TABLE chat_messages ADD COLUMN user_id TEXT DEFAULT 'anon'").run();
        console.log("[tanka-db] Added user_id column to chat_messages table");
      }
    }
  } catch (err) {
    console.warn("[tanka-db] chat_messages migration notice:", err.message);
  }

  try {
    if (hasTable(targetDb, "mistake_notebook")) {
      const mistakeColumns = targetDb.prepare("PRAGMA table_info(mistake_notebook)").all().map(c => c.name);
      if (!mistakeColumns.includes("user_id")) {
        targetDb.prepare("ALTER TABLE mistake_notebook ADD COLUMN user_id TEXT DEFAULT 'anon'").run();
        console.log("[tanka-db] Added user_id column to mistake_notebook table");
      }
    }
  } catch (err) {
    console.warn("[tanka-db] mistake_notebook migration notice:", err.message);
  }

  try {
    if (hasTable(targetDb, "quizzes")) {
      const quizColumns = targetDb.prepare("PRAGMA table_info(quizzes)").all().map(c => c.name);
      if (!quizColumns.includes("quiz_type")) {
        targetDb.prepare("ALTER TABLE quizzes ADD COLUMN quiz_type TEXT DEFAULT 'conceptual'").run();
        console.log("[tanka-db] Added quiz_type column to quizzes table");
      }
    }
  } catch (err) {
    console.warn("[tanka-db] quizzes migration notice:", err.message);
  }

  try {
    if (hasTable(targetDb, "study_rooms")) {
      const roomColumns = targetDb.prepare("PRAGMA table_info(study_rooms)").all().map(c => c.name);
      if (!roomColumns.includes("max_participants")) {
        targetDb.prepare("ALTER TABLE study_rooms ADD COLUMN max_participants INTEGER DEFAULT 0").run();
        console.log("[tanka-db] Added max_participants column to study_rooms table");
      }
    }
  } catch (err) {
    console.warn("[tanka-db] study_rooms migration notice:", err.message);
  }

  try {
    if (hasTable(targetDb, "document_concepts")) {
      const conceptColumns = targetDb.prepare("PRAGMA table_info(document_concepts)").all().map(c => c.name);
      if (!conceptColumns.includes("category")) {
        targetDb.prepare("ALTER TABLE document_concepts ADD COLUMN category TEXT DEFAULT 'core'").run();
        console.log("[tanka-db] Added category column to document_concepts table");
      }
      if (!conceptColumns.includes("is_required")) {
        targetDb.prepare("ALTER TABLE document_concepts ADD COLUMN is_required INTEGER DEFAULT 1").run();
        console.log("[tanka-db] Added is_required column to document_concepts table");
      }
      if (!conceptColumns.includes("evidence_quote")) {
        targetDb.prepare("ALTER TABLE document_concepts ADD COLUMN evidence_quote TEXT DEFAULT ''").run();
        console.log("[tanka-db] Added evidence_quote column to document_concepts table");
      }
      if (!conceptColumns.includes("segment_id")) {
        targetDb.prepare("ALTER TABLE document_concepts ADD COLUMN segment_id TEXT DEFAULT ''").run();
        console.log("[tanka-db] Added segment_id column to document_concepts table");
      }
      if (!conceptColumns.includes("updated_at")) {
        targetDb.prepare("ALTER TABLE document_concepts ADD COLUMN updated_at INTEGER DEFAULT 0").run();
        console.log("[tanka-db] Added updated_at column to document_concepts table");
      }
    }
  } catch (err) {
    console.warn("[tanka-db] document_concepts migration notice:", err.message);
  }

  try {
    targetDb.exec(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS auth_verifications (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_verifications_phone ON auth_verifications(phone);
    `);
  } catch (err) {
    console.warn("[tanka-db] user_sessions/auth_verifications table ensure notice:", err.message);
  }

  try {
    if (hasTable(targetDb, "users")) {
      const userColumns = targetDb.prepare("PRAGMA table_info(users)").all().map(c => c.name);
      if (!userColumns.includes("phone")) {
        targetDb.prepare("ALTER TABLE users ADD COLUMN phone TEXT").run();
        console.log("[tanka-db] Added phone column to users table");
      }
      if (!userColumns.includes("auth_provider")) {
        targetDb.prepare("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'").run();
        console.log("[tanka-db] Added auth_provider column to users table");
      }
      if (!userColumns.includes("is_verified")) {
        targetDb.prepare("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0").run();
        console.log("[tanka-db] Added is_verified column to users table");
      }
      if (!userColumns.includes("google_id")) {
        targetDb.prepare("ALTER TABLE users ADD COLUMN google_id TEXT").run();
        console.log("[tanka-db] Added google_id column to users table");
      }

      targetDb.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
      `);
    }
  } catch (err) {
    console.warn("[tanka-db] users migration notice:", err.message);
  }

  try {
    targetDb.exec(`
      CREATE TABLE IF NOT EXISTS chapter_plans (
        id TEXT PRIMARY KEY,
        doc_id TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        trigger_question TEXT DEFAULT '',
        target_goal TEXT DEFAULT '',
        key_concept_ids TEXT NOT NULL DEFAULT '[]',
        content TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'planned',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        UNIQUE(doc_id, chapter_number)
      );

      CREATE TABLE IF NOT EXISTS concept_edges (
        id TEXT PRIMARY KEY,
        doc_id TEXT NOT NULL,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        relation_label TEXT NOT NULL,
        relation_type TEXT NOT NULL DEFAULT 'association',
        evidence_quote TEXT DEFAULT '',
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_chapter_plans_doc_id ON chapter_plans(doc_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_plans_doc_num ON chapter_plans(doc_id, chapter_number);
      CREATE INDEX IF NOT EXISTS idx_concept_edges_doc_id ON concept_edges(doc_id);
      CREATE INDEX IF NOT EXISTS idx_concept_edges_nodes ON concept_edges(source_id, target_id);
      CREATE INDEX IF NOT EXISTS idx_document_concepts_doc_id ON document_concepts(doc_id);
      CREATE INDEX IF NOT EXISTS idx_document_segments_doc_id ON document_segments(doc_id);
    `);
  } catch (err) {
    console.warn("[tanka-db] chapter_plans/concept_edges table ensure notice:", err.message);
  }
}
runMigrations();

cleanOrphanedRecords();

module.exports = {
  db,
  cleanOrphanedRecords,
  runMigrations
};
