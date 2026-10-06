const express = require('express');
const store = require('../lib/store');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Every route in this file is admin-only.
router.use(requireAuth, requireAdmin);

const BODY_TYPES = ['Hatchback', 'SUV', 'MPV', 'Sedan', 'Luxury'];
const CONNECTORS = ['CCS2', 'Type 2', 'CHAdeMO', 'Bharat AC001'];
const BOOKING_STATUSES = ['pending', 'paid', 'cancelled'];
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const num = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

/**
 * Validate car input. `partial` allows a subset of fields (for edits).
 * Returns { errors: [...] } or { value: {...} } with only known, coerced fields.
 */
function validateCar(body, { partial = false } = {}) {
  const b = body || {};
  const errors = [];
  const out = {};
  const has = (k) => b[k] !== undefined && b[k] !== null && b[k] !== '';

  const text = (key, label, max, required) => {
    if (!has(key)) {
      if (required && !partial) errors.push(`${label} is required`);
      return;
    }
    const v = str(b[key]);
    if (!v) errors.push(`${label} is required`);
    else if (v.length > max) errors.push(`${label} must be at most ${max} characters`);
    else out[key] = v;
  };
  const number = (key, label, min, max, required, { integer = false } = {}) => {
    if (!has(key)) {
      if (required && !partial) errors.push(`${label} is required`);
      return;
    }
    const n = num(b[key]);
    if (!Number.isFinite(n)) errors.push(`${label} must be a number`);
    else if (integer && !Number.isInteger(n)) errors.push(`${label} must be a whole number`);
    else if (n < min || n > max) errors.push(`${label} must be between ${min} and ${max}`);
    else out[key] = n;
  };
  const oneOf = (key, label, allowed, required) => {
    if (!has(key)) {
      if (required && !partial) errors.push(`${label} is required`);
      return;
    }
    if (!allowed.includes(b[key])) errors.push(`${label} must be one of: ${allowed.join(', ')}`);
    else out[key] = b[key];
  };

  if (has('id')) {
    const id = str(b.id).toLowerCase();
    if (!SLUG_RE.test(id) || id.length > 60) errors.push('Id must be lower-case words separated by hyphens (e.g. "tata-nexon-ev")');
    else out.id = id;
  } else if (!partial) {
    errors.push('Id is required');
  }

  text('brand', 'Brand', 40, true);
  text('name', 'Name', 60, true);
  oneOf('type', 'Body type', BODY_TYPES, true);
  oneOf('connector', 'Connector', CONNECTORS, true);
  number('seats', 'Seats', 1, 9, true, { integer: true });
  number('batteryKWh', 'Battery (kWh)', 1, 300, true);
  number('rangeKm', 'Range (km)', 10, 2000, true, { integer: true });
  number('chargeNormalHrs', 'AC charge time (hours)', 0.1, 48, true);
  number('acChargerKW', 'AC charger power (kW)', 0.5, 50, false);
  number('topSpeedKmh', 'Top speed (km/h)', 20, 400, false, { integer: true });
  number('pricePerHour', 'Price per hour', 1, 100000, true, { integer: true });
  number('pricePerDay', 'Price per day', 1, 1000000, true, { integer: true });
  number('rating', 'Rating', 0, 5, false);
  text('image', 'Image path', 300, false);
  text('imageCredit', 'Image credit', 300, false);
  text('specsNote', 'Specs note', 500, false);

  // Fast charging and its fields travel together
  if (b.fastCharging !== undefined) out.fastCharging = b.fastCharging === true || b.fastCharging === 'true';
  if (out.fastCharging) {
    number('chargeFastMins', 'DC fast charge time (minutes)', 1, 600, true, { integer: true });
    number('dcChargerKW', 'DC charger power (kW)', 1, 500, false);
  } else if (b.fastCharging !== undefined) {
    out.chargeFastMins = null;
    out.dcChargerKW = null;
  }

  if (out.image && !/^\/[\w\-./]*$/.test(out.image)) {
    errors.push('Image must be a site path such as /cars/my-car.jpg');
  }
  if (out.pricePerHour && out.pricePerDay && out.pricePerHour > out.pricePerDay) {
    errors.push('Price per hour cannot be more than price per day');
  }

  if (errors.length) return { errors };
  out.specsApproximate = true; // everything in this fleet is an estimate
  return { value: out };
}

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [cars, bookings, users] = await Promise.all([store.listCars({}), store.listAllBookings(), store.countUsers()]);
    const paid = bookings.filter((b) => b.status === 'paid');
    // Demo payments are not real money, so they are reported separately and never counted as revenue
    const real = paid.filter((b) => !b.payment?.demo);
    const demo = paid.filter((b) => b.payment?.demo);
    const sum = (list) => list.reduce((t, b) => t + (b.totalINR || 0), 0);

    res.json({
      source: store.source(),
      cars: cars.length,
      users,
      bookings: {
        total: bookings.length,
        pending: bookings.filter((b) => b.status === 'pending').length,
        paid: paid.length,
        cancelled: bookings.filter((b) => b.status === 'cancelled').length,
      },
      revenueINR: sum(real),
      demoRevenueINR: sum(demo),
      demoBookings: demo.length,
      recentBookings: bookings.slice(0, 5),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/bookings?status=pending
router.get('/bookings', async (req, res) => {
  const { status } = req.query;
  if (status && !BOOKING_STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${BOOKING_STATUSES.join(', ')}` });
  }
  try {
    const bookings = await store.listAllBookings({ status });
    res.json({ count: bookings.length, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/bookings/:id  { status }
router.patch('/bookings/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!BOOKING_STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${BOOKING_STATUSES.join(', ')}` });
  }
  try {
    const booking = await store.getBooking(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    // "paid" is set by the payment flow after a verified payment, never by hand
    if (status === 'paid') {
      return res.status(400).json({ message: 'A booking can only become paid through a verified payment' });
    }
    const result = await store.setBookingStatus(req.params.id, status);
    res.json({ booking: result.booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/cars
router.post('/cars', async (req, res) => {
  const { errors, value } = validateCar(req.body);
  if (errors) return res.status(400).json({ message: errors[0], errors });
  try {
    const car = await store.createCar(value);
    if (!car) return res.status(409).json({ message: `A car with id "${value.id}" already exists` });
    res.status(201).json({ car, source: store.source() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/cars/:id
router.patch('/cars/:id', async (req, res) => {
  const { id: _ignored, ...rest } = req.body || {}; // the slug is the key: it cannot be edited
  const { errors, value } = validateCar(rest, { partial: true });
  if (errors) return res.status(400).json({ message: errors[0], errors });
  if (!Object.keys(value).length) return res.status(400).json({ message: 'No valid fields to update' });
  try {
    const car = await store.updateCar(req.params.id, value);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json({ car, source: store.source() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/cars/:id
router.delete('/cars/:id', async (req, res) => {
  try {
    const bookings = await store.listAllBookings();
    const active = bookings.filter((b) => b.carId === req.params.id && b.status !== 'cancelled');
    if (active.length) {
      return res.status(409).json({
        message: `This car has ${active.length} active booking(s). Cancel them before deleting it.`,
      });
    }
    const removed = await store.deleteCar(req.params.id);
    if (!removed) return res.status(404).json({ message: 'Car not found' });
    res.json({ deleted: req.params.id, source: store.source() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
