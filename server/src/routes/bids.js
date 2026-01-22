const express = require('express');
const db = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/:listingId/bids', authenticateToken, (req, res) => {
  const { listingId } = req.params;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid bid amount is required' });
  }

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  if (listing.status !== 'active') {
    return res.status(400).json({ error: 'Listing is not active' });
  }

  if (listing.listing_type === 'buy_now') {
    return res.status(400).json({ error: 'This listing does not accept bids' });
  }

  if (listing.user_id === req.user.id) {
    return res.status(400).json({ error: 'Cannot bid on your own listing' });
  }

  const minBid = listing.current_bid || listing.starting_bid;
  if (amount <= minBid) {
    return res.status(400).json({ error: `Bid must be higher than current bid of $${minBid}` });
  }

  if (listing.auction_end_date && new Date(listing.auction_end_date) < new Date()) {
    return res.status(400).json({ error: 'Auction has ended' });
  }

  try {
    db.prepare('INSERT INTO bids (listing_id, user_id, amount) VALUES (?, ?, ?)').run(listingId, req.user.id, amount);
    db.prepare('UPDATE listings SET current_bid = ?, highest_bidder_id = ? WHERE id = ?').run(amount, req.user.id, listingId);

    const bid = db.prepare('SELECT * FROM bids WHERE listing_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1').get(listingId, req.user.id);
    res.status(201).json(bid);
  } catch (err) {
    res.status(500).json({ error: 'Failed to place bid' });
  }
});

router.get('/:listingId/bids', (req, res) => {
  const { listingId } = req.params;

  const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(listingId);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  try {
    const bids = db.prepare(`
      SELECT b.*, u.name as bidder_name
      FROM bids b
      JOIN users u ON b.user_id = u.id
      WHERE b.listing_id = ?
      ORDER BY b.amount DESC, b.created_at DESC
    `).all(listingId);
    res.json(bids);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

module.exports = router;
