// services/notifications.js
const sgMail = require("@sendgrid/mail");
const {
  getVolunteerById
} = require("../DataAccessLayer");
const { getFirestore } = require("firebase-admin/firestore");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM = process.env.SENDGRID_FROM_EMAIL;

sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * Send a single notification via Email.
 */
async function sendEmail(to, subject, message) {
  try {
    const msg = {
      to,
      from: SENDGRID_FROM,
      subject,
      text: message,
    };
    await sgMail.send(msg);
    console.log(`📧 Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`Email send failure to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Notify all drivers under an organization about available rides.
 * - Queries rides by organization field directly
 * - Uses DataAccessLayer to fetch volunteers.
 * - Avoids duplicate emails.
 */
async function notifyDriversForOrganization(orgId) {
  try {
    const db = getFirestore();
    
    // Step 1: Query rides by organization field
    const collectionsToCheck = ['rides', 'Rides'];
    const organizationFields = ['organization', 'Organization', 'org_id', 'orgId', 'organization_ID'];
    
    let rides = [];
    const seenKeys = new Set();
    
    for (const collectionName of collectionsToCheck) {
      const collectionRef = db.collection(collectionName);
      
      for (const field of organizationFields) {
        try {
          const snapshot = await collectionRef.where(field, '==', orgId).get();
          
          if (snapshot.empty) {
            continue;
          }
          
          snapshot.forEach(doc => {
            const dedupeKey = `${collectionName}:${doc.id}`;
            if (seenKeys.has(dedupeKey)) {
              return;
            }
            seenKeys.add(dedupeKey);
            rides.push({
              id: doc.id,
              ...doc.data()
            });
          });
        } catch (error) {
          console.warn(`Failed querying ${collectionName}.${field} for org ${orgId}:`, error.message);
        }
      }
    }
    
    if (rides.length === 0) {
      console.log(`No rides found for org ${orgId}`);
      return { success: true, message: "No rides available." };
    }
    
    console.log(`Found ${rides.length} ride(s) for org ${orgId}`);

    // Step 2: Identify unique drivers who have rides assigned
    const driverUIDs = new Set();
    rides.forEach((ride) => {
      // Check multiple possible driver field names
      const driverId = ride.driverUID || ride.driverUid || ride.driverId || 
                       ride.driver_uid || ride.driver_id || ride.DriverUID ||
                       ride.assignedTo || ride.assigned_to;
      
      if (driverId) {
        // Handle comma-separated driver IDs
        String(driverId)
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
          .forEach((id) => driverUIDs.add(id));
      }
    });

    if (driverUIDs.size === 0) {
      console.log(`No drivers found with assigned rides for org ${orgId}`);
      return { success: true, message: "No drivers to notify." };
    }
    
    console.log(`Found ${driverUIDs.size} unique driver(s) to notify`);

    // Step 3: Send one email per driver
    const message =
      "You have rides available for acceptance. Please visit https://axo-lift.webdev.gccis.rit.edu to review and accept available rides.";

    let sentCount = 0;
    for (const driverId of driverUIDs) {
      const driverResult = await getVolunteerById(driverId);
      if (!driverResult.success) {
        console.warn(`Driver ${driverId} not found or invalid: ${driverResult.error}`);
        continue;
      }

      const driver = driverResult.volunteer;
      if (!driver.email_address) {
        console.warn(`Driver ${driverId} missing email address.`);
        continue;
      }

      const sendResult = await sendEmail(
        driver.email_address,
        "Rides Available for Acceptance",
        message
      );

      if (sendResult.success) sentCount++;
    }

    console.log(`✅ ${sentCount} notification emails sent successfully.`);
    return { success: true, notified: sentCount };
  } catch (error) {
    console.error("Error notifying drivers:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { notifyDriversForOrganization };