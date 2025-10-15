// routes/reports.js

const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

/**
GET /api/reports
Frontend format example:
/api/reports?rideVolume=true&volunteerHours=false&donations=true&start=2025-01-01&end=2025-12-31
 */

router.get("/", async (req, res) => {
  try {
    const { start, end, organization } = req.query;

    // Convert dates
    const startDate = start ? new Date(start) : new Date("2000-01-01");
    const endDate = end ? new Date(end) : new Date();

    // Read and handle frontend flags
    const rideVolumeFlag = req.query.rideVolume === "true";
    const volunteerHoursFlag = req.query.volunteerHours === "true";
    const donationsFlag = req.query.donations === "true";

    const responseData = {};

    if (rideVolumeFlag) {
      responseData.rideVolume = await getRideVolume(startDate, endDate, organization);
    }
    if (volunteerHoursFlag) {
      responseData.volunteerHours = await getVolunteerHours(startDate, endDate, organization);
    }
    if (donationsFlag) {
      responseData.donations = await getDonationsTotal(startDate, endDate, organization);
    }

    res.json({ success: true, reports: responseData });
  } catch (error) {
    console.error("Error generating reports:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});



                      // Helper Function \\

// Get Ride Volume - Total number of rides completed within a specific time period.
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

// Get Volunteer Hours
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

// Get Donations Total
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