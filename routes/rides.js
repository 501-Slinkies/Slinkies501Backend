// routes/rides.js

const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

/**
 * ============================================================================
 * ✅ GET /api/rides/calendar
 * Returns rides formatted for calendar view
 * Supports filters: start, end, status, driver_id, organization
 *
 * Example:
 * /api/rides/calendar?start=2025-09-01&end=2025-12-31&status=unassigned
 * ============================================================================
 */

router.get("/calendar", async (req, res) => {
  try {
    const { start, end, status, driver_id, organization } = req.query;

    // Convert dates safely
    const startDate = start ? new Date(start) : new Date("2000-01-01");
    const endDate = end ? new Date(end) : new Date("3000-01-01");

    // Query Firestore
    let query = db.collection("rides")
      .where("Date", ">=", startDate)
      .where("Date", "<=", endDate);          // Firestore field **must be capital D** ✅

    if (status) query = query.where("status", "==", status);
    if (driver_id) query = query.where("driverUID", "==", driver_id);
    if (organization) query = query.where("organization", "==", organization);

    const snapshot = await query.get();
    if (snapshot.empty) {
      return res.json({ success: true, rides: [] });
    }

    const rides = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        ride_id: data.ride_id || doc.id,
        date: data.Date,                            // Calendar date ✅
        pickupTime: data.pickupTime || null,
        appointmentTime: data.appointmentTime || null,
        status: data.status || "",
        appointment_type: data.appointment_type || "",
        clientUID: data.clientUID || "",
        driverUID: data.driverUID || "",
        destinationUID: data.destinationUID || "",
        milesDriven: data.milesDriven || 0,
        wheelchair: data.wheelchair || false
      };
    });

    res.json({
      success: true,
      rides,
      count: rides.length
    });

  } catch (error) {
    console.error("🔥 Error fetching calendar rides:", error);
    res.status(500).json({
      success: false,
      message: "Server error loading calendar rides.",
      error: error.message
    });
  }
});

module.exports = router;