const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../lib/store');
const { signToken, passwordProblem, isEmail, TOKEN_TTL } = require('../lib/auth');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter, signupLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Wrong email and wrong password must be indistinguishable, so an attacker cannot
// use the API to discover which addresses have accounts.
const INVALID_CREDENTIALS = 'Invalid email or password';
// Comparing against this when no user exists keeps the response time similar either way
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.e2tYXMAXqe7V1t6D2LRkkF/9S6EwJqa';

const nameProblem = (name) => {
  if (typeof name !== 'string' || !name.trim()) return 'Name is required';
  if (name.trim().length > 80) return 'Name must be at most 80 characters';
  return null;
};

// POST /api/auth/signup - always creates a "user"; the role in the request body is ignored.
router.post('/signup', signupLimiter, async (req, res) => {
  const { name, email, password } = req.body || {};

  const problem = nameProblem(name) || (!isEmail(email) ? 'Enter a valid email address' : null) || passwordProblem(password);
  if (problem) return res.status(400).json({ message: problem });

  try {
    const user = await store.createUser({ name, email, password }); // role is never taken from input
    if (!user) return res.status(409).json({ message: 'An account with this email already exists' });
    res.status(201).json({ token: signToken(user), user, expiresIn: TOKEN_TTL });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof password !== 'string' || !isEmail(email)) {
    return res.status(401).json({ message: INVALID_CREDENTIALS });
  }

  try {
    const found = await store.getUserByEmailWithHash(email);
    // Always run a comparison, even with no account, so both paths cost the same
    const matches = await bcrypt.compare(password, found?.password || DUMMY_HASH);
    if (!found || !matches) return res.status(401).json({ message: INVALID_CREDENTIALS });

    const { password: _hash, ...user } = found;
    res.json({ token: signToken(user), user, expiresIn: TOKEN_TTL });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me - who the current token belongs to
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
