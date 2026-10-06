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
// (demo mode) and are lost when the server restarts.
const memoryBookings = new Map();

async function createBooking(data) {
  if (dbReady()) {
    const doc = await Booking.create(data);
    const { _id, __v, ...rest } = doc.toObject();
    return { id: String(_id), ...rest };
  }
  const booking = { id: crypto.randomUUID(), ...data, createdAt: new Date() };
  memoryBookings.set(booking.id, booking);
  return booking;
}

async function getBooking(id) {
  if (!dbReady()) return memoryBookings.get(id) || null;
  if (!mongoose.isValidObjectId(id)) return null;
  const doc = await Booking.findById(id).lean();
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
}

module.exports = { createBooking, getBooking, source, listCars, getCar, listStations, seedCars, seedStations };
