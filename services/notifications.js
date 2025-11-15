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
 * Helper function to get volunteer by volunteer_id field
 */
async function getVolunteerByVolunteerId(volunteerId) {
  const db = getFirestore();
  try {
    const snapshot = await db.collection("volunteers")
      .where("volunteer_id", "==", volunteerId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return { success: false, error: "Volunteer not found" };
    }

    const doc = snapshot.docs[0];
    return { 
      success: true, 
      volunteer: { id: doc.id, ...doc.data() }
    };
  } catch (error) {
    console.error("Error fetching volunteer by volunteer_id:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Notify all drivers under an organization about available rides.
 * - Queries rides by organization field
 * - Filters for unassigned rides with populated driverUID
 * - driverUID contains CSV list of volunteer_id's
 * - Sends email to volunteers using their email field
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

    // Step 2: Filter for unassigned rides with populated driverUID
    const unassignedRidesWithDrivers = rides.filter((ride) => {
      const status = ride.status || ride.Status || '';
      const driverUID = ride.driverUID || ride.driverUid || ride.DriverUID || '';
      
      // Check if status is "unassigned" (case-insensitive) and driverUID is populated
      return status.toLowerCase() === 'unassigned' && 
             driverUID && 
             String(driverUID).trim().length > 0;
    });

    if (unassignedRidesWithDrivers.length === 0) {
      console.log(`No unassigned rides with drivers found for org ${orgId}`);
      return { success: true, message: "No rides available." };
    }
    
    console.log(`Found ${unassignedRidesWithDrivers.length} unassigned ride(s) with drivers for org ${orgId}`);

    // Step 3: Extract unique volunteer_id's from CSV driverUID fields
    const volunteerIds = new Set();
    unassignedRidesWithDrivers.forEach((ride) => {
      const driverUID = ride.driverUID || ride.driverUid || ride.DriverUID || '';
      
      if (driverUID) {
        // Handle comma-separated volunteer_id's
        String(driverUID)
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
          .forEach((id) => volunteerIds.add(id));
      }
    });

    if (volunteerIds.size === 0) {
      console.log(`No volunteer_id's found in driverUID fields for org ${orgId}`);
      return { success: true, message: "No drivers to notify." };
    }
    
    console.log(`Found ${volunteerIds.size} unique volunteer_id(s) to notify`);

    // Step 4: Get driver acceptance endpoint (you may want to make this configurable)
    const driverAcceptanceEndpoint = process.env.DRIVER_ACCEPTANCE_ENDPOINT || 
                                     "https://axo-lift.webdev.gccis.rit.edu/driver/accept";

    // Step 5: Send one email per volunteer
    const message = `You have rides you can accept for ${orgId}, accept them here: ${driverAcceptanceEndpoint}`;

    let sentCount = 0;
    for (const volunteerId of volunteerIds) {
      const volunteerResult = await getVolunteerByVolunteerId(volunteerId);
      if (!volunteerResult.success) {
        console.warn(`Volunteer with volunteer_id ${volunteerId} not found: ${volunteerResult.error}`);
        continue;
      }

      const volunteer = volunteerResult.volunteer;
      const emailAddress = volunteer.email || volunteer.email_address;
      
      if (!emailAddress) {
        console.warn(`Volunteer ${volunteerId} missing email address.`);
        continue;
      }

      const sendResult = await sendEmail(
        emailAddress,
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