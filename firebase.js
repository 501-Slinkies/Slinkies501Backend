// Firebase.js - This file handles the database connection and configuration.
require("dotenv").config();
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

if (!admin.apps.length) {
    // This logic switches between the emulator and production
    if (process.env.FIRESTORE_EMULATOR_HOST) {
        // If the emulator variable is set, connect to the emulator
        initializeApp({
            projectId: "dev-project", // A dummy project ID is fine for the emulator
        });
        console.log("Firebase Admin connected to Firestore Emulator");
    } else {
        // Otherwise, connect to the live production database
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializeApp({
            credential: cert(serviceAccount),
        });
        console.log("Firebase Admin connected to Production Firestore");
    }
}

const db = getFirestore();
module.exports = { admin, db };
