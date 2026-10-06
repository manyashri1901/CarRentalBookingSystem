// Usage: npm run seed   (requires MONGO_URI in server/.env)
// Upserts cars and stations from server/data/*.json. Safe to run repeatedly.
require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('../models/Car');
const Station = require('../models/Station');
const cars = require('../data/cars.json');
const stations = require('../data/stations.json');

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Add it to server/.env first.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);

  const upsert = (Model, docs) =>
    Model.bulkWrite(docs.map((d) => ({ replaceOne: { filter: { id: d.id }, replacement: d, upsert: true } })));

  await upsert(Car, cars);
  await upsert(Station, stations);
  console.log(`Seeded ${cars.length} cars and ${stations.length} stations.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
