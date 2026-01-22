const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const db = require('./db/schema');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const authRoutes = require('./routes/auth');
const assetsRoutes = require('./routes/assets');
const listingsRoutes = require('./routes/listings');
const bidsRoutes = require('./routes/bids');
const categoriesRoutes = require('./routes/categories');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/listings', bidsRoutes);
app.use('/api/categories', categoriesRoutes);

app.get('/api/users/me/listings', authenticateToken, (req, res) => {
  try {
    const listings = db.prepare(`
      SELECT l.*, a.name as asset_name, a.type as asset_type,
             c.name as category_name
      FROM listings l
      JOIN assets a ON l.asset_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `).all(req.user.id);
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user listings' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Opportunity Exchange API running on http://localhost:${PORT}`);
});

module.exports = app;
