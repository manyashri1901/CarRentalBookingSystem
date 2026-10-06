const rateLimit = require('express-rate-limit');

// Rate limits are per IP. Tests set RATE_LIMIT_DISABLED=1 so they can run many requests;
// the limiter is still exercised by its own test with a low limit.
const disabled = () => process.env.RATE_LIMIT_DISABLED === '1';

const make = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    skip: disabled,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    // Count only failures, so a user signing in correctly is never locked out
    skipSuccessfulRequests: true,
  });

// Login: 10 failed attempts per 15 min per IP
const loginLimiter = make(15 * 60 * 1000, Number(process.env.RATE_LIMIT_LOGIN || 10),
  'Too many sign-in attempts. Please wait a few minutes and try again.');

// Signup: 5 accounts per hour per IP (counts successes too, so this one is set separately)
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_SIGNUP || 5),
  skip: disabled,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many accounts created from this network. Please try again later.' },
});

module.exports = { loginLimiter, signupLimiter };
