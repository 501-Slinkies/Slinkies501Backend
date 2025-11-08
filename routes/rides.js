// routes/rides.js

const express = require("express");
const router = express.Router();
const { db } = require("../firebase");

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



module.exports = router;