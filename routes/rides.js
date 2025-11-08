// routes/rides.js

const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

// ======================================================
// ✅ GET /api/rides/calendar
// Returns rides grouped by date → perfect for calendar UI
//
// Optional query params:
//   start=YYYY-MM-DD
//   end=YYYY-MM-DD
//   driver_id=xxxxxx (optional filter)
// ======================================================
router.get("/calendar", async (req, res) => {
  try {
    const { start, end, driver_id } = req.query;

    // Convert params into proper Date values
    const startDate = start ? new Date(start) : new Date("2000-01-01");
    const endDate = end ? new Date(end) : new Date("2100-01-01");

    console.log("📅 Calendar range:", startDate, "→", endDate);

    let query = db
      .collection("rides")
      .where("date", ">=", startDate)
      .where("date", "<=", endDate);

    // Optional filter if a driver is selected
    if (driver_id) {
      query = query.where("driver_volunteer_ref", "==", driver_id);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.json({ success: true, rides: [] });
    }

    // Format data for calendar use — grouped by date
    const calendarData = {};

    snapshot.forEach(doc => {
      const ride = doc.data();
      const rideDate = ride.date.toDate().toISOString().split("T")[0]; // YYYY-MM-DD

      if (!calendarData[rideDate]) calendarData[rideDate] = [];

      calendarData[rideDate].push({
        ride_id: doc.id,
        client_ref: ride.client_ref || "",
        driver_id: ride.driver_volunteer_ref || "",
        status: ride.status || "Unassigned",
        miles_driven: ride.miles_driven || ride.MilesDriven || 0,
        start_location: ride.start_location_address_ref || "",
        end_location: ride.end_location_address_ref || "",
        notes: ride.external_comments || ""
      });
    });

    res.json({
      success: true,
      total_days: Object.keys(calendarData).length,
      rides: calendarData,
    });

  } catch (error) {
    console.error("❌ Error loading calendar rides:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

module.exports = router;