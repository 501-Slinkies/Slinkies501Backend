// routes/clients.js

const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

/**
 * ==========================================================================================
 *  ✅ GET Donation History for a Specific Client
 *  Endpoint:  GET /api/clients/:clientId/donations
 *  Example:   /api/clients/3BTQXZprhxhqupb4NLzu/donations
 * ==========================================================================================
 */
router.get("/:clientId/donations", async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
      });
    }

    // Query rides where donations exist for that client
    const snapshot = await db
      .collection("rides")
      .where("clientUID", "==", clientId)
      .where("donationAmount", ">", 0) // MUST have donationAmount > 0
      .orderBy("donationAmount", "desc") // Requires Firestore index
      .get();

    if (snapshot.empty) {
      return res.json({
        success: true,
        clientId,
        total: 0,
        donations: []
      });
    }

    const donations = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        donationId: doc.id,
        ride_id: data.ride_id || "",
        amount: data.donationAmount || 0,
        method: data.donationReceived || "",
        appointmentDate: data.appointmentTime?.toDate
          ? data.appointmentTime.toDate().toISOString()
          : null,
        createdAt: data.CreatedAt?.toDate
          ? data.CreatedAt.toDate().toISOString()
          : null,
      };
    });

    res.json({
      success: true,
      clientId,
      total: donations.length,
      donations,
    });

  } catch (error) {
    console.error("❌ Error fetching donation history:", error);

    return res.status(500).json({
      success: false,
      message: "Server error fetching donation history",
      error: error.message,
    });
  }
});

module.exports = router;
