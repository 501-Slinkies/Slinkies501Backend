// routes/reports.js
const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

// ===========================================================================
// 🔥 SIMPLE FIRESTORE REPORTS ENDPOINT
// Returns ALL clients, rides, volunteers — no filters, no user_id
// ===========================================================================

/**
 * GET /api/reports/all
 * Returns:
 * {
 *   success: true,
 *   clients: [...],
 *   rides: [...],
 *   volunteers: [...]
 * }
 */
router.get("/all", async (req, res) => {
  try {
    // Fetch all documents from Firestore
    const clientsSnap = await db.collection("clients").get();
    const ridesSnap = await db.collection("rides").get();
    const volunteersSnap = await db.collection("volunteers").get();

    // Convert Firestore docs into arrays
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

    // Send all data back
    res.json({
      success: true,
      clients,
      rides,
      volunteers,
    });

  } catch (error) {
    console.error("❌ Error fetching ALL data:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ===========================================================================
// EXPORT ROUTER
// ===========================================================================
module.exports = router;
