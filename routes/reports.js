// routes/reports.js ✅ FINAL

const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const _ = require("lodash");

// ---------------------- REPORT ENTRYPOINT -------------------------

router.get("/:reportName", async (req, res) => {
  try {
    const { reportName } = req.params;
    const { start, end, organization } = req.query;

    const startDate = start ? new Date(start) : new Date("2000-01-01");
    const endDate   = end   ? new Date(end)   : new Date();

    let data = null;

    switch (reportName) {

      case "rideVolume":
        data = await getRideVolume(startDate, endDate, organization);
        break;

      case "volunteerHours":
        data = await getVolunteerHours(startDate, endDate, organization);
        break;

      case "donations":
        data = await getDonationTotals(startDate, endDate, organization);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Invalid report: ${reportName}`
        });
    }

    return res.json({ success: true, report: reportName, ...data });

  } catch (error) {
    console.error("❌ Error generating report:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ---------------------- RIDE VOLUME REPORT -------------------------

async function getRideVolume(startDate, endDate, organization) {
  let query = db.collection("rides")
    .where("Date", ">=", startDate)
    .where("Date", "<=", endDate);

  if (organization) query = query.where("organization", "==", organization);

  const snapshot = await query.get();

  const monthlyCount = {};
  let totalRides = 0;

  snapshot.forEach(doc => {
    const ride = doc.data();
    const date = ride.Date?.toDate?.() || null;
    if (!date) return;

    const key = date.toLocaleString("en-US", { month: "short", year: "numeric" });

    monthlyCount[key] = (monthlyCount[key] || 0) + 1;
    totalRides++;
  });

  return {
    totalRides,
    monthly: monthlyCount
  };
}

// ---------------------- VOLUNTEER HOURS -------------------------

async function getVolunteerHours(startDate, endDate, organization) {
  let query = db.collection("rides")
    .where("Date", ">=", startDate)
    .where("Date", "<=", endDate);

  if (organization) query = query.where("organization", "==", organization);

  const snapshot = await query.get();

  const volunteerTotals = {};
  let totalHours = 0;

  snapshot.forEach(doc => {
    const r = doc.data();
    const hours = r.volunteerHours || 0;
    const driverUID = r.driverUID;

    if (driverUID && hours > 0) {
      volunteerTotals[driverUID] = (volunteerTotals[driverUID] || 0) + hours;
      totalHours += hours;
    }
  });

  return {
    totalHours,
    byVolunteer: volunteerTotals
  };
}

// ---------------------- DONATIONS REPORT -------------------------

async function getDonationTotals(startDate, endDate, organization) {
  let query = db.collection("rides")
    .where("Date", ">=", startDate)
    .where("Date", "<=", endDate);

  if (organization) query = query.where("organization", "==", organization);

  const snapshot = await query.get();

  const donationTotals = {};
  let totalAmount = 0;

  snapshot.forEach(doc => {
    const r = doc.data();
    const amount = r.donationAmount || 0;
    const type = r.donationReceived || "Unknown";

    donationTotals[type] = (donationTotals[type] || 0) + amount;
    totalAmount += amount;
  });

  return {
    totalAmount,
    byType: donationTotals
  };
}

module.exports = router;