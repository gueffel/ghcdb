import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(join(__dirname, 'hockey_cards.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id);
  CREATE INDEX IF NOT EXISTS idx_cards_year_product ON cards(year, product);
  CREATE INDEX IF NOT EXISTS idx_cards_description ON cards(description);
  CREATE INDEX IF NOT EXISTS idx_cards_team ON cards(team_city, team_name);

  CREATE TABLE IF NOT EXISTS catalog_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_catalog_year_product ON catalog_cards(year, product);
`);

// Migrations for new columns (safe to run on existing DBs)
for (const col of ['first_name TEXT', 'last_name TEXT', 'email TEXT']) {
  try { db.exec(`ALTER TABLE users ADD COLUMN ${col}`); } catch { /* column already exists */ }
}

export default db;
