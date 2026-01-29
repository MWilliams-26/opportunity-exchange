const express = require('express');
const db = require('../db/schema');
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(a.id) as asset_count
    FROM categories c
    LEFT JOIN assets a ON c.id = a.category_id
    GROUP BY c.id
    ORDER BY c.name
  `).all();
  res.json(categories);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = db.prepare(`
    SELECT c.*, COUNT(a.id) as asset_count
    FROM categories c
    LEFT JOIN assets a ON c.id = a.category_id
    WHERE c.id = ? OR c.slug = ?
    GROUP BY c.id
  `).get(id, id);

  if (!category) {
    throw new NotFoundError('Category');
  }

  res.json(category);
}));

module.exports = router;
