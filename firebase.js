// Firebase.js - This file handles the database connection and configuration.

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
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // If the service account key is provided as an environment variable
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({
                credential: cert(serviceAccount),
            });
            console.log("Firebase Admin connected to Production Firestore using environment variable.");
        } catch (error) {
            console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY from environment variable:", error.message);
            process.exit(1);
        }
    } else {
        console.error("Firebase service account key not found.");
        console.error("Please ensure the FIREBASE_SERVICE_ACCOUNT_KEY is set in your .env file.");
        process.exit(1);
    }
}

const db = getFirestore();
module.exports = { admin, db };
