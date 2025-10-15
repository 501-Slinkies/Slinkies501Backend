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

module.exports = router;