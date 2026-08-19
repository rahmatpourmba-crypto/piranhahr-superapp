export const SCHEMA_SQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL UNIQUE,
    name TEXT,
    is_admin INTEGER NOT NULL DEFAULT 0,
    lang TEXT NOT NULL DEFAULT 'fa',
    created_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL UNIQUE,
    state TEXT,
    data TEXT,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL DEFAULT 'sell',
    category TEXT,
    title TEXT,
    price TEXT,
    description TEXT,
    contact TEXT,
    tg_username TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_featured INTEGER NOT NULL DEFAULT 0,
    featured_until INTEGER,
    created_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    description TEXT,
    phone TEXT,
    tg_username TEXT,
    address TEXT,
    owner_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    is_featured INTEGER NOT NULL DEFAULT 0,
    featured_until INTEGER,
    rating_sum INTEGER NOT NULL DEFAULT 0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ad_id INTEGER,
    amount INTEGER,
    ref_code TEXT,
    target_type TEXT NOT NULL DEFAULT 'ad',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER,
    verified_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT,
    value TEXT,
    unit TEXT NOT NULL DEFAULT 'تومان',
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    stars INTEGER NOT NULL,
    comment TEXT,
    created_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    date_text TEXT,
    description TEXT,
    location TEXT,
    created_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code TEXT NOT NULL,
    threshold REAL NOT NULL,
    direction TEXT NOT NULL DEFAULT 'below',
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT,
    channel_name TEXT,
    post_id INTEGER,
    text TEXT,
    url TEXT,
    published_at TEXT,
    created_at INTEGER
  )`,
]