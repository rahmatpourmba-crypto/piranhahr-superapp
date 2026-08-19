import { db } from 'lib/db'
import { DIV, DIV_SOFT, iconForCategory, footer } from 'lib/style'

export async function createAd(userId, data) {
  const res = await db.run(
    'INSERT INTO ads (user_id, type, category, title, price, description, contact, tg_username, status, is_featured, created_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
    [userId, data.type, data.category, data.title, data.price, data.description, data.contact, data.tgUsername || '', 'active', 0, Date.now()],
  )
  return res.id
}

export async function listAdsByCategory(category, limit = 10) {
  return db.all(
    'SELECT * FROM ads WHERE category = ? AND status = ? ORDER BY is_featured DESC, created_at DESC LIMIT ?',
    [category, 'active', limit],
  )
}

export async function setFeatured(adId, days) {
  await db.run(
    'UPDATE ads SET is_featured = 1, featured_until = ? WHERE id = ?',
    [Date.now() + days * 86400000, adId],
  )
}

export async function listBusinesses(includePending = false) {
  const where = includePending ? '' : 'WHERE status = ?'
  const params = includePending ? [] : ['active']
  return db.all(
    `SELECT * FROM businesses ${where} ORDER BY is_featured DESC, rating_count DESC, created_at DESC`,
    params,
  )
}

export async function listMyBusinesses(ownerId) {
  return db.all('SELECT * FROM businesses WHERE owner_id = ? ORDER BY created_at DESC', [ownerId])
}

export async function addBusiness(data) {
  const res = await db.run(
    'INSERT INTO businesses (name, category, description, phone, tg_username, address, owner_id, status, is_featured, created_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
    [
      data.name,
      data.category,
      data.description,
      data.phone || '',
      data.tgUsername || '',
      data.address || '',
      data.ownerId || null,
      data.status || 'pending',
      data.isFeatured ? 1 : 0,
      Date.now(),
    ],
  )
  return res.id
}

export async function setBusinessStatus(bizId, status) {
  await db.run('UPDATE businesses SET status = ? WHERE id = ?', [status, bizId])
}

export async function setBusinessFeatured(bizId, days) {
  await db.run(
    'UPDATE businesses SET is_featured = 1, featured_until = ? WHERE id = ?',
    [Date.now() + days * 86400000, bizId],
  )
}

export async function addRating(bizId, userId, stars, comment = '') {
  await db.run(
    'INSERT INTO ratings (business_id, user_id, stars, comment, created_at) VALUES (?, ?, ?, ?, ?)',
    [bizId, userId, stars, comment, Date.now()],
  )
  await db.run(
    'UPDATE businesses SET rating_sum = rating_sum + ?, rating_count = rating_count + 1 WHERE id = ?',
    [stars, bizId],
  )
}

export function formatBusiness(b) {
  const stars = b.rating_count ? '⭐'.repeat(Math.max(1, Math.round(b.rating_sum / b.rating_count))) : 'بدون امتياز'
  const featured = b.is_featured ? `\n👑 <b>ويژه</b>` : ''
  return [
    `🏪 <b>${b.name}</b> ${featured}`,
    `${DIV_SOFT}`,
    `🏷 <b>دسته:</b> ${b.category}`,
    `⭐ ${stars}`,
    b.description ? `📝 ${b.description}` : '',
    b.address ? `📍 ${b.address}` : '',
  ].filter(Boolean).join('\n')
}

export function formatBusinessFull(b) {
  const stars = b.rating_count
    ? `امتياز: ${(b.rating_sum / b.rating_count).toFixed(1)} (${b.rating_count} نظر)`
    : 'بدون امتياز'
  const featured = b.is_featured ? `\n👑 <b>ويژه</b>` : ''
  return [
    `🏪 <b>${b.name}</b> ${featured}`,
    `${DIV_SOFT}`,
    `🏷 <b>دسته:</b> ${b.category}`,
    `⭐ ${stars}`,
    b.description ? `📝 ${b.description}` : '',
    b.phone ? `☎️ <b>تلفن:</b> ${b.phone}` : '',
    b.tg_username ? `✈️ <b>تلگرام:</b> @${b.tg_username.replace('@', '')}` : '',
    b.address ? `📍 ${b.address}` : '',
  ].filter(Boolean).join('\n')
}

export async function getBusinessById(id) {
  return db.get('SELECT * FROM businesses WHERE id = ?', [id])
}

export async function listEvents() {
  return db.all('SELECT * FROM events ORDER BY created_at DESC')
}

export async function addEvent(data) {
  const res = await db.run(
    'INSERT INTO events (title, date_text, description, location, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id',
    [data.title, data.dateText || '', data.description || '', data.location || '', Date.now()],
  )
  return res.id
}

export function formatEvent(e) {
  return [
    `🎉 <b>${e.title}</b>`,
    `${DIV_SOFT}`,
    e.date_text ? `📅 <b>زمان:</b> ${e.date_text}` : '',
    e.location ? `📍 <b>مکان:</b> ${e.location}` : '',
    e.description ? `📝 ${e.description}` : '',
  ].filter(Boolean).join('\n')
}

