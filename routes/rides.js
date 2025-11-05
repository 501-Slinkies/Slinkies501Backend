// Set up rides.js

const express = require("express");
const router = express.Router();
const applicationLayer = require("../ApplicationLayer");

/**
 * GET /api/rides/calendar
 * Provides ride data for a calendar view (monthly/weekly) with filters.
 */
router.get("/calendar", async (req, res) => {
  try {
    let {viewType = "month", startDate, endDate, status, driverId} = req.query;

    // Set default date ranges if not provided
    const now = new Date();
    if (!startDate || !endDate) {
      if (viewType === "week") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        startDate = weekStart.toISOString();
        endDate = weekEnd.toISOString();
      } else {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate = monthStart.toISOString();
        endDate = monthEnd.toISOString();
      }
    }

    const result = await applicationLayer.getRidesByTimeframe(startDate, endDate);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error("Error fetching calendar rides:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * POST /api/rides
 * Creates a new ride with the provided data
 */
router.post("/", async (req, res) => {
  try {
    const rideData = req.body;

    const result = await applicationLayer.createRide(rideData);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error creating ride:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * GET /api/rides/appointment-info
 * Returns appointment date, time, and client name for all rides
 */
router.get("/appointment-info", async (req, res) => {
  try {
    const result = await applicationLayer.getAllRidesAppointmentInfo();

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error("Error fetching appointment info:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * GET /api/rides/:uid/match-drivers
 * Matches available drivers for a ride by UID
 */
router.get("/:uid/match-drivers", async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ success: false, message: "UID is required" });
    }

    const result = await applicationLayer.matchDriversForRideByUID(uid);

    if (result.success) {
      res.json(result);
    } else {
      const statusCode = result.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error("Error matching drivers:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * POST /api/rides/:ride_id/assign
 * Assigns a driver (volunteer) to a ride
 * Body: { "volunteer_id": "volunteer-document-id" }
 */
router.post("/:ride_id/assign", async (req, res) => {
  try {
    const { ride_id } = req.params;
    const { volunteer_id } = req.body;
    
    if (!ride_id) {
      return res.status(400).json({ success: false, message: "Ride ID is required" });
    }
    
    if (!volunteer_id) {
      return res.status(400).json({ success: false, message: "Volunteer ID is required" });
    }

    const result = await applicationLayer.assignDriverToRide(ride_id, volunteer_id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      const statusCode = result.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error("Error assigning driver to ride:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * PUT /api/rides/:uid
 * Updates a ride's data (with permission checks)
 */
router.put("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const updateData = req.body;

    if (!uid) {
      return res.status(400).json({ success: false, message: "UID is required" });
    }

    const result = await applicationLayer.updateRideByUID(uid, updateData);

    if (result.success) {
      res.json(result);
    } else {
      const statusCode = result.message.includes('not found') ? 404 : 400;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error("Error updating ride:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

/**
 * GET /api/rides/:uid
 * Gets a single ride by UID
 */
router.get("/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    
    if (!uid) {
      return res.status(400).json({ success: false, message: "UID is required" });
    }

    const result = await applicationLayer.getRideByUID(uid);

    if (result.success) {
      res.json(result);
    } else {
      const statusCode = result.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error("Error fetching ride:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

module.exports = router;