// Payment flow tests. They start the real Express app (no database: in-memory bookings)
// and a local FAKE Razorpay API, using dummy keys. No real Razorpay account is contacted.
// Run: npm test
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');

const KEY_ID = 'rzp_test_FAKEKEYID123';
const KEY_SECRET = 'fake_secret_for_tests_only';

const sign = (orderId, paymentId, secret = KEY_SECRET) =>
  crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

let appServer;
let base;
let fakeServer;
const fake = { mode: 'ok', requests: [], counter: 0 };

before(async () => {
  // Fake Razorpay: POST /orders
  fakeServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const parsed = body ? JSON.parse(body) : {};
      fake.requests.push({ url: req.url, auth: req.headers.authorization, body: parsed });
      if (fake.mode === 'fail') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: { description: 'internal secret provider detail' } }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: `order_TEST${++fake.counter}`, amount: parsed.amount, currency: parsed.currency }));
    });
  });
  await new Promise((r) => fakeServer.listen(0, r));
  process.env.RAZORPAY_API_BASE = `http://127.0.0.1:${fakeServer.address().port}`;

  const app = require('../app');
  appServer = http.createServer(app);
  await new Promise((r) => appServer.listen(0, r));
  base = `http://127.0.0.1:${appServer.address().port}`;
});

after(() => {
  appServer.close();
  fakeServer.close();
});

async function api(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text };
}

async function newBooking() {
  const start = new Date(Date.now() + 2 * 3600e3);
  const end = new Date(start.getTime() + 24 * 3600e3);
  const r = await api('POST', '/api/bookings', {
    carId: 'tata-nexon-ev', name: 'Test User', email: 'test@example.com', pickupLocation: 'Indore',
    start: start.toISOString(), end: end.toISOString(), addOns: { insurance: true, homeCharger: false },
  });
  assert.equal(r.status, 201);
  return r.json.booking; // totalINR = 2500 + 299 = 2799
}

const useKeys = () => { process.env.RAZORPAY_KEY_ID = KEY_ID; process.env.RAZORPAY_KEY_SECRET = KEY_SECRET; };
const noKeys = () => { delete process.env.RAZORPAY_KEY_ID; delete process.env.RAZORPAY_KEY_SECRET; };

describe('demo mode (no Razorpay keys)', () => {
  beforeEach(noKeys);

  it('config says demo and exposes no key', async () => {
    const r = await api('GET', '/api/payments/config');
    assert.deepEqual(r.json, { mode: 'demo', keyId: null });
  });

  it('order endpoint returns a demo order and never calls the provider', async () => {
    const b = await newBooking();
    fake.requests.length = 0;
    const r = await api('POST', '/api/payments/order', { bookingId: b.id });
    assert.equal(r.status, 200);
    assert.equal(r.json.mode, 'demo');
    assert.equal(r.json.demo, true);
    assert.equal(r.json.amount, 279900);
    assert.equal(fake.requests.length, 0);
  });

  it('verify is refused in demo mode', async () => {
    const b = await newBooking();
    const r = await api('POST', '/api/payments/verify', {
      bookingId: b.id, razorpay_order_id: 'order_x', razorpay_payment_id: 'pay_x', razorpay_signature: 'sig',
    });
    assert.equal(r.status, 400);
  });

  it('demo payment marks the booking "paid (demo)" and says so', async () => {
    const b = await newBooking();
    const r = await api('POST', '/api/payments/demo', { bookingId: b.id });
    assert.equal(r.status, 200);
    assert.equal(r.json.demo, true);
    assert.match(r.json.notice, /no money/i);
    assert.equal(r.json.booking.status, 'paid');
    assert.equal(r.json.booking.payment.demo, true);
    assert.equal(r.json.booking.payment.method, 'demo');
    assert.match(r.json.booking.payment.razorpayPaymentId, /^demo_/);
  });

  it('repeating the demo payment changes nothing (idempotent)', async () => {
    const b = await newBooking();
    const first = await api('POST', '/api/payments/demo', { bookingId: b.id });
    const second = await api('POST', '/api/payments/demo', { bookingId: b.id });
    assert.equal(first.json.alreadyPaid, false);
    assert.equal(second.json.alreadyPaid, true);
    assert.equal(second.json.booking.payment.razorpayPaymentId, first.json.booking.payment.razorpayPaymentId);
    assert.equal(second.json.booking.payment.paidAt, first.json.booking.payment.paidAt);
  });

  it('unknown booking is a 404', async () => {
    const r = await api('POST', '/api/payments/demo', { bookingId: 'does-not-exist' });
    assert.equal(r.status, 404);
  });
});

