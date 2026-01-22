const express = require('express');
const db = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const VALID_LISTING_TYPES = ['buy_now', 'auction', 'both'];
const VALID_STATUSES = ['active', 'sold', 'expired', 'cancelled'];

function isPositiveInteger(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

router.get('/', (req, res) => {
  const { status = 'active', category, type, minPrice, maxPrice } = req.query;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  
  let query = `
    SELECT l.*, a.name as asset_name, a.type as asset_type, 
           c.name as category_name, c.slug as category_slug,
           u.name as seller_name
    FROM listings l
    JOIN assets a ON l.asset_id = a.id
    LEFT JOIN categories c ON a.category_id = c.id
    JOIN users u ON l.user_id = u.id
    WHERE l.status = ?
  `;
  const params = [status];

  if (category) {
    query += ' AND (c.id = ? OR c.slug = ?)';
    params.push(category, category);
  }

  if (type) {
    query += ' AND a.type = ?';
    params.push(type);
  }

  if (minPrice) {
    query += ' AND (l.buy_now_price >= ? OR l.current_bid >= ? OR l.starting_bid >= ?)';
    params.push(parseFloat(minPrice), parseFloat(minPrice), parseFloat(minPrice));
  }

  if (maxPrice) {
    query += ' AND (l.buy_now_price <= ? OR l.current_bid <= ? OR l.starting_bid <= ?)';
    params.push(parseFloat(maxPrice), parseFloat(maxPrice), parseFloat(maxPrice));
  }

  query += ' ORDER BY l.created_at DESC';

  try {
    const listings = db.prepare(query).all(...params);
    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

router.get('/:id(\\d+)', (req, res) => {
  const { id } = req.params;
  
  const listing = db.prepare(`
    SELECT l.*, a.name as asset_name, a.type as asset_type, a.description as asset_description,
           a.estimated_cost, a.potential_value, a.state,
           c.name as category_name, c.slug as category_slug,
           u.name as seller_name
    FROM listings l
    JOIN assets a ON l.asset_id = a.id
    LEFT JOIN categories c ON a.category_id = c.id
    JOIN users u ON l.user_id = u.id
    WHERE l.id = ?
  `).get(id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  res.json(listing);
});

router.post('/', authenticateToken, (req, res) => {
  const { asset_id, title, description, listing_type, buy_now_price, starting_bid, auction_end_date, contact_email } = req.body;

  if (!asset_id || !title || !listing_type) {
    return res.status(400).json({ error: 'asset_id, title, and listing_type are required' });
  }

  if (!isPositiveInteger(asset_id)) {
    return res.status(400).json({ error: 'asset_id must be a positive integer' });
  }

  if (!VALID_LISTING_TYPES.includes(listing_type)) {
    return res.status(400).json({ error: 'listing_type must be buy_now, auction, or both' });
  }

  if ((listing_type === 'buy_now' || listing_type === 'both') && !buy_now_price) {
    return res.status(400).json({ error: 'buy_now_price required for buy_now or both listing types' });
  }

  if ((listing_type === 'auction' || listing_type === 'both') && !starting_bid) {
    return res.status(400).json({ error: 'starting_bid required for auction or both listing types' });
  }

  const asset = db.prepare('SELECT id FROM assets WHERE id = ?').get(asset_id);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO listings (user_id, asset_id, title, description, listing_type, buy_now_price, starting_bid, auction_end_date, contact_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      asset_id,
      title,
      description || null,
      listing_type,
      buy_now_price || null,
      starting_bid || null,
      auction_end_date || null,
      contact_email || req.user.email
    );

    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

router.put('/:id(\\d+)', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, buy_now_price, starting_bid, auction_end_date, status, contact_email } = req.body;

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  if (listing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to update this listing' });
  }

  const updates = [];
  const params = [];

  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (buy_now_price !== undefined) { updates.push('buy_now_price = ?'); params.push(buy_now_price); }
  if (starting_bid !== undefined) { updates.push('starting_bid = ?'); params.push(starting_bid); }
  if (auction_end_date !== undefined) { updates.push('auction_end_date = ?'); params.push(auction_end_date); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (contact_email !== undefined) { updates.push('contact_email = ?'); params.push(contact_email); }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(id);

  try {
    db.prepare(`UPDATE listings SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const updated = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

router.delete('/:id(\\d+)', authenticateToken, (req, res) => {
  const { id } = req.params;

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  if (listing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized to delete this listing' });
  }

  try {
    db.prepare('DELETE FROM bids WHERE listing_id = ?').run(id);
    db.prepare('DELETE FROM listings WHERE id = ?').run(id);
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

module.exports = router;
