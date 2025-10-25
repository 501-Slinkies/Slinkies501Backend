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


