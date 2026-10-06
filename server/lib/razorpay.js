// Minimal Razorpay helper: reads keys from the environment on every call,
// creates orders over HTTPS, and verifies checkout signatures.
// The key secret never leaves the server and is never logged or returned.
const crypto = require('crypto');

// RAZORPAY_API_BASE only exists so the automated tests can point at a local fake server.
const apiBase = () => (process.env.RAZORPAY_API_BASE || 'https://api.razorpay.com/v1').replace(/\/$/, '');

function getKeys() {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  return keyId && keySecret ? { keyId, keySecret } : null;
}

// 'razorpay' when both keys are set, otherwise 'demo'
const mode = () => (getKeys() ? 'razorpay' : 'demo');

async function createOrder({ amountPaise, receipt, notes }) {
  const keys = getKeys();
  if (!keys) throw new Error('Razorpay keys are not configured');
  const auth = Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString('base64');
  const res = await fetch(`${apiBase()}/orders`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    // Status only: the response body is not forwarded to the client
    throw new Error(`Razorpay order creation failed with HTTP ${res.status}`);
  }
  return res.json(); // { id, amount, currency, ... }
}

// Razorpay signature = HMAC_SHA256(key_secret, `${order_id}|${payment_id}`) as hex
function verifySignature({ orderId, paymentId, signature }) {
  const keys = getKeys();
  if (!keys || typeof signature !== 'string') return false;
  const expected = crypto.createHmac('sha256', keys.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { getKeys, mode, createOrder, verifySignature };