describe('Razorpay test mode (keys set, fake provider)', () => {
  beforeEach(() => { useKeys(); fake.mode = 'ok'; fake.requests.length = 0; });

  async function orderFor(b) {
    const r = await api('POST', '/api/payments/order', { bookingId: b.id });
    assert.equal(r.status, 200);
    return r.json;
  }
  const verifyBody = (b, orderId, paymentId, signature) => ({
    bookingId: b.id, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature,
  });

  it('config exposes the key id but never the secret', async () => {
    const r = await api('GET', '/api/payments/config');
    assert.deepEqual(r.json, { mode: 'razorpay', keyId: KEY_ID });
    assert.ok(!r.text.includes(KEY_SECRET));
  });

  it('amount comes from the saved booking; a client-sent amount is ignored', async () => {
    const b = await newBooking();
    const r = await api('POST', '/api/payments/order', { bookingId: b.id, amount: 1, totalINR: 1 });
    assert.equal(r.status, 200);
    assert.equal(r.json.amount, 279900); // 2799 INR in paise, not 1
    assert.equal(fake.requests.length, 1);
    assert.equal(fake.requests[0].body.amount, 279900);
    assert.equal(fake.requests[0].body.currency, 'INR');
    assert.equal(fake.requests[0].auth, 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64'));
    assert.ok(!r.text.includes(KEY_SECRET));
  });

  it('SUCCESS: a valid signature marks the booking paid', async () => {
    const b = await newBooking();
    const o = await orderFor(b);
    const r = await api('POST', '/api/payments/verify', verifyBody(b, o.orderId, 'pay_OK1', sign(o.orderId, 'pay_OK1')));
    assert.equal(r.status, 200);
    assert.equal(r.json.alreadyPaid, false);
    assert.equal(r.json.booking.status, 'paid');
    assert.equal(r.json.booking.payment.method, 'razorpay');
    assert.equal(r.json.booking.payment.demo, false);
    assert.equal(r.json.booking.payment.razorpayPaymentId, 'pay_OK1');
    const got = await api('GET', `/api/bookings/${b.id}`);
    assert.equal(got.json.status, 'paid');
  });

  it('IDEMPOTENT: repeating verify does not change the booking', async () => {
    const b = await newBooking();
    const o = await orderFor(b);
    const body = verifyBody(b, o.orderId, 'pay_REP', sign(o.orderId, 'pay_REP'));
    const first = await api('POST', '/api/payments/verify', body);
    const second = await api('POST', '/api/payments/verify', body);
    assert.equal(second.status, 200);
    assert.equal(first.json.alreadyPaid, false);
    assert.equal(second.json.alreadyPaid, true);
    assert.equal(second.json.booking.payment.paidAt, first.json.booking.payment.paidAt);
  });

  it('IDEMPOTENT: 5 concurrent verify calls mark the booking paid exactly once', async () => {
    const b = await newBooking();
    const o = await orderFor(b);
    const body = verifyBody(b, o.orderId, 'pay_RACE', sign(o.orderId, 'pay_RACE'));
    const rs = await Promise.all(Array.from({ length: 5 }, () => api('POST', '/api/payments/verify', body)));
    assert.ok(rs.every((r) => r.status === 200));
    assert.equal(rs.filter((r) => r.json.alreadyPaid === false).length, 1);
    assert.equal(new Set(rs.map((r) => r.json.booking.payment.paidAt)).size, 1);
  });

  it('TAMPERED signature is rejected and the booking stays pending', async () => {
    const b = await newBooking();
    const o = await orderFor(b);
    const good = sign(o.orderId, 'pay_T1');
    const tampered = good.slice(0, -1) + (good.endsWith('0') ? '1' : '0');
    const r = await api('POST', '/api/payments/verify', verifyBody(b, o.orderId, 'pay_T1', tampered));
    assert.equal(r.status, 400);
    assert.match(r.json.message, /signature/i);
    const got = await api('GET', `/api/bookings/${b.id}`);
    assert.equal(got.json.status, 'pending');
  });

  it('signature made with the wrong secret is rejected', async () => {
    const b = await newBooking();
    const o = await orderFor(b);
    const r = await api('POST', '/api/payments/verify', verifyBody(b, o.orderId, 'pay_W', sign(o.orderId, 'pay_W', 'attacker_guess')));
    assert.equal(r.status, 400);
    assert.equal((await api('GET', `/api/bookings/${b.id}`)).json.status, 'pending');
  });

  it('a valid signature for a different payment id is rejected', async () => {
    const b = await newBooking();
    const o = await orderFor(b);
    const r = await api('POST', '/api/payments/verify', verifyBody(b, o.orderId, 'pay_B', sign(o.orderId, 'pay_A')));
    assert.equal(r.status, 400);
  });

  it('an empty or non-string signature is rejected', async () => {
    const b = await newBooking();
    const o = await orderFor(b);
    assert.equal((await api('POST', '/api/payments/verify', verifyBody(b, o.orderId, 'pay_E', ''))).status, 400);
    assert.equal((await api('POST', '/api/payments/verify', verifyBody(b, o.orderId, 'pay_E', 12345))).status, 400);
    assert.equal((await api('GET', `/api/bookings/${b.id}`)).json.status, 'pending');
  });

  it("another booking's order cannot be used to pay this booking", async () => {
    const a = await newBooking();
    const other = await newBooking();
    const oa = await orderFor(a);
    const r = await api('POST', '/api/payments/verify', verifyBody(other, oa.orderId, 'pay_X', sign(oa.orderId, 'pay_X')));
    assert.equal(r.status, 400);
    assert.equal((await api('GET', `/api/bookings/${other.id}`)).json.status, 'pending');
  });

  it('a paid booking cannot be paid again with a different payment (409) or re-ordered (409)', async () => {
    const b = await newBooking();
    const o = await orderFor(b);
    await api('POST', '/api/payments/verify', verifyBody(b, o.orderId, 'pay_FIRST', sign(o.orderId, 'pay_FIRST')));
    const second = await api('POST', '/api/payments/verify', verifyBody(b, o.orderId, 'pay_SECOND', sign(o.orderId, 'pay_SECOND')));
    assert.equal(second.status, 409);
    const reorder = await api('POST', '/api/payments/order', { bookingId: b.id });
    assert.equal(reorder.status, 409);
    assert.equal((await api('GET', `/api/bookings/${b.id}`)).json.payment.razorpayPaymentId, 'pay_FIRST');
  });

  it('FAILURE: provider error gives a 502, no provider detail leaks, booking stays pending, retry works', async () => {
    const b = await newBooking();
    fake.mode = 'fail';
    const bad = await api('POST', '/api/payments/order', { bookingId: b.id });
    assert.equal(bad.status, 502);
    assert.ok(!bad.text.includes('secret provider detail'));
    assert.equal((await api('GET', `/api/bookings/${b.id}`)).json.status, 'pending');

    fake.mode = 'ok';
    const retry = await api('POST', '/api/payments/order', { bookingId: b.id });
    assert.equal(retry.status, 200);
    const v = await api('POST', '/api/payments/verify', verifyBody(b, retry.json.orderId, 'pay_RETRY', sign(retry.json.orderId, 'pay_RETRY')));
    assert.equal(v.json.booking.status, 'paid');
  });

  it('RETRY: payment on an earlier attempt (order 1) still verifies after a second order was created', async () => {
    const b = await newBooking();
    const o1 = await orderFor(b);
    const o2 = await orderFor(b);
    assert.notEqual(o1.orderId, o2.orderId);
    const r = await api('POST', '/api/payments/verify', verifyBody(b, o1.orderId, 'pay_O1', sign(o1.orderId, 'pay_O1')));
    assert.equal(r.status, 200);
    assert.equal(r.json.booking.status, 'paid');
  });

  it('demo endpoint is disabled when keys are configured (403)', async () => {
    const b = await newBooking();
    const r = await api('POST', '/api/payments/demo', { bookingId: b.id });
    assert.equal(r.status, 403);
    assert.equal((await api('GET', `/api/bookings/${b.id}`)).json.status, 'pending');
  });

  it('missing fields are a 400', async () => {
    assert.equal((await api('POST', '/api/payments/order', {})).status, 400);
    assert.equal((await api('POST', '/api/payments/verify', { bookingId: 'x' })).status, 400);
  });
});
