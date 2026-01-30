# Opportunity Exchange

> Discover expiring domains and undervalued digital assets before anyone else.

A personal tool for finding and tracking expiring domains with real value — backlinks, trust flow, domain age — so you can catch them when they drop.

---

## Features

### 🔍 Import & Search
- Import domains from ExpiredDomains.net CSV exports
- Filter by TLD, score, backlinks, trust flow
- Sort by what matters to you

### ⭐ Score & Explain
- Automatic scoring based on SEO metrics
- "Why Interesting" explanations for each domain
- Identify the best opportunities at a glance

### 📋 Track & Favorite
- Mark favorites for quick access
- Add personal notes to any domain
- Watchlist for domains you're monitoring

### 🔗 Register
- One-click links to registrars (GoDaddy, Namecheap, Porkbun, DropCatch)
- Research links (Wayback Machine, SEMrush, Ahrefs)

---

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Create environment file
cp server/.env.example server/.env
# Edit server/.env and set JWT_SECRET

# Start development server
npm run dev
```

**Requires**: Node.js >= 20.12.0 (22+ recommended)

- **API**: http://localhost:3001
- **Client**: http://localhost:5173

---

## Importing Domains

### 1. Get Data from ExpiredDomains.net
1. Create free account at [expireddomains.net](https://www.expireddomains.net)
2. Go to **Deleted Domains** → **.com**
3. Apply filters (backlinks > 10, etc.)
4. Export → CSV
5. Save to `server/data/`

### 2. Run Import
```bash
cd server
npm run import data/your-file.csv

# Preview first (dry run)
npm run import data/your-file.csv -- --dry-run

# Replace existing domains
npm run import data/your-file.csv -- --replace
```

---

## Architecture

```
server/src/
├── services/
│   ├── discovery/      # CSV import, normalization
│   ├── availability/   # DNS checking, caching
│   ├── enrichment/     # WHOIS API (optional)
│   ├── scoring/        # Score calculation, explanations
│   └── notifications/  # Email alerts (future)
├── routes/             # API endpoints
├── middleware/         # Auth, validation, errors
└── db/                 # SQLite schema

client/src/
├── pages/              # React pages
├── components/         # UI components
├── lib/                # API client
└── types/              # TypeScript types
```

---

## API Endpoints

### Expiring Domains
| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/expiring-domains` | No | Search domains |
| `GET /api/expiring-domains/:id` | No | Get domain + availability |
| `POST /api/expiring-domains/:id/favorite` | Yes | Toggle favorite |
| `PUT /api/expiring-domains/:id/notes` | Yes | Update notes |
| `PUT /api/expiring-domains/:id/status` | Yes | Update status |
| `POST /api/expiring-domains/import` | Yes | Import CSV |

### Auth
| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Create account |
| `POST /api/auth/login` | Login |
| `GET /api/auth/me` | Current user |

### Watchlist
| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/watchlist` | Yes | Get watchlist |
| `POST /api/watchlist` | Yes | Add domain |
| `DELETE /api/watchlist/:id` | Yes | Remove domain |

---

## Environment Variables

```env
# Required
JWT_SECRET=your-secret-key-min-32-chars

# Optional - WHOIS enrichment
WHOISXML_API_KEY=your-api-key

# Optional - Email alerts (future)
EMAIL_PROVIDER=resend
EMAIL_API_KEY=your-api-key
```

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full feature roadmap:
- ✅ Phase 1: Expiring domains
- 🔜 Phase 2: Social media handles
- 🔜 Phase 3: Trademarks & patents
- 🔜 Phase 4: Physical assets (tax liens, auctions)

---

## License

Private — All rights reserved.
