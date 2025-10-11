require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { db } = require('./firebase');         
const applicationLayer = require('./ApplicationLayer');
const calendarRoutes = require("./calendar");
const ridesRouter = require("./routes/rides");
const clientsRouter = require("./routes/clients");   // ✅ NEW - Donations reporting route
const { verifyAddress, getRoute } = require("./integrations/maps");
const { sendNotification } = require("./services/notifications");
const reportsRouter = require("./routes/reports");


const app = express();
const port = 3000;

// ================================
// Middleware
// ================================
app.use(bodyParser.json());

// ================================
// Login Endpoint
// ================================
app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).send({ message: 'Email, password, and role are required' });
  }

  const result = await applicationLayer.loginUser(email, password, role);
  if (result.success) {
    res.status(200).send(result);
  } else {
    res.status(401).send(result);
  }
});

// ================================
// Maps API Endpoints (OpenStreetMap)
// ================================

// Verify an address using OSM Nominatim API Example: /api/maps/verify?address=1600+Pennsylvania+Ave+NW+Washington+DC
app.get("/api/maps/verify", async (req, res) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ success: false, message: "Missing address" });

  const result = await verifyAddress(address);
  res.json(result);
});

//Get route between two coordinates using OSRM Format: /api/maps/route?start=-73.935242,40.730610&end=-74.0060,40.7128
app.get("/api/maps/route", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ success: false, message: "Missing start or end" });

  const result = await getRoute(start, end);
  res.json(result);
});

// ================================
// Notification Endpoint (SendGrid + Mocked SMS)
// ================================

// Send notification to a user by ID, Body: { "userId": "abc123", "message": "Your ride is confirmed", "type": "sms" }
app.post("/api/notify", async (req, res) => {
  const { userId, message, type } = req.body;

  if (!userId || !message || !type) {
    return res.status(400).json({ success: false, message: "Missing userId, message, or type" });
  }

  const result = await sendNotification(userId, message, type);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json(result);
  }
});

// ================================
// Calendar & Rides Endpoints
// ================================
app.use('/api/calendar', calendarRoutes);
app.use('/api/rides', ridesRouter);

// ================================
// Clients / Donations Reporting
// ================================
app.use('/api/clients', clientsRouter);


// ================================
// Reports
// ================================
app.use("/api/reports", reportsRouter);

// ================================
// Root Endpoint
// ================================
app.get('/', (req, res) => {
  res.send('🚀 Server is running!');
});

// ================================
// Start Server
// ================================
app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});

module.exports = { app, db };