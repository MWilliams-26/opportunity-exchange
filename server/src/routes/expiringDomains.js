const express = require('express');
const path = require('path');
const csvIngestionService = require('../services/discovery/csvIngestionService');
const dnsService = require('../services/availability/dnsService');
const whoisService = require('../services/enrichment/whoisService');
const scoringService = require('../services/scoring/scoringService');
const db = require('../db/schema');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Search expiring domains
router.get('/', asyncHandler(async (req, res) => {
  const {
    keyword,
    tld,
    minBacklinks,
    minScore,
    minTF,
    favoritesOnly,
    status,
    sortBy = 'score',
    sortOrder = 'DESC',
    limit = 50,
    offset = 0,
  } = req.query;

  let query = 'SELECT * FROM expiring_domains WHERE 1=1';
  const params = [];

  if (keyword) {
    query += ' AND domain LIKE ?';
    params.push(`%${keyword}%`);
  }

  if (tld) {
    query += ' AND tld = ?';
    params.push(tld.toLowerCase().replace('.', ''));
  }

  if (minBacklinks) {
    query += ' AND backlinks >= ?';
    params.push(parseInt(minBacklinks));
  }

  if (minScore) {
    query += ' AND score >= ?';
    params.push(parseInt(minScore));
  }

  if (minTF) {
    query += ' AND majestic_tf >= ?';
    params.push(parseInt(minTF));
  }

  if (favoritesOnly === 'true') {
    query += ' AND is_favorite = 1';
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  // Sorting
  const validSortColumns = ['score', 'backlinks', 'referring_domains', 'majestic_tf', 'delete_date', 'domain', 'imported_at'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'score';
  const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  query += ` ORDER BY ${sortColumn} ${order}`;
  query += ' LIMIT ? OFFSET ?';
  params.push(Math.min(parseInt(limit) || 50, 200), parseInt(offset) || 0);

  const domains = db.prepare(query).all(...params);

  // Get stats
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN is_favorite = 1 THEN 1 END) as favorites,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'registered' THEN 1 END) as registered,
      AVG(score) as avg_score,
      MAX(score) as max_score,
      COUNT(CASE WHEN backlinks > 100 THEN 1 END) as high_backlinks,
      COUNT(CASE WHEN majestic_tf > 20 THEN 1 END) as high_tf
    FROM expiring_domains
  `).get();

  const byTld = db.prepare(`
    SELECT tld, COUNT(*) as count 
    FROM expiring_domains 
    GROUP BY tld 
    ORDER BY count DESC 
    LIMIT 10
  `).all();

  res.json({
    domains,
    stats: { ...stats, byTld },
    filters: { keyword, tld, minBacklinks, minScore, minTF, favoritesOnly, status, sortBy, sortOrder },
  });
}));

// Get stats
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN is_favorite = 1 THEN 1 END) as favorites,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'registered' THEN 1 END) as registered,
      AVG(score) as avg_score,
      MAX(score) as max_score,
      COUNT(CASE WHEN backlinks > 100 THEN 1 END) as high_backlinks,
      COUNT(CASE WHEN majestic_tf > 20 THEN 1 END) as high_tf
    FROM expiring_domains
  `).get();

  const byTld = db.prepare(`
    SELECT tld, COUNT(*) as count 
    FROM expiring_domains 
    GROUP BY tld 
    ORDER BY count DESC 
    LIMIT 10
  `).all();

  res.json({ ...stats, byTld });
}));

// Get single domain with availability check
router.get('/:id', asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);
  const domain = db.prepare('SELECT * FROM expiring_domains WHERE id = ?').get(id);

  if (!domain) {
    throw new ValidationError('Domain not found');
  }

  // Check DNS availability (uses cache)
  let availability = null;
  try {
    availability = await dnsService.checkAvailability(domain.domain);
  } catch (err) {
    console.error('DNS check failed:', err.message);
  }

  res.json({
    ...domain,
    availability,
  });
}));

// Toggle favorite (requires auth) - triggers WHOIS enrichment
router.post('/:id/favorite', authenticateToken, asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);
  const domain = db.prepare('SELECT * FROM expiring_domains WHERE id = ?').get(id);

  if (!domain) {
    throw new ValidationError('Domain not found');
  }

  const newValue = domain.is_favorite ? 0 : 1;
  db.prepare('UPDATE expiring_domains SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newValue, id);

  // Trigger WHOIS enrichment if favoriting (async, don't wait)
  if (newValue === 1) {
    whoisService.enrichDomain(domain.domain).catch(err => {
      console.error('Background WHOIS enrichment failed:', err.message);
    });
  }

  const updated = db.prepare('SELECT * FROM expiring_domains WHERE id = ?').get(id);
  res.json(updated);
}));

// Update notes (requires auth)
router.put('/:id/notes', authenticateToken, asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);
  const { notes } = req.body;

  validate.string(notes, 'notes', { maxLength: 1000, required: false });

  const result = db.prepare('UPDATE expiring_domains SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(notes || null, id);

  if (result.changes === 0) {
    throw new ValidationError('Domain not found');
  }

  const domain = db.prepare('SELECT * FROM expiring_domains WHERE id = ?').get(id);
  res.json(domain);
}));

// Update status (requires auth)
router.put('/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);
  const { status } = req.body;

  validate.enum(status, 'status', ['pending', 'available', 'registered', 'archived']);

  const result = db.prepare('UPDATE expiring_domains SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, id);

  if (result.changes === 0) {
    throw new ValidationError('Domain not found');
  }

  const domain = db.prepare('SELECT * FROM expiring_domains WHERE id = ?').get(id);
  res.json(domain);
}));

// Check DNS availability for a domain
router.get('/:id/availability', asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);
  const domain = db.prepare('SELECT domain FROM expiring_domains WHERE id = ?').get(id);

  if (!domain) {
    throw new ValidationError('Domain not found');
  }

  const availability = await dnsService.checkAvailability(domain.domain);
  res.json(availability);
}));

// Import from CSV (requires auth)
router.post('/import', authenticateToken, asyncHandler(async (req, res) => {
  const { filePath, dryRun = false, skipExisting = true } = req.body;

  if (!filePath) {
    throw new ValidationError('filePath is required');
  }

  // Resolve path relative to server/data directory for security
  const dataDir = path.join(__dirname, '../../data');
  const resolvedPath = path.resolve(dataDir, filePath);

  // Security check: ensure path is within data directory
  if (!resolvedPath.startsWith(dataDir)) {
    throw new ValidationError('File path must be within the data directory');
  }

  const results = await csvIngestionService.importFromCSV(resolvedPath, {
    dryRun,
    skipExisting,
  });

  res.json({
    message: dryRun ? 'Dry run complete' : 'Import complete',
    results,
  });
}));

// Delete domain (requires auth)
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);
  const result = db.prepare('DELETE FROM expiring_domains WHERE id = ?').run(id);

  if (result.changes === 0) {
    throw new ValidationError('Domain not found');
  }

  res.json({ message: 'Domain deleted' });
}));

// Clear all domains (requires auth) - dangerous, use with caution
router.delete('/', authenticateToken, asyncHandler(async (req, res) => {
  const { confirm } = req.body;

  if (confirm !== 'DELETE_ALL') {
    throw new ValidationError('Must confirm with DELETE_ALL');
  }

  const result = db.prepare('DELETE FROM expiring_domains').run();
  res.json({ message: 'All domains cleared', deleted: result.changes });
}));

module.exports = router;
