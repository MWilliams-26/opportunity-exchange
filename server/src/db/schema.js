const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/opportunity-exchange.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('domain', 'business_name')),
    category_id INTEGER REFERENCES categories(id),
    estimated_cost REAL,
    description TEXT,
    potential_value TEXT,
    state TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    asset_id INTEGER NOT NULL REFERENCES assets(id),
    title TEXT NOT NULL,
    description TEXT,
    listing_type TEXT NOT NULL CHECK(listing_type IN ('buy_now', 'auction', 'both')),
    buy_now_price REAL,
    starting_bid REAL,
    current_bid REAL,
    highest_bidder_id INTEGER REFERENCES users(id),
    auction_end_date DATETIME,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'sold', 'expired')),
    contact_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL REFERENCES listings(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
  CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
  CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
  CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
  CREATE INDEX IF NOT EXISTS idx_bids_listing ON bids(listing_id);
`);

module.exports = db;
