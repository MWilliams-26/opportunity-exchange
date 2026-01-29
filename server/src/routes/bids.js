const express = require('express');
const db = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');

const router = express.Router();

const placeBid = db.transaction((listingId, userId, amountCents) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId);
  
  if (!listing) {
    throw new NotFoundError('Listing');
  }

  if (listing.status !== 'active') {
    throw new ValidationError('Listing is not active');
  }

  if (listing.listing_type === 'buy_now') {
    throw new ValidationError('This listing does not accept bids');
  }

  if (listing.user_id === userId) {
    throw new ValidationError('Cannot bid on your own listing');
  }

  if (listing.auction_end_date && new Date(listing.auction_end_date) < new Date()) {
    throw new ValidationError('Auction has ended');
  }

  const currentBidCents = listing.current_bid_cents || 0;
  const startingBidCents = listing.starting_bid_cents || 0;
  const minBidCents = Math.max(currentBidCents, startingBidCents);

  if (amountCents <= minBidCents) {
    const minBidDisplay = validate.moneyFromCents(minBidCents);
    throw new ValidationError(`Bid must be higher than current bid of $${minBidDisplay.toFixed(2)}`);
  }

  db.prepare('INSERT INTO bids (listing_id, user_id, amount_cents) VALUES (?, ?, ?)').run(listingId, userId, amountCents);
  db.prepare('UPDATE listings SET current_bid_cents = ?, highest_bidder_id = ? WHERE id = ?').run(amountCents, userId, listingId);

  return db.prepare('SELECT * FROM bids WHERE listing_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1').get(listingId, userId);
});

router.post('/:listingId/bids', authenticateToken, asyncHandler(async (req, res) => {
  const listingId = validate.id(req.params.listingId, 'listingId');
  validate.required(req.body.amount, 'amount');
  const amountCents = validate.money(req.body.amount, 'amount');

  if (amountCents <= 0) {
    throw new ValidationError('Bid amount must be positive', 'amount');
  }

  const bid = placeBid(listingId, req.user.id, amountCents);
  
  res.status(201).json({
    ...bid,
    amount: validate.moneyFromCents(bid.amount_cents),
  });
}));

router.get('/:listingId/bids', asyncHandler(async (req, res) => {
  const listingId = validate.id(req.params.listingId, 'listingId');

  const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(listingId);
  if (!listing) {
    throw new NotFoundError('Listing');
  }

  const bids = db.prepare(`
    SELECT b.*, u.name as bidder_name
    FROM bids b
    JOIN users u ON b.user_id = u.id
    WHERE b.listing_id = ?
    ORDER BY b.amount_cents DESC, b.created_at DESC
  `).all(listingId);

  res.json(bids.map(bid => ({
    ...bid,
    amount: validate.moneyFromCents(bid.amount_cents),
  })));
}));

module.exports = router;
