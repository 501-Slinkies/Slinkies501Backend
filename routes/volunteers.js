const express = require("express");
const router = express.Router();
const applicationLayer = require("../ApplicationLayer");

router.get("/:volunteerId/unavailability", async (req, res) => {
  try {
    const { volunteerId } = req.params;

    if (!volunteerId) {
      return res.status(400).json({
        success: false,
        message: "Volunteer ID is required"
      });
    }

    const result = await applicationLayer.getVolunteerUnavailability(volunteerId);

    if (result.success) {
      return res.status(200).json(result);
    }

    const statusCode =
      result.message && result.message.toLowerCase().includes("not found")
        ? 404
        : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error("Error fetching volunteer unavailability:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.post("/:volunteerId/unavailability", async (req, res) => {
  try {
    const { volunteerId } = req.params;

    if (!volunteerId) {
      return res.status(400).json({
        success: false,
        message: "Volunteer ID is required"
      });
    }

    const requestPayload = Array.isArray(req.body?.entries)
      ? req.body.entries
      : req.body;

    if (requestPayload === undefined || requestPayload === null) {
      return res.status(400).json({
        success: false,
        message: "Request body must include unavailability entry data"
      });
    }

    const result = await applicationLayer.addVolunteerUnavailability(
      volunteerId,
      requestPayload
    );

    if (result.success) {
      return res.status(200).json(result);
    }

    const statusCode =
      result.message && result.message.includes("not found") ? 404 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error("Error recording volunteer unavailability:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

module.exports = router;

