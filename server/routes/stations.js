const express = require('express');
const store = require('../lib/store');
const router = express.Router();

// GET /api/stations?city=Delhi&connector=CCS2,Type 2
router.get('/', async (req, res) => {
  const { city, connector } = req.query;
  try {
    const stations = await store.listStations({
      city: city ? String(city).toLowerCase().trim() : null,
      connector: connector ? String(connector).toLowerCase().split(',').map((s) => s.trim()) : null,
    });
    res.json({ count: stations.length, source: store.source(), stations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
