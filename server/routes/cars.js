const express = require('express');
const store = require('../lib/store');
const router = express.Router();

const NUMERIC = ['minRange', 'maxRange', 'minBattery', 'maxBattery', 'minSeats', 'minPrice', 'maxPrice'];
const SORTS = ['price_asc', 'price_desc', 'range_desc', 'battery_desc', 'rating_desc'];

// "Tata,MG" or "tata" -> ['tata', 'mg']
const list = (v) => (v ? String(v).toLowerCase().split(',').map((s) => s.trim()).filter(Boolean) : null);

// GET /api/cars?brand=Tata,MG&minRange=300&maxPrice=3000&fastCharging=true&minSeats=5&sort=range_desc
router.get('/', async (req, res) => {
  const q = req.query;
  const filters = {
    brand: list(q.brand),
    type: list(q.type),
    connector: list(q.connector),
    q: q.q ? String(q.q).toLowerCase().trim() : null,
    sort: q.sort,
    fastCharging: q.fastCharging == null ? null : q.fastCharging === 'true',
  };

  for (const key of NUMERIC) {
    if (q[key] == null || q[key] === '') {
      filters[key] = null;
      continue;
    }
    const n = Number(q[key]);
    if (!Number.isFinite(n)) return res.status(400).json({ message: `${key} must be a number` });
    filters[key] = n;
  }
  if (q.fastCharging != null && !['true', 'false'].includes(q.fastCharging)) {
    return res.status(400).json({ message: 'fastCharging must be true or false' });
  }
  if (q.sort && !SORTS.includes(q.sort)) {
    return res.status(400).json({ message: `sort must be one of: ${SORTS.join(', ')}` });
  }

  try {
    const cars = await store.listCars(filters);
    res.json({ count: cars.length, source: store.source(), cars });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const car = await store.getCar(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json(car);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
