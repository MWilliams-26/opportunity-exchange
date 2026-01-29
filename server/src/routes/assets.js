const express = require('express');
const db = require('../db/schema');
const domainService = require('../services/domainService');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/search', asyncHandler(async (req, res) => {
  const { keyword, limit = 10 } = req.query;

  validate.required(keyword, 'keyword');
  validate.string(keyword, 'keyword', { minLength: 1, maxLength: 63 });

  const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

  const domains = await domainService.searchAvailableDomains(keyword, parsedLimit);
  const businessNameNote = await domainService.checkBusinessNameAvailability(keyword, null);

  res.json({
    domains,
    businessName: businessNameNote,
    meta: {
      keyword,
      source: 'dns_lookup',
      accuracy: 'MVP - DNS-based check, not 100% accurate. Verify with registrar.',
      supportedTlds: domainService.SUPPORTED_TLDS,
    },
  });
}));

router.get('/check', asyncHandler(async (req, res) => {
  const { domain } = req.query;

  validate.required(domain, 'domain');
  validate.domain(domain);

  const result = await domainService.checkDomainAvailability(domain);
  res.json(result);
}));

router.get('/', asyncHandler(async (req, res) => {
  const { keyword, type, maxPrice, category } = req.query;

  let query = `
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM assets a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (keyword) {
    validate.string(keyword, 'keyword', { maxLength: 100 });
    query += ' AND (a.name LIKE ? OR a.description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (type) {
    validate.enum(type, 'type', ['domain', 'business_name']);
    query += ' AND a.type = ?';
    params.push(type);
  }

  if (maxPrice) {
    const maxCents = validate.money(maxPrice, 'maxPrice');
    query += ' AND a.estimated_cost_cents <= ?';
    params.push(maxCents);
  }

  if (category) {
    query += ' AND (c.id = ? OR c.slug = ?)';
    params.push(category, category);
  }

  query += ' ORDER BY a.created_at DESC';

  const assets = db.prepare(query).all(...params);
  res.json(assets.map(asset => ({
    ...asset,
    estimated_cost: asset.estimated_cost_cents ? validate.moneyFromCents(asset.estimated_cost_cents) : null,
  })));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);

  const asset = db.prepare(`
    SELECT a.*, c.name as category_name, c.slug as category_slug
    FROM assets a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id = ?
  `).get(id);

  if (!asset) {
    throw new ValidationError('Asset not found');
  }

  res.json({
    ...asset,
    estimated_cost: asset.estimated_cost_cents ? validate.moneyFromCents(asset.estimated_cost_cents) : null,
  });
}));

module.exports = router;
