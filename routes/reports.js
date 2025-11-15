const express = require('express');
const router = express.Router();
const admin = require('../firebase');
const db = admin.firestore();

/**
 * ---------------------------------------------------------
 * POST /api/reports/save
 * Save selected report filters for a user.
 * ---------------------------------------------------------
 */
router.post('/save', async (req, res) => {
  try {
    const { user_id, selectedParams } = req.body;

    if (!user_id || !selectedParams) {
      return res.status(400).json({
        success: false,
        message: "Missing user_id or selectedParams"
      });
    }

    const docRef = db.collection('reports').doc(user_id);

    await docRef.set(
      {
        id: user_id,
        filters_used: selectedParams,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return res.status(200).json({
      success: true,
      message: "Saved successfully",
      document_id: user_id
    });

  } catch (error) {
    console.error("Error saving report:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/**
 * ---------------------------------------------------------
 * GET /api/reports/:user_id
 * Retrieve saved report filters for a user.
 * ---------------------------------------------------------
 */
router.get('/:user_id', async (req, res) => {
  try {
    const userId = req.params.user_id;

    const docRef = db.collection('reports').doc(userId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(200).json({
        success: true,
        message: "No saved report filters found",
        reports: []
      });
    }

    const data = snapshot.data();

    return res.status(200).json({
      success: true,
      filters_used: data.filters_used || [],
      reports: data || {}
    });

  } catch (error) {
    console.error("Error getting report:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

module.exports = router;