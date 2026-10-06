// Data access for cars and stations.
// Uses MongoDB when connected; otherwise serves the seed JSON in server/data,
// so the app runs locally with no MONGO_URI.
const mongoose = require('mongoose');
const Car = require('../models/Car');
const Station = require('../models/Station');
const Booking = require('../models/Booking');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const seedCars = require('../data/cars.json');
const seedStations = require('../data/stations.json');

const dbReady = () => mongoose.connection.readyState === 1;
const source = () => (dbReady() ? 'mongodb' : 'json');

const clean = (docs) => docs.map(({ _id, __v, ...rest }) => rest);

// Demo mode (no MONGO_URI) keeps an editable copy of the seed fleet in memory so the
// admin pages work locally. Changes are lost when the server restarts.
const memoryCars = new Map(structuredClone(seedCars).map((c) => [c.id, c]));

async function allCars() {
  if (!dbReady()) return structuredClone([...memoryCars.values()]);
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

// ---------- Cars: admin writes ----------

async function createCar(data) {
  if (!dbReady()) {
    if (memoryCars.has(data.id)) return null; // duplicate
    memoryCars.set(data.id, structuredClone(data));
    return structuredClone(data);
  }
  if (await Car.findOne({ id: data.id }).lean()) return null;
  const doc = await Car.create(data);
  const { _id, __v, ...rest } = doc.toObject();
  return rest;
}

/** Partial update. Returns the updated car, or null if there is no such car. */
async function updateCar(id, patch) {
  if (!dbReady()) {
    const car = memoryCars.get(id);
    if (!car) return null;
    Object.assign(car, patch);
    return structuredClone(car);
  }
  const doc = await Car.findOneAndUpdate({ id }, { $set: patch }, { new: true, runValidators: true }).lean();
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  return rest;
}

async function deleteCar(id) {
  if (!dbReady()) return memoryCars.delete(id);
  const res = await Car.deleteOne({ id });
  return res.deletedCount > 0;
}

// ---------- Users ----------
// Same dual mode as bookings: MongoDB when connected, otherwise in memory for local demos.
const memoryUsers = new Map(); // id -> user (with password hash)
const memoryUsersByEmail = new Map(); // email -> id

const publicUser = ({ password, ...u }) => u; // never leak the hash

async function createUser({ name, email, password, role = 'user' }) {
  const hash = await bcrypt.hash(password, 12);
  const lower = email.toLowerCase().trim();
  if (!dbReady()) {
    if (memoryUsersByEmail.has(lower)) return null; // already exists
    const user = { id: crypto.randomUUID(), name: name.trim(), email: lower, password: hash, role, createdAt: new Date() };
    memoryUsers.set(user.id, user);
    memoryUsersByEmail.set(lower, user.id);
    return publicUser(structuredClone(user));
  }
  if (await User.findOne({ email: lower }).lean()) return null;
  try {
    const doc = await User.create({ name: name.trim(), email: lower, password: hash, role });
    return publicUser(shape(doc.toObject()));
  } catch (err) {
    if (err.code === 11000) return null; // unique index lost a race
    throw err;
  }
}

/** Includes the password hash: for sign-in only. */
async function getUserByEmailWithHash(email) {
  const lower = String(email || '').toLowerCase().trim();
  if (!dbReady()) {
    const id = memoryUsersByEmail.get(lower);
    return id ? structuredClone(memoryUsers.get(id)) : null;
  }
  const doc = await User.findOne({ email: lower }).lean();
  return doc ? shape(doc) : null;
}

async function getUserById(id) {
  if (!dbReady()) {
    const u = memoryUsers.get(String(id));
    return u ? publicUser(structuredClone(u)) : null;
  }
  const doc = await User.findOne({ ref: String(id) }).lean();
  return doc ? publicUser(shape(doc)) : null;
}

async function setUserRole(email, role) {
  const lower = String(email).toLowerCase().trim();
  if (!dbReady()) {
    const id = memoryUsersByEmail.get(lower);
    if (!id) return null;
    memoryUsers.get(id).role = role;
    return publicUser(structuredClone(memoryUsers.get(id)));
  }
  const doc = await User.findOneAndUpdate({ email: lower }, { $set: { role } }, { new: true }).lean();
  return doc ? publicUser(shape(doc)) : null;
}

async function countUsers() {
  if (!dbReady()) return memoryUsers.size;
  return User.countDocuments();
}

// ---------- Bookings: listing, ownership, status ----------

/** Bookings owned by one user, newest first. */
async function listBookingsByUser(userId) {
  if (!dbReady()) {
    return [...memoryBookings.values()]
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(copy);
  }
  const docs = await Booking.find({ userId: String(userId) }).sort({ createdAt: -1 }).lean();
  return docs.map(shape);
}

/** All bookings (admin), newest first. */
async function listAllBookings({ status } = {}) {
  if (!dbReady()) {
    return [...memoryBookings.values()]
      .filter((b) => !status || b.status === status)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(copy);
  }
  const docs = await Booking.find(status ? { status } : {}).sort({ createdAt: -1 }).lean();
  return docs.map(shape);
}

/**
 * Change a booking's status. `expected` restricts which current status may change
 * (used so a customer can only cancel a booking that is still pending).
 * Returns { booking } on success, { conflict: <current status> } if `expected` did not match, or null if missing.
 */
async function setBookingStatus(id, status, { expected } = {}) {
  if (!dbReady()) {
    const b = memoryBookings.get(id);
    if (!b) return null;
    if (expected && b.status !== expected) return { conflict: b.status };
    b.status = status;
    return { booking: copy(b) };
  }
  const filter = { ref: String(id), ...(expected ? { status: expected } : {}) };
  const doc = await Booking.findOneAndUpdate(filter, { $set: { status } }, { new: true }).lean();
  if (doc) return { booking: shape(doc) };
  const existing = await Booking.findOne({ ref: String(id) }).lean();
  if (!existing) return null;
  return { conflict: existing.status };
}

module.exports = {
  source,
  // cars
  listCars, getCar, createCar, updateCar, deleteCar,
  // stations
  listStations,
  // bookings
  createBooking, getBooking, addPaymentOrder, markBookingPaid,
  listBookingsByUser, listAllBookings, setBookingStatus,
  // users
  createUser, getUserByEmailWithHash, getUserById, setUserRole, countUsers,
  // seed data
  seedCars, seedStations,
};
