const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dealsRoutes = require('./routes/deals');
const carsRoutes = require('./routes/cars');
const stationsRoutes = require('./routes/stations');
const bookingsRoutes = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('API running');
});

app.use('/api/auth', authRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/stations', stationsRoutes);
app.use('/api/bookings', bookingsRoutes);

// Without MONGO_URI the API serves the seed JSON in server/data (cars, stations).
// Start listening even if the DB is down so the host health check passes
if (!process.env.MONGO_URI) {
  console.warn('MONGO_URI is not set - serving cars/stations from JSON seed data; signup is unavailable and bookings are kept in memory (demo mode).');
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err.message));
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
