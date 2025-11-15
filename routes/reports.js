const express = require("express");
const router = express.Router();

// Firestore
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * POST /api/reports
 */
router.post("/", async (req, res) => {
  try {
    const { selectedParams, collection } = req.body;

    if (!selectedParams || !collection) {
      return res.status(400).json({
        success: false,
        message: "Missing selectedParams or collection",
      });
    }

    await db.collection("savedReports").add({
      selectedParams,
      collection,
      timestamp: new Date(),
    });

    return res.json({
      success: true,
      message: "Report saved successfully",
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
 * GET /api/reports
 */
router.get("/", async (req, res) => {
  try {
    const { selectedParams, collection } = req.query;

    if (!selectedParams || !collection) {
      return res.status(400).json({
        success: false,
        message: "Missing selectedParams or collection",
      });
    }

    const paramsArray = selectedParams.split(",");

    const snapshot = await db.collection(collection).get();
    const results = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const filtered = {};

      paramsArray.forEach((field) => {
        if (data[field] !== undefined) {
          filtered[field] = data[field];
        }
      });

      results.push({
        doc_id: doc.id,
        ...filtered,
      });
    });

    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("GET /reports error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;