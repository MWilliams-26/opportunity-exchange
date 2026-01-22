const express = require('express');
const db = require('../db/schema');
const domainService = require('../services/domainService');

const router = express.Router();

router.get('/search', async (req, res) => {
  const { keyword, limit = 10 } = req.query;

  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    const domains = await domainService.searchAvailableDomains(keyword, parseInt(limit));
    
    const businessNameNote = await domainService.checkBusinessNameAvailability(keyword, null);

    res.json({
      domains,
      businessName: businessNameNote,
      meta: {
        keyword,
        source: 'dns_lookup',
        accuracy: 'MVP - DNS-based check, not 100% accurate. Verify with registrar.',
        supportedTlds: domainService.SUPPORTED_TLDS
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search domains', details: err.message });
  }
});

router.get('/check', async (req, res) => {
  const { domain } = req.query;

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  try {
    const result = await domainService.checkDomainAvailability(domain);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check domain', details: err.message });
  }
});

router.get('/', (req, res) => {
  const { keyword, type, maxPrice, category } = req.query;
  
  let query = `
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM assets a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (keyword) {
    query += ' AND (a.name LIKE ? OR a.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (type) {
    query += ' AND a.type = ?';
    params.push(type);
  }

  if (maxPrice) {
    query += ' AND a.estimated_cost <= ?';
    params.push(parseFloat(maxPrice));
  }

  if (category) {
    query += ' AND (c.id = ? OR c.slug = ?)';
    params.push(category, category);
  }

  query += ' ORDER BY a.created_at DESC';

  try {
    const assets = db.prepare(query).all(...params);
    res.json(assets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const asset = db.prepare(`
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM assets a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id = ?
  `).get(id);

  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  res.json(asset);
});

module.exports = router;
