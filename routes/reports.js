// routes/reports.js
const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

/* ============================================================================
   POST /api/reports/save
   Saves: user_id + selectedParams (e.g., ["first_name","last_name"])
   ============================================================================ */
router.post("/save", async (req, res) => {
  try {
    let { user_id, selectedParams } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "Missing user_id",
      });
    }

    // Ensure selectedParams is always an array
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

    if (!Array.isArray(selectedParams) || selectedParams.length === 0) {
      return res.status(400).json({
        success: false,
        message: "selectedParams must be a non-empty array",
      });
    }

    // Save into Firestore
    await db.collection("savedReports").add({
      user_id,
      selectedParams,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: "Report settings saved",
      user_id,
      saved_params: selectedParams,
    });

  } catch (error) {
    console.error("❌ Error saving report:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});


/* ============================================================================
   GET /api/reports/:user_id
   Loads user's last saved settings → returns REAL Firestore data
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

    // Get latest saved filter settings for this user
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
        reports: [],
      });
    }

    const savedData = snapshot.docs[0].data();
    let selectedParams = savedData.selectedParams;

    // Ensure array
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

    /* -----------------------------------------------------------
       FETCH REAL CLIENT DATA FROM FIRESTORE
       ----------------------------------------------------------- */
    const clientsSnap = await db.collection("clients").get();

    const clients = clientsSnap.docs.map((doc) => ({
      id: doc.id,
      first_name: doc.data().first_name || "",
      last_name: doc.data().last_name || "",
    }));

    /* -----------------------------------------------------------
       APPLY FILTERS (first_name, last_name)
       ----------------------------------------------------------- */
    const filteredClients = clients.map((client) => {
      const filtered = {};
      selectedParams.forEach((p) => {
        if (client[p] !== undefined) {
          filtered[p] = client[p];
        }
      });
      return filtered;
    });

    res.json({
      success: true,
      filters_used: selectedParams,
      reports: {
        clients: filteredClients,
      },
    });

  } catch (error) {
    console.error("❌ Error generating report:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});


/* ============================================================================
   GET /api/reports/all
   Returns ALL clients (clean), ALL rides, ALL volunteers
   ============================================================================ */
router.get("/all", async (req, res) => {
  try {
    const clientsSnap = await db.collection("clients").get();
    const ridesSnap = await db.collection("rides").get();
    const volunteersSnap = await db.collection("volunteers").get();

    // Clean client output
    const clients = clientsSnap.docs.map(doc => ({
      id: doc.id,
      first_name: doc.data().first_name || "",
      last_name: doc.data().last_name || "",
    }));

    // Rides (full fields)
    const rides = ridesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Volunteers (full fields)
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
    console.error("❌ Error fetching ALL:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;