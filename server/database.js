import postgres from 'postgres';

const db = postgres(process.env.DATABASE_URL, {
  ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '') ? false : { rejectUnauthorized: false }
});

await db`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_name TEXT,
    last_name TEXT,
    email TEXT
  )
`;

await db`
  CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owned INTEGER DEFAULT 0,
    card_number TEXT,
    set_name TEXT,
    description TEXT,
    team_city TEXT,
    team_name TEXT,
    rookie INTEGER DEFAULT 0,
    auto INTEGER DEFAULT 0,
    mem TEXT,
    serial INTEGER,
    serial_of INTEGER,
    thickness TEXT,
    year TEXT,
    product TEXT,
    grade TEXT,
    duplicates INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

await db`CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id)`;
await db`CREATE INDEX IF NOT EXISTS idx_cards_year_product ON cards(year, product)`;
await db`CREATE INDEX IF NOT EXISTS idx_cards_description ON cards(description)`;
await db`CREATE INDEX IF NOT EXISTS idx_cards_team ON cards(team_city, team_name)`;

await db`
  CREATE TABLE IF NOT EXISTS catalog_cards (
    id SERIAL PRIMARY KEY,
    card_number TEXT,
    set_name TEXT,
    description TEXT,
    team_city TEXT,
    team_name TEXT,
    rookie INTEGER DEFAULT 0,
    auto INTEGER DEFAULT 0,
    mem TEXT,
    serial INTEGER,
    serial_of INTEGER,
    thickness TEXT,
    year TEXT NOT NULL,
    product TEXT NOT NULL,
    grade TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

await db`CREATE INDEX IF NOT EXISTS idx_catalog_year_product ON catalog_cards(year, product)`;

export default db;
