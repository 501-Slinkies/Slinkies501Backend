const express = require('express');
const bodyParser = require('body-parser');
const { db } = require('./firebase');              // ✅ Centralized Firebase init
const applicationLayer = require('./ApplicationLayer');
const calendarRoutes = require("./calendar");
const ridesRouter = require("./routes/rides");

const app = express();
const port = 3000;

// ================================
// 🧠 Middleware
// ================================
app.use(bodyParser.json());

// ================================
// 🔐 Login Endpoint
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
// 📅 Calendar Endpoints
// ================================
app.use('/api/calendar', calendarRoutes); // Existing calendar routes
app.use('/api/rides', ridesRouter);       // ✅ New rides calendar endpoint

// ================================
// 🟢 Root Endpoint
// ================================
app.get('/', (req, res) => {
  res.send('🚀 Server is running!');
});

// ================================
// 🟡 Start Server
// ================================
app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});

module.exports = { app, db };