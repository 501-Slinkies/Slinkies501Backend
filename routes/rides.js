// Set up rides.js


const express = require("express");
const router = express.Router();
const { db } = require("../server");  // ✅ Import the initialized db


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

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Build Firestore query
    let query = db.collection("rides")
      .where("rideDate", ">=", start)
      .where("rideDate", "<=", end);

    if (status) query = query.where("status", "==", status);
    if (driverId) query = query.where("assignedDriver", "==", driverId);

    const snapshot = await query.get();
    const rides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({
      success: true,
      total: rides.length,
      startDate,
      endDate,
      rides,
    });
  } catch (error) {
    console.error("Error fetching calendar rides:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

module.exports = router;