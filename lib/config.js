import 'dotenv/config'

const required = ['BOT_TOKEN', 'CARD_NUMBER', 'CARD_HOLDER', 'CARD_BANK']
const missing = required.filter((name) => !process.env[name]?.trim())
if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`)

export const BOT_TOKEN = process.env.BOT_TOKEN
export const ADMIN_ID = process.env.ADMIN_ID ? Number(process.env.ADMIN_ID) : null
export const REVEAL_PRICE = Number(process.env.REVEAL_PRICE) || 15000
export const CARD_NUMBER = process.env.CARD_NUMBER
export const CARD_HOLDER = process.env.CARD_HOLDER
export const CARD_BANK = process.env.CARD_BANK
export const REF_CODE_PREFIX = process.env.REF_CODE_PREFIX || '54'
export const REF_CODE_LENGTH = Number(process.env.REF_CODE_LENGTH) || 10

if (!Number.isInteger(REVEAL_PRICE) || REVEAL_PRICE <= 0) throw new Error('REVEAL_PRICE must be a positive integer')
if (!Number.isInteger(REF_CODE_LENGTH) || REF_CODE_LENGTH < 1) throw new Error('REF_CODE_LENGTH must be a positive integer')

export const NEWS_CHANNELS = [
  { username: 'PiranshahrRudaw', name: 'پیرانشهر رووداو', category: 'city' },
  { username: 'M0_HM', name: 'خبر فوری', category: 'world' },
]