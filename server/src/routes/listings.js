const express = require('express');
const db = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, ValidationError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');

const router = express.Router();

const VALID_LISTING_TYPES = ['buy_now', 'auction', 'both'];
const VALID_STATUSES = ['active', 'sold', 'expired', 'cancelled'];

function formatListing(listing) {
  return {
    ...listing,
    buy_now_price: listing.buy_now_price_cents ? validate.moneyFromCents(listing.buy_now_price_cents) : null,
    starting_bid: listing.starting_bid_cents ? validate.moneyFromCents(listing.starting_bid_cents) : null,
    current_bid: listing.current_bid_cents ? validate.moneyFromCents(listing.current_bid_cents) : null,
    estimated_cost: listing.estimated_cost_cents ? validate.moneyFromCents(listing.estimated_cost_cents) : null,
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const status = req.query.status || 'active';
  const { category, type, minPrice, maxPrice } = req.query;

  if (status && !VALID_STATUSES.includes(status)) {
    throw new ValidationError('Invalid status value', 'status');
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
    validate.enum(type, 'type', ['domain', 'business_name']);
    query += ' AND a.type = ?';
    params.push(type);
  }

  if (minPrice) {
    const minCents = validate.money(minPrice, 'minPrice');
    query += ' AND (l.buy_now_price_cents >= ? OR l.current_bid_cents >= ? OR l.starting_bid_cents >= ?)';
    params.push(minCents, minCents, minCents);
  }

  if (maxPrice) {
    const maxCents = validate.money(maxPrice, 'maxPrice');
    query += ' AND (l.buy_now_price_cents <= ? OR l.current_bid_cents <= ? OR l.starting_bid_cents <= ?)';
    params.push(maxCents, maxCents, maxCents);
  }

  query += ' ORDER BY l.created_at DESC';

  const listings = db.prepare(query).all(...params);
  res.json(listings.map(formatListing));
}));

router.get('/:id(\\d+)', asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);

  const listing = db.prepare(`
    SELECT l.*, a.name as asset_name, a.type as asset_type, a.description as asset_description,
           a.estimated_cost_cents, a.potential_value, a.state,
           c.name as category_name, c.slug as category_slug,
           u.name as seller_name
    FROM listings l
    JOIN assets a ON l.asset_id = a.id
    LEFT JOIN categories c ON a.category_id = c.id
    JOIN users u ON l.user_id = u.id
    WHERE l.id = ?
  `).get(id);

  if (!listing) {
    throw new NotFoundError('Listing');
  }

  res.json(formatListing(listing));
}));

