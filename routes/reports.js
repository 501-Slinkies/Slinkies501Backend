const express = require("express");
const router = express.Router();

// Firestore
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * -------------------------------------------------
 * POST /api/reports/save
 * Save report configuration:
 *  - user_id (who saved the report)
 *  - selectedParams (fields they want in the report)
 *  - collection ("clients" | "rides" | "volunteers")
 * -------------------------------------------------
 */
router.post("/save", async (req, res) => {
  try {
    const { user_id, selectedParams, collection } = req.body;

    if (!user_id || !selectedParams || !collection) {
      return res.status(400).json({
        success: false,
        message: "Missing user_id, selectedParams, or collection",
      });
    }

    const docRef = await db.collection("savedReports").add({
      user_id,
      selectedParams,
      collection,
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Saved successfully",
      document_id: docRef.id,
    });
  } catch (err) {
    console.error("Error saving report:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * -------------------------------------------------
 * GET /api/reports
 * Returns a FULL REPORT based on last saved config:
 *  - loads latest saved report settings
 *  - reads selected collection
 *  - returns ALL documents with just selected fields
 * -------------------------------------------------
 */
router.get("/", async (req, res) => {
  try {
    // 1️⃣ Load most recent saved report config
    const savedSnapshot = await db
      .collection("savedReports")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (savedSnapshot.empty) {
      return res.status(200).json({
        success: true,
        filters_used: [],
        report_data: [],
        message: "No saved report configuration found",
      });
    }

    const savedData = savedSnapshot.docs[0].data();

    const filters = savedData.selectedParams; // fields user selected
    const collection = savedData.collection;  // collection to pull from

    // 2️⃣ Get all docs from selected collection
    const docsSnapshot = await db.collection(collection).get();

    let results = [];

    // 3️⃣ Extract only selected fields from each document
    docsSnapshot.forEach((doc) => {
      const raw = doc.data();

      let filtered = {};
      filters.forEach((field) => {
        if (raw[field] !== undefined) {
          filtered[field] = raw[field];
        }
      });

      results.push(filtered);
    });

    // 4️⃣ Return final report
    return res.status(200).json({
      success: true,
      filters_used: filters,
      collection_used: collection,
      report_data: results,
    });

  } catch (err) {
    console.error("Error generating report:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;