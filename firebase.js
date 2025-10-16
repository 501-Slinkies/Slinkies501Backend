// Firebase.js 

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    initializeApp({
      projectId: "dev-project",
    });
    console.log("🔥 Firebase Admin connected to Firestore Emulator");
  } else {
    const serviceAccount = require("./serviceAccountKey.json");
    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log("🔥 Firebase Admin connected to Production Firestore");
  }
}

const db = getFirestore();
module.exports = { admin, db };
