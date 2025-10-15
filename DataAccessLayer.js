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

async function getAllVolunteers() {
  const db = getFirestore();
  try {
    // Use "volunteers" (lowercase) as shown in your Firestore console
    const volunteersRef = db.collection("volunteers");
    const snapshot = await volunteersRef.get();
    
    const volunteers = [];
    snapshot.forEach(doc => {
      volunteers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, volunteers: volunteers };
  } catch (error) {
    console.error("Error fetching volunteers:", error);
    return { success: false, error: error.message };
  }
}

async function getVolunteersByOrganization(organizationId) {
  const db = getFirestore();
  try {
    const volunteersRef = db.collection("volunteers");
    const snapshot = await volunteersRef.where("OrganizationID", "==", organizationId).get();
    
    const volunteers = [];
    snapshot.forEach(doc => {
      volunteers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, volunteers: volunteers };
  } catch (error) {
    console.error("Error fetching volunteers by organization:", error);
    return { success: false, error: error.message };
  }
}

async function getRideById(rideId) {
  const db = getFirestore();
  try {
    // Try both "Rides" (capital R) and "rides" (lowercase) for compatibility
    let rideRef = db.collection("Rides").doc(rideId);
    let doc = await rideRef.get();
    
    if (!doc.exists) {
      // Fallback to lowercase if not found
      rideRef = db.collection("rides").doc(rideId);
      doc = await rideRef.get();
    }
    
    if (!doc.exists) {
      return { success: false, error: "Ride not found" };
    }
    
    return { success: true, ride: { id: doc.id, ...doc.data() } };
  } catch (error) {
    console.error("Error fetching ride:", error);
    return { success: false, error: error.message };
  }
}

async function getRidesByDriverId(driverId) {
  const db = getFirestore();
  try {
    // First, verify the driver exists
    const driverDoc = await db.collection("volunteers").doc(driverId).get();
    if (!driverDoc.exists) {
      return { success: false, error: "Driver not found" };
    }

    // Create a reference to the driver document
    const driverRef = db.collection("volunteers").doc(driverId);
    
    // Query rides where Driver field references this volunteer
    // Try "Rides" (capital R) first
    let ridesSnapshot = await db.collection("Rides")
      .where("Driver", "==", driverRef)
      .get();
    
    // If no results, try lowercase "rides"
    if (ridesSnapshot.empty) {
      ridesSnapshot = await db.collection("rides")
        .where("Driver", "==", driverRef)
        .get();
    }
    
    const rides = [];
    ridesSnapshot.forEach(doc => {
      rides.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { 
      success: true, 
      rides: rides,
      count: rides.length,
      driverId: driverId
    };
  } catch (error) {
    console.error("Error fetching rides by driver ID:", error);
    return { success: false, error: error.message };
  }
}

async function createUser(userData) {
  const db = getFirestore();
  try {
    // Check if user with same email already exists
    if (userData.email_address) {
      const existingUserQuery = await db.collection("volunteers")
        .where("email_address", "==", userData.email_address)
        .get();
      
      if (!existingUserQuery.empty) {
        return { success: false, error: "User with this email already exists" };
      }
    }

    // Check if user_ID already exists
    if (userData.user_ID) {
      const existingUserIdQuery = await db.collection("volunteers")
        .where("user_ID", "==", userData.user_ID)
        .get();
      
      if (!existingUserIdQuery.empty) {
        return { success: false, error: "User ID already exists" };
      }
    }

    // Create the user document
    const userRef = db.collection("volunteers").doc();
    await userRef.set(userData);

    return { 
      success: true, 
      userId: userRef.id,
      message: "User created successfully"
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
}

async function getUserByEmail(email) {
  const db = getFirestore();
  try {
    const snapshot = await db.collection("volunteers")
      .where("email_address", "==", email)
      .get();
    
    if (snapshot.empty) {
      return { success: false, error: "User not found" };
    }

    const doc = snapshot.docs[0];
    return { 
      success: true, 
      user: { id: doc.id, ...doc.data() }
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: error.message };
  }
}

async function getUserById(userId) {
  const db = getFirestore();
  try {
    const doc = await db.collection("volunteers").doc(userId).get();
    
    if (!doc.exists) {
      return { success: false, error: "User not found" };
    }

    return { 
      success: true, 
      user: { id: doc.id, ...doc.data() }
    };
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return { success: false, error: error.message };
  }
}

async function getUserByUserID(userID) {
  const db = getFirestore();
  try {
    const snapshot = await db.collection("volunteers")
      .where("user_ID", "==", userID)
      .get();
    
    if (snapshot.empty) {
      return { success: false, error: "User not found" };
    }

    const doc = snapshot.docs[0];
    return { 
      success: true, 
      user: { id: doc.id, ...doc.data() }
    };
  } catch (error) {
    console.error("Error fetching user by user_ID:", error);
    return { success: false, error: error.message };
  }
}

async function updateUser(userId, updateData) {
  const db = getFirestore();
  try {
    // Check if user exists
    const userDoc = await db.collection("volunteers").doc(userId).get();
    if (!userDoc.exists) {
      return { success: false, error: "User not found" };
    }

    const currentData = userDoc.data();

    // If email is being changed, check it's not already taken by another user
    if (updateData.email_address && updateData.email_address !== currentData.email_address) {
      const existingUserQuery = await db.collection("volunteers")
        .where("email_address", "==", updateData.email_address)
        .get();
      
      if (!existingUserQuery.empty) {
        // Make sure it's not the same user
        const existingDoc = existingUserQuery.docs[0];
        if (existingDoc.id !== userId) {
          return { success: false, error: "Email address already in use by another user" };
        }
      }
    }

    // If user_ID is being changed, check it's not already taken
    if (updateData.user_ID && updateData.user_ID !== currentData.user_ID) {
      const existingUserIdQuery = await db.collection("volunteers")
        .where("user_ID", "==", updateData.user_ID)
        .get();
      
      if (!existingUserIdQuery.empty) {
        // Make sure it's not the same user
        const existingDoc = existingUserIdQuery.docs[0];
        if (existingDoc.id !== userId) {
          return { success: false, error: "User ID already in use by another user" };
        }
      }
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the user document
    await db.collection("volunteers").doc(userId).update(updateData);

    return { 
      success: true, 
      userId: userId,
      message: "User updated successfully"
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: error.message };
  }
}

async function deleteUser(userId) {
  const db = getFirestore();
  try {
    // Check if user exists
    const userDoc = await db.collection("volunteers").doc(userId).get();
    if (!userDoc.exists) {
      return { success: false, error: "User not found" };
    }

    const userData = userDoc.data();

    // Delete the user document
    await db.collection("volunteers").doc(userId).delete();

    return { 
      success: true, 
      userId: userId,
      userID: userData.user_ID,
      message: "User deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { 
  login, 
  createRole, 
  createPermission, 
  getAllVolunteers, 
  getVolunteersByOrganization, 
  getRideById,
  getRidesByDriverId,
  createUser,
  getUserByEmail,
  getUserById,
  getUserByUserID,
  updateUser,
  deleteUser
};
