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

const toRow = (columns, row) => Object.fromEntries(columns.map((c, i) => [c, row[i]]));

// Petite interface asynchrone commune (base locale ou Turso) :
// get → une ligne, all → toutes les lignes, run → écriture.
function wrap(executor) {
  const execute = (sql, args) => executor.execute({ sql, args });
  return {
    async get(sql, ...args) {
      const rs = await execute(sql, args);
      return rs.rows.length ? toRow(rs.columns, rs.rows[0]) : undefined;
    },
    async all(sql, ...args) {
      const rs = await execute(sql, args);
      return rs.rows.map((row) => toRow(rs.columns, row));
    },
    async run(sql, ...args) {
      const rs = await execute(sql, args);
      return {
        changes: rs.rowsAffected,
        lastInsertRowid: rs.lastInsertRowid == null ? null : Number(rs.lastInsertRowid),
      };
    },
  };
}

/**
 * Ouvre la base :
 * - TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) → base hébergée, persistante (production, Vercel) ;
 * - sinon un fichier SQLite local (DB_FILE, par défaut data/autoschub.db) ou ':memory:' pour les tests.
 */
export async function openDb(file = process.env.DB_FILE || 'data/autoschub.db') {
  let url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
    url = file === ':memory:' ? ':memory:' : `file:${file}`;
  }
  // Base distante : client 100 % JavaScript (pas de module natif à embarquer sur Vercel).
  const remote = /^(libsql|https?|wss?):/.test(url);
  const { createClient } = remote ? await import('@libsql/client/web') : await import('@libsql/client');
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const db = {
    ...wrap(client),
    client,
    isRemote: Boolean(process.env.TURSO_DATABASE_URL),
    exec: (sql) => client.executeMultiple(sql),
    async transaction(fn) {
      const tx = await client.transaction('write');
      try {
        const result = await fn(wrap(tx));
        await tx.commit();
        return result;
      } catch (err) {
        await tx.rollback().catch(() => {});
        throw err;
      } finally {
        tx.close();
      }
    },
    close: () => client.close(),
  };

  // Base locale partagée par plusieurs processus : attendre plutôt qu'échouer sur un verrou.
  if (!remote && url !== ':memory:') await db.exec('PRAGMA busy_timeout = 5000;');
  await db.exec(SCHEMA);
  await migrate(db);
  return db;
}

async function migrate(db) {
  for (const [table, columns] of Object.entries(ADDED_COLUMNS)) {
    const existing = new Set((await db.all(`PRAGMA table_info(${table})`)).map((c) => c.name));
    for (const [name, type] of Object.entries(columns)) {
      if (existing.has(name)) continue;
      try {
        await db.run(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
      } catch (err) {
        // Une autre instance a pu faire la migration en même temps.
        if (!/duplicate column/i.test(String(err?.message))) throw err;
      }
    }
  }
}
