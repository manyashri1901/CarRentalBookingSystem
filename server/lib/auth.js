// JWT issuing/verification and password rules.
// The secret is read from the environment on every call so tests can swap it.
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const TOKEN_TTL = '2h'; // short-lived: there is no refresh token, so the user logs in again
const MIN_SECRET_LENGTH = 32;

// Values that look like a secret but are not one. Checked lower-case, as substrings.
// Deliberately distinctive: the suggested `randomBytes().toString('hex')` output cannot
// contain any of them, while short generic words like "test" could appear in a genuinely
// random base64 secret and are left out to avoid false alarms.
const WEAK_SECRETS = [
  'secret', 'changeme', 'change_me', 'changeit', 'password', 'replace', 'your_',
  'example', 'placeholder', '123456', 'keyboard cat', 'xxxx',
];

/** Why this secret is unusable, or null if it is fine. */
function secretProblem(secret) {
  if (!secret || !secret.trim()) return 'JWT_SECRET is not set';
  const s = secret.trim();
  if (s.length < MIN_SECRET_LENGTH) return `JWT_SECRET is too short (needs at least ${MIN_SECRET_LENGTH} characters)`;
  const lower = s.toLowerCase();
  const hit = WEAK_SECRETS.find((w) => lower.includes(w));
  if (hit) return `JWT_SECRET looks like a placeholder (contains "${hit}")`;
  if (new Set(s).size < 8) return 'JWT_SECRET is not random enough (too few distinct characters)';
  return null;
}

// In development a missing secret becomes a random one for this process only:
// the app still runs, but every restart invalidates existing tokens.
let ephemeralSecret = null;

function getSecret() {
  const fromEnv = process.env.JWT_SECRET;
  if (!secretProblem(fromEnv)) return fromEnv.trim();
  if (process.env.NODE_ENV === 'production') {
    // Should be unreachable: assertUsableSecret() stops the server at boot
    throw new Error('JWT_SECRET is missing or weak');
  }
  if (!ephemeralSecret) ephemeralSecret = crypto.randomBytes(48).toString('hex');
  return ephemeralSecret;
}

/** Called at startup. Refuses to run in production without a strong secret. */
function assertUsableSecret() {
  const problem = secretProblem(process.env.JWT_SECRET);
  if (!problem) return;
  const generate = "Generate one with:  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"";
  if (process.env.NODE_ENV === 'production') {
    console.error(`FATAL: ${problem}. Refusing to start in production.\n${generate}`);
    process.exit(1);
  }
  console.warn(`WARNING: ${problem}. Using a random secret for this process only - logins will not survive a restart.\n${generate}`);
}

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role, email: user.email }, getSecret(), {
    expiresIn: TOKEN_TTL,
    issuer: 'ecar-ride',
  });

/** Returns the payload, or null if the token is missing, tampered with or expired. */
function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret(), { issuer: 'ecar-ride', algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

// bcrypt only uses the first 72 bytes, so longer passwords are rejected rather than silently truncated.
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72;

function passwordProblem(password) {
  if (typeof password !== 'string' || !password) return 'Password is required';
  if (password.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters`;
  if (Buffer.byteLength(password) > MAX_PASSWORD) return `Password must be at most ${MAX_PASSWORD} bytes`;
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmail = (v) => typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);

module.exports = { signToken, verifyToken, assertUsableSecret, secretProblem, passwordProblem, isEmail, TOKEN_TTL, MIN_PASSWORD };
