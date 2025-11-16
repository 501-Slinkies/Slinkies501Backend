const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const db = admin.firestore();

/**
 * POST /api/reports
 * Body: { selectedParams: string[], collection: "clients" | "volunteers" | "rides" }
 * Saves the report definition and returns document_id (required for GET).
 */
router.post("/", async (req, res) => {
  try {
    const { selectedParams, collection } = req.body;

    // ---- validation ----
    if (!Array.isArray(selectedParams) || selectedParams.length === 0) {
      return res.status(400).json({
        success: false,
        message: "selectedParams must be a non-empty array",
      });
    }

    if (!collection) {
      return res.status(400).json({
        success: false,
        message: "collection is required",
      });
    }

    const allowedCollections = ["clients", "volunteers", "rides"];
    if (!allowedCollections.includes(collection)) {
      return res.status(400).json({
        success: false,
        message: `collection must be one of: ${allowedCollections.join(", ")}`,
      });
    }

    // ---- save report definition ----
    const docRef = await db.collection("savedReports").add({
      selectedParams,
      collection,
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      message: "Report definition saved",
      document_id: docRef.id, // <-- this is what GET will use
    });
  } catch (error) {
    console.error("POST /api/reports error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * GET /api/reports
 * Query: ?document_id=...&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *
 * Uses the saved report definition (selectedParams + collection) +
 * optional start_date/end_date to return all matching records.
 */

// GET: retrieve report data based on saved document_id
router.get("/", async (req, res) => {
  try {
    const { document_id } = req.query;

    if (!document_id) {
      return res.status(400).json({ success: false, message: "Missing document_id" });
    }

    const savedRef = db.collection("savedReports").doc(document_id);
    const savedSnap = await savedRef.get();

    if (!savedSnap.exists) {
      return res.status(404).json({ success: false, message: "Saved report not found" });
    }

    const savedData = savedSnap.data();
    const { collection, selectedParams } = savedData;

    const querySnap = await db.collection(collection).get();
    let results = [];

    querySnap.forEach((doc) => {
      let item = {};
      
      selectedParams.forEach((field) => {
        item[field] = doc.data()[field] || null;
      });

      if (collection === "volunteers") item.volunteer_id = doc.id;
      if (collection === "clients") item.client_id = doc.id;
      if (collection === "rides") item.request_id = doc.id;

      results.push(item);
    });

    return res.status(200).json({
      success: true,
      document_id,
      collection,
      selectedParams,
      data: results
    });

  } catch (error) {
    console.error("ERROR in GET /api/reports:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});





// router.get("/", async (req, res) => {
//   try {
//     const { document_id, start_date, end_date } = req.query;

//     if (!document_id) {
//       return res.status(400).json({
//         success: false,
//         message: "document_id is required",
//       });
//     }

//     // ---- load report definition ----
//     const reportSnap = await db.collection("savedReports").doc(document_id).get();

//     if (!reportSnap.exists) {
//       return res.status(404).json({
//         success: false,
//         message: "Report definition not found for given document_id",
//       });
//     }

//     const reportData = reportSnap.data();
//     const { selectedParams, collection } = reportData;

//     if (!Array.isArray(selectedParams) || !collection) {
//       return res.status(500).json({
//         success: false,
//         message: "Saved report is missing selectedParams or collection",
//       });
//     }

//     // ---- figure out which *_id field to return ----
//     let idFieldName;
//     if (collection === "clients") {
//       idFieldName = "client_id";
//     } else if (collection === "volunteers") {
//       idFieldName = "volunteer_id";
//     } else if (collection === "rides") {
//       idFieldName = "request_id";
//     }

//     // ---- fetch whole collection then filter in JS ----
//     const snapshot = await db.collection(collection).get();
//     const results = [];

//     // parse optional dates
//     const startDate = start_date ? new Date(start_date) : null;
//     const endDate = end_date ? new Date(end_date) : null;

//     snapshot.forEach((doc) => {
//       const data = doc.data();

//       // Optional date filter (Helen’s example with "date")
//       if (startDate || endDate) {
//         const docDate = data.date ? new Date(data.date) : null;
//         if (!docDate) {
//           // no date -> skip because we don't want null values
//           return;
//         }
//         if (startDate && docDate < startDate) return;
//         if (endDate && docDate > endDate) return;
//       }

//       // build filtered object with ONLY selected fields
//       const filtered = {};
//       let hasAllValues = true;

//       selectedParams.forEach((field) => {
//         const value = data[field];
//         if (value === undefined || value === null) {
//           hasAllValues = false; // we don't want null values at all
//         } else {
//           filtered[field] = value;
//         }
//       });

//       if (!hasAllValues) {
//         // at least one selected field is null/undefined → skip this record
//         return;
//       }

//       // attach proper *_id from document id (tied to reference)
//       if (idFieldName) {
//         filtered[idFieldName] = doc.id;
//       }

//       results.push(filtered);
//     });

//     return res.json({
//       success: true,
//       document_id,
//       collection,
//       selectedParams,
//       data: results,
//     });
//   } catch (error) {
//     console.error("GET /api/reports error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });

module.exports = router;