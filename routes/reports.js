// routes/reports.js

const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const _ = require("lodash");

/**
 * ✅ GET /api/reports
 * Example:
 * /api/reports?client_name=true&ride_status=true&start=2025-01-01&end=2025-12-31
 */
router.get("/", async (req, res) => {
  try {
    const { start, end, organization } = req.query;

    const startDate = start ? new Date(start) : new Date("2000-01-01");
    const endDate = end ? new Date(end) : new Date();

    // Collect requested fields from the query
    const requestedFields = Object.keys(req.query)
      .filter(key => req.query[key] === "true")
      .map(key => key.toLowerCase());

    const reportsData = await getReportData(requestedFields, startDate, endDate, organization);

    // Convert all fields to snake_case before sending to FlutterFlow
    const snakeCaseResponse = _.mapKeys(reportsData, (value, key) => _.snakeCase(key));

    res.json({ success: true, reports: snakeCaseResponse });
  } catch (error) {
    console.error("Error generating reports:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});


// ✅ POST /api/reports/save 
router.post("/save", async (req, res) => {
  try {
    let { user_id, selectedParams } = req.body;

    // if selectedParams comes as string: "[first_name,last_name]"
    if (typeof selectedParams === "string") {
      try {
        selectedParams = JSON.parse(selectedParams);  // try JSON first
      } catch {
        selectedParams = selectedParams
          .replace(/[\[\]]/g, "") // remove []
          .split(",")             // split into array
          .map(f => f.trim());
      }
    }

    if (!user_id || !selectedParams || selectedParams.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing user_id or selectedParams"
      });
    }

    const docRef = await db.collection("savedReports").add({
      user_id,
      selectedParams,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "Saved successfully",
      document_id: docRef.id
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});


/**
 * ✅ GET /api/reports/:user_id
 * Reads the last saved report preferences and returns report data
 */
router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const { start, end, organization } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "Missing user_id"
      });
    }

    // Get last saved selection for this user
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
        message: "No saved report filters found"
      });
    }

    const saved = snapshot.docs[0].data();
    const selectedParams = saved.selectedParams; // e.g. ["first_name", "last_name"]

    // If FF passed dates, use them, otherwise default
    const startDate = start ? new Date(start) : new Date("2000-01-01");
    const endDate   = end   ? new Date(end)   : new Date();

    // Run the report using stored params
    const reportsData = await getReportData(selectedParams, startDate, endDate, organization);

    // Convert keys to snake_case before sending
    const snakeCaseResponse = _.mapKeys(reportsData, (v, k) => _.snakeCase(k));

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
      error: error.message
    });
  }
});



// ===========================================================================
// ✅ Report generators (Clients, Rides, Volunteers, Meta)
// ===========================================================================

async function getReportData(fields, startDate, endDate, organization) {
  const results = {};

  if (fields.includes("client_name") || fields.includes("date_of_birth")) {
    results.clients = await getClientsData(startDate, endDate, organization);
  }

  if (fields.includes("ride_status") || fields.includes("trip_mileage") || fields.includes("driver_id")) {
    results.rides = await getRideVolume(startDate, endDate, organization);
  }

  if (fields.includes("volunteering_status") || fields.includes("mobility_assistance")) {
    results.volunteers = await getVolunteerData(startDate, endDate, organization);
  }

  if (fields.includes("security_assignment") || fields.includes("date_enrolled") || fields.includes("m_f")) {
    results.client_metadata = await getClientMetadata(startDate, endDate, organization);
  }

  return results;
}


// ✅ Fetch Clients data
async function getClientsData(startDate, endDate, organization) {
  let query = db.collection("clients");
  if (organization) query = query.where("organization_id", "==", organization);

  const snapshot = await query.get();

  return snapshot.docs.map(doc => ({
    client_name: doc.data().client_name || "",
    date_of_birth: doc.data().date_of_birth || "",
    volunteering_status: doc.data().volunteering_status || "",
    mobility_assistance: doc.data().mobility_assistance || "",
    date_enrolled: doc.data().date_enrolled || "",
    m_f: doc.data().m_f || ""
  }));
}


// ✅ Fetch Rides data
async function getRideVolume(startDate, endDate, organization) {
  let query = db.collection("rides")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate);

  if (organization) query = query.where("organization_id", "==", organization);

  const snapshot = await query.get();

  return snapshot.docs.map(doc => ({
    ride_status: doc.data().status || doc.data().ride_status || "",
    trip_mileage: doc.data().MilesDriven || doc.data().miles_driven || "",
    driver_id: doc.data().Driver || doc.data().driver_volunteer_ref || ""
  }));
}


// ✅ Fetch Volunteer data
async function getVolunteerData(startDate, endDate, organization) {
  let query = db.collection("volunteers");
  if (organization) query = query.where("organization_id", "==", organization);

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    volunteering_status: doc.data().volunteering_status || "",
    mobility_assistance: doc.data().mobility_assistance || ""
  }));
}


// ✅ Fetch additional metadata
async function getClientMetadata(startDate, endDate, organization) {
  let query = db.collection("clients");
  if (organization) query = query.where("organization_id", "==", organization);

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    security_assignment: doc.data().security_assignment || "",
    date_enrolled: doc.data().date_enrolled || "",
    m_f: doc.data().m_f || ""
  }));
}

module.exports = router;