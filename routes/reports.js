const express = require("express");
const router = express.Router();

// Firestore
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * POST /api/reports/save
 */
router.post("/save", async (req, res) => {
  try {
    const { user_id, selectedParams } = req.body;

    if (!user_id || !selectedParams) {
      return res.status(400).json({
        success: false,
        message: "Missing user_id or selectedParams",
      });
    }

    const docRef = await db.collection("savedReports").add({
      user_id,
      selectedParams,
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
 * GET /api/reports/:user_id
 */
router.get("/:user_id", async (req, res) => {
  try {
    const user_id = req.params.user_id;

    // Get saved filters
    const savedSnapshot = await db
      .collection("savedReports")
      .where("user_id", "==", user_id)
      .limit(1)
      .get();

    if (savedSnapshot.empty) {
      return res.status(200).json({
        success: true,
        filters_used: [],
        reports: {},
        message: "No saved report filters found",
      });
    }

    const savedData = savedSnapshot.docs[0].data();
    const filters = savedData.selectedParams;

    // Check collections
    const collections = ["clients", "rides", "volunteers"];
    let foundCollection = null;
    let docData = null;

    for (const col of collections) {
      const docSnap = await db.collection(col).doc(user_id).get();
      if (docSnap.exists) {
        foundCollection = col;
        docData = docSnap.data();
        break;
      }
    }

    if (!foundCollection) {
      return res.status(200).json({
        success: true,
        filters_used: filters,
        reports: {},
        message: "No matching doc found",
      });
    }

    // Return only selected fields
    let reportData = {};
    filters.forEach((field) => {
      if (docData[field] !== undefined) {
        reportData[field] = docData[field];
      }
    });

    return res.status(200).json({
      success: true,
      document_type: foundCollection,
      filters_used: filters,
      reports: reportData,
    });

  } catch (err) {
    console.error("Error fetching report:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;