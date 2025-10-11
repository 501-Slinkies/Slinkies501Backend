// Set up notifications.js

const twilio = require("twilio");
const sgMail = require("@sendgrid/mail");
const { db } = require("../firebase");

// Load environment variables
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM = process.env.SENDGRID_FROM_EMAIL;

// Initialize Twilio and SendGrid
const twilioClient = twilio(TWILIO_SID, TWILIO_AUTH);
sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * Send notification via Email or SMS
 * @param {string} userId - Firestore user ID
 * @param {string} message - The notification text
 * @param {string} type - "email" or "sms"
 */
async function sendNotification(userId, message, type) {
  try {
    // Retrieve user contact info from Firestore
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");

    const userData = userDoc.data();

    if (type === "sms") {
      if (!userData.phoneNumber) throw new Error("User missing phone number");

      await twilioClient.messages.create({
        body: message,
        from: TWILIO_PHONE,
        to: userData.phoneNumber
      });

      console.log(`📱 SMS sent to ${userData.phoneNumber}`);
    }

    else if (type === "email") {
      if (!userData.email) throw new Error("User missing email");

      const msg = {
        to: userData.email,
        from: SENDGRID_FROM,
        subject: "Ride Notification",
        text: message
      };

      await sgMail.send(msg);
      console.log(`📧 Email sent to ${userData.email}`);
    }

    else {
      throw new Error("Invalid notification type");
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Notification error:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendNotification };
