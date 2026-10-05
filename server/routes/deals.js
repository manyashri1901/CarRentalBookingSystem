const express = require('express');
const router = express.Router();

const deals = [
  { title: 'Weekend SUV Deal', description: '20% off on SUVs every weekend!', discount: '20%' },
  { title: 'Early Bird Discount', description: 'Book 5 days in advance and get 15% off!', discount: '15%' },
  { title: 'Monsoon Offer', description: 'Rain or shine, get 10% off city rides.', discount: '10%' },
];

router.get('/', (req, res) => res.json(deals));

module.exports = router;