const createListingWithAsset = db.transaction((userId, userEmail, data) => {
  const assetResult = db.prepare(`
    INSERT INTO assets (name, type, category_id, description)
    VALUES (?, ?, ?, ?)
  `).run(
    data.assetName,
    data.assetType,
    data.categoryId || null,
    data.assetDescription || null
  );

  const result = db.prepare(`
    INSERT INTO listings (user_id, asset_id, title, description, listing_type, buy_now_price_cents, starting_bid_cents, auction_end_date, contact_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    assetResult.lastInsertRowid,
    data.title,
    data.description || null,
    data.listingType,
    data.buyNowPriceCents,
    data.startingBidCents,
    data.auctionEndDate,
    data.contactEmail || userEmail
  );

  return db.prepare(`
    SELECT l.*, a.name as asset_name, a.type as asset_type, a.description as asset_description
    FROM listings l
    JOIN assets a ON l.asset_id = a.id
    WHERE l.id = ?
  `).get(result.lastInsertRowid);
});

router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  validate.required(req.body.title, 'title');
  validate.required(req.body.listing_type, 'listing_type');
  validate.required(req.body.asset_name, 'asset_name');
  validate.required(req.body.asset_type, 'asset_type');

  const title = validate.string(req.body.title, 'title', { minLength: 1, maxLength: 200 });
  const listingType = validate.enum(req.body.listing_type, 'listing_type', VALID_LISTING_TYPES);
  const description = validate.optional(req.body.description, validate.string, 'description', { maxLength: 5000 });
  const contactEmail = validate.optional(req.body.contact_email, validate.email, 'contact_email');

  const assetName = validate.string(req.body.asset_name, 'asset_name', { minLength: 1, maxLength: 200 });
  const assetType = validate.enum(req.body.asset_type, 'asset_type', ['domain', 'business_name']);
  const assetDescription = validate.optional(req.body.asset_description, validate.string, 'asset_description', { maxLength: 5000 });

  let buyNowPriceCents = null;
  let startingBidCents = null;
  let auctionEndDate = null;

  if (listingType === 'buy_now' || listingType === 'both') {
    validate.required(req.body.buy_now_price, 'buy_now_price');
    buyNowPriceCents = validate.money(req.body.buy_now_price, 'buy_now_price');
    if (buyNowPriceCents <= 0) {
      throw new ValidationError('buy_now_price must be positive', 'buy_now_price');
    }
  }

  if (listingType === 'auction' || listingType === 'both') {
    validate.required(req.body.starting_bid, 'starting_bid');
    startingBidCents = validate.money(req.body.starting_bid, 'starting_bid');
    if (startingBidCents <= 0) {
      throw new ValidationError('starting_bid must be positive', 'starting_bid');
    }
    if (req.body.auction_end_date) {
      auctionEndDate = validate.futureDate(req.body.auction_end_date, 'auction_end_date');
    }
  }

  const listing = createListingWithAsset(req.user.id, req.user.email, {
    assetName,
    assetType,
    assetDescription,
    categoryId: req.body.category_id ? validate.id(req.body.category_id, 'category_id') : null,
    title,
    description,
    listingType,
    buyNowPriceCents,
    startingBidCents,
    auctionEndDate,
    contactEmail,
  });

  res.status(201).json(formatListing(listing));
}));

router.put('/:id(\\d+)', authenticateToken, asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
  if (!listing) {
    throw new NotFoundError('Listing');
  }

  if (listing.user_id !== req.user.id) {
    throw new ForbiddenError('Not authorized to update this listing');
  }

  const updates = [];
  const params = [];

  if (req.body.title !== undefined) {
    const title = validate.string(req.body.title, 'title', { minLength: 1, maxLength: 200 });
    updates.push('title = ?');
    params.push(title);
  }

  if (req.body.description !== undefined) {
    const description = validate.string(req.body.description, 'description', { maxLength: 5000 });
    updates.push('description = ?');
    params.push(description);
  }

  if (req.body.buy_now_price !== undefined) {
    const cents = validate.money(req.body.buy_now_price, 'buy_now_price');
    updates.push('buy_now_price_cents = ?');
    params.push(cents);
  }

  if (req.body.starting_bid !== undefined) {
    const cents = validate.money(req.body.starting_bid, 'starting_bid');
    updates.push('starting_bid_cents = ?');
    params.push(cents);
  }

  if (req.body.auction_end_date !== undefined) {
    const date = req.body.auction_end_date ? validate.futureDate(req.body.auction_end_date, 'auction_end_date') : null;
    updates.push('auction_end_date = ?');
    params.push(date);
  }

  if (req.body.status !== undefined) {
    const status = validate.enum(req.body.status, 'status', VALID_STATUSES);
    updates.push('status = ?');
    params.push(status);
  }

  if (req.body.contact_email !== undefined) {
    const email = validate.email(req.body.contact_email, 'contact_email');
    updates.push('contact_email = ?');
    params.push(email);
  }

  if (updates.length === 0) {
    throw new ValidationError('No fields to update');
  }

  params.push(id);
  db.prepare(`UPDATE listings SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
  res.json(formatListing(updated));
}));

router.delete('/:id(\\d+)', authenticateToken, asyncHandler(async (req, res) => {
  const id = validate.id(req.params.id);

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(id);
  if (!listing) {
    throw new NotFoundError('Listing');
  }

  if (listing.user_id !== req.user.id) {
    throw new ForbiddenError('Not authorized to delete this listing');
  }

  db.prepare('DELETE FROM bids WHERE listing_id = ?').run(id);
  db.prepare('DELETE FROM listings WHERE id = ?').run(id);

  res.json({ message: 'Listing deleted successfully' });
}));

module.exports = router;
