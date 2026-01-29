const express = require('express');
const db = require('../db/schema');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler, ValidationError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');

const stripe = require('stripe')(config.stripe.secretKey);

const router = express.Router();

router.post('/create-checkout-session', authenticateToken, asyncHandler(async (req, res) => {
  validate.required(req.body.brandable_name_id, 'brandable_name_id');
  const brandableNameId = validate.id(req.body.brandable_name_id, 'brandable_name_id');

  const brandableName = db.prepare(`
    SELECT bn.*, u.email as seller_email
    FROM brandable_names bn
    JOIN users u ON bn.creator_id = u.id
    WHERE bn.id = ?
  `).get(brandableNameId);

  if (!brandableName) {
    throw new NotFoundError('Brandable name');
  }

  if (brandableName.status !== 'available') {
    throw new ValidationError('This brandable name is not available for purchase', 'brandable_name_id');
  }

  if (brandableName.creator_id === req.user.id) {
    throw new ForbiddenError('You cannot purchase your own brandable name');
  }

  if (!brandableName.suggested_price_cents || brandableName.suggested_price_cents <= 0) {
    throw new ValidationError('This brandable name does not have a valid price', 'brandable_name_id');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: brandableName.name,
            description: brandableName.description || `Brandable name: ${brandableName.name}`,
          },
          unit_amount: brandableName.suggested_price_cents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: config.stripe.successUrl,
    cancel_url: config.stripe.cancelUrl,
    metadata: {
      brandable_name_id: String(brandableNameId),
      buyer_id: String(req.user.id),
      seller_id: String(brandableName.creator_id),
    },
  });

  res.json({ sessionId: session.id, url: session.url });
}));

router.post('/webhook', asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { brandable_name_id, buyer_id, seller_id } = session.metadata;

    if (!brandable_name_id || !buyer_id || !seller_id) {
      return res.status(400).json({ error: 'Missing metadata in checkout session' });
    }

    const brandableName = db.prepare('SELECT * FROM brandable_names WHERE id = ?').get(Number(brandable_name_id));

    if (!brandableName) {
      return res.status(400).json({ error: 'Brandable name not found' });
    }

    if (brandableName.status !== 'available') {
      return res.status(400).json({ error: 'Brandable name is no longer available' });
    }

    const salePriceCents = session.amount_total;
    const platformFeeCents = Math.round(salePriceCents * 0.30);
    const sellerPayoutCents = salePriceCents - platformFeeCents;

    const updateBrandableName = db.prepare('UPDATE brandable_names SET status = ? WHERE id = ?');
    const insertTransaction = db.prepare(`
      INSERT INTO transactions (brandable_name_id, seller_id, buyer_id, sale_price_cents, platform_fee_cents, seller_payout_cents, status)
      VALUES (?, ?, ?, ?, ?, ?, 'completed')
    `);

    db.transaction(() => {
      updateBrandableName.run('sold', Number(brandable_name_id));
      insertTransaction.run(
        Number(brandable_name_id),
        Number(seller_id),
        Number(buyer_id),
        salePriceCents,
        platformFeeCents,
        sellerPayoutCents
      );
    })();
  }

  res.json({ received: true });
}));

router.get('/transactions', authenticateToken, asyncHandler(async (req, res) => {
  const transactions = db.prepare(`
    SELECT t.*, 
           bn.name as brandable_name,
           seller.name as seller_name,
           buyer.name as buyer_name
    FROM transactions t
    LEFT JOIN brandable_names bn ON t.brandable_name_id = bn.id
    JOIN users seller ON t.seller_id = seller.id
    JOIN users buyer ON t.buyer_id = buyer.id
    WHERE t.seller_id = ? OR t.buyer_id = ?
    ORDER BY t.created_at DESC
  `).all(req.user.id, req.user.id);

  const formattedTransactions = transactions.map(t => ({
    ...t,
    sale_price: validate.moneyFromCents(t.sale_price_cents),
    platform_fee: validate.moneyFromCents(t.platform_fee_cents),
    seller_payout: validate.moneyFromCents(t.seller_payout_cents),
    is_seller: t.seller_id === req.user.id,
    is_buyer: t.buyer_id === req.user.id,
  }));

  const totalEarnings = transactions
    .filter(t => t.seller_id === req.user.id && t.status === 'completed')
    .reduce((sum, t) => sum + t.seller_payout_cents, 0);

  const totalSpent = transactions
    .filter(t => t.buyer_id === req.user.id && t.status === 'completed')
    .reduce((sum, t) => sum + t.sale_price_cents, 0);

  res.json({
    transactions: formattedTransactions,
    summary: {
      total_earnings: validate.moneyFromCents(totalEarnings),
      total_spent: validate.moneyFromCents(totalSpent),
    },
  });
}));

module.exports = router;
