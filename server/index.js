const mongoose = require('mongoose');
require('dotenv').config();

// dotenv must run before app.js reads the environment
const app = require('./app');
const { assertUsableSecret } = require('./lib/auth');

// Stops the server in production when JWT_SECRET is missing or weak
assertUsableSecret();

const PORT = process.env.PORT || 5000;

// Without MONGO_URI the API serves the seed JSON in server/data (cars, stations).
// Start listening even if the DB is down so the host health check passes
if (!process.env.MONGO_URI) {
  console.warn('MONGO_URI is not set - serving cars/stations from JSON seed data; accounts, bookings and car edits are kept in memory (demo mode) and lost on restart.');
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err.message));
}

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set - payments run in DEMO mode (no real money is taken).');
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
