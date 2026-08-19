import { db } from 'lib/db'
import { ADMIN_ID } from 'lib/config'

export async function upsertUser(tgId, name) {
  await db.run(
    'INSERT INTO users (telegram_id, name, created_at) VALUES (?, ?, ?) ' +
      'ON CONFLICT(telegram_id) DO UPDATE SET name = excluded.name',
    [tgId, name, Date.now()],
  )
}

export async function isAdmin(tgId) {
  if (ADMIN_ID && String(tgId) === String(ADMIN_ID)) return true
  const row = await db.get('SELECT is_admin FROM users WHERE telegram_id = ?', [tgId])
  return row ? !!row.is_admin : false
}

export async function getLang(tgId) {
  const row = await db.get('SELECT lang FROM users WHERE telegram_id = ?', [tgId])
  return row && row.lang ? row.lang : 'fa'
}

export async function setLang(tgId, lang) {
  await db.run('UPDATE users SET lang = ? WHERE telegram_id = ?', [lang, tgId])
}

export async function getSession(tgId) {
  const row = await db.get('SELECT state, data FROM sessions WHERE telegram_id = ?', [tgId])
  if (!row) return null
  return { state: row.state, data: row.data ? JSON.parse(row.data) : {} }
}

export async function setSession(tgId, state, data = {}) {
  await db.run(
    'INSERT INTO sessions (telegram_id, state, data, updated_at) VALUES (?, ?, ?, ?) ' +
      'ON CONFLICT(telegram_id) DO UPDATE SET state = excluded.state, data = excluded.data, updated_at = excluded.updated_at',
    [tgId, state, JSON.stringify(data), Date.now()],
  )
}

export async function clearSession(tgId) {
  await db.run('DELETE FROM sessions WHERE telegram_id = ?', [tgId])
}