import { db } from 'lib/db'
import { NEWS_CHANNELS } from 'lib/config'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

function decodeEntities(s) {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function fetchChannelPosts(username) {
  const res = await fetch(`https://t.me/s/${username}`, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`news fetch ${username}: HTTP ${res.status}`)
  const html = await res.text()

  const positions = []
  const idRe = /data-post="[^"]*\/(\d+)"/g
  let m
  while ((m = idRe.exec(html))) {
    positions.push({ id: Number(m[1]), start: m.index })
  }

  const posts = []
  for (let i = 0; i < positions.length; i++) {
    const end = i + 1 < positions.length ? positions[i + 1].start : html.length
    const slice = html.slice(positions[i].start, end)

    const textMatch = /<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/.exec(slice)
    const timeMatch = /<time datetime="([^"]+)"/.exec(slice)

    const raw = textMatch ? decodeEntities(textMatch[1]) : ''
    if (!raw) continue

    posts.push({
      postId: positions[i].id,
      text: raw,
      url: `https://t.me/${username}/${positions[i].id}`,
      date: timeMatch ? timeMatch[1] : '',
    })
  }
  return posts
}

export async function refreshNews() {
  for (const ch of NEWS_CHANNELS) {
    try {
      const posts = await fetchChannelPosts(ch.username)
      for (const p of posts) {
        await db.run(
          'INSERT OR IGNORE INTO news (channel, channel_name, category, post_id, text, url, published_at, created_at) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [ch.username, ch.name, ch.category || 'city', p.postId, p.text, p.url, p.date, Date.now()],
        )
      }
      console.log(`news: ${ch.name} -> ${posts.length} posts`)
    } catch (err) {
      console.error(`news error ${ch.username}:`, err.message)
    }
  }
}

export async function listNews(category = null, limit = 10) {
  if (category) {
    return db.all('SELECT * FROM news WHERE category = ? ORDER BY id DESC LIMIT ?', [category, limit])
  }
  return db.all('SELECT * FROM news ORDER BY id DESC LIMIT ?', [limit])
}