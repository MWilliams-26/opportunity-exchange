require('dotenv').config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requireEnvInProd(name, devDefault) {
  const value = process.env[name];
  if (process.env.NODE_ENV === 'production' && !value) {
    throw new Error(`Missing required environment variable in production: ${name}`);
  }
  return value || devDefault;
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3001,
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',

  jwt: {
    secret: requireEnvInProd('JWT_SECRET', 'dev-only-secret-change-in-production-min-32-chars'),
    issuer: process.env.JWT_ISSUER || 'opportunity-exchange',
    audience: process.env.JWT_AUDIENCE || 'opportunity-exchange-api',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
      .split(',')
      .map(s => s.trim()),
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // general limit
    authMax: 10, // stricter for auth endpoints
    searchMax: 30, // DNS lookups
  },
};

if (config.isProd && config.jwt.secret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

module.exports = config;
