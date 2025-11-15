// routes/reports.js
const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

/* ============================================================================
   HELPER: Detect Which Collection a Document ID Belongs To
   ============================================================================ */
async function detectCollectionById(docId) {
  const collections = ["clients", "rides", "volunteers"];

  for (const col of collections) {
    const snap = await db.collection(col).doc(docId).get();
    if (snap.exists) {
      return { collection: col, data: snap.data() };
    }
  }

  return null;
}

/* ============================================================================
   POST /api/reports/save
   Saves filters for ANY Firestore document ID
   ============================================================================ */
router.post("/save", async (req, res) => {
  try {
    let { user_id, selectedParams } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "Missing user_id (can be client_id, ride_id, or volunteer_id)",
      });
    }

    // Parse selectedParams safely
    if (typeof selectedParams === "string") {
      try {
        selectedParams = JSON.parse(selectedParams);
      } catch {
        selectedParams = selectedParams
          .replace(/[\[\]]/g, "")
          .split(",")
          .map(f => f.trim());
      }
    }

    if (!Array.isArray(selectedParams) || selectedParams.length === 0) {
      return res.status(400).json({
        success: false,
        message: "selectedParams must be a non-empty array",
      });
    }

    // Save filter settings for this resource ID
    await db.collection("savedReports").add({
      user_id,
      selectedParams,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "Report settings saved successfully",
      target_document_id: user_id,
      saved_params: selectedParams,
    });

  } catch (error) {
    console.error("❌ POST /save error:", error);
    res.status(500).json({
      success: false,
      message: "Server error in /save",
      error: error.message,
    });
  }
});


/* ============================================================================
   GET /api/reports/:user_id
   Loads saved filters → detects which collection the ID belongs to
   ============================================================================ */
router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "Missing user_id",
      });
    }

    // Load latest saved filter settings
    const snapshot = await db
      .collection("savedReports")
      .where("user_id", "==", user_id)
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({
        success: true,
        message: "No saved report settings found",
        reports: {},
      });
    }

    let selectedParams = snapshot.docs[0].data().selectedParams;

    // Ensure params array
    if (typeof selectedParams === "string") {
      try {
        selectedParams = JSON.parse(selectedParams);
      } catch {
        selectedParams = selectedParams
          .replace(/[\[\]]/g, "")
          .split(",")
          .map(f => f.trim());
      }
    }

    /* -----------------------------------------------------------
       Detect WHICH collection this ID belongs to
       ----------------------------------------------------------- */
    const detected = await detectCollectionById(user_id);

    if (!detected) {
      return res.status(404).json({
        success: false,
        message: `Document ID ${user_id} not found in clients, rides, or volunteers.`,
      });
    }

    const { collection, data } = detected;

    /* -----------------------------------------------------------
       Build filtered result
       ----------------------------------------------------------- */
    const filtered = {};
    selectedParams.forEach(p => {
      if (data[p] !== undefined) {
        filtered[p] = data[p];
      }
    });

    // Always include ID
    filtered.id = user_id;

    res.json({
      success: true,
      document_type: collection,
      filters_used: selectedParams,
      reports: filtered,
    });

  } catch (error) {
    console.error("❌ GET /:user_id error:", error);
    res.status(500).json({
      success: false,
      message: "Server error in /:user_id",
      error: error.message,
    });
  }
});


/* ============================================================================
   GET /api/reports/all   (unchanged — returns all data)
   ============================================================================ */
router.get("/all", async (req, res) => {
  try {
    const clientsSnap = await db.collection("clients").get();
    const ridesSnap = await db.collection("rides").get();
    const volunteersSnap = await db.collection("volunteers").get();

    const clients = clientsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const rides = ridesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const volunteers = volunteersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      clients,
      rides,
      volunteers,
    });

  } catch (error) {
    console.error("❌ /all error:", error);
    res.status(500).json({
      success: false,
      message: "Server error in /all",
      error: error.message,
    });
  }
});


module.exports = router;