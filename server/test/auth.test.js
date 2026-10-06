// Auth, authorisation and booking-ownership tests. They run the real Express app with no
// database (users and bookings in memory) and a strong test JWT secret.
// Run: npm test
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');

// Hex, so it passes the weak-secret check the same way a real generated secret does
process.env.JWT_SECRET = '9f2b7c41a6e8d530b94c7af162e05d83c7b4916ae2f8d05c3b81e7a46f092dc15';
process.env.RATE_LIMIT_DISABLED = '1';
process.env.TRUST_PROXY = '0';
delete process.env.RAZORPAY_KEY_ID;
delete process.env.RAZORPAY_KEY_SECRET;

let server;
let base;

before(async () => {
  const app = require('../app');
  server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

async function api(method, path, { body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text };
}

let seq = 0;
async function signup(overrides = {}) {
  const body = { name: 'Test Person', email: `u${++seq}_${Date.now()}@example.com`, password: 'correct horse battery', ...overrides };
  const r = await api('POST', '/api/auth/signup', { body });
  return { ...r, credentials: body };
}

async function makeAdmin() {
  const store = require('../lib/store');
  const { signToken } = require('../lib/auth');
  const email = `admin${++seq}_${Date.now()}@example.com`;
  const user = await store.createUser({ name: 'Admin', email, password: 'admin password here', role: 'admin' });
  return { user, token: signToken(user) };
}

async function makeBooking(token, extra = {}) {
  const start = new Date(Date.now() + 2 * 3600e3);
  const end = new Date(start.getTime() + 24 * 3600e3);
  const r = await api('POST', '/api/bookings', {
    token,
    body: { carId: 'tata-nexon-ev', name: 'Test Person', email: 'test@example.com', pickupLocation: 'Indore',
      start: start.toISOString(), end: end.toISOString(), addOns: {}, ...extra },
  });
  assert.equal(r.status, 201);
  return r.json.booking;
}

describe('signup', () => {
  it('creates an account, returns a token, and never returns the password hash', async () => {
    const r = await signup();
    assert.equal(r.status, 201);
    assert.equal(r.json.user.role, 'user');
    assert.ok(r.json.token);
    assert.equal(r.json.user.password, undefined);
    assert.ok(!r.text.includes('$2a$') && !r.text.includes('$2b$'));
  });

  it('IGNORES a role in the request body (no self-promotion to admin)', async () => {
    const r = await signup({ role: 'admin' });
    assert.equal(r.status, 201);
    assert.equal(r.json.user.role, 'user');
    const me = await api('GET', '/api/auth/me', { token: r.json.token });
    assert.equal(me.json.user.role, 'user');
    // and the token itself carries "user"
    assert.equal(jwt.decode(r.json.token).role, 'user');
  });

  it('rejects a weak or oversized password and a bad email', async () => {
    assert.equal((await signup({ password: 'short1' })).status, 400);
    assert.equal((await signup({ password: 'x'.repeat(73) })).status, 400);
    assert.equal((await signup({ email: 'not-an-email' })).status, 400);
    assert.equal((await signup({ name: '   ' })).status, 400);
  });

  it('refuses a duplicate email with 409', async () => {
    const first = await signup();
    const again = await api('POST', '/api/auth/signup', { body: first.credentials });
    assert.equal(again.status, 409);
  });

  it('stores a bcrypt hash, not the password', async () => {
    const { credentials } = await signup();
    const store = require('../lib/store');
    const row = await store.getUserByEmailWithHash(credentials.email);
    assert.notEqual(row.password, credentials.password);
    assert.match(row.password, /^\$2[aby]\$12\$/);
  });
});

describe('login', () => {
  it('signs in with the right password', async () => {
    const { credentials } = await signup();
    const r = await api('POST', '/api/auth/login', { body: credentials });
    assert.equal(r.status, 200);
    assert.equal(r.json.user.email, credentials.email.toLowerCase());
    assert.ok(r.json.token);
  });

  it('gives the SAME generic error for an unknown email and a wrong password', async () => {
    const { credentials } = await signup();
    const wrongPassword = await api('POST', '/api/auth/login', { body: { email: credentials.email, password: 'wrong password!' } });
    const unknownEmail = await api('POST', '/api/auth/login', { body: { email: 'nobody@example.com', password: credentials.password } });
    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.deepEqual(wrongPassword.json, unknownEmail.json);
    assert.equal(wrongPassword.json.message, 'Invalid email or password');
  });

  it('is case-insensitive about the email', async () => {
    const { credentials } = await signup();
    const r = await api('POST', '/api/auth/login', { body: { ...credentials, email: credentials.email.toUpperCase() } });
    assert.equal(r.status, 200);
  });
});

describe('token handling', () => {
  it('401 with no token, a malformed header, a tampered token or a wrong-secret token', async () => {
    const { json } = await signup();
    const good = json.token;
    assert.equal((await api('GET', '/api/auth/me')).status, 401);
    assert.equal((await api('GET', '/api/auth/me', { token: 'not-a-token' })).status, 401);
    const [h, p, s] = good.split('.');
    assert.equal((await api('GET', '/api/auth/me', { token: `${h}.${p}.${s.slice(0, -2)}xx` })).status, 401);
    // payload edited to claim admin, then re-signed with a secret the attacker chose
    const forged = jwt.sign({ sub: json.user.id, role: 'admin' }, 'attacker-secret', { issuer: 'ecar-ride' });
    assert.equal((await api('GET', '/api/auth/me', { token: forged })).status, 401);
  });

  it('401 for an expired token', async () => {
    const { json } = await signup();
    const expired = jwt.sign({ sub: json.user.id, role: 'user' }, process.env.JWT_SECRET, { issuer: 'ecar-ride', expiresIn: '-1s' });
    const r = await api('GET', '/api/auth/me', { token: expired });
    assert.equal(r.status, 401);
  });

  it('401 for a validly signed token whose account does not exist', async () => {
    const { signToken } = require('../lib/auth');
    const ghost = signToken({ id: 'no-such-user-id', role: 'admin', email: 'ghost@example.com' });
    assert.equal((await api('GET', '/api/auth/me', { token: ghost })).status, 401);
    assert.equal((await api('GET', '/api/admin/stats', { token: ghost })).status, 401);
  });

  it('uses the stored role, not the role inside the token', async () => {
    const { json } = await signup();
    // Correctly signed by us, but claiming admin for an account that is only a user
    const claimsAdmin = jwt.sign({ sub: json.user.id, role: 'admin' }, process.env.JWT_SECRET, { issuer: 'ecar-ride', expiresIn: '1h' });
    const r = await api('GET', '/api/admin/stats', { token: claimsAdmin });
    assert.equal(r.status, 403);
  });
});

describe('admin routes', () => {
  const ADMIN_ROUTES = [
    ['GET', '/api/admin/stats'],
    ['GET', '/api/admin/bookings'],
    ['PATCH', '/api/admin/bookings/some-id', { status: 'cancelled' }],
    ['POST', '/api/admin/cars', { id: 'x-car' }],
    ['PATCH', '/api/admin/cars/tata-nexon-ev', { rangeKm: 400 }],
    ['DELETE', '/api/admin/cars/tata-nexon-ev'],
  ];

  it('401 on EVERY admin endpoint with no token', async () => {
    for (const [method, path, body] of ADMIN_ROUTES) {
      const r = await api(method, path, { body });
      assert.equal(r.status, 401, `${method} ${path} returned ${r.status}`);
    }
  });

  it('403 on EVERY admin endpoint for a normal signed-in user', async () => {
    const { json } = await signup();
    for (const [method, path, body] of ADMIN_ROUTES) {
      const r = await api(method, path, { token: json.token, body });
      assert.equal(r.status, 403, `${method} ${path} returned ${r.status}`);
      assert.equal(r.json.message, 'Admin access required');
    }
  });

  it('an admin sees stats, and demo payments are not counted as revenue', async () => {
    const { token } = await makeAdmin();
    const booking = await makeBooking(null);
    await api('POST', '/api/payments/demo', { body: { bookingId: booking.id } }); // demo mode: no keys set
    const r = await api('GET', '/api/admin/stats', { token });
    assert.equal(r.status, 200);
    assert.ok(r.json.cars > 0 && r.json.users > 0);
    assert.ok(r.json.demoBookings >= 1);
    assert.ok(r.json.demoRevenueINR >= booking.totalINR);
    assert.equal(r.json.revenueINR, 0); // no real payments happened
  });

  it('admin can create, edit and delete a car, and input is validated', async () => {
    const { token } = await makeAdmin();
    const car = {
      id: 'test-ev-one', brand: 'Testla', name: 'Model T', type: 'SUV', seats: 5, connector: 'CCS2',
      batteryKWh: 50, rangeKm: 400, chargeNormalHrs: 6, pricePerHour: 200, pricePerDay: 2000, fastCharging: true, chargeFastMins: 40,
    };
    assert.equal((await api('POST', '/api/admin/cars', { token, body: car })).status, 201);
    assert.equal((await api('POST', '/api/admin/cars', { token, body: car })).status, 409); // duplicate

    const bad = await api('POST', '/api/admin/cars', { token, body: { ...car, id: 'Bad Id!', seats: 99, type: 'Spaceship' } });
    assert.equal(bad.status, 400);
    assert.ok(bad.json.errors.length >= 3);

    // the new car is visible through the public API
    assert.equal((await api('GET', '/api/cars/test-ev-one')).status, 200);

    const patched = await api('PATCH', '/api/admin/cars/test-ev-one', { token, body: { rangeKm: 450, pricePerDay: 2200 } });
    assert.equal(patched.json.car.rangeKm, 450);
    assert.equal(patched.json.car.brand, 'Testla'); // untouched fields survive
    assert.equal((await api('PATCH', '/api/admin/cars/test-ev-one', { token, body: { rangeKm: -5 } })).status, 400);
    assert.equal((await api('PATCH', '/api/admin/cars/nope', { token, body: { rangeKm: 450 } })).status, 404);

    assert.equal((await api('DELETE', '/api/admin/cars/test-ev-one', { token })).status, 200);
    assert.equal((await api('GET', '/api/cars/test-ev-one')).status, 404);
    assert.equal((await api('DELETE', '/api/admin/cars/test-ev-one', { token })).status, 404);
  });

  it('refuses to delete a car that has active bookings', async () => {
    const { token } = await makeAdmin();
    const car = { id: 'test-ev-busy', brand: 'Testla', name: 'Busy', type: 'SUV', seats: 5, connector: 'CCS2',
      batteryKWh: 50, rangeKm: 400, chargeNormalHrs: 6, pricePerHour: 200, pricePerDay: 2000, fastCharging: false };
    await api('POST', '/api/admin/cars', { token, body: car });
    const booking = await makeBooking(null, { carId: 'test-ev-busy' });
    const blocked = await api('DELETE', '/api/admin/cars/test-ev-busy', { token });
    assert.equal(blocked.status, 409);
    await api('POST', `/api/bookings/${booking.id}/cancel`);
    assert.equal((await api('DELETE', '/api/admin/cars/test-ev-busy', { token })).status, 200);
  });

  it('admin can cancel a booking but cannot mark one paid by hand', async () => {
    const { token } = await makeAdmin();
    const booking = await makeBooking(null);
    assert.equal((await api('PATCH', `/api/admin/bookings/${booking.id}`, { token, body: { status: 'paid' } })).status, 400);
    const cancelled = await api('PATCH', `/api/admin/bookings/${booking.id}`, { token, body: { status: 'cancelled' } });
    assert.equal(cancelled.json.booking.status, 'cancelled');
    assert.equal((await api('PATCH', `/api/admin/bookings/${booking.id}`, { token, body: { status: 'nonsense' } })).status, 400);
    assert.equal((await api('PATCH', '/api/admin/bookings/missing', { token, body: { status: 'cancelled' } })).status, 404);
  });
});

describe('booking ownership', () => {
  it('a booking made while signed in belongs to that user and shows in /mine', async () => {
    const a = await signup();
    const booking = await makeBooking(a.json.token);
    assert.equal(booking.userId, a.json.user.id);
    const mine = await api('GET', '/api/bookings/mine', { token: a.json.token });
    assert.equal(mine.status, 200);
    assert.ok(mine.json.bookings.some((b) => b.id === booking.id));
  });

  it('/mine shows ONLY your own bookings and needs a token', async () => {
    const a = await signup();
    const b = await signup();
    const bookingA = await makeBooking(a.json.token);
    const bookingB = await makeBooking(b.json.token);
    const mineB = await api('GET', '/api/bookings/mine', { token: b.json.token });
    assert.ok(mineB.json.bookings.some((x) => x.id === bookingB.id));
    assert.ok(!mineB.json.bookings.some((x) => x.id === bookingA.id));
    assert.equal((await api('GET', '/api/bookings/mine')).status, 401);
  });

  it("another user CANNOT read or cancel someone else's booking", async () => {
    const owner = await signup();
    const stranger = await signup();
    const booking = await makeBooking(owner.json.token);

    assert.equal((await api('GET', `/api/bookings/${booking.id}`, { token: stranger.json.token })).status, 404);
    assert.equal((await api('GET', `/api/bookings/${booking.id}`)).status, 404); // signed out, even with the reference
    assert.equal((await api('POST', `/api/bookings/${booking.id}/cancel`, { token: stranger.json.token })).status, 404);
    assert.equal((await api('POST', `/api/bookings/${booking.id}/cancel`)).status, 404);

    // still untouched, and the owner can still see it
    const still = await api('GET', `/api/bookings/${booking.id}`, { token: owner.json.token });
    assert.equal(still.json.status, 'pending');
  });

  it('the owner can cancel an unpaid booking; a paid one needs support', async () => {
    const owner = await signup();
    const booking = await makeBooking(owner.json.token);
    const cancelled = await api('POST', `/api/bookings/${booking.id}/cancel`, { token: owner.json.token });
    assert.equal(cancelled.json.booking.status, 'cancelled');
    // repeating is harmless
    assert.equal((await api('POST', `/api/bookings/${booking.id}/cancel`, { token: owner.json.token })).status, 200);

    const paidBooking = await makeBooking(owner.json.token);
    await api('POST', '/api/payments/demo', { body: { bookingId: paidBooking.id } });
    const refused = await api('POST', `/api/bookings/${paidBooking.id}/cancel`, { token: owner.json.token });
    assert.equal(refused.status, 409);
    assert.match(refused.json.message, /support/i);
  });

  it('an admin can read any booking', async () => {
    const owner = await signup();
    const { token: adminToken } = await makeAdmin();
    const booking = await makeBooking(owner.json.token);
    assert.equal((await api('GET', `/api/bookings/${booking.id}`, { token: adminToken })).status, 200);
  });

  it('a guest booking stays reachable with its reference (no account to sign in to)', async () => {
    const booking = await makeBooking(null);
    assert.equal(booking.userId, null);
    assert.equal((await api('GET', `/api/bookings/${booking.id}`)).status, 200);
  });
});

describe('rate limiting', () => {
  it('blocks repeated failed logins once the limit is reached', async () => {
    process.env.RATE_LIMIT_DISABLED = '0';
    process.env.RATE_LIMIT_LOGIN = '3';
    // a separate app instance so the limiter picks up the low limit
    delete require.cache[require.resolve('../middleware/rateLimit')];
    delete require.cache[require.resolve('../routes/auth')];
    delete require.cache[require.resolve('../app')];
    const limitedApp = require('../app');
    const limitedServer = http.createServer(limitedApp);
    await new Promise((r) => limitedServer.listen(0, r));
    const limitedBase = `http://127.0.0.1:${limitedServer.address().port}`;
    const attempt = () =>
      fetch(`${limitedBase}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'victim@example.com', password: 'guessing' }),
      });
    try {
      const codes = [];
      for (let i = 0; i < 5; i++) codes.push((await attempt()).status);
      assert.deepEqual(codes.slice(0, 3), [401, 401, 401]);
      assert.equal(codes[3], 429);
      assert.equal(codes[4], 429);
    } finally {
      limitedServer.close();
      process.env.RATE_LIMIT_DISABLED = '1';
      delete process.env.RATE_LIMIT_LOGIN;
    }
  });
});
