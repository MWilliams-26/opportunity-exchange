const express = require('express');
const db = require('../db/schema');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(a.id) as asset_count
      FROM categories c
      LEFT JOIN assets a ON c.id = a.category_id
      GROUP BY c.id
      ORDER BY c.name
    `).all();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const category = db.prepare(`
    SELECT c.*, COUNT(a.id) as asset_count
    FROM categories c
    LEFT JOIN assets a ON c.id = a.category_id
    WHERE c.id = ? OR c.slug = ?
    GROUP BY c.id
  `).get(id, id);

  if (!category) {
    return res.status(404).json({ error: 'Category not found' });
  }

  res.json(category);
});

module.exports = router;
