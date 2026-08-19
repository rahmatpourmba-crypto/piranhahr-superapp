import { DatabaseSync } from 'node:sqlite'
import { SCHEMA_SQL } from 'schema'

const database = new DatabaseSync('piranhahr.db')

database.exec('PRAGMA journal_mode = WAL')
database.exec('PRAGMA foreign_keys = ON')

for (const sql of SCHEMA_SQL) {
  database.exec(sql)
}

const MIGRATIONS = [
  "ALTER TABLE users ADD COLUMN lang TEXT NOT NULL DEFAULT 'fa'",
  'ALTER TABLE businesses ADD COLUMN owner_id INTEGER',
  "ALTER TABLE businesses ADD COLUMN status TEXT NOT NULL DEFAULT 'active'",
  'ALTER TABLE businesses ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE businesses ADD COLUMN featured_until INTEGER',
  'ALTER TABLE businesses ADD COLUMN rating_sum INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE businesses ADD COLUMN rating_count INTEGER NOT NULL DEFAULT 0',
  "ALTER TABLE news ADD COLUMN category TEXT NOT NULL DEFAULT 'city'",
]
for (const sql of MIGRATIONS) {
  try {
    database.exec(sql)
    console.log('Migration applied:', sql.slice(0, 60))
  } catch (e) {
    // column already exists
  }
}

export const db = {
  async run(sql, params = []) {
    const stmt = database.prepare(sql)
    if (/returning/i.test(sql)) {
      return stmt.get(...params) ?? null
    }
    return stmt.run(...params)
  },
  async get(sql, params = []) {
    const stmt = database.prepare(sql)
    return stmt.get(...params) ?? null
  },
  async all(sql, params = []) {
    const stmt = database.prepare(sql)
    return stmt.all(...params)
  },
}