# Opportunity Exchange

A marketplace for discovering and trading digital assets — domains and business names.

## Quick Start

```bash
cd opportunity-exchange

# Install all dependencies
npm run install:all

# Create .env file from example
cp server/.env.example server/.env
# Edit server/.env and set JWT_SECRET (min 32 characters)

# Initialize database
npm run seed

# Start both server + client
npm run dev
```

**Note**: Requires Node.js >= 22.12.0 (use `nvm install 22` if needed)

- **API**: http://localhost:3001
- **Client**: http://localhost:5173

---

## Features

### Domain Discovery (Real Data)
- Search for available domains by keyword
- Real-time availability checking via DNS lookup
- Supports: .com, .net, .org, .io, .co, .app, .dev
- Estimated registration costs ($12-$40)

### Marketplace
- List domains you own for sale
- Buy Now or Auction listings
- Bidding system with countdown timers
- User dashboard to manage listings

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT with bcrypt |

---

## Project Structure

```
opportunity-exchange/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── context/        # Auth context
│   │   ├── lib/            # API client
│   │   └── types/          # TypeScript types
│   └── package.json
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── db/             # Schema + seed
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   └── services/       # Domain checking service
│   ├── .env.example        # Environment template
│   └── package.json
│
└── package.json            # Root scripts
```

---

## API Endpoints

### Domain Discovery
| Endpoint | Description |
|----------|-------------|
| `GET /api/assets/search?keyword=X` | Search available domains |
| `GET /api/assets/check?domain=X` | Check single domain |

### Auth
| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Create account |
| `POST /api/auth/login` | Login |
| `GET /api/auth/me` | Current user |

### Listings
| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/listings` | No | Browse listings |
| `GET /api/listings/:id` | No | Listing details |
| `POST /api/listings` | Yes | Create listing |
| `PUT /api/listings/:id` | Yes | Update listing |
| `DELETE /api/listings/:id` | Yes | Delete listing |

### Bids
| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/listings/:id/bids` | No | Get bids |
| `POST /api/listings/:id/bids` | Yes | Place bid |

---

## Environment Variables

Create `server/.env`:

```env
JWT_SECRET=your-secret-key-min-32-chars
JWT_ISSUER=opportunity-exchange
JWT_AUDIENCE=opportunity-exchange-api
CORS_ORIGINS=http://localhost:5173
PORT=3001
NODE_ENV=development
```

**Required in production**: `JWT_SECRET`, `NODE_ENV=production`

---

## Security Features

- JWT authentication with algorithm/issuer/audience validation
- bcrypt password hashing (cost factor 12)
- Parameterized SQL queries (no SQL injection)
- Centralized input validation (emails, IDs, enums, money, domains)
- Helmet security headers
- CORS allowlist
- Request body size limits (100kb)
- Rate limiting (auth: 10/15min, search: 30/15min, general: 100/15min)
- Transactional bidding (prevents race conditions)
- Graceful shutdown handling
- Structured logging with Pino

---

## Domain Availability

The MVP uses DNS lookups to check domain availability:
- **Free**: No API keys required
- **Fast**: Parallel DNS queries
- **Limitation**: ~90% accurate (some parked domains may show as taken)

For production, integrate with:
- GoDaddy Auctions API
- Namecheap API
- Dynadot API

---

## License

Private — All rights reserved.
