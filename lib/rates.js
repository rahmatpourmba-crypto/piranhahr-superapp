import { getRates, updateRate } from 'lib/store'

const FRESH_MS = 30 * 60 * 1000

const TARGETS = [
  { code: 'usd', name: 'دلار آمريکا', key: 'price_dollar_rl', toman: true },
  { code: 'eur', name: 'يورو', key: 'price_eur', toman: true },
  { code: 'try', name: 'لير ترکيه', key: 'price_try', toman: true },
  { code: 'iqd', name: 'دينار عراق', key: 'price_iqd', toman: true },
  { code: 'gold18', name: 'طلای ۱۸', key: 'geram18', toman: true },
  { code: 'gold24', name: 'طلای ۲۴', key: 'geram24', toman: true },
  { code: 'mesghal', name: 'مثقال طلا', key: 'mesghal', toman: true },
  { code: 'coin', name: 'سکه امامي', key: 'sekee', toman: true },
  { code: 'silver', name: 'نقره (مثقال)', key: 'silver_999', toman: true },
  { code: 'ons', name: 'انس طلا (دلار)', key: 'ons', toman: false },
  { code: 'silver_ons', name: 'انس نقره (دلار)', key: 'silver', toman: false },
]

function normalize(value) {
  return value.replace(/,/g, '')
}

function extractPrice(html, rowKey) {
  const re = new RegExp(`data-market-row="${rowKey}"`, 'g')
  let m
  while ((m = re.exec(html)) !== null) {
    const block = html.slice(m.index, m.index + 10000)
    const nextRow = block.indexOf('data-market-row="', 1)
    const own = nextRow > 0 ? block.slice(0, nextRow) : block
    const attr = own.match(/data-price="([\d.,]+)"/)
    if (attr) return normalize(attr[1])
    const widget = own.match(/data-market-name="p"[\s\S]*?>[\s]*([\d.,]+)\s*</)
    if (widget) return normalize(widget[1])
  }
  return null
}

async function fetchTgjuPage() {
  const res = await fetch('https://www.tgju.org/', {
    headers: { Accept: 'text/html', 'User-Agent': 'Mozilla/5.0' },
  })
  if (!res.ok) return null
  const html = await res.text()

  const out = []
  for (const t of TARGETS) {
    const raw = extractPrice(html, t.key)
    if (raw) {
      const value = t.toman ? String(Math.round(Number(raw) / 10)) : raw
      out.push({ code: t.code, name: t.name, value, unit: t.toman ? 'تومان' : 'دلار' })
    }
  }

  return out.length >= 2 ? out : null
}

async function fetchErApi() {
  const res = await fetch('https://open.er-api.com/v6/latest/USD')
  if (!res.ok) return null
  const json = await res.json()
  const r = json.rates || {}
  const out = []
  const toman = (rial) => String(Math.round(rial / 10))
  if (r.IRR) out.push({ code: 'usd', name: 'دلار آمريکا', value: toman(r.IRR), unit: 'تومان' })
  if (r.IRR && r.EUR) out.push({ code: 'eur', name: 'يورو', value: toman(r.EUR * r.IRR), unit: 'تومان' })
  if (r.IRR && r.TRY) out.push({ code: 'try', name: 'لير ترکيه', value: toman(r.TRY * r.IRR), unit: 'تومان' })
  if (r.IRR && r.IQD) out.push({ code: 'iqd', name: 'دينار عراق', value: toman(r.IQD * r.IRR), unit: 'تومان' })
  return out.length >= 2 ? out : null
}

export async function fetchOnlineRates() {
  try {
    const tgju = await fetchTgjuPage()
    if (tgju) return tgju
  } catch {}
  try {
    const er = await fetchErApi()
    if (er) return er
  } catch {}
  return null
}

export async function getRatesForUser() {
  const dbRates = await getRates()

  let fresh = false
  if (dbRates.length) {
    const max = Math.max(...dbRates.map((r) => r.updated_at || 0))
    fresh = Date.now() - max < FRESH_MS
  }

  if (!fresh) {
    const online = await fetchOnlineRates()
    if (online && online.length) {
      for (const r of online) await updateRate(r.code, r.name, r.value, r.unit)
      const updated = await getRates()
      return { rates: updated, source: 'online' }
    }
  }

  return { rates: dbRates, source: fresh ? 'cached' : 'stale' }
}

export function formatPrice(value) {
  const n = Number(value)
  if (Number.isFinite(n)) return n.toLocaleString('fa-IR')
  return value
}