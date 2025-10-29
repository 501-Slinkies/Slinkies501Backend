// routes/reports.js

const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const _ = require("lodash"); // ensure lodash is installed (npm install lodash)

/**
GET /api/reports
Example:
/api/reports?client_name=true&ride_status=true&start=2025-01-01&end=2025-12-31
 */

router.get("/", async (req, res) => {
  try {
    const { start, end, organization } = req.query;

    // Convert dates safely
    const startDate = start ? new Date(start) : new Date("2000-01-01");
    const endDate = end ? new Date(end) : new Date();

    // Collect all requested fields dynamically
    const requestedFields = Object.keys(req.query)
      .filter(key => req.query[key] === "true")
      .map(key => key.toLowerCase());

    const reportsData = await getReportData(requestedFields, startDate, endDate, organization);

    // Convert all field names to snake_case before sending
    const snakeCaseResponse = _.mapKeys(reportsData, (value, key) => _.snakeCase(key));

    res.json({ success: true, reports: snakeCaseResponse });
  } catch (error) {
    console.error("Error generating reports:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// POST /api/reports/save
router.post("/save", async (req, res) => {
  try {
    const { user_id, selectedParams } = req.body;

    if (!user_id || !selectedParams) {
      return res.status(400).json({ success: false, message: "Missing user_id or selectedParams" });
    }

    // Save user's report selection (you can adjust the collection name as needed)
    await db.collection("savedReports").add({
      user_id,
      selectedParams,
      timestamp: new Date(),
    });

    res.json({ success: true, message: "Report parameters saved successfully" });
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// GET /api/reports/saved/:user_id
router.get("/saved/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "Missing user_id" });
    }

    const snapshot = await db
      .collection("savedReports")
      .where("user_id", "==", user_id)
      .orderBy("timestamp", "desc")
      .get();

    if (snapshot.empty) {
      return res.json({ success: true, reports: [] });
    }

    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, reports });
  } catch (error) {
    console.error("Error fetching saved reports:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});


// Core report data generator
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


// Fetch Clients
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


// Fetch Rides
async function getRideVolume(startDate, endDate, organization) {
  let query = db.collection("rides")
    .where("date", ">=", startDate)
    .where("date", "<=", endDate);

  if (organization) query = query.where("organization_id", "==", organization);

  const snapshot = await query.get();

  return snapshot.docs.map(doc => ({
    ride_status: doc.data().status || "", 
    trip_mileage: doc.data().MilesDriven || doc.data().miles_driven || "", 
    driver_id: doc.data().Driver || doc.data().driver_volunteer_ref || ""
}));

}


// Fetch Volunteers
async function getVolunteerData(startDate, endDate, organization) {
  let query = db.collection("volunteers");
  if (organization) query = query.where("organization_id", "==", organization);

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    volunteering_status: doc.data().volunteering_status || "",
    mobility_assistance: doc.data().mobility_assistance || ""
  }));
}


// Fetch Client Metadata
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