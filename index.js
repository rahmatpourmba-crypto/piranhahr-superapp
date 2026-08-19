import { api } from 'lib/botapi'
import handleMessage from 'handlers/message'
import handleCallbackQuery from 'handlers/callback_query'
import { fetchOnlineRates } from 'lib/rates'
import { refreshNews } from 'lib/news'
import { listActiveAlerts, deactivateAlert } from 'lib/store'

let offset = 0
let shuttingDown = false
let alertTimer
let newsTimer

async function getUpdates() {
  const updates = await api.getUpdates({
    offset,
    timeout: 30,
    allowed_updates: ['message', 'callback_query'],
  })
  for (const update of updates) {
    offset = update.update_id + 1
    try {
      if (update.message) {
        await handleMessage(update)
      } else if (update.callback_query) {
        await handleCallbackQuery(update)
      }
    } catch (err) {
      console.error('Handler error:', err)
    }
  }
}

async function checkAlerts() {
  try {
    const alerts = await listActiveAlerts()
    if (!alerts.length) return
    const online = await fetchOnlineRates()
    if (!online || !online.length) return
    const byCode = {}
    for (const r of online) {
      const n = Number(String(r.value).replace(/[,،]/g, ''))
      if (!Number.isNaN(n)) byCode[r.code] = n
    }
    for (const a of alerts) {
      const value = byCode[a.code]
      if (value === undefined) continue
      let hit = false
      if (a.direction === 'above' && value > a.threshold) hit = true
      if (a.direction === 'below' && value < a.threshold) hit = true
      if (hit) {
        await deactivateAlert(a.id)
        await api.sendMessage({
          chat_id: a.user_id,
          text: `هشدار نرخ شما فعال شد:\n${a.code}: ${value.toLocaleString('fa-IR')} (${a.direction === 'above' ? 'بيشتر از' : 'کمتر از'} ${a.threshold.toLocaleString('fa-IR')})`,
        })
      }
    }
  } catch (err) {
    console.error('Alert check error:', err.message)
  }
}

async function main() {
  while (!shuttingDown) {
    try {
      const me = await api.getMe()
      console.log(`Bot running: @${me.username}`)
      break
    } catch (err) {
      console.error(`getMe failed (${err.message}) — retrying in 10s...`)
      await new Promise((r) => setTimeout(r, 10000))
    }
  }
  if (shuttingDown) return
  alertTimer = setInterval(checkAlerts, 10 * 60 * 1000)
  checkAlerts()
  newsTimer = setInterval(refreshNews, 30 * 60 * 1000)
  refreshNews()
  while (!shuttingDown) {
    try {
      await getUpdates()
    } catch (err) {
      if (shuttingDown) break
      console.error('Polling error:', err.message)
      await new Promise((r) => setTimeout(r, 3000))
    }
  }
}

function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  clearInterval(alertTimer)
  clearInterval(newsTimer)
  console.log(`Received ${signal}; shutting down`)
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err))

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})