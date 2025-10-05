// Set up a calendar

const express = require('express');
const router = express.Router();
const applicationLayer = require('./ApplicationLayer');

router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }

    const rides = await applicationLayer.getRidesByTimeframe(startDate, endDate);
    res.json(rides);
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;