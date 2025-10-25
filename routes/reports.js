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


/**
 * Core report data generator
 */
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