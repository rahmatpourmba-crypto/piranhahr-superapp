export const DIV = '━━━━━━━━━━━━━━━━━━━━━━'
export const DIV_SOFT = '· · · · · · · · · · · · · · · ·'

export function banner(title, icon = '💎') {
  return `${DIV}\n${icon} <b>${title}</b>\n${DIV}`
}

export function luxury(text) {
  return text
}

export const RATE_ICONS = {
  usd: '💵',
  eur: '💶',
  try: '💴',
  iqd: '🪙',
  gold18: '🥇',
  gold24: '🥇',
  mesghal: '🏅',
  coin: '🪙',
  silver: '🥈',
  ons: '🌍',
  silver_ons: '🥈',
}

export const CATEGORY_ICONS = {
  خودرو: '🚗',
  ملک: '🏠',
  'کالا و لوازم': '🛍',
  غذا: '🍽',
  'غذای خانگی': '🍲',
  'لباس و پوشاک': '👗',
  'لوازم خانگي': '🛋',
  'دست دوم': '♻️',
  'موبايل و کامپيوتر': '📱',
  'کشاورزي و دام': '🌾',
  'گمشده و پیداشده': '🔍',
  'نوبت خالی': '🗓',
  'ساير اجناس': '📦',
  خدمات: '🛠',
  شغل: '💼',
}

export function iconForCategory(cat) {
  return CATEGORY_ICONS[cat] || '✨'
}

export function footer() {
  return `${DIV}\n✨ پيرانشهر، شهر ما ✨`
}