require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { db } = require('./firebase');         
const applicationLayer = require('./ApplicationLayer');
const calendarRoutes = require("./calendar");
const ridesRouter = require("./routes/rides");
const clientsRouter = require("./routes/clients");  
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

app.post('/roles', async (req, res) => {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send({ 
        success: false, 
        message: 'Authorization token required. Please provide a Bearer token in the Authorization header.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Extract role data from request body
    const { name, title, permissions } = req.body;
    
    // Validate required fields
    if (!name || !title || !permissions) {
      return res.status(400).send({
        success: false,
        message: 'Role name, title, and permissions are required',
        required_fields: {
          name: 'string - unique identifier for the role',
          title: 'string - display title for the role',
          permissions: {
            create_clients: 'boolean',
            read_clients: 'boolean',
            update_clients: 'boolean',
            delete_clients: 'boolean',
            create_org: 'boolean',
            read_org: 'boolean',
            update_org: 'boolean',
            delete_org: 'boolean',
            create_rides: 'boolean',
            read_rides: 'boolean',
            update_rides: 'boolean',
            delete_rides: 'boolean',
            create_users: 'boolean',
            read_users: 'boolean',
            update_users: 'boolean',
            delete_users: 'boolean',
            create_volunteers: 'boolean',
            read_volunteers: 'boolean',
            update_volunteers: 'boolean',
            delete_volunteers: 'boolean',
            read_logs: 'boolean'
          }
        }
      });
    }

    const roleData = { name, title, permissions };
    
    // Create role and permissions
    const result = await applicationLayer.createRoleWithPermissions(roleData, token);
    
    if (result.success) {
      res.status(201).send(result);
    } else {
      // Determine appropriate status code based on error type
      let statusCode = 500; // Default to internal server error
      if (result.message.includes('Authentication failed') || result.message.includes('token')) {
        statusCode = 401;
      } else if (result.message.includes('required') || result.message.includes('Organization information not found')) {
        statusCode = 400;
      }
      
      res.status(statusCode).send(result);
    }
  } catch (error) {
    console.error('Error in /roles endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Endpoint to match drivers for a specific ride
// This endpoint takes a ride document ID and returns available/unavailable drivers
// based on their availability and the ride's timeframe (PickupTime, AppointmentTime, EstimatedDuration, TripType)
app.get('/rides/:rideId/match-drivers', async (req, res) => {
  try {
    const { rideId } = req.params;
    
    if (!rideId) {
      return res.status(400).send({
        success: false,
        message: 'Ride ID is required'
      });
    }
    
    const result = await applicationLayer.matchDriversForRide(rideId);
    
    if (result.success) {
      res.status(200).send(result);
    } else {
      // Determine appropriate status code based on error type
      let statusCode = 500;
      if (result.message.includes('not found') || result.message.includes('Invalid')) {
        statusCode = 404;
      } else if (result.message.includes('Failed to fetch')) {
        statusCode = 500;
      }
      
      res.status(statusCode).send(result);
    }
  } catch (error) {
    console.error('Error in /rides/:rideId/match-drivers endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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