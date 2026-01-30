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

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  -- Watchlist for expiring domains users are tracking
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    domain TEXT NOT NULL,
    expiry_date DATETIME,
    estimated_value_cents INTEGER,
    notes TEXT,
    expiring_domain_id INTEGER REFERENCES expiring_domains(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
  CREATE INDEX IF NOT EXISTS idx_watchlist_expiry ON watchlist(expiry_date);

  -- Expiring domains imported from ExpiredDomains.net
  CREATE TABLE IF NOT EXISTS expiring_domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT UNIQUE NOT NULL,
    tld TEXT NOT NULL,
    expiry_date DATE,
    delete_date DATE,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'available', 'registered', 'archived')),
    
    -- SEO metrics from ExpiredDomains.net
    backlinks INTEGER DEFAULT 0,
    referring_domains INTEGER DEFAULT 0,
    domain_age_years INTEGER,
    archive_org_age INTEGER,
    
    -- Traffic & ranking
    majestic_tf INTEGER DEFAULT 0,
    majestic_cf INTEGER DEFAULT 0,
    moz_da INTEGER DEFAULT 0,
    moz_pa INTEGER DEFAULT 0,
    
    -- Estimated value (your assessment)
    estimated_value_cents INTEGER,
    score INTEGER DEFAULT 0,
    
    -- Tracking
    notes TEXT,
    is_favorite INTEGER DEFAULT 0,
    source TEXT DEFAULT 'expireddomains.net',
    imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Explainable scoring and cached data
    why_interesting TEXT,
    dns_available INTEGER,
    dns_checked_at DATETIME,
    whois_data TEXT,
    whois_fetched_at DATETIME
  );

  CREATE INDEX IF NOT EXISTS idx_expiring_domains_tld ON expiring_domains(tld);
  CREATE INDEX IF NOT EXISTS idx_expiring_domains_expiry ON expiring_domains(expiry_date);
  CREATE INDEX IF NOT EXISTS idx_expiring_domains_delete ON expiring_domains(delete_date);
  CREATE INDEX IF NOT EXISTS idx_expiring_domains_status ON expiring_domains(status);
  CREATE INDEX IF NOT EXISTS idx_expiring_domains_score ON expiring_domains(score DESC);
  CREATE INDEX IF NOT EXISTS idx_expiring_domains_favorite ON expiring_domains(is_favorite);
  CREATE INDEX IF NOT EXISTS idx_expiring_domains_backlinks ON expiring_domains(backlinks DESC);
`);

module.exports = db;
