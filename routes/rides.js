// routes/rides.js

const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const dataAccess = require("../DataAccessLayer");

/**
 * ============================================================================
 * ✅ GET /api/rides/calendar
 * Returns rides formatted for calendar view
 * Supports filters: start, end, status, driver_id, organization
 *
 * Example:
 * /api/rides/calendar?start=2025-09-01&end=2025-12-31&status=unassigned
 * ============================================================================
 */

router.get("/calendar", async (req, res) => {
  try {
    const { start, end, status, driver_id, organization } = req.query;

    // Convert dates safely
    const startDate = start ? new Date(start) : new Date("2000-01-01");
    const endDate = end ? new Date(end) : new Date("3000-01-01");

    // Query Firestore
    let query = db.collection("rides")
      .where("Date", ">=", startDate)
      .where("Date", "<=", endDate);          // Firestore field **must be capital D** ✅

    if (status) query = query.where("status", "==", status);
    if (driver_id) query = query.where("driverUID", "==", driver_id);
    if (organization) query = query.where("organization", "==", organization);

    const snapshot = await query.get();
    if (snapshot.empty) {
      return res.json({ success: true, rides: [] });
    }

    const rides = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        ride_id: data.ride_id || doc.id,
        date: data.Date,                            // Calendar date ✅
        pickupTime: data.pickupTime || null,
        appointmentTime: data.appointmentTime || null,
        status: data.status || "",
        appointment_type: data.appointment_type || "",
        clientUID: data.clientUID || "",
        driverUID: data.driverUID || "",
        destinationUID: data.destinationUID || "",
        milesDriven: data.milesDriven || 0,
        wheelchair: data.wheelchair || false
      };
    });

    res.json({
      success: true,
      rides,
      count: rides.length
    });

  } catch (error) {
    console.error("🔥 Error fetching calendar rides:", error);
    res.status(500).json({
      success: false,
      message: "Server error loading calendar rides.",
      error: error.message
    });
  }
});

/**
 * ============================================================================
 * ✅ POST /api/rides/assign-driver
 * Assigns a driver to multiple rides
 * 
 * Body: {
 *   "driverId": "driver123",
 *   "rideIds": "RideID01,RideID02,RideID03",
 *   "userId": "user123" (optional - logged in user's id)
 * }
 * 
 * For each ride:
 * - Sets assignedTo field to driverId (only if field is empty)
 * - Sets status to 'assigned'
 * ============================================================================
 */
router.post("/assign-driver", async (req, res) => {
  try {
    const { driverId, rideIds, userId } = req.body;
    // Get logged in user's id from request body (or token if available)
    const loggedInUserId = userId || (req.user ? req.user.userId : null);

    // Validate required fields
    if (!driverId || !rideIds) {
      return res.status(400).json({
        success: false,
        message: "driverId and rideIds are required"
      });
    }

    // Parse CSV string into array
    const rideIdArray = rideIds.split(",").map(id => id.trim()).filter(id => id.length > 0);

    if (rideIdArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "rideIds must contain at least one valid ride ID"
      });
    }

    const results = {
      success: true,
      updated: [],
      skipped: [],
      notFound: [],
      errors: []
    };

    // Process each ride ID
    for (const rideId of rideIdArray) {
      try {
        // Get the ride document
        const rideResult = await dataAccess.getRideById(rideId);

        if (!rideResult.success || !rideResult.ride) {
          results.notFound.push(rideId);
          continue;
        }

        const ride = rideResult.ride;
        
        // Check if assignedTo field already has a value
        const assignedTo = ride.assignedTo || null;
        
        if (assignedTo && assignedTo.trim() !== "") {
          // Skip this ride - already assigned
          results.skipped.push({
            rideId: rideId,
            reason: "assignedTo field already contains a value",
            currentValue: assignedTo
          });
          continue;
        }

        // Prepare update data
        const updateData = {
          status: "assigned",
          assignedTo: driverId
        };

        // Update the ride
        const updateResult = await dataAccess.updateRideById(rideId, updateData);

        if (updateResult.success) {
          results.updated.push({
            rideId: rideId,
            driverId: driverId,
            assignedBy: loggedInUserId
          });
        } else {
          results.errors.push({
            rideId: rideId,
            error: updateResult.error || "Failed to update ride"
          });
        }
      } catch (error) {
        console.error(`Error processing ride ${rideId}:`, error);
        results.errors.push({
          rideId: rideId,
          error: error.message
        });
      }
    }

    // Determine overall success
    const hasErrors = results.errors.length > 0;
    const hasUpdates = results.updated.length > 0;

    res.status(hasErrors && !hasUpdates ? 500 : 200).json({
      success: !hasErrors || hasUpdates,
      message: `Processed ${rideIdArray.length} ride(s). Updated: ${results.updated.length}, Skipped: ${results.skipped.length}, Not Found: ${results.notFound.length}, Errors: ${results.errors.length}`,
      results: results
    });

  } catch (error) {
    console.error("🔥 Error in assign-driver endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Server error assigning driver to rides.",
      error: error.message
    });
  }
});

/**
 * ============================================================================
 * ✅ POST /api/rides/set-driver
 * Sets the driverUID field in a ride document
 * 
 * Body: {
 *   "driverId": "driver123",
 *   "rideId": "ride456"
 * }
 * 
 * This is different from assigning - it directly sets the driverUID field
 * ============================================================================
 */
router.post("/set-driver", async (req, res) => {
  try {
    const { driverId, rideId } = req.body;

    // Validate required fields
    if (!driverId || !rideId) {
      return res.status(400).json({
        success: false,
        message: "driverId and rideId are required"
      });
    }

    // Get the ride document
    const rideResult = await dataAccess.getRideById(rideId);

    if (!rideResult.success || !rideResult.ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }

    // Prepare update data - set driverUID field
    const updateData = {
      driverUID: driverId
    };

    // Update the ride
    const updateResult = await dataAccess.updateRideById(rideId, updateData);

    if (updateResult.success) {
      res.status(200).json({
        success: true,
        message: "driverUID field updated successfully",
        ride: {
          rideId: rideId,
          driverId: driverId,
          updatedRide: updateResult.ride
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update ride",
        error: updateResult.error || "Unknown error"
      });
    }

  } catch (error) {
    console.error("🔥 Error in set-driver endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Server error setting driver in ride.",
      error: error.message
    });
  }
});

/**
 * ============================================================================
 * ✅ GET /api/rides/by-driver
 * Returns rides for a specific driver within an organization
 * 
 * Query params: {
 *   "orgId": "org123",
 *   "driverId": "zvco96u8CWM2ryR1CyKvyJ17VHC3"
 * }
 * 
 * The driverId is checked against the driverUID field in ride documents.
 * The driverUID field is a comma-separated list of driver IDs.
 * If the driverId matches any ID in that list, the ride is returned.
 * ============================================================================
 */
router.get("/by-driver", async (req, res) => {
  try {
    const { orgId, driverId } = req.query;

    // Validate required fields
    if (!orgId || !driverId) {
      return res.status(400).json({
        success: false,
        message: "orgId and driverId are required as query parameters"
      });
    }

    // Query rides by organization
    // Try multiple possible organization field names
    const orgFields = ['organization', 'organizationId', 'organization_id', 'OrganizationID', 'org', 'org_id'];
    let ridesSnapshot = null;
    let foundRides = false;

    for (const field of orgFields) {
      try {
        ridesSnapshot = await db.collection("rides")
          .where(field, "==", orgId)
          .get();
        
        if (!ridesSnapshot.empty) {
          foundRides = true;
          break;
        }
      } catch (error) {
        // Try next field
        continue;
      }
    }

    // If no rides found in "rides" collection, try "Rides" (capital R)
    if (!foundRides) {
      for (const field of orgFields) {
        try {
          ridesSnapshot = await db.collection("Rides")
            .where(field, "==", orgId)
            .get();
          
          if (!ridesSnapshot.empty) {
            foundRides = true;
            break;
          }
        } catch (error) {
          // Try next field
          continue;
        }
      }
    }

    if (!foundRides || !ridesSnapshot) {
      return res.json({
        success: true,
        rides: [],
        count: 0,
        message: "No rides found for the specified organization"
      });
    }

    // Filter rides where driverUID contains the driverId
    const matchingRides = [];
    
    ridesSnapshot.forEach(doc => {
      const rideData = doc.data();
      const driverUID = rideData.driverUID || rideData.driver_uid || rideData.DriverUID || "";
      
      if (driverUID) {
        // Split the comma-separated string and check if driverId is in the list
        const driverIds = driverUID.split(",").map(id => id.trim()).filter(id => id.length > 0);
        
        if (driverIds.includes(driverId)) {
          matchingRides.push({
            id: doc.id,
            ...rideData
          });
        }
      }
    });

    res.json({
      success: true,
      rides: matchingRides,
      count: matchingRides.length,
      orgId: orgId,
      driverId: driverId
    });

  } catch (error) {
    console.error("🔥 Error in by-driver endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching rides by driver.",
      error: error.message
    });
  }
});

module.exports = router;