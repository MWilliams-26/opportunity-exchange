const express = require('express');
const db = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');

const router = express.Router();

const VALID_STATUSES = ['available', 'sold', 'reserved'];
const VALID_SORTS = ['newest', 'price_asc', 'price_desc'];

function formatBrandableName(name) {
  return {
    ...name,
    suggested_price: name.suggested_price_cents ? validate.moneyFromCents(name.suggested_price_cents) : null,
    domain_available: Boolean(name.domain_available),
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const { category, minPrice, maxPrice, sort } = req.query;

  let query = `
    SELECT bn.*, c.name as category_name, c.slug as category_slug,
           u.name as creator_name
    FROM brandable_names bn
    LEFT JOIN categories c ON bn.category_id = c.id
    JOIN users u ON bn.creator_id = u.id
    WHERE bn.status = 'available'
  `;
  const params = [];

  if (category) {
    query += ' AND (c.id = ? OR c.slug = ?)';
    params.push(category, category);
  }

  if (minPrice) {
    const minCents = validate.money(minPrice, 'minPrice');
    query += ' AND bn.suggested_price_cents >= ?';
    params.push(minCents);
  }

  if (maxPrice) {
    const maxCents = validate.money(maxPrice, 'maxPrice');
    query += ' AND bn.suggested_price_cents <= ?';
    params.push(maxCents);
  }

  if (sort) {
    validate.enum(sort, 'sort', VALID_SORTS);
    if (sort === 'newest') {
      query += ' ORDER BY bn.created_at DESC';
    } else if (sort === 'price_asc') {
      query += ' ORDER BY bn.suggested_price_cents ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY bn.suggested_price_cents DESC';
    }
  } else {
    query += ' ORDER BY bn.created_at DESC';
  }

  const names = db.prepare(query).all(...params);
  res.json(names.map(formatBrandableName));
}));

router.get('/:id(\\d+)', asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);

  const name = db.prepare(`
    SELECT bn.*, c.name as category_name, c.slug as category_slug,
           u.name as creator_name
    FROM brandable_names bn
    LEFT JOIN categories c ON bn.category_id = c.id
    JOIN users u ON bn.creator_id = u.id
    WHERE bn.id = ?
  `).get(id);

  if (!name) {
    throw new NotFoundError('Brandable name');
  }

  res.json(formatBrandableName(name));
}));

router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  validate.required(req.body.name, 'name');

  const name = validate.string(req.body.name, 'name', { minLength: 2, maxLength: 50 });
  const description = validate.optional(req.body.description, validate.string, 'description', { maxLength: 5000 });
  const categoryId = req.body.category_id ? validate.id(req.body.category_id, 'category_id') : null;
  const domainAvailable = req.body.domain_available ? 1 : 0;

  let suggestedPriceCents = null;
  if (req.body.suggested_price !== undefined && req.body.suggested_price !== null) {
    suggestedPriceCents = validate.money(req.body.suggested_price, 'suggested_price');
    if (suggestedPriceCents <= 0) {
      throw new ValidationError('suggested_price must be positive', 'suggested_price');
    }
  }

  const existing = db.prepare('SELECT id FROM brandable_names WHERE LOWER(name) = LOWER(?)').get(name);
  if (existing) {
    throw new ConflictError('A brandable name with this name already exists');
  }

  if (categoryId) {
    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
    if (!category) {
      throw new ValidationError('Category not found', 'category_id');
    }
  }

  const result = db.prepare(`
    INSERT INTO brandable_names (creator_id, name, description, category_id, suggested_price_cents, domain_available, status)
    VALUES (?, ?, ?, ?, ?, ?, 'available')
  `).run(
    req.user.id,
    name,
    description || null,
    categoryId,
    suggestedPriceCents,
    domainAvailable
  );

  const created = db.prepare(`
    SELECT bn.*, c.name as category_name, c.slug as category_slug,
           u.name as creator_name
    FROM brandable_names bn
    LEFT JOIN categories c ON bn.category_id = c.id
    JOIN users u ON bn.creator_id = u.id
    WHERE bn.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(formatBrandableName(created));
}));

router.delete('/:id(\\d+)', authenticateToken, asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);

  const name = db.prepare('SELECT * FROM brandable_names WHERE id = ?').get(id);
  if (!name) {
    throw new NotFoundError('Brandable name');
  }

  if (name.creator_id !== req.user.id) {
    throw new ForbiddenError('Not authorized to delete this brandable name');
  }

  if (name.status !== 'available') {
    throw new ForbiddenError('Cannot delete a brandable name that has been sold or reserved');
  }

  db.prepare('DELETE FROM brandable_names WHERE id = ?').run(id);

  res.json({ message: 'Brandable name deleted successfully' });
}));

module.exports = router;
