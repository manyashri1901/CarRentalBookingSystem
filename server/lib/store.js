// Data access for cars and stations.
// Uses MongoDB when connected; otherwise serves the seed JSON in server/data,
// so the app runs locally with no MONGO_URI.
const mongoose = require('mongoose');
const Car = require('../models/Car');
const Station = require('../models/Station');
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

module.exports = { source, listCars, getCar, listStations, seedCars, seedStations };
