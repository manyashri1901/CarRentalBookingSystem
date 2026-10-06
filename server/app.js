const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const dealsRoutes = require('./routes/deals');
const carsRoutes = require('./routes/cars');
const stationsRoutes = require('./routes/stations');
const bookingsRoutes = require('./routes/bookings');
const paymentsRoutes = require('./routes/payments');

const app = express();

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
app.use('/api/payments', paymentsRoutes);

module.exports = app;