export async function addAlert(userId, code, threshold, direction) {
  await db.run(
    'INSERT INTO alerts (user_id, code, threshold, direction, active, created_at) VALUES (?, ?, ?, ?, 1, ?)',
    [userId, code, threshold, direction, Date.now()],
  )
}

export async function listActiveAlerts() {
  return db.all('SELECT * FROM alerts WHERE active = 1')
}

export async function deactivateAlert(id) {
  await db.run('UPDATE alerts SET active = 0 WHERE id = ?', [id])
}

export async function updateRate(code, name, value, unit = 'تومان') {
  await db.run(
    'INSERT INTO rates (code, name, value, unit, updated_at) VALUES (?, ?, ?, ?, ?) ' +
      'ON CONFLICT(code) DO UPDATE SET value = excluded.value, unit = excluded.unit, updated_at = excluded.updated_at',
    [code, name, value, unit, Date.now()],
  )
}

export async function getRates() {
  return db.all('SELECT code, name, value, unit, updated_at FROM rates ORDER BY id')
}

export function formatAd(ad) {
  const isSwap = ad.type === 'swap' || ad.type === 'معاوضه'
  const isFree = ad.type === 'free' || ad.type === 'رايگان'
  const isRequest = ad.type === 'درخواست'
  const isWorkforce = ad.type === 'درخواست نیرو'
  const isLost = ad.type === 'گمشده'
  const isFound = ad.type === 'پیداشده'
  const isSlot = ad.type === 'نوبت'
  const typeIcon = isSlot ? '🗓' : isLost ? '🔴' : isFound ? '🟢' : isWorkforce ? '👷' : isRequest ? '💼' : isSwap ? '🔄' : isFree ? '🎁' : '💰'
  const typeLabel = isSlot
    ? 'نوبت خالی'
    : isLost
      ? 'گمشده'
    : isFound
      ? 'پیداشده'
      : isWorkforce
        ? 'درخواست نیروی کار'
        : isRequest
          ? 'درخواست استخدام'
          : isSwap
            ? 'معاوضه'
            : isFree
              ? 'رايگان'
              : 'فروش'
  const featured = ad.isFeatured ? `\n👑 <b>ويژه</b>` : ''
  return [
    `${iconForCategory(ad.category)} <b>${ad.title}</b>`,
    `${DIV_SOFT}`,
    `🏷 <b>دسته:</b> ${ad.category}`,
    `${typeIcon} <b>نوع:</b> ${typeLabel}`,
    `💲 <b>قيمت:</b> ${ad.price}`,
    ad.description ? `📝 ${ad.description}` : '',
    featured,
  ].filter(Boolean).join('\n')
}

export function formatContact(ad) {
  return [
    `📞 <b>تماس با آگهي:</b> ${ad.title}`,
    `${DIV_SOFT}`,
    `☎️ <b>شماره:</b> ${ad.contact}`,
    ad.tg_username ? `✈️ <b>تلگرام:</b> @${ad.tg_username.replace('@', '')}` : '',
  ].filter(Boolean).join('\n')
}

export function contactKeyboard(ad) {
  const buttons = []
  if (ad.tg_username) {
    buttons.push({ text: '✈️ تلگرام', url: `https://t.me/${ad.tg_username.replace('@', '')}` })
  }
  const digits = ad.contact ? ad.contact.replace(/[^\d]/g, '') : ''
  if (digits.length >= 10) {
    buttons.push({ text: '📞 تماس', url: `https://t.me/+${digits}` })
  }
  return buttons.length ? { inline_keyboard: [buttons] } : undefined
}

export async function getAdById(id) {
  return db.get('SELECT * FROM ads WHERE id = ?', [id])
}

export async function hasPaidAccess(tgId, targetId, targetType = 'ad') {
  const row = await db.get(
    'SELECT id FROM payments WHERE user_id = ? AND ad_id = ? AND target_type = ? AND status = ?',
    [tgId, targetId, targetType, 'verified'],
  )
  return !!row
}

export async function getPendingPayment(tgId, targetId) {
  return db.get(
    'SELECT * FROM payments WHERE user_id = ? AND ad_id = ? AND status = ? ORDER BY id DESC LIMIT 1',
    [tgId, targetId, 'pending'],
  )
}

export async function createPayment(tgId, targetId, amount, refCode, targetType = 'ad') {
  await db.run(
    "INSERT INTO payments (user_id, ad_id, amount, ref_code, target_type, status, created_at) VALUES (?, ?, ?, ?, ?, 'verified', ?)",
    [tgId, targetId, amount, refCode, targetType, Date.now()],
  )
  const row = await db.get('SELECT last_insert_rowid() AS id')
  return row.id
}

export async function getPaymentById(id) {
  return db.get('SELECT * FROM payments WHERE id = ?', [id])
}