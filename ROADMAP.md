# Opportunity Exchange - Roadmap

> **Vision**: A platform for discovering expiring and undervalued digital (and physical) assets that anyone can afford.

---

## Phase 1: Expiring Domains ✅ (Current)

### Core Features
- [x] Expiring domain search (filter by TLD, keywords, score, backlinks)
- [x] DNS-based availability checking (cached)
- [x] Watchlist for tracking domains
- [x] Score-based valuation (backlinks, TF, age, TLD)
- [x] Favorites system for marking best opportunities
- [x] Notes on individual domains
- [x] "Why Interesting" explanations for each domain
- [x] Direct links to registrars (GoDaddy, Namecheap, Porkbun, DropCatch)
- [ ] Email alerts when domains drop

### Data Architecture
- [x] **Discovery Layer**: ExpiredDomains.net CSV import
- [x] **Availability Layer**: DNS checks with 24h cache
- [x] **Enrichment Layer**: WhoisXML API integration (stubbed, triggers on favorite)
- [x] **Scoring Layer**: Modular scoring with explanations

### Data Sources
- [x] ExpiredDomains.net CSV import
- [x] DNS availability checking
- [ ] WhoisXML API (ready, needs API key)
- [ ] Automated daily data refresh

---

## Phase 2: Social & Digital Handles (Future)

### Platforms
- [ ] Twitter/X username checker
- [ ] Instagram handle availability
- [ ] TikTok username checker
- [ ] GitHub username checker
- [ ] App Store name availability (iOS/Android)

### Features
- [ ] Cross-platform search (check one name everywhere)
- [ ] Inactive account detection (where possible)
- [ ] Alert when handles become available

### Integration Points
```
server/src/services/social/
├── twitterService.js
├── instagramService.js
├── tiktokService.js
└── githubService.js
```

---

## Phase 3: Intellectual Property (Future)

### Assets
- [ ] Expiring/abandoned trademarks (USPTO, EUIPO)
- [ ] Lapsed patents (public domain opportunities)

### Features
- [ ] Trademark search by class/category
- [ ] Filing guides and cost breakdowns
- [ ] Attorney referral network (optional)

### Integration Points
```
server/src/services/ip/
├── trademarkService.js
└── patentService.js
```

---

## Phase 4: Physical Assets (Future)

### Assets
- [ ] Tax lien properties
- [ ] Government surplus auctions (GSA, local)
- [ ] Seized asset auctions (US Marshals, Treasury)
- [ ] Unclaimed property

### Features
- [ ] Location-based search
- [ ] Auction calendar with alerts
- [ ] Due diligence guides
- [ ] Financing/acquisition guides

### Integration Points
```
server/src/services/physical/
├── taxLienService.js
├── auctionService.js
└── unclaimedPropertyService.js
```

---

## Architecture

### Service Layer
```
server/src/services/
├── discovery/
│   └── csvIngestionService.js    # Bulk CSV import, normalization
├── availability/
│   └── dnsService.js             # Fast DNS checks, cached
├── enrichment/
│   └── whoisService.js           # On-demand WHOIS, cached
├── scoring/
│   └── scoringService.js         # Modular scoring, explanations
└── notifications/
    └── emailService.js           # Email alerts (stubbed)
```

### Jobs (Future)
```
server/src/jobs/
├── domainRefresh.js              # Daily DNS re-check
└── alertProcessor.js             # Send drop notifications
```

### Database Tables
```
users                  # User accounts
watchlist              # Domains user is tracking
expiring_domains       # Imported domain data + scores
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend | Node.js, Express |
| Database | SQLite → PostgreSQL (production) |
| Auth | JWT |
| Jobs | node-cron (future) |
| Email | Resend/SendGrid (future) |

---

## Getting Started

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Environment
```bash
cp server/.env.example server/.env
# Edit .env with your JWT_SECRET
```

### 3. Import Domain Data
```bash
# Download CSV from expireddomains.net
# Save to server/data/
cd server
npm run import data/your-file.csv
```

### 4. Start Development
```bash
npm run dev
```

---

## Revenue Model (Future)

| Model | Description |
|-------|-------------|
| **Freemium** | Free basic search, paid alerts/advanced features |
| **Affiliate** | Commissions from registrar referrals |
| **Premium data** | Detailed valuation reports, backlink data |
| **Courses** | Educational content on asset flipping |
