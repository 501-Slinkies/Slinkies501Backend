const express = require('express');
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const applicationLayer = require('./ApplicationLayer');
const calendarRoutes = require("./calendar");

// Conditionally initialize Firebase Admin SDK
if (process.env.FIRESTORE_EMULATOR_HOST) {
  // Connect to the Firestore Emulator
  initializeApp({
    projectId: 'dev-project', // A dummy project ID is fine for the emulator
  });
  console.log('Firebase Admin SDK connected to Firestore Emulator.');
} else {
  // Connect to production Firestore
  const serviceAccount = require('./serviceAccountKey.json');
  initializeApp({
    credential: cert(serviceAccount)
  });
  console.log('Firebase Admin SDK connected to production Firestore.');
}


const db = getFirestore();
const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).send({ message: 'Email, password, and role are required' });
  }

  const result = await applicationLayer.loginUser(email, password, role);
  if (result.success) {
    res.status(200).send(result);
  } else {
    res.status(401).send(result);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});



app.use('/api/calendar', calendarRoutes);


module.exports = {app, db};