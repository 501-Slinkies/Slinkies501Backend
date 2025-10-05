const { getFirestore } = require("firebase-admin/firestore");
const bcrypt = require("bcrypt");

async function login(email, password, role) {
  const db = getFirestore();
  const usersRef = db.collection("users");
  const snapshot = await usersRef.where("email", "==", email).get();

  if (snapshot.empty) {
    console.log("No matching documents.");
    return null;
  }

  let user = null;
  for (const doc of snapshot.docs) {
    const userData = doc.data();
    if (userData.role === role) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        user = { id: doc.id, ...userData };
        break;
      }
    }
  }

  return user;
}

// Add a function below your login function
async function fetchRidesInRange(startDate, endDate) {
  const db = getFirestore();
  const ridesRef = db.collection('rides');

  const snapshot = await ridesRef
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get();

  if (snapshot.empty) return [];

  const rides = [];
  snapshot.forEach(doc => {
    rides.push({ id: doc.id, ...doc.data() });
  });

  return rides;
}

module.exports = {login, fetchRidesInRange};
