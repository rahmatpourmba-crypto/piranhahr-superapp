import { BOT_TOKEN } from 'lib/config'

const BASE = `https://api.telegram.org/bot${BOT_TOKEN}`

const TIMEOUT = 70000

async function call(method, params = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)
  try {
    const res = await fetch(`${BASE}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    })
    const json = await res.json().catch(() => null)
    if (!json || !json.ok) {
      throw new Error(`Telegram API error (${method}): ${json ? json.description : res.status}`)
    }
    return json.result
  } finally {
    clearTimeout(timer)
  }
}

export const api = new Proxy({}, {
  get: (_t, method) => (params) => call(method, params),
})