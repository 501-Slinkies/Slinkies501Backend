// utils/notificationService.js
require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const twilio = require("twilio");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendNotification(user, message, type) {
  try {
    if (!user || (!user.email && !user.phone)) {
      return { success: false, message: "User contact info missing" };
    }

    if (type === "email" && user.email) {
      const msg = {
        to: user.email,
        from: "noreply@slinkies.org",
        subject: "Ride Notification",
        text: message,
      };
      await sgMail.send(msg);
    }

    if (type === "sms" && user.phone) {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone,
      });
    }

    return { success: true, message: "Notification sent" };

  } catch (error) {
    console.error("Notification error:", error);
    return { success: false, message: "Notification failed", error };
  }
}

module.exports = { sendNotification };