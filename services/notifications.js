// Set up notifications.js

// services/notifications.js
const sgMail = require("@sendgrid/mail");
const { db } = require("../firebase");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM = process.env.SENDGRID_FROM_EMAIL;

sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * Send notification via Email or SMS (SMS mocked)
 */
async function sendNotification(userId, message, type) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) throw new Error("User not found");

    const userData = userDoc.data();

    if (type === "sms") {
      // Mock SMS sending to avoid Twilio requirement
      console.log(`[MOCK SMS] To ${userData.phoneNumber || "N/A"}: ${message}`);
      return { success: true, mocked: true };
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
    console.error("Notification error:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendNotification };