const express = require('express');
const crypto = require('crypto');
const store = require('../lib/store');
const razorpay = require('../lib/razorpay');
const router = express.Router();

const isStr = (v) => typeof v === 'string' && v.length > 0 && v.length < 200;

// What the checkout page should show. Only the public key id is ever returned, never the secret.
// mode "demo" = no real payment will happen.
router.get('/config', (req, res) => {
  const keys = razorpay.getKeys();
  res.json({ mode: razorpay.mode(), keyId: keys ? keys.keyId : null });
});

// POST /api/payments/order  { bookingId }
// The amount ALWAYS comes from the booking saved on the server; anything the browser sends is ignored.
router.post('/order', async (req, res) => {
  const { bookingId } = req.body || {};
  if (!isStr(bookingId)) return res.status(400).json({ message: 'bookingId is required' });

  try {
    const booking = await store.getBooking(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'paid') return res.status(409).json({ message: 'This booking is already paid' });
    if (booking.status === 'cancelled') return res.status(409).json({ message: 'This booking was cancelled' });

    const amountPaise = Math.round(booking.totalINR * 100);

    if (razorpay.mode() === 'demo') {
      return res.json({
        mode: 'demo',
        demo: true,
        bookingId: booking.id,
        amount: amountPaise,
        currency: 'INR',
        notice: 'Demo mode: no real payment will be taken.',
      });
    }

    let order;
    try {
      order = await razorpay.createOrder({
        amountPaise,
        receipt: booking.id,
        notes: { bookingId: booking.id, carId: booking.carId },
      });
    } catch (err) {
      console.error('Razorpay order error:', err.message);
      return res.status(502).json({ message: 'The payment provider is unavailable. Please try again.' });
    }
    if (!order || !isStr(order.id) || order.amount !== amountPaise) {
      console.error('Razorpay returned an unexpected order');
      return res.status(502).json({ message: 'The payment provider returned an invalid order. Please try again.' });
    }

    await store.addPaymentOrder(booking.id, order.id);
    res.json({
      mode: 'razorpay',
      demo: false,
      bookingId: booking.id,
      keyId: razorpay.getKeys().keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency || 'INR',
      prefill: { name: booking.name, email: booking.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/payments/verify  { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Marks the booking paid only if the HMAC signature is valid. Safe to repeat (idempotent).
router.post('/verify', async (req, res) => {
  const { bookingId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (![bookingId, orderId, paymentId, signature].every(isStr)) {
    return res.status(400).json({ message: 'bookingId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required' });
  }
  if (razorpay.mode() === 'demo') {
    return res.status(400).json({ message: 'Real payments are not enabled on this server (demo mode).' });
  }

  try {
    const booking = await store.getBooking(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // The order must be one we created for THIS booking
    if (!booking.payment?.razorpayOrderIds?.includes(orderId)) {
      return res.status(400).json({ message: 'Payment does not match this booking' });
    }
    // Signature first, so even a repeat call must carry a valid one.
    // A bad signature never changes the booking: anyone could send one.
    if (!razorpay.verifySignature({ orderId, paymentId, signature })) {
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }
    // Same payment confirmed again: succeed without changing anything
    if (booking.status === 'paid') {
      if (booking.payment.razorpayPaymentId === paymentId) return res.json({ alreadyPaid: true, booking });
      return res.status(409).json({ message: 'This booking is already paid with a different payment' });
    }

    const result = await store.markBookingPaid(booking.id, { method: 'razorpay', demo: false, razorpayPaymentId: paymentId });
    // A concurrent request may have won the race with a different payment id
    if (result.alreadyPaid && result.booking.payment.razorpayPaymentId !== paymentId) {
      return res.status(409).json({ message: 'This booking is already paid with a different payment' });
    }
    res.json({ alreadyPaid: result.alreadyPaid, booking: result.booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/payments/demo  { bookingId }
// Only available when no Razorpay keys are configured. Marks the booking "paid (demo)":
// NOT a real payment, and the booking record says so (payment.demo = true).
router.post('/demo', async (req, res) => {
  const { bookingId } = req.body || {};
  if (!isStr(bookingId)) return res.status(400).json({ message: 'bookingId is required' });
  if (razorpay.mode() !== 'demo') {
    return res.status(403).json({ message: 'Demo payments are disabled because Razorpay keys are configured.' });
  }

  try {
    const booking = await store.getBooking(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'cancelled') return res.status(409).json({ message: 'This booking was cancelled' });

    const result = await store.markBookingPaid(booking.id, {
      method: 'demo',
      demo: true,
      razorpayPaymentId: `demo_${crypto.randomUUID()}`,
    });
    res.json({ alreadyPaid: result.alreadyPaid, demo: true, notice: 'Demo payment: no money was charged.', booking: result.booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
