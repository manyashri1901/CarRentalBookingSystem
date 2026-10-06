const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // URL slug, e.g. "tata-nexon-ev"
  brand: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Hatchback', 'SUV', 'MPV', 'Sedan', 'Luxury'], required: true },
  seats: { type: Number, required: true },
  image: String,
  imageCredit: String,

  // EV specs (approximate - see specsNote)
  batteryKWh: { type: Number, required: true },
  rangeKm: { type: Number, required: true }, // claimed (ARAI/MIC) range
  chargeFastMins: { type: Number, default: null }, // DC fast charge, 10-80%; null = no DC charging
  chargeNormalHrs: { type: Number, required: true }, // AC charge, ~0-100%
  acChargerKW: Number,
  dcChargerKW: { type: Number, default: null },
  connector: { type: String, enum: ['CCS2', 'Type 2', 'CHAdeMO', 'Bharat AC001'], required: true },
  topSpeedKmh: Number,
  fastCharging: { type: Boolean, default: false },

  // Rental pricing in INR
  pricePerHour: { type: Number, required: true },
  pricePerDay: { type: Number, required: true },

  rating: Number,
  specsApproximate: { type: Boolean, default: true },
  specsNote: String,
});

module.exports = mongoose.model('Car', carSchema);
