// clients.js

// routes/clients.js
const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

// GET /api/clients/:clientId/donations Returns donation history for a specific client
router.get("/:clientId/donations", async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ success: false, message: "Client ID is required" });
    }

    // Query Firestore donations collection
    const donationsRef = db.collection("donations");
    const snapshot = await donationsRef.where("clientId", "==", clientId).get();

    if (snapshot.empty) {
      return res.json({ success: true, donations: [], total: 0 });
    }

    const donations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      success: true,
      clientId,
      total: donations.length,
      donations,
    });
  } catch (error) {
    console.error("Error fetching donation history:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

module.exports = router;