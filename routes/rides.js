// routes/rides.js

const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const dataAccess = require("../DataAccessLayer");

/**
 * ✅ GET /api/rides/calendar
 * Robust lookups for client/dispatcher/driver last names with many fallbacks.
 * Add ?debug=true to see which IDs were used for resolution.
 */
router.get("/calendar", async (req, res) => {
  try {
    const debug = String(req.query.debug || "false").toLowerCase() === "true";

    // --- Load collections ---
    const [ridesSnap, clientsSnap, volunteersSnap] = await Promise.all([
      db.collection("rides").get(),
      db.collection("clients").get(),
      db.collection("volunteers").get(),
    ]);

    // --- Index clients by several possible keys ---
    const clientsById = new Map();          // client document id -> last_name
    const clientsByUID = new Map();         // clientUID field     -> last_name
    clientsSnap.forEach(doc => {
      const c = doc.data() || {};
      const last = c.last_name ?? c.lastName ?? null;
      clientsById.set(doc.id, last);
      if (c.clientUID) clientsByUID.set(c.clientUID, last);
      if (c.uid)       clientsByUID.set(c.uid, last);
      if (c.client_id) clientsByUID.set(c.client_id, last);
    });

    // --- Index volunteers many ways (dispatcher/driver live here) ---
    const volByVolunteerId = new Map();     // volunteer_id -> last_name
    const volByDocId = new Map();           // doc.id       -> last_name
    const volByEmail = new Map();           // email        -> last_name
    const volByUserId = new Map();          // UserID / user_id -> last_name
    volunteersSnap.forEach(doc => {
      const v = doc.data() || {};
      const last = v.last_name ?? v.lastName ?? null;
      if (!last) return;

      if (v.volunteer_id) volByVolunteerId.set(String(v.volunteer_id), last);
      volByDocId.set(doc.id, last);
      if (v.email_address) volByEmail.set(String(v.email_address).toLowerCase(), last);
      if (v.UserID)        volByUserId.set(String(v.UserID), last);
      if (v.user_id)       volByUserId.set(String(v.user_id), last);
    });

    // --- Helpers ---
    const fmtDate = ts =>
      ts?.toDate?.().toLocaleDateString("en-US") ?? null;

    const fmtTime = ts =>
      ts?.toDate?.().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) ?? null;

    const resolveVolunteerLast = (idLike) => {
      if (!idLike) return null;
      const key = String(idLike);
      return (
        volByVolunteerId.get(key) ||
        volByDocId.get(key) ||
        volByUserId.get(key) ||
        volByEmail.get(key.toLowerCase()) ||
        null
      );
    };

    const resolveClientLast = (clientRef) => {
      if (!clientRef) return null;
      const key = String(clientRef);
      return (
        clientsByUID.get(key) ||
        clientsById.get(key) ||
        null
      );
    };

    // --- Build payload ---
    const rides = ridesSnap.docs.map(doc => {
      const r = doc.data() || {};

      // tolerate mixed field names
      const rideId = r.ride_id ?? doc.id;

      const dateTs = r.Date || r.date || null;
      const pickupTs = r.pickupTime || r.pickup_time || r.pickupTme || null;
      const apptTs = r.appointmentTime || r.appointment_time || null;

      const status = r.status ?? r.Status ?? null;
      const apptType = r.appointment_type ?? r.appointmentType ?? r.purpose ?? null;
      const miles = r.milesDriven ?? r.MilesDriven ?? 0;
      const chair = r.wheelchair ?? false;

      // IDs that might be present in different shapes
      const clientRef =
        r.clientUID ?? r.client_uid ?? r.client ?? r.clientId ?? r.client_id ?? null;

      const dispatcherRef =
        r.dispatcherUID ?? r.dispatcher_uid ?? r.dispatcher ??
        r.dispatcherId ?? r.dispatcher_id ?? r.assignedTo ?? null;

      const driverRef =
        r.driverUID ?? r.driver_uid ?? r.driver ??
        r.driverId ?? r.driver_id ?? r.driver_volunteer_ref ?? null;

      const clientLastName = resolveClientLast(clientRef);
      const dispatcherLastName = resolveVolunteerLast(dispatcherRef);
      const driverLastName = resolveVolunteerLast(driverRef);

      const item = {
        ride_id: rideId,
        date: fmtDate(dateTs),
        pickupTime: fmtTime(pickupTs),
        appointmentTime: fmtTime(apptTs),
        status,
        appointment_type: apptType,
        milesDriven: miles,
        wheelchair: chair,
        clientLastName,
        dispatcherLastName,
        driverLastName,
      };

      if (debug) {
        item._debug_ids = {
          clientRef,
          dispatcherRef,
          driverRef,
        };
      }
      return item;
    });

    res.json({ success: true, rides });
  } catch (err) {
    console.error("🔥 Error GET /api/rides/calendar:", err);
    res.status(500).json({ success: false, error: err.message });
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