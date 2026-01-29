const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/schema');
const { authenticateToken, generateToken } = require('../middleware/auth');
const { asyncHandler, ValidationError, NotFoundError, ConflictError } = require('../middleware/errorHandler');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
  validate.required(req.body.email, 'email');
  validate.required(req.body.password, 'password');
  validate.required(req.body.name, 'name');

  const email = validate.email(req.body.email);
  const password = validate.password(req.body.password);
  const name = validate.string(req.body.name, 'name', { minLength: 1, maxLength: 100 });

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = bcrypt.hashSync(password, 12);

  const result = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)').run(email, passwordHash, name);
  const user = { id: result.lastInsertRowid, email, name };
  const token = generateToken(user);

  res.status(201).json({ user, token });
}));

router.post('/login', asyncHandler(async (req, res) => {
  validate.required(req.body.email, 'email');
  validate.required(req.body.password, 'password');

  const email = validate.email(req.body.email);
  const password = validate.string(req.body.password, 'password', { minLength: 1, maxLength: 128 });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    throw new ValidationError('Invalid email or password');
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    throw new ValidationError('Invalid email or password');
  }

  const token = generateToken({ id: user.id, email: user.email, name: user.name });

  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  });
}));

router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    throw new NotFoundError('User');
  }
  res.json(user);
}));

module.exports = router;
