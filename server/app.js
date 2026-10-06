const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const dealsRoutes = require('./routes/deals');
const carsRoutes = require('./routes/cars');
const stationsRoutes = require('./routes/stations');
const bookingsRoutes = require('./routes/bookings');
const paymentsRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();

// Render and similar hosts put one proxy in front of the app. Without this the rate
// limiter would see the proxy's IP for everyone. Only one hop is trusted, so a client
// cannot fake its address by sending its own X-Forwarded-For header.
if (process.env.TRUST_PROXY !== '0') app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));

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
app.use('/api/admin', adminRoutes);

module.exports = app;
