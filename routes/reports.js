// routes/reports.js
const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const _ = require("lodash");

/**
 * ✅ GET /api/reports
 * Example:
 * /api/reports?first_name=true&last_name=true&start=2025-01-01&end=2025-12-31
 */
router.get("/", async (req, res) => {
  try {
    const { start, end, organization } = req.query;
    const startDate = start ? new Date(start) : new Date("2000-01-01");
    const endDate = end ? new Date(end) : new Date();

    // Collect requested fields
    const requestedFields = Object.keys(req.query)
      .filter((key) => req.query[key] === "true")
      .map((key) => key.toLowerCase());

    const reportsData = await getReportData(
      requestedFields,
      startDate,
      endDate,
      organization
    );

    // Convert object keys to snake_case
    const snakeCaseResponse = _.mapValues(reportsData, (value) =>
      value.map((item) =>
        _.mapKeys(item, (v, k) => _.snakeCase(k))
      )
    );

    res.json({ success: true, reports: snakeCaseResponse });
  } catch (error) {
    console.error("Error generating reports:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ===========================================================================
// ✅ POST /api/reports/save
// ===========================================================================
router.post("/save", async (req, res) => {
  try {
    console.log("🔥 POST BODY RECEIVED:", JSON.stringify(req.body, null, 2));

    let { user_id, selectedParams } = req.body;

    // Parse array or string
    if (typeof selectedParams === "string") {
      try {
        selectedParams = JSON.parse(selectedParams);
      } catch {
        selectedParams = selectedParams
          .replace(/[\[\]]/g, "")
          .split(",")
          .map((f) => f.trim());
      }
    }

    if (!user_id || !selectedParams || selectedParams.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid user_id or selectedParams",
      });
    }

    if (!Array.isArray(selectedParams)) {
      return res.status(400).json({
        success: false,
        message: "selectedParams must be an array or JSON-parsable string",
      });
    }

    // Save to Firestore
    await db.collection("savedReports").add({
      user_id,
      selectedParams,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "Saved successfully",
      user_id: user_id,
    });
  } catch (error) {
    console.error("❌ Error saving report:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ===========================================================================
// ✅ GET /api/reports/:user_id
// ===========================================================================
router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const { start, end, organization } = req.query;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing user_id" });
    }

    // Pull last saved filters
    const snapshot = await db
      .collection("savedReports")
      .where("user_id", "==", user_id)
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({
        success: true,
        reports: [],
        message: "No saved report filters found",
      });
    }

    const saved = snapshot.docs[0].data();
    let selectedParams = saved.selectedParams;

    if (typeof selectedParams === "string") {
      try {
        selectedParams = JSON.parse(selectedParams);
      } catch {
        selectedParams = selectedParams
          .replace(/[\[\]]/g, "")
          .split(",")
          .map((f) => f.trim());
      }
    }

    const startDate = start ? new Date(start) : new Date("2000-01-01");
    const endDate = end ? new Date(end) : new Date();

    // Replace data based on filters
    const reportsData = await getReportData(
      selectedParams,
      startDate,
      endDate,
      organization
    );

    const snakeCaseResponse = _.mapValues(reportsData, (value) =>
      value.map((item) =>
        _.mapKeys(item, (v, k) => _.snakeCase(k))
      )
    );

    return res.json({
      success: true,
      filters_used: selectedParams,
      reports: snakeCaseResponse,
    });
  } catch (error) {
    console.error("Error generating user report:", error);
    res.status(500).json({
      success: false,
      message: "Server error generating report",
      error: error.message,
    });
  }
});

// ===========================================================================
// 🔥 REPORT DATA BUILDERS
// ===========================================================================

async function getReportData(fields, startDate, endDate, organization) {
  const results = {};

  // CLIENTS (first + last name only)
  if (fields.includes("first_name") || fields.includes("last_name")) {
    results.clients = await getClientsData(startDate, endDate, organization);
  }

  // RIDES
  if (
    fields.includes("ride_status") ||
    fields.includes("trip_mileage") ||
    fields.includes("driver_id")
  ) {
    results.rides = await getRideVolume(startDate, endDate, organization);
  }

  // VOLUNTEERS
  if (
    fields.includes("volunteering_status") ||
    fields.includes("mobility_assistance")
  ) {
    results.volunteers = await getVolunteerData(
      startDate,
      endDate,
      organization
    );
  }

  // METADATA
  if (
    fields.includes("security_assignment") ||
    fields.includes("date_enrolled") ||
    fields.includes("m_f")
  ) {
    results.client_metadata = await getClientMetadata(
      startDate,
      endDate,
      organization
    );
  }

  return results;
}

// ===========================================================================
// 🔥 CLIENTS: FIRST + LAST NAME ONLY
// ===========================================================================
async function getClientsData(startDate, endDate, organization) {
  let query = db.collection("clients");
  if (organization)
    query = query.where("organization_id", "==", organization);

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    first_name: doc.data().first_name || "",
    last_name: doc.data().last_name || "",
  }));
}

// ===========================================================================
// 🔥 RIDES
// ===========================================================================
async function getRideVolume(startDate, endDate, organization) {
  let query = db
    .collection("rides")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate);

  if (organization)
    query = query.where("organization_id", "==", organization);

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    ride_status: doc.data().status || doc.data().ride_status || "",
    trip_mileage:
      doc.data().MilesDriven || doc.data().miles_driven || "",
    driver_id:
      doc.data().Driver || doc.data().driver_volunteer_ref || "",
  }));
}

// ===========================================================================
// 🔥 VOLUNTEERS
// ===========================================================================
async function getVolunteerData(startDate, endDate, organization) {
  let query = db.collection("volunteers");
  if (organization)
    query = query.where("organization_id", "==", organization);

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    volunteering_status: doc.data().volunteering_status || "",
    mobility_assistance: doc.data().mobility_assistance || "",
  }));
}

// ===========================================================================
// 🔥 CLIENT METADATA
// ===========================================================================
async function getClientMetadata(startDate, endDate, organization) {
  let query = db.collection("clients");
  if (organization)
    query = query.where("organization_id", "==", organization);

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    security_assignment: doc.data().security_assignment || "",
    date_enrolled: doc.data().date_enrolled || "",
    m_f: doc.data().m_f || "",
  }));
}

module.exports = router;