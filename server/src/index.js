const config = require('./config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pino = require('pino');
const pinoHttp = require('pino-http');

const db = require('./db/schema');
const authRoutes = require('./routes/auth');
const assetsRoutes = require('./routes/assets');
const listingsRoutes = require('./routes/listings');
const bidsRoutes = require('./routes/bids');
const categoriesRoutes = require('./routes/categories');
const brandableNamesRoutes = require('./routes/brandableNames');
const watchlistRoutes = require('./routes/watchlist');
const { authenticateToken } = require('./middleware/auth');
const { generalLimiter, authLimiter, searchLimiter } = require('./middleware/rateLimiter');
const { asyncHandler, notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const validate = require('./middleware/validate');

const logger = pino({
  level: config.isDev ? 'debug' : 'info',
  transport: config.isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
});

const app = express();

app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

app.use(helmet());

app.use(cors({
  origin: config.cors.origins,
  credentials: false,
}));

app.use(express.json({ limit: '100kb' }));

app.use(generalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/assets/search', searchLimiter);
app.use('/api/assets/check', searchLimiter);
app.use('/api/assets', assetsRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/listings', bidsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brandable-names', brandableNamesRoutes);
app.use('/api/watchlist', watchlistRoutes);

app.get('/api/users/me/listings', authenticateToken, asyncHandler(async (req, res) => {
  const listings = db.prepare(`
    SELECT l.*, a.name as asset_name, a.type as asset_type,
           c.name as category_name
    FROM listings l
    JOIN assets a ON l.asset_id = a.id
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
  `).all(req.user.id);

  res.json(listings.map(listing => ({
    ...listing,
    buy_now_price: listing.buy_now_price_cents ? validate.moneyFromCents(listing.buy_now_price_cents) : null,
    starting_bid: listing.starting_bid_cents ? validate.moneyFromCents(listing.starting_bid_cents) : null,
    current_bid: listing.current_bid_cents ? validate.moneyFromCents(listing.current_bid_cents) : null,
  })));
}));

app.get('/api/users/me/brandable-names', authenticateToken, asyncHandler(async (req, res) => {
  const names = db.prepare(`
    SELECT bn.*, c.name as category_name, c.slug as category_slug
    FROM brandable_names bn
    LEFT JOIN categories c ON bn.category_id = c.id
    WHERE bn.creator_id = ?
    ORDER BY bn.created_at DESC
  `).all(req.user.id);

  res.json(names.map(name => ({
    ...name,
    suggested_price: name.suggested_price_cents ? validate.moneyFromCents(name.suggested_price_cents) : null,
    domain_available: Boolean(name.domain_available),
  })));
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/ready', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ready', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`Opportunity Exchange API running on http://localhost:${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    db.close();
    logger.info('Database connection closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
