const config = require('./config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pino = require('pino');
const pinoHttp = require('pino-http');

const db = require('./db/schema');
const authRoutes = require('./routes/auth');
const watchlistRoutes = require('./routes/watchlist');
const expiringDomainsRoutes = require('./routes/expiringDomains');
const { authenticateToken } = require('./middleware/auth');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiter');
const { asyncHandler, notFoundHandler, errorHandler } = require('./middleware/errorHandler');

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
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/expiring-domains', expiringDomainsRoutes);

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
