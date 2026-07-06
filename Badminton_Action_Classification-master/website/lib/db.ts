import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

// Zero-dependency SQLite via Node's built-in driver. The database file lives in
// ./data (gitignored). Opened lazily so `next build` never touches it.

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  const dir = path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const instance = new DatabaseSync(path.join(dir, "app.db"));
  instance.exec("PRAGMA journal_mode = WAL;");
  instance.exec("PRAGMA foreign_keys = ON;");
  migrate(instance);
  db = instance;
  return db;
}

function migrate(d: DatabaseSync) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT PRIMARY KEY,
      email           TEXT NOT NULL UNIQUE,
      name            TEXT NOT NULL,
      password_hash   TEXT NOT NULL,
      email_verified  INTEGER NOT NULL DEFAULT 0,
      training_consent INTEGER NOT NULL DEFAULT 0,
      twofa_enabled   INTEGER NOT NULL DEFAULT 0,
      created_at      INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  INTEGER NOT NULL,
      expires_at  INTEGER NOT NULL
    );



    CREATE TABLE IF NOT EXISTS videos (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      filename    TEXT NOT NULL,
      size        INTEGER NOT NULL,
      mime        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'complete',
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classifications (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      video_id      TEXT REFERENCES videos(id) ON DELETE SET NULL,
      clip          TEXT NOT NULL,
      predicted     TEXT NOT NULL,
      confidence    REAL NOT NULL,
      probabilities TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'complete',
      source        TEXT NOT NULL DEFAULT 'simulated',
      created_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      type        TEXT NOT NULL,
      range_label TEXT NOT NULL,
      clip_count  INTEGER NOT NULL,
      payload     TEXT NOT NULL,
      created_at  INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_class_user ON classifications(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id, created_at);

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      tokens INTEGER NOT NULL,
      last_refill INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS account_lockouts (
      email TEXT PRIMARY KEY,
      failed_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Idempotent column additions for databases created before a column existed.
  const userCols = (d.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map((c) => c.name);
  if (!userCols.includes("twofa_enabled")) {
    d.exec("ALTER TABLE users ADD COLUMN twofa_enabled INTEGER NOT NULL DEFAULT 0");
  }
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
