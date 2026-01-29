const express = require('express');
const db = require('../db/schema');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const items = db.prepare(`
    SELECT * FROM watchlist
    WHERE user_id = ?
    ORDER BY expiry_date ASC
  `).all(req.user.id);

  const now = new Date();
  res.json(items.map(item => {
    const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null;
    const daysUntilExpiry = expiryDate
      ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
      : null;

    return {
      ...item,
      estimated_value: item.estimated_value_cents ? validate.moneyFromCents(item.estimated_value_cents) : null,
      days_until_expiry: daysUntilExpiry,
    };
  }));
}));

router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { domain, expiry_date, estimated_value, notes } = req.body;

  validate.required(domain, 'domain');
  validate.domain(domain);

  validate.required(expiry_date, 'expiry_date');
  const expiryDateIso = validate.isoDate(expiry_date, 'expiry_date');

  const estimatedValueCents = validate.optional(estimated_value, validate.money, 'estimated_value');
  const validatedNotes = validate.optional(notes, validate.string, 'notes', { maxLength: 1000 });

  const existing = db.prepare(`
    SELECT id FROM watchlist WHERE user_id = ? AND domain = ?
  `).get(req.user.id, domain.toLowerCase());

  if (existing) {
    throw new ValidationError('Domain already in watchlist');
  }

  const result = db.prepare(`
    INSERT INTO watchlist (user_id, domain, expiry_date, estimated_value_cents, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, domain.toLowerCase(), expiryDateIso, estimatedValueCents, validatedNotes);

  const item = db.prepare('SELECT * FROM watchlist WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({
    ...item,
    estimated_value: item.estimated_value_cents ? validate.moneyFromCents(item.estimated_value_cents) : null,
  });
}));

router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);

  const item = db.prepare('SELECT * FROM watchlist WHERE id = ?').get(id);

  if (!item) {
    throw new ValidationError('Watchlist item not found');
  }

  if (item.user_id !== req.user.id) {
    throw new ValidationError('Not authorized to delete this item');
  }

  db.prepare('DELETE FROM watchlist WHERE id = ?').run(id);

  res.json({ message: 'Removed from watchlist' });
}));

module.exports = router;
