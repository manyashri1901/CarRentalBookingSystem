const express = require('express');
const store = require('../lib/store');
const { quote } = require('../lib/pricing');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { isEmail } = require('../lib/auth');

const router = express.Router();

/**
 * Who may see or change a booking:
 * - owned by a signed-in user -> only that user, or an admin
 * - made by a guest (no userId) -> anyone holding the unguessable reference, which is
 *   the only way a guest can reach their own confirmation page
 */
function mayAccess(booking, user) {
  if (!booking.userId) return true;
  return !!user && (user.id === booking.userId || user.role === 'admin');
}

// GET /api/bookings/mine - the signed-in user's own bookings
// Declared before /:id so "mine" is not read as an id.
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const bookings = await store.listBookingsByUser(req.user.id);
    res.json({ count: bookings.length, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/bookings
// body: { carId, name, email, pickupLocation, start, end, addOns: { insurance, homeCharger } }
router.post('/', optionalAuth, async (req, res) => {
  const { carId, name, email, pickupLocation, start, end, addOns } = req.body || {};

  const errors = [];
  if (!carId) errors.push('carId is required');
  if (!name || !String(name).trim()) errors.push('name is required');
  if (!isEmail(email)) errors.push('a valid email is required');
  if (!pickupLocation || !String(pickupLocation).trim()) errors.push('pickupLocation is required');
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    errors.push('start and end must be valid dates');
  } else {
    if (startDate.getTime() < Date.now() - 5 * 60 * 1000) errors.push('start cannot be in the past');
    if (endDate.getTime() - startDate.getTime() < 60 * 60 * 1000) errors.push('booking must be at least 1 hour');
  }
  if (errors.length) return res.status(400).json({ message: errors[0], errors });

  try {
    const car = await store.getCar(carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const flags = { insurance: !!addOns?.insurance, homeCharger: !!addOns?.homeCharger };
    const q = quote(car, startDate, endDate, flags);

    const booking = await store.createBooking({
      carId: car.id,
      userId: req.user?.id || null, // claimed by the signed-in user, if any
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      pickupLocation: String(pickupLocation).trim(),
      start: startDate,
      end: endDate,
      addOns: flags,
      totalINR: q.total,
      status: 'pending',
    });

    res.status(201).json({ booking, quote: q, source: store.source() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const booking = await store.getBooking(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!mayAccess(booking, req.user)) {
      // 404, not 403: knowing a reference exists is itself information
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/bookings/:id/cancel - the customer cancels their own unpaid booking
router.post('/:id/cancel', optionalAuth, async (req, res) => {
  try {
    const booking = await store.getBooking(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!mayAccess(booking, req.user)) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'cancelled') return res.json({ booking }); // already done

    const result = await store.setBookingStatus(req.params.id, 'cancelled', { expected: 'pending' });
    if (result?.conflict === 'paid') {
      return res.status(409).json({ message: 'This booking is paid. Contact support to cancel it and arrange a refund.' });
    }
    if (!result?.booking) return res.status(409).json({ message: 'This booking can no longer be cancelled' });
    res.json({ booking: result.booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
