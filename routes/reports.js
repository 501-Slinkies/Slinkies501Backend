const express = require("express");
const router = express.Router();

// Firestore
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * POST /api/reports
 * REQUIRED:
 *  - selectedParams (array)
 *  - collection (string)
 *  - start_date (nullable but must exist in body)
 *  - end_date (nullable but must exist in body)
 *
 * Saves the report configuration and returns document_id.
 */
router.post("/reports", async (req, res) => {
  try {
    const { selectedParams, collection, start_date, end_date } = req.body;

    // Required fields
    if (!selectedParams || !collection) {
      return res.status(400).json({
        success: false,
        message: "selectedParams and collection are required.",
      });
    }

    // Save report configuration
    const saved = await db.collection("savedReports").add({
      selectedParams,
      collection,
      start_date: start_date || null,
      end_date: end_date || null,
      created_at: new Date(),
    });

    return res.json({
      success: true,
      document_id: saved.id,
    });
  } catch (error) {
    console.error("POST /reports error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


/**
 * GET /api/reports/:document_id
 *
 * REQUIRED:
 *  - Use document_id passed from POST
 *  - Load savedParams + collection + dates
 *  - Query entire collection
 *  - Apply date filtering
 *  - Return ONLY the selected fields
 *  - MUST include the correct reference ID:
 *      clients → client_id
 *      volunteers → volunteer_id
 *      rides → request_id
 *
 * DO NOT RETURN doc_id.
 */
router.get("/reports/:document_id", async (req, res) => {
  try {
    const { document_id } = req.params;

    // Load saved report configuration
    const configDoc = await db.collection("savedReports").doc(document_id).get();

    if (!configDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "Report configuration not found",
      });
    }

    const { selectedParams, collection, start_date, end_date } = configDoc.data();

    // Query the entire collection chosen (clients, volunteers, rides)
    const snapshot = await db.collection(collection).get();
    const results = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Apply date filtering if required
      if (start_date || end_date) {
        const recordDate = data.date ? new Date(data.date) : null;

        if (start_date && recordDate < new Date(start_date)) return;
        if (end_date && recordDate > new Date(end_date)) return;
      }

      // Only return selected fields
      const filtered = {};
      selectedParams.forEach((field) => {
        if (data[field] !== undefined) {
          filtered[field] = data[field];
        }
      });

      // REQUIRED: attach correct reference ID depending on collection
      if (collection === "clients") {
        filtered.client_id = doc.id;
      } else if (collection === "volunteers") {
        filtered.volunteer_id = doc.id;
      } else if (collection === "rides") {
        filtered.request_id = doc.id;
      }

      results.push(filtered);
    });

    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("GET /reports/:document_id error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;