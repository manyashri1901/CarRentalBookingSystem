const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const razorpay = require('./lib/razorpay');
const { secretProblem } = require('./lib/auth');

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

/**
 * GET /health - used by the host's health check and handy for diagnosing a deploy.
 * Reports which back-ends are wired up; never reveals a secret, only whether one is set.
 */
app.get('/health', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
  const dbConfigured = !!process.env.MONGO_URI;
  res.json({
    status: 'ok', // the process is up; see `degraded` for whether it is fully configured
    uptimeSeconds: Math.round(process.uptime()),
    database: dbConfigured ? dbState : 'not configured (serving seed JSON, data kept in memory)',
    payments: razorpay.mode(), // "razorpay" or "demo"
    authSecret: secretProblem(process.env.JWT_SECRET) ? 'weak or missing' : 'configured',
    degraded: !dbConfigured || dbState !== 'connected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/stations', stationsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;
