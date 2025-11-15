// routes/reports.js
const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const _ = require("lodash");

/**
 * POST /api/reports/save
 */
router.post("/save", async (req, res) => {
  try {
    let { user_id, selectedParams } = req.body;

    if (!user_id || !selectedParams || selectedParams.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid user_id or selectedParams",
      });
    }

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

    await db.collection("savedReports").add({
      user_id,
      selectedParams,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "Report settings saved successfully",
      user_id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * GET /api/reports/:user_id
 */
app.get('/api/reports/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const savedDoc = await db.collection('savedReports')
      .where('user_id', '==', user_id)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (savedDoc.empty) {
      return res.json({
        success: true,
        document_type: null,
        filters_used: [],
        reports: {},
        message: "No saved report filters found"
      });
    }

    const data = savedDoc.docs[0].data();
    const filters = data.selectedParams || [];

    // Detect document collection
    const collections = ["clients", "rides", "volunteers"];
    let documentType = null;
    let finalData = null;

    for (const col of collections) {
      const docRef = await db.collection(col).doc(user_id).get();
      if (docRef.exists) {
        documentType = col;
        const raw = docRef.data();
        finalData = {};

        // Only return fields that user selected
        for (const f of filters) {
          finalData[f] = raw[f];
        }

        break;
      }
    }

    return res.json({
      success: true,
      document_type: documentType,   // <--- Add this line
      filters_used: filters,
      reports: finalData || {}
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// =============================================================
// REPORT LOGIC
// =============================================================

async function getReportData(user_id, fields) {
  let results = {};

  // CLIENT REPORTS
  if (fields.includes("first_name") || fields.includes("last_name")) {
    results.client = await getClientData(user_id);
  }

  // RIDES REPORTS
  if (
    fields.includes("ride_status") ||
    fields.includes("trip_mileage") ||
    fields.includes("driver_id")
  ) {
    results.rides = await getRideData(user_id);
  }

  // VOLUNTEER REPORTS
  if (
    fields.includes("volunteering_status") ||
    fields.includes("mobility_assistance")
  ) {
    results.volunteer = await getVolunteerData(user_id);
  }

  return results;
}

/**
 * CLIENT DATA (first_name + last_name)
 */
async function getClientData(clientId) {
  const ref = db.collection("clients").doc(clientId);
  const doc = await ref.get();

  if (!doc.exists) return {};

  return {
    id: clientId,
    first_name: doc.data().first_name || "",
    last_name: doc.data().last_name || "",
  };
}

/**
 * RIDE DATA for this client
 */
async function getRideData(clientId) {
  let query = db.collection("rides").where("client_id", "==", clientId);
  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ride_status: doc.data().status || doc.data().ride_status || "",
    trip_mileage:
      doc.data().MilesDriven || doc.data().miles_driven || "",
    driver_id:
      doc.data().Driver || doc.data().driver_volunteer_ref || "",
  }));
}

/**
 * VOLUNTEER DATA linked to this client (if any)
 */
async function getVolunteerData(clientId) {
  let query = db.collection("volunteers").where("client_id", "==", clientId);
  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    volunteering_status: doc.data().volunteering_status || "",
    mobility_assistance: doc.data().mobility_assistance || "",
  }));
}

module.exports = router;