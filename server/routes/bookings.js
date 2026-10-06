const express = require('express');
const store = require('../lib/store');
const { quote } = require('../lib/pricing');
const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/bookings
// body: { carId, name, email, pickupLocation, start, end, addOns: { insurance, homeCharger } }
router.post('/', async (req, res) => {
  const { carId, name, email, pickupLocation, start, end, addOns } = req.body || {};

  const errors = [];
  if (!carId) errors.push('carId is required');
  if (!name || !String(name).trim()) errors.push('name is required');
  if (!email || !EMAIL_RE.test(email)) errors.push('a valid email is required');
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

router.get('/:id', async (req, res) => {
  try {
    const booking = await store.getBooking(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
