export const BOT_TOKEN = process.env.BOT_TOKEN || ''
export const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : null
export const REVEAL_PRICE = Number(process.env.REVEAL_PRICE) || 15000
export const CARD_NUMBER = process.env.CARD_NUMBER || ''
export const CARD_HOLDER = process.env.CARD_HOLDER || ''
export const CARD_BANK = process.env.CARD_BANK || ''
export const REF_CODE_PREFIX = process.env.REF_CODE_PREFIX || '54'
export const REF_CODE_LENGTH = Number(process.env.REF_CODE_LENGTH) || 10

export const NEWS_CHANNELS = [
  { username: 'PiranshahrRudaw', name: 'پیرانشهر رووداو', category: 'city' },
  { username: 'M0_HM', name: 'خبر فوری', category: 'world' },
]