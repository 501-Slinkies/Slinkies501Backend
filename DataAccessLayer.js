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

async function createRole(roleData) {
  const db = getFirestore();
  try {
    // Create the role document
    const roleRef = db.collection("roles").doc(roleData.name);
    await roleRef.set({
      title: roleData.title,
      org: roleData.org,
      permission_set: roleData.name, // Reference to the permission document
      created_at: new Date(),
      updated_at: new Date()
    });

    return { success: true, roleId: roleData.name };
  } catch (error) {
    console.error("Error creating role:", error);
    return { success: false, error: error.message };
  }
}

async function createPermission(permissionData) {
  const db = getFirestore();
  try {
    // Create the permission document
    const permissionRef = db.collection("permissions").doc(permissionData.name);
    await permissionRef.set({
      // CRUD operations for clients
      create_clients: permissionData.create_clients || false,
      read_clients: permissionData.read_clients || false,
      update_clients: permissionData.update_clients || false,
      delete_clients: permissionData.delete_clients || false,
      
      // CRUD operations for organization
      create_org: permissionData.create_org || false,
      read_org: permissionData.read_org || false,
      update_org: permissionData.update_org || false,
      delete_org: permissionData.delete_org || false,
      
      // CRUD operations for rides
      create_rides: permissionData.create_rides || false,
      read_rides: permissionData.read_rides || false,
      update_rides: permissionData.update_rides || false,
      delete_rides: permissionData.delete_rides || false,
      
      // CRUD operations for users
      create_users: permissionData.create_users || false,
      read_users: permissionData.read_users || false,
      update_users: permissionData.update_users || false,
      delete_users: permissionData.delete_users || false,
      
      // CRUD operations for volunteers
      create_volunteers: permissionData.create_volunteers || false,
      read_volunteers: permissionData.read_volunteers || false,
      update_volunteers: permissionData.update_volunteers || false,
      delete_volunteers: permissionData.delete_volunteers || false,
      
      // Read logs permission
      read_logs: permissionData.read_logs || false,
      
      created_at: new Date(),
      updated_at: new Date()
    });

    return { success: true, permissionId: permissionData.name };
  } catch (error) {
    console.error("Error creating permission:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { login, createRole, createPermission };
