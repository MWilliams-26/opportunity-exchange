const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'opportunity-exchange.db');
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
    estimated_cost_cents INTEGER,
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
    buy_now_price_cents INTEGER,
    starting_bid_cents INTEGER,
    current_bid_cents INTEGER,
    highest_bidder_id INTEGER REFERENCES users(id),
    auction_end_date DATETIME,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'sold', 'expired', 'cancelled')),
    contact_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (
      (listing_type = 'buy_now' AND buy_now_price_cents IS NOT NULL) OR
      (listing_type = 'auction' AND starting_bid_cents IS NOT NULL) OR
      (listing_type = 'both' AND buy_now_price_cents IS NOT NULL AND starting_bid_cents IS NOT NULL)
    )
  );

  CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount_cents INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
  CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category_id);
  CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
  CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
  CREATE INDEX IF NOT EXISTS idx_bids_listing ON bids(listing_id);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  -- Brandable names created by users to sell
  CREATE TABLE IF NOT EXISTS brandable_names (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    suggested_price_cents INTEGER,
    status TEXT DEFAULT 'available' CHECK(status IN ('available', 'sold', 'reserved')),
    domain_available INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Watchlist for expiring domains users are tracking
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    domain TEXT NOT NULL,
    expiry_date DATETIME,
    estimated_value_cents INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Transactions for completed sales and earnings tracking
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER REFERENCES listings(id),
    brandable_name_id INTEGER REFERENCES brandable_names(id),
    seller_id INTEGER NOT NULL REFERENCES users(id),
    buyer_id INTEGER NOT NULL REFERENCES users(id),
    sale_price_cents INTEGER NOT NULL,
    platform_fee_cents INTEGER NOT NULL,
    seller_payout_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'refunded')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_brandable_names_creator ON brandable_names(creator_id);
  CREATE INDEX IF NOT EXISTS idx_brandable_names_status ON brandable_names(status);
  CREATE INDEX IF NOT EXISTS idx_brandable_names_category ON brandable_names(category_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_expiry ON watchlist(expiry_date);
  CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
`);

module.exports = db;
