// Set up a calendar

const express = require('express');
const appLayer = require('./ApplicationLayer');
const router = express.Router();


router.get('/', async (req, res) => {
  const result = await appLayer.listAllEvents();
  res.json(result);
});

router.get('/:id', async (req, res) => {
  const result = await appLayer.getEventById(req.params.id);
  res.status(result.success ? 200 : 404).json(result);
});

router.post('/', async (req, res) => {
  const result = await appLayer.createEvent(req.body);
  res.status(result.success ? 201 : 400).json(result);
});

router.put('/:id', async (req, res) => {
  const result = await appLayer.updateEvent(req.params.id, req.body);
  res.json(result);
});


module.exports = router;