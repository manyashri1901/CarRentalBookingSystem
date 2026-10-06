const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  operator: String,
  city: { type: String, index: true },
  area: String,
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  connectors: [
    {
      _id: false,
      type: { type: String, enum: ['CCS2', 'Type 2', 'CHAdeMO', 'Bharat AC001'] },
      powerKW: Number,
      count: Number,
    },
  ],
  open24x7: { type: Boolean, default: true },
  pricePerKWh: Number, // INR
});

module.exports = mongoose.model('Station', stationSchema);
