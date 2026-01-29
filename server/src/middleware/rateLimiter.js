const rateLimit = require('express-rate-limit');
const config = require('../config');

const createLimiter = (options) => rateLimit({
  windowMs: config.rateLimit.windowMs,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
  ...options,
});

const generalLimiter = createLimiter({
  max: config.rateLimit.max,
});

const authLimiter = createLimiter({
  max: config.rateLimit.authMax,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts, please try again later' } },
});

const searchLimiter = createLimiter({
  max: config.rateLimit.searchMax,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many search requests, please try again later' } },
});

module.exports = {
  generalLimiter,
  authLimiter,
  searchLimiter,
};
