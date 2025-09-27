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

module.exports = { login };
