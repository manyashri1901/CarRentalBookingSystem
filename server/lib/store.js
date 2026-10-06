// Data access for cars and stations.
// Uses MongoDB when connected; otherwise serves the seed JSON in server/data,
// so the app runs locally with no MONGO_URI.
const mongoose = require('mongoose');
const Car = require('../models/Car');
const Station = require('../models/Station');
const Booking = require('../models/Booking');
const crypto = require('crypto');
const seedCars = require('../data/cars.json');
const seedStations = require('../data/stations.json');

const dbReady = () => mongoose.connection.readyState === 1;
const source = () => (dbReady() ? 'mongodb' : 'json');

const clean = (docs) => docs.map(({ _id, __v, ...rest }) => rest);

async function allCars() {
  if (!dbReady()) return seedCars;
  return clean(await Car.find().lean());
}

async function allStations() {
  if (!dbReady()) return seedStations;
  return clean(await Station.find().lean());
}

// Same filtering for both sources (the fleet is small, so filter in memory).
const SORTS = {
  price_asc: (a, b) => a.pricePerDay - b.pricePerDay,
  price_desc: (a, b) => b.pricePerDay - a.pricePerDay,
  range_desc: (a, b) => b.rangeKm - a.rangeKm,
  battery_desc: (a, b) => b.batteryKWh - a.batteryKWh,
  rating_desc: (a, b) => (b.rating || 0) - (a.rating || 0),
};

async function listCars(f) {
  let cars = (await allCars()).filter(
    (c) =>
      (!f.brand || f.brand.includes(c.brand.toLowerCase())) &&
      (!f.type || f.type.includes(c.type.toLowerCase())) &&
      (!f.connector || f.connector.includes(c.connector.toLowerCase())) &&
      (f.minRange == null || c.rangeKm >= f.minRange) &&
      (f.maxRange == null || c.rangeKm <= f.maxRange) &&
      (f.minBattery == null || c.batteryKWh >= f.minBattery) &&
      (f.maxBattery == null || c.batteryKWh <= f.maxBattery) &&
      (f.minSeats == null || c.seats >= f.minSeats) &&
      (f.minPrice == null || c.pricePerDay >= f.minPrice) &&
      (f.maxPrice == null || c.pricePerDay <= f.maxPrice) &&
      (f.fastCharging == null || c.fastCharging === f.fastCharging) &&
      (!f.q || `${c.brand} ${c.name}`.toLowerCase().includes(f.q))
  );
  if (f.sort && SORTS[f.sort]) cars = [...cars].sort(SORTS[f.sort]);
  return cars;
}

async function getCar(id) {
  return (await allCars()).find((c) => c.id === id) || null;
}

async function listStations(f) {
  return (await allStations()).filter(
    (s) =>
      (!f.city || s.city.toLowerCase() === f.city) &&
      (!f.connector || s.connectors.some((c) => f.connector.includes(c.type.toLowerCase())))
  );
}

// Bookings: MongoDB when connected. With no database they are kept in memory
// (demo mode) and are lost when the server restarts. Both modes expose the same
// shape: the public id is a random UUID (`id`), never a database _id.
const memoryBookings = new Map();

const shape = (doc) => {
  const { _id, __v, ref, ...rest } = doc;
  return { id: ref, ...rest };
};
const copy = (b) => structuredClone(b);

async function createBooking(data) {
  if (dbReady()) {
    const doc = await Booking.create(data);
    return shape(doc.toObject());
  }
  const booking = { id: crypto.randomUUID(), ...data, payment: { demo: false, razorpayOrderIds: [] }, createdAt: new Date() };
  memoryBookings.set(booking.id, booking);
  return copy(booking);
}

async function getBooking(id) {
  if (!dbReady()) {
    const b = memoryBookings.get(id);
    return b ? copy(b) : null;
  }
  const doc = await Booking.findOne({ ref: String(id) }).lean();
  return doc ? shape(doc) : null;
}

// Remember a Razorpay order for this booking (one per payment attempt).
// Returns null if the booking does not exist.
async function addPaymentOrder(id, orderId) {
  if (!dbReady()) {
    const b = memoryBookings.get(id);
    if (!b) return null;
    if (!b.payment.razorpayOrderIds.includes(orderId)) b.payment.razorpayOrderIds.push(orderId);
    return copy(b);
  }
  const doc = await Booking.findOneAndUpdate(
    { ref: String(id) },
    { $addToSet: { 'payment.razorpayOrderIds': orderId } },
    { new: true }
  ).lean();
  return doc ? shape(doc) : null;
}

// Mark a booking paid exactly once. Atomic and idempotent: the first caller flips
// pending -> paid; any later or concurrent caller gets { alreadyPaid: true } and
// the original booking untouched.
// Returns null if missing, else { booking, alreadyPaid }.
async function markBookingPaid(id, { method, demo, razorpayPaymentId }) {
  if (!dbReady()) {
    const b = memoryBookings.get(id);
    if (!b) return null;
    if (b.status === 'paid') return { booking: copy(b), alreadyPaid: true };
    // no await between the check above and these writes, so this is atomic in-process
    b.status = 'paid';
    b.payment = { ...b.payment, method, demo, razorpayPaymentId, paidAt: new Date() };
    return { booking: copy(b), alreadyPaid: false };
  }
  const updated = await Booking.findOneAndUpdate(
    { ref: String(id), status: { $ne: 'paid' } },
    {
      $set: {
        status: 'paid',
        'payment.method': method,
        'payment.demo': demo,
        'payment.razorpayPaymentId': razorpayPaymentId,
        'payment.paidAt': new Date(),
      },
    },
    { new: true }
  ).lean();
  if (updated) return { booking: shape(updated), alreadyPaid: false };
  const existing = await Booking.findOne({ ref: String(id) }).lean();
  return existing ? { booking: shape(existing), alreadyPaid: true } : null;
}

module.exports = { createBooking, getBooking, addPaymentOrder, markBookingPaid, source, listCars, getCar, listStations, seedCars, seedStations };
