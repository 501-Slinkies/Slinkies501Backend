// routes/reports.js - NEED FIX ISSUE

const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

// GET /api/reports/:reportName
// Supports: ride volume, volunteer hours, donations  
// Query params: start, end, organization

router.get("/:reportName", async (req, res) => {
  try {
    const { reportName } = req.params;
    const { start, end, organization } = req.query;

    // Date range filter
    const startDate = start ? new Date(start) : new Date("2000-01-01");
    const endDate = end ? new Date(end) : new Date();

    let data = null;

    switch (reportName) {
      case "ride-volume":
        data = await getRideVolume(startDate, endDate, organization);
        break;
      case "volunteer-hours":
        data = await getVolunteerHours(startDate, endDate, organization);
        break;
      case "donations":
        data = await getDonationsTotal(startDate, endDate, organization);
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid report name" });
    }

    res.json({ success: true, reportName, data });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// Helper Functions
async function getRideVolume(startDate, endDate, organization) {
  let query = db.collection("rides")
    .where("rideDate", ">=", startDate)
    .where("rideDate", "<=", endDate);

  if (organization) query = query.where("organizationId", "==", organization);

  const snapshot = await query.get();
  return {
    totalRides: snapshot.size,
    rides: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  };
}

async function getVolunteerHours(startDate, endDate, organization) {
  let query = db.collection("volunteerLogs")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate);

  if (organization) query = query.where("organizationId", "==", organization);

  const snapshot = await query.get();
  let totalHours = 0;
  snapshot.forEach(doc => {
    totalHours += doc.data().hours || 0;
  });

  return {
    totalHours,
    logs: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  };
}

async function getDonationsTotal(startDate, endDate, organization) {
  let query = db.collection("donations")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate);

  if (organization) query = query.where("organizationId", "==", organization);

  const snapshot = await query.get();
  let totalAmount = 0;
  snapshot.forEach(doc => {
    totalAmount += doc.data().amount || 0;
  });

  return {
    totalAmount,
    donations: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  };
}

module.exports = router;