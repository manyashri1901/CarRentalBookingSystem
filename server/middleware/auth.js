const { verifyToken } = require('../lib/auth');
const store = require('../lib/store');

// Reads "Authorization: Bearer <token>" and loads the user.
// Sets req.user when the token is valid AND the account still exists.
async function loadUser(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (!/^Bearer$/i.test(scheme || '') || !token) return null;
  const payload = verifyToken(token);
  if (!payload?.sub) return null;
  // Look the user up every time: a deleted or demoted account must lose access immediately,
  // rather than keeping whatever role was baked into the token.
  return store.getUserById(payload.sub);
}

/** Attaches req.user when a valid token is present; never rejects. */
async function optionalAuth(req, res, next) {
  try {
    req.user = await loadUser(req);
  } catch (err) {
    console.error(err);
    req.user = null;
  }
  next();
}

/** 401 unless a valid token for an existing account is present. */
async function requireAuth(req, res, next) {
  try {
    const user = await loadUser(req);
    if (!user) return res.status(401).json({ message: 'Sign in to continue' });
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

/** 401 when signed out, 403 when signed in without the admin role. Use after requireAuth. */
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Sign in to continue' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
}

module.exports = { optionalAuth, requireAuth, requireAdmin };
