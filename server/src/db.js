import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK (role IN ('student', 'instructor')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS instructors (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT NOT NULL DEFAULT '',
  school_name TEXT NOT NULL DEFAULT '',
  approval_number TEXT NOT NULL DEFAULT '',
  categories TEXT NOT NULL DEFAULT '[]',
  languages TEXT NOT NULL DEFAULT '["fr"]',
  transmission TEXT NOT NULL DEFAULT 'manuelle',
  vehicle TEXT NOT NULL DEFAULT '',
  hourly_rate_cents INTEGER NOT NULL DEFAULT 5500,
  lat REAL,
  lng REAL,
  is_online INTEGER NOT NULL DEFAULT 0,
  rating_sum INTEGER NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id),
  instructor_id INTEGER NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  start_at TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  is_instant INTEGER NOT NULL DEFAULT 0,
  pickup_address TEXT NOT NULL DEFAULT '',
  pickup_lat REAL,
  pickup_lng REAL,
  status TEXT NOT NULL DEFAULT 'pending',
  price_cents INTEGER NOT NULL,
  student_rating INTEGER,
  student_comment TEXT,
  instructor_feedback TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_instructor ON bookings(instructor_id);

CREATE TABLE IF NOT EXISTS theory_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  mode TEXT NOT NULL,
  theme TEXT,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  total INTEGER NOT NULL,
  grave_faults INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id),
  plan_id TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  current_period_start TEXT NOT NULL,
  current_period_end TEXT NOT NULL,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  provisional_at TEXT,
  exam_date TEXT,
  license_obtained_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_student ON subscriptions(student_id);
`;

// Colonnes ajoutées après la première version : migration des bases existantes.
const ADDED_COLUMNS = {
  bookings: {
    student_price_cents: 'INTEGER',
    covered_minutes: 'INTEGER NOT NULL DEFAULT 0',
    subscription_id: 'INTEGER REFERENCES subscriptions(id)',
    subscription_period: 'TEXT',
  },
};

function migrate(db) {
  for (const [table, columns] of Object.entries(ADDED_COLUMNS)) {
    const existing = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name));
    for (const [name, type] of Object.entries(columns)) {
      if (!existing.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
    }
  }
}

export function openDb(file = process.env.DB_FILE || 'data/autoschub.db') {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

export function transaction(db, fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
