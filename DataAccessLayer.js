const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { hashPassword } = require("./utils/encryption");

// Migration-friendly batch helpers
function createBatch() {
  const db = getFirestore();
  return db.batch();
}

async function commitBatch(batch) {
  return batch.commit();
}

function setBatchDoc(batch, collectionName, docId, data, options = {}) {
  const db = getFirestore();
  const ref = db.collection(collectionName).doc(docId);
  if (options.merge) batch.set(ref, data, { merge: true });
  else batch.set(ref, data);
  return ref;
}

async function login(username, password) {
  const db = getFirestore();
  const volunteersRef = db.collection("volunteers");
  const snapshot = await volunteersRef.where("email_address", "==", username).get();

  if (snapshot.empty) {
    console.log("No matching documents.");
    return null;
  }

  let user = null;
  let hashedInput;
  try {
    hashedInput = hashPassword(password);
  } catch (error) {
    console.error("Failed to hash password during login:", error);
    return null;
  }

  for (const doc of snapshot.docs) {
    const userData = doc.data();
    const storedPassword = userData.password;

    if (typeof storedPassword !== "string") {
      continue;
    }

    // Support both hashed passwords (preferred) and legacy plain-text passwords.
    if (storedPassword === hashedInput || storedPassword === password) {
      user = { id: doc.id, ...userData };
      break;
    }
  }

  return user;
}

async function createRole(roleData) {
  const db = getFirestore();
  try {
    if (!roleData.name || !roleData.org_id) {
      return { success: false, error: 'Role name and org_id are required' };
    }

    // Try multiple collection names for compatibility
    const roleCollections = ['roles', 'Roles', 'role', 'Role'];
    
    for (const collectionName of roleCollections) {
      try {
        const roleRef = db.collection(collectionName).doc(roleData.name);
        const docSnapshot = await roleRef.get();
        
        if (docSnapshot.exists) {
          return { success: false, error: 'Role with this name already exists' };
        }

        // Create the role document with only name, org_id, and parentRole
        const roleDocument = {
          name: roleData.name,
          org_id: roleData.org_id,
          created_at: new Date(),
          updated_at: new Date()
        };

        // Add parentRole only if provided
        if (roleData.parentRole) {
          roleDocument.parentRole = roleData.parentRole;
        }

        await roleRef.set(roleDocument);

        return { success: true, roleId: roleData.name, collection: collectionName };
      } catch (error) {
        // If this collection doesn't work, try the next one
        console.warn(`Failed to create role in ${collectionName}:`, error.message);
        continue;
      }
    }

    return { success: false, error: 'Failed to create role in any collection' };
  } catch (error) {
    console.error("Error creating role:", error);
    return { success: false, error: error.message };
  }
}

async function updateRole(roleName, updateData) {
  const db = getFirestore();
  try {
    if (!roleName || typeof roleName !== 'string' || roleName.trim() === '') {
      return { success: false, error: 'Role name is required' };
    }

    const normalizedRoleName = roleName.trim();

    // Try multiple collection names for compatibility
    const roleCollections = ['roles', 'Roles', 'role', 'Role'];
    let roleFound = false;
    let roleCollection = null;
    let roleDoc = null;
    let roleRef = null;

    // First, find the role document
    for (const collectionName of roleCollections) {
      try {
        roleRef = db.collection(collectionName).doc(normalizedRoleName);
        const docSnapshot = await roleRef.get();
        
        if (docSnapshot.exists) {
          roleFound = true;
          roleCollection = collectionName;
          roleDoc = { id: docSnapshot.id, ...docSnapshot.data() };
          break;
        }
      } catch (error) {
        console.warn(`Failed to check role in ${collectionName}:`, error.message);
        continue;
      }
    }

    // If not found by document ID, try querying by name field
    if (!roleFound) {
      for (const collectionName of roleCollections) {
        try {
          const snapshot = await db.collection(collectionName)
            .where('name', '==', normalizedRoleName)
            .limit(1)
            .get();
          
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            roleFound = true;
            roleCollection = collectionName;
            roleRef = doc.ref;
            roleDoc = { id: doc.id, ...doc.data() };
            break;
          }
        } catch (error) {
          console.warn(`Failed to query role in ${collectionName}:`, error.message);
          continue;
        }
      }
    }

    if (!roleFound || !roleDoc || !roleRef) {
      return { success: false, error: 'Role not found' };
    }

    const currentData = roleDoc;
    const newName = updateData.name || updateData.roleName;
    const newDocId = updateData.docId || updateData.documentId || newName;
    
    // Check if name or document ID is being changed
    const nameChanging = newName && newName.trim() !== normalizedRoleName && newName.trim() !== currentData.name;
    const docIdChanging = newDocId && newDocId.trim() !== normalizedRoleName && newDocId.trim() !== roleDoc.id;

    // If name or document ID is changing, we need to create a new document and delete the old one
    if (nameChanging || docIdChanging) {
      const finalNewName = (newName || normalizedRoleName).trim();
      const finalNewDocId = (newDocId || finalNewName).trim();

      // Check if a role with the new name/doc ID already exists
      for (const collectionName of roleCollections) {
        try {
          const checkRef = db.collection(collectionName).doc(finalNewDocId);
          const checkDoc = await checkRef.get();
          
          if (checkDoc.exists) {
            return { success: false, error: `Role with name/ID "${finalNewDocId}" already exists` };
          }

          // Also check by name field if different from doc ID
          if (finalNewName !== finalNewDocId) {
            const nameCheckSnapshot = await db.collection(collectionName)
              .where('name', '==', finalNewName)
              .limit(1)
              .get();
            
            if (!nameCheckSnapshot.empty) {
              return { success: false, error: `Role with name "${finalNewName}" already exists` };
            }
          }
        } catch (error) {
          console.warn(`Failed to check for existing role in ${collectionName}:`, error.message);
        }
      }

      // Prepare the new document data
      const newRoleData = {
        ...currentData,
        name: finalNewName,
        updated_at: new Date()
      };

      // Apply other field updates
      const allowedFields = ['org_id', 'parentRole', 'view'];
      for (const field of allowedFields) {
        if (updateData.hasOwnProperty(field)) {
          newRoleData[field] = updateData[field];
        }
      }

      // Remove id from newRoleData since it will be set by Firestore
      delete newRoleData.id;

      // Create new document with new ID
      const newRoleRef = db.collection(roleCollection).doc(finalNewDocId);
      await newRoleRef.set(newRoleData);

      // Update permission document if it exists and references the old role name
      const permissionCollections = ['Permissions', 'permissions', 'Permission', 'permission'];
      for (const permCollectionName of permissionCollections) {
        try {
          const oldPermissionRef = db.collection(permCollectionName).doc(normalizedRoleName);
          const oldPermissionDoc = await oldPermissionRef.get();
          
          if (oldPermissionDoc.exists) {
            // Create new permission document with new name
            const newPermissionRef = db.collection(permCollectionName).doc(finalNewName);
            await newPermissionRef.set(oldPermissionDoc.data());
            
            // Update role to reference new permission
            await newRoleRef.update({
              permission_set: newPermissionRef
            });
            
            // Delete old permission document
            await oldPermissionRef.delete();
            break;
          }
        } catch (error) {
          console.warn(`Failed to update permission reference in ${permCollectionName}:`, error.message);
        }
      }

      // Delete old role document
      await roleRef.delete();

      // Get the new document
      const updatedDoc = await newRoleRef.get();

      return {
        success: true,
        role: { id: updatedDoc.id, ...updatedDoc.data() },
        collection: roleCollection,
        renamed: true,
        oldId: normalizedRoleName,
        newId: finalNewDocId
      };
    } else {
      // Regular update without renaming
      // Prepare update object with only allowed fields
      const allowedFields = ['org_id', 'parentRole', 'view'];
      const updateObject = {
        updated_at: new Date()
      };

      // Add allowed fields that are being updated
      for (const field of allowedFields) {
        if (updateData.hasOwnProperty(field)) {
          updateObject[field] = updateData[field];
        }
      }

      // Validate org_id change if it's being updated
      if (updateObject.org_id && updateObject.org_id !== currentData.org_id) {
        // Check if another role with the same name already has this org_id
        // (This validation is optional - roles are typically unique by name, not org_id)
        // We'll allow org_id updates for now
      }

      // If no fields to update (besides updated_at), return error
      if (Object.keys(updateObject).length === 1) {
        return { success: false, error: 'No valid fields to update' };
      }

      // Update the role document
      await roleRef.update(updateObject);

      // Get the updated document
      const updatedDoc = await roleRef.get();

      return {
        success: true,
        role: { id: updatedDoc.id, ...updatedDoc.data() },
        collection: roleCollection,
        renamed: false
      };
    }
  } catch (error) {
    console.error("Error updating role:", error);
    return { success: false, error: error.message };
  }
}

async function createPermission(permissionData) {
  const db = getFirestore();
  try {
    if (!permissionData.name) {
      return { success: false, error: 'Permission name is required' };
    }

    // Try multiple collection names for compatibility
    const permissionCollections = ['Permissions', 'permissions', 'Permission', 'permission'];
    
    for (const collectionName of permissionCollections) {
      try {
        const permissionRef = db.collection(collectionName).doc(permissionData.name);
        const docSnapshot = await permissionRef.get();
        
        if (docSnapshot.exists) {
          return { success: false, error: 'Permission with this name already exists' };
        }

        // Create the permission document with all boolean values
        await permissionRef.set({
          // CRUD operations for clients
          create_clients: permissionData.create_clients === true,
          read_clients: permissionData.read_clients === true,
          update_clients: permissionData.update_clients === true,
          delete_clients: permissionData.delete_clients === true,
          
          // CRUD operations for organization
          create_org: permissionData.create_org === true,
          read_org: permissionData.read_org === true,
          update_org: permissionData.update_org === true,
          delete_org: permissionData.delete_org === true,
          
          // CRUD operations for rides
          create_rides: permissionData.create_rides === true,
          read_rides: permissionData.read_rides === true,
          update_rides: permissionData.update_rides === true,
          delete_rides: permissionData.delete_rides === true,
          
          // CRUD operations for roles
          create_roles: permissionData.create_roles === true,
          read_roles: permissionData.read_roles === true,
          update_roles: permissionData.update_roles === true,
          delete_roles: permissionData.delete_roles === true,
          
          // CRUD operations for volunteers
          create_volunteers: permissionData.create_volunteers === true,
          read_volunteers: permissionData.read_volunteers === true,
          update_volunteers: permissionData.update_volunteers === true,
          delete_volunteers: permissionData.delete_volunteers === true,
          
          // Read logs permission
          read_logs: permissionData.read_logs === true,
          
          created_at: new Date(),
          updated_at: new Date()
        });

        return { success: true, permissionId: permissionData.name, permissionRef: permissionRef, collection: collectionName };
      } catch (error) {
        console.warn(`Failed to create permission in ${collectionName}:`, error.message);
        continue;
      }
    }

    return { success: false, error: 'Failed to create permission in any collection' };
  } catch (error) {
    console.error("Error creating permission:", error);
    return { success: false, error: error.message };
  }
}

async function createPermissionAndUpdateRole(roleName, permissionData) {
  const db = getFirestore();
  try {
    if (!roleName) {
      return { success: false, error: 'Role name is required' };
    }

    if (!permissionData) {
      return { success: false, error: 'Permission data is required' };
    }

    // Set the permission name (will use roleName as the permission document ID)
    permissionData.name = roleName;

    // Create the permission document
    const permissionResult = await createPermission(permissionData);
    
    if (!permissionResult.success) {
      return permissionResult;
    }

    // Now update the role document to reference the permission
    const roleCollections = ['roles', 'Roles', 'role', 'Role'];
    let roleUpdated = false;
    let roleCollection = null;
    
    for (const collectionName of roleCollections) {
      try {
        const roleRef = db.collection(collectionName).doc(roleName);
        const roleDoc = await roleRef.get();
        
        if (roleDoc.exists) {
          // Create a document reference to the permission
          const permissionRef = db.collection(permissionResult.collection).doc(roleName);
          
          // Update the role with the permission_set reference
          await roleRef.update({
            permission_set: permissionRef,
            updated_at: new Date()
          });
          
          roleUpdated = true;
          roleCollection = collectionName;
          break;
        }
      } catch (error) {
        console.warn(`Failed to update role in ${collectionName}:`, error.message);
        continue;
      }
    }

    if (!roleUpdated) {
      // Permission was created but role wasn't found/updated
      // We could optionally delete the permission, but for now just return a warning
      return { 
        success: false, 
        error: 'Permission created but role not found to update. Role may need to be created first.' 
      };
    }

    return { 
      success: true, 
      permissionId: permissionResult.permissionId,
      roleName: roleName,
      permissionRef: permissionResult.permissionRef,
      roleCollection: roleCollection
    };
  } catch (error) {
    console.error("Error creating permission and updating role:", error);
    return { success: false, error: error.message };
  }
}

async function getRolesByOrganization(orgId) {
  const db = getFirestore();
  try {
    if (!orgId || (typeof orgId === 'string' && orgId.trim() === '')) {
      return { success: false, error: 'Organization ID is required' };
    }

    const normalizedOrgId = typeof orgId === 'string' ? orgId.trim() : `${orgId}`;
    const targets = ['roles', 'Roles', 'role', 'Role'];
    const organizationsToMatch = [normalizedOrgId, 'default'];
    const fieldsToCheck = [
      'org',
      'org_id',
      'organization',
      'organizationId',
      'organization_id',
      'OrganizationID',
      'Organization'
    ];

    const roles = [];
    const seen = new Set();

    for (const collectionName of targets) {
      const collectionRef = db.collection(collectionName);

      for (const field of fieldsToCheck) {
        for (const orgValue of organizationsToMatch) {
          try {
            const snapshot = await collectionRef
              .where(field, '==', orgValue)
              .get();

            if (snapshot.empty) {
              continue;
            }

            snapshot.forEach(doc => {
              const dedupeKey = `${collectionName}:${doc.id}`;
              if (seen.has(dedupeKey)) {
                return;
              }
              seen.add(dedupeKey);
              roles.push({
                id: doc.id,
                sourceCollection: collectionName,
                matchedField: field,
                matchedOrg: orgValue,
                ...doc.data()
              });
            });
          } catch (error) {
            console.warn(`Error querying ${collectionName}.${field} for org ${orgValue}:`, error.message);
          }
        }
      }
    }

    return { success: true, roles };
  } catch (error) {
    console.error('Error fetching roles by organization:', error);
    return { success: false, error: error.message };
  }
}

async function getPermissionSetByRoleName(roleName) {
  const db = getFirestore();
  try {
    if (!roleName || typeof roleName !== 'string' || roleName.trim() === '') {
      return { success: false, error: 'Role name is required' };
    }

    const normalizedRoleName = roleName.trim();
    const roleCollections = ['roles', 'Roles', 'role', 'Role'];

    let roleDoc = null;
    for (const collectionName of roleCollections) {
      const doc = await db.collection(collectionName).doc(normalizedRoleName).get();
      if (doc.exists) {
        roleDoc = { id: doc.id, ...doc.data() };
        break;
      }
    }

    if (!roleDoc) {
      const candidateFields = ['name', 'role_name', 'roleName', 'RoleName'];

      for (const collectionName of roleCollections) {
        for (const field of candidateFields) {
          const snapshot = await db.collection(collectionName)
            .where(field, '==', normalizedRoleName)
            .limit(1)
            .get();
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            roleDoc = { id: doc.id, ...doc.data() };
            break;
          }
        }
        if (roleDoc) {
          break;
        }
      }
    }

    if (!roleDoc) {
      return { success: false, error: 'Role not found' };
    }

    const permissionSetName = roleDoc.permission_set || roleDoc.permissionSet;
    const parentRoleName = roleDoc.parent_role || roleDoc.parentRole || roleDoc.parentRoleName;

    const fetchPermissionSet = async (identifier) => {
      if (!identifier) {
        return null;
      }

      if (typeof identifier === 'object' && typeof identifier.get === 'function') {
        const snapshot = await identifier.get();
        if (snapshot.exists) {
          return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
      }

      if (typeof identifier !== 'string') {
        return null;
      }

      let trimmed = identifier.trim();
      if (!trimmed) {
        return null;
      }

      if (trimmed.startsWith('/')) {
        trimmed = trimmed.replace(/^\/+/, '');
      }

      // Attempt direct doc path lookup
      try {
        const directDoc = await db.doc(trimmed).get();
        if (directDoc.exists) {
          return { id: directDoc.id, ...directDoc.data() };
        }
      } catch (error) {
        console.warn(`Error fetching permission set via direct path ${trimmed}:`, error.message);
      }

      let collectionHint = null;
      let permissionIdentifier = trimmed;
      const segments = trimmed.split('/').filter(segment => segment.length > 0);
      if (segments.length > 1) {
        collectionHint = segments.slice(0, -1).join('/');
        permissionIdentifier = segments[segments.length - 1];
      }

      const baseCollections = ['permissions', 'Permissions'];
      const collectionsToCheck = collectionHint
        ? Array.from(new Set([
            collectionHint,
            collectionHint.toLowerCase(),
            collectionHint.charAt(0).toUpperCase() + collectionHint.slice(1),
            ...baseCollections
          ]))
        : baseCollections;

      for (const collectionName of collectionsToCheck) {
        try {
          const docRef = db.collection(collectionName).doc(permissionIdentifier);
          const docSnapshot = await docRef.get();
          if (docSnapshot.exists) {
            return { id: docSnapshot.id, ...docSnapshot.data() };
          }
        } catch (error) {
          console.warn(`Error fetching permission set ${permissionIdentifier} from ${collectionName}:`, error.message);
        }
      }

      for (const collectionName of baseCollections) {
        try {
          const snapshot = await db.collection(collectionName)
            .where('name', '==', permissionIdentifier)
            .limit(1)
            .get();
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
          }
        } catch (error) {
          console.warn(`Error querying permission set ${permissionIdentifier} by name in ${collectionName}:`, error.message);
        }
      }

      return null;
    };

    let permissionDoc = await fetchPermissionSet(permissionSetName);

    if (!permissionDoc && parentRoleName) {
      const parentResult = await getPermissionSetByRoleName(parentRoleName);
      if (parentResult.success && parentResult.permissionSet) {
        permissionDoc = parentResult.permissionSet;
      }
    }

    if (!permissionDoc) {
      return { success: false, error: 'Permission set not found' };
    }

    return {
      success: true,
      role: roleDoc,
      permissionSet: permissionDoc
    };
  } catch (error) {
    console.error('Error fetching permission set by role name:', error);
    return { success: false, error: error.message };
  }
}

async function getRoleByName(roleName) {
  const db = getFirestore();

  try {
    if (!roleName || typeof roleName !== "string") {
      return { success: false, error: "Role name is required" };
    }

    const normalizedRoleName = roleName.trim();
    if (!normalizedRoleName) {
      return { success: false, error: "Role name is required" };
    }

    // Attempt to fetch by document ID (role name is commonly used as doc id)
    const roleDoc = await db.collection("Roles").doc(normalizedRoleName).get();
    if (roleDoc.exists) {
      return { success: true, role: { id: roleDoc.id, ...roleDoc.data() } };
    }

    // Fallback: query by name field if stored separately
    const querySnapshot = await db
      .collection("Roles")
      .where("name", "==", normalizedRoleName)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { success: true, role: { id: doc.id, ...doc.data() } };
    }

    return { success: false, error: "Role not found" };
  } catch (error) {
    console.error("Error fetching role:", error);
    return { success: false, error: error.message };
  }
}

async function getParentRoleView(roleName) {
  const db = getFirestore();
  try {
    if (!roleName || typeof roleName !== "string") {
      return { success: false, error: "Role name is required" };
    }

    const normalizedRoleName = roleName.trim();
    if (!normalizedRoleName) {
      return { success: false, error: "Role name is required" };
    }

    // Find the role document - try multiple collections and methods
    const roleCollections = ['roles', 'Roles', 'role', 'Role'];
    let roleDoc = null;

    // First, try by document ID
    for (const collectionName of roleCollections) {
      const doc = await db.collection(collectionName).doc(normalizedRoleName).get();
      if (doc.exists) {
        roleDoc = { id: doc.id, ...doc.data() };
        break;
      }
    }

    // If not found, try querying by name field
    if (!roleDoc) {
      for (const collectionName of roleCollections) {
        const snapshot = await db.collection(collectionName)
          .where("name", "==", normalizedRoleName)
          .limit(1)
          .get();
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          roleDoc = { id: doc.id, ...doc.data() };
          break;
        }
      }
    }

    if (!roleDoc) {
      return { success: false, error: "Role not found" };
    }

    // Get the parent role name
    const parentRoleName = roleDoc.parent_role || roleDoc.parentRole || roleDoc.parentRoleName;
    if (!parentRoleName) {
      return { success: false, error: "Parent role not found for this role" };
    }

    // Find the parent role document
    let parentRoleDoc = null;
    for (const collectionName of roleCollections) {
      const doc = await db.collection(collectionName).doc(parentRoleName).get();
      if (doc.exists) {
        parentRoleDoc = { id: doc.id, ...doc.data() };
        break;
      }
    }

    // If not found by ID, try querying by name field
    if (!parentRoleDoc) {
      for (const collectionName of roleCollections) {
        const snapshot = await db.collection(collectionName)
          .where("name", "==", parentRoleName)
          .limit(1)
          .get();
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          parentRoleDoc = { id: doc.id, ...doc.data() };
          break;
        }
      }
    }

    if (!parentRoleDoc) {
      return { success: false, error: "Parent role document not found" };
    }

    // Get the view field
    const view = parentRoleDoc.view || null;
    if (view === null) {
      return { success: false, error: "View field not found in parent role" };
    }

    return { success: true, view: view };
  } catch (error) {
    console.error("Error fetching parent role view:", error);
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
    const snapshot = await volunteersRef.where("organization", "==", organizationId).get();
    
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

async function getUnassignedRidesByOrganizationAndVolunteer(orgId, volunteerId) {
  const db = getFirestore();
  try {
    if (!orgId || (typeof orgId === 'string' && orgId.trim() === '')) {
      return { success: false, error: 'Organization ID is required' };
    }

    if (!volunteerId || (typeof volunteerId === 'string' && volunteerId.trim() === '')) {
      return { success: false, error: 'Volunteer ID is required' };
    }

    const normalizedOrgId = typeof orgId === 'string' ? orgId.trim() : `${orgId}`;
    const normalizedVolunteerId = typeof volunteerId === 'string' ? volunteerId.trim() : `${volunteerId}`;
    
    // Query rides by organization field (similar to notifications.js pattern)
    const collectionsToCheck = ['rides', 'Rides'];
    const organizationFields = ['organization', 'Organization', 'org_id', 'orgId', 'organization_ID'];
    
    let rides = [];
    const seenKeys = new Set();
    
    for (const collectionName of collectionsToCheck) {
      const collectionRef = db.collection(collectionName);
      
      for (const field of organizationFields) {
        try {
          const snapshot = await collectionRef.where(field, '==', normalizedOrgId).get();
          
          if (snapshot.empty) {
            continue;
          }
          
          snapshot.forEach(doc => {
            const dedupeKey = `${collectionName}:${doc.id}`;
            if (seenKeys.has(dedupeKey)) {
              return;
            }
            seenKeys.add(dedupeKey);
            rides.push({
              id: doc.id,
              ...doc.data()
            });
          });
        } catch (error) {
          console.warn(`Failed querying ${collectionName}.${field} for org ${normalizedOrgId}:`, error.message);
        }
      }
    }

    // Filter for unassigned rides where volunteer_id is in driverUID
    const filteredRides = rides.filter((ride) => {
      // Check status is "unassigned" (case-insensitive)
      const status = ride.status || ride.Status || '';
      if (status.toLowerCase() !== 'unassigned') {
        return false;
      }

      // Check if volunteer_id is in driverUID CSV string
      const driverUID = ride.driverUID || ride.driverUid || ride.DriverUID || '';
      if (!driverUID) {
        return false;
      }

      // Parse CSV and check if volunteer_id matches
      const driverIds = String(driverUID)
        .split(',')
        .map(id => id.trim())
        .filter(Boolean);

      return driverIds.includes(normalizedVolunteerId);
    });

    return {
      success: true,
      rides: filteredRides,
      count: filteredRides.length,
      orgId: normalizedOrgId,
      volunteerId: normalizedVolunteerId
    };
  } catch (error) {
    console.error('Error fetching unassigned rides by organization and volunteer:', error);
    return { success: false, error: error.message };
  }
}

async function getRidesByDriverIdentifiers(identifiers) {
  const db = getFirestore();
  try {
    if (!Array.isArray(identifiers) || identifiers.length === 0) {
      return { success: true, rides: [], matchedIdentifiers: [] };
    }

    const normalizedIdentifiers = Array.from(
      new Set(
        identifiers
          .filter(value => value !== undefined && value !== null)
          .map(value => {
            const str = typeof value === 'string' ? value : `${value}`;
            return str.trim();
          })
          .filter(value => value.length > 0)
      )
    );

    if (normalizedIdentifiers.length === 0) {
      return { success: true, rides: [], matchedIdentifiers: [] };
    }

    const collectionsToCheck = ['rides', 'Rides'];
    const stringFields = [
      'assignedTo',
      'assigned_to',
      'driverUID',
      'driverUid',
      'DriverUID',
      'driverId',
      'driver_id',
      'driverVolunteerUID',
      'driver_volunteer_uid',
      'driverVolunteerId',
      'driver_volunteer_id',
      'driverVolunteer',
      'driver_volunteer',
      'driverVolunteerName',
      'driver_volunteer_name'
    ];
    const referenceFields = [
      'Driver',
      'driverVolunteerRef',
      'driver_volunteer_ref'
    ];

    const rides = [];
    const seenKeys = new Set();
    const matchedIdentifiers = new Set();

    for (const collectionName of collectionsToCheck) {
      const collectionRef = db.collection(collectionName);

      for (const field of stringFields) {
        for (const identifier of normalizedIdentifiers) {
          try {
            const snapshot = await collectionRef.where(field, '==', identifier).get();
            if (snapshot.empty) {
              continue;
            }

            snapshot.forEach(doc => {
              const dedupeKey = `${collectionName}:${doc.id}`;
              if (seenKeys.has(dedupeKey)) {
                return;
              }
              seenKeys.add(dedupeKey);
              matchedIdentifiers.add(identifier);
              rides.push({
                id: doc.id,
                sourceCollection: collectionName,
                matchField: field,
                matchIdentifier: identifier,
                ...doc.data()
              });
            });
          } catch (error) {
            console.warn(`Failed querying ${collectionName}.${field} for identifier ${identifier}:`, error.message);
          }
        }
      }

      for (const field of referenceFields) {
        for (const identifier of normalizedIdentifiers) {
          try {
            const reference = db.collection('volunteers').doc(identifier);
            const snapshot = await collectionRef.where(field, '==', reference).get();
            if (snapshot.empty) {
              continue;
            }

            snapshot.forEach(doc => {
              const dedupeKey = `${collectionName}:${doc.id}`;
              if (seenKeys.has(dedupeKey)) {
                return;
              }
              seenKeys.add(dedupeKey);
              matchedIdentifiers.add(identifier);
              rides.push({
                id: doc.id,
                sourceCollection: collectionName,
                matchField: field,
                matchIdentifier: identifier,
                ...doc.data()
              });
            });
          } catch (error) {
            console.warn(`Failed querying ${collectionName}.${field} for identifier ${identifier}:`, error.message);
          }
        }
      }
    }

    return {
      success: true,
      rides,
      matchedIdentifiers: Array.from(matchedIdentifiers)
    };
  } catch (error) {
    console.error('Error fetching rides by driver identifiers:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to normalize roles to role array format (singular)
function normalizeRolesToArray(userData) {
  if (!userData) {
    return userData;
  }

  // Create a copy to avoid mutating the original
  const normalized = { ...userData };

  // Convert roles (plural), role (string), or role_name to role array (singular)
  if (normalized.role && typeof normalized.role === 'string') {
    // Convert single role string to array
    normalized.role = [normalized.role.trim()];
  } else if (normalized.role_name && typeof normalized.role_name === 'string') {
    // Convert role_name string to array
    normalized.role = [normalized.role_name.trim()];
    delete normalized.role_name;
  } else if (normalized.roles) {
    // Convert roles (plural) to role (singular) array
    if (Array.isArray(normalized.roles)) {
      // Clean up array - trim strings and filter out empty values
      normalized.role = normalized.roles
        .map(role => typeof role === 'string' ? role.trim() : String(role))
        .filter(role => role.length > 0);
    } else if (typeof normalized.roles === 'string') {
      normalized.role = [normalized.roles.trim()];
    } else {
      normalized.role = [];
    }
    delete normalized.roles;
  } else if (!normalized.role) {
    // If no role field exists, set to empty array
    normalized.role = [];
  } else if (Array.isArray(normalized.role)) {
    // Ensure role array is clean - trim strings and filter out empty values
    normalized.role = normalized.role
      .map(role => typeof role === 'string' ? role.trim() : String(role))
      .filter(role => role.length > 0);
  }

  return normalized;
}

async function createUser(userData) {
  const db = getFirestore();
  try {
    // Normalize roles to array format
    const normalizedUserData = normalizeRolesToArray(userData);

    // Check if user with same email already exists
    if (normalizedUserData.email_address) {
      const existingUserQuery = await db.collection("volunteers")
        .where("email_address", "==", normalizedUserData.email_address)
        .get();
      
      if (!existingUserQuery.empty) {
        return { success: false, error: "User with this email already exists" };
      }
    }

    // Check if user_ID already exists
    if (normalizedUserData.user_ID) {
      const existingUserIdQuery = await db.collection("volunteers")
        .where("user_ID", "==", normalizedUserData.user_ID)
        .get();
      
      if (!existingUserIdQuery.empty) {
        return { success: false, error: "User ID already exists" };
      }
    }

    // Create the user document
    const userRef = db.collection("volunteers").doc();
    await userRef.set(normalizedUserData);

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

    // Prevent password updates through this function - passwords must be reset via resetPassword function
    if (updateData.password !== undefined) {
      return { success: false, error: "Password cannot be updated through this endpoint. Use the password reset endpoint instead." };
    }

    // Normalize roles to array format if roles are being updated
    const normalizedUpdateData = normalizeRolesToArray(updateData);

    // If email is being changed, check it's not already taken by another user
    if (normalizedUpdateData.email_address && normalizedUpdateData.email_address !== currentData.email_address) {
      const existingUserQuery = await db.collection("volunteers")
        .where("email_address", "==", normalizedUpdateData.email_address)
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
    if (normalizedUpdateData.user_ID && normalizedUpdateData.user_ID !== currentData.user_ID) {
      const existingUserIdQuery = await db.collection("volunteers")
        .where("user_ID", "==", normalizedUpdateData.user_ID)
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
    normalizedUpdateData.updated_at = new Date();

    // Update the user document
    await db.collection("volunteers").doc(userId).update(normalizedUpdateData);

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

async function resetPassword(userId, newPassword) {
  const db = getFirestore();
  const { hashPassword } = require("./utils/encryption");
  
  try {
    // Check if user exists
    const userDoc = await db.collection("volunteers").doc(userId).get();
    if (!userDoc.exists) {
      return { success: false, error: "User not found" };
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
      return { success: false, error: "New password is required and must be a non-empty string" };
    }

    // Hash the new password
    const hashedPassword = hashPassword(newPassword.trim());

    // Update the user's password
    await db.collection("volunteers").doc(userId).update({
      password: hashedPassword,
      updated_at: new Date()
    });

    return { 
      success: true, 
      userId: userId,
      message: "Password reset successfully"
    };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { success: false, error: error.message };
  }
}

async function resetPasswordByUserID(userID, newPassword) {
  const db = getFirestore();
  const { hashPassword } = require("./utils/encryption");
  
  try {
    // Find user by user_ID
    const snapshot = await db.collection("volunteers")
      .where("uid", "==", userID)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: "User not found" };
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
      return { success: false, error: "New password is required and must be a non-empty string" };
    }

    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;

    // Hash the new password
    const hashedPassword = hashPassword(newPassword.trim());

    // Update the user's password
    await db.collection("volunteers").doc(userId).update({
      password: hashedPassword,
      updated_at: new Date()
    });

    return { 
      success: true, 
      userId: userId,
      userID: userID,
      message: "Password reset successfully"
    };
  } catch (error) {
    console.error("Error resetting password:", error);
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


async function fetchRidesInRange(startDate, endDate) {
  const db = getFirestore();
  const rangeStart = new Date(startDate);
  const rangeEnd = new Date(endDate);
  const rides = [];
  const seen = new Set();
  const collectionsToCheck = ['rides', 'Rides'];

  for (const collectionName of collectionsToCheck) {
    try {
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef
        .where('appointmentTime', '>=', new Date(rangeStart))
        .where('appointmentTime', '<=', new Date(rangeEnd))
        .get();

      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const dedupeKey = `${collectionName}:${doc.id}`;
          if (seen.has(dedupeKey)) {
            return;
          }
          seen.add(dedupeKey);
          rides.push({
            id: doc.id,
            sourceCollection: collectionName,
            ...doc.data()
          });
        });
      }
    } catch (error) {
      console.error(
        `Error fetching rides from ${collectionName} between ${rangeStart.toISOString()} and ${rangeEnd.toISOString()}:`,
        error
      );
    }
  }

  return rides;
}

async function createRide(rideData) {
  const db = getFirestore();
  try {
    // Check if ride with this UID already exists
    const existingRide = await db.collection("rides")
      .where("UID", "==", rideData.UID)
      .get();

    if (!existingRide.empty) {
      return { success: false, error: "Ride with this UID already exists" };
    }

    // Create the ride document
    const rideRef = db.collection("rides").doc();
    await rideRef.set(rideData);

    return {
      success: true,
      ride: { id: rideRef.id, ...rideData }
    };
  } catch (error) {
    console.error("Error creating ride:", error);
    return { success: false, error: error.message };
  }
}

async function getRideByUID(uid) {
  const db = getFirestore();
  try {
    // Get the ride by UID field (not document ID)
    const ridesSnapshot = await db.collection("rides")
      .where("UID", "==", uid)
      .get();

    if (ridesSnapshot.empty) {
      return { success: false, error: "Ride not found" };
    }

    const rideDoc = ridesSnapshot.docs[0];
    return { 
      success: true, 
      ride: { id: rideDoc.id, ...rideDoc.data() } 
    };
  } catch (error) {
    console.error("Error fetching ride by UID:", error);
    return { success: false, error: error.message };
  }
}

async function updateRideByUID(uid, updateData) {
  const db = getFirestore();
  try {
    // Get the ride by UID
    const ridesSnapshot = await db.collection("rides")
      .where("UID", "==", uid)
      .get();

    if (ridesSnapshot.empty) {
      return { success: false, error: "Ride not found" };
    }

    const rideDoc = ridesSnapshot.docs[0];
    const rideRef = rideDoc.ref;

    // Update the document
    await rideRef.update(updateData);

    // Get the updated document
    const updatedDoc = await rideRef.get();
    
    return {
      success: true,
      ride: { id: updatedDoc.id, ...updatedDoc.data() }
    };
  } catch (error) {
    console.error("Error updating ride by UID:", error);
    return { success: false, error: error.message };
  }
}

async function updateRideById(rideId, updateData) {
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

    // Update the document
    await rideRef.update(updateData);

    // Get the updated document
    const updatedDoc = await rideRef.get();
    
    return {
      success: true,
      ride: { id: updatedDoc.id, ...updatedDoc.data() }
    };
  } catch (error) {
    console.error("Error updating ride by ID:", error);
    return { success: false, error: error.message };
  }
}

async function getClientByReference(clientRef) {
  const db = getFirestore();
  try {
    if (!clientRef) {
      return { success: false, error: "Client reference is required" };
    }

    let clientDoc;
    
    // Handle both string ID and Firestore reference
    if (typeof clientRef === 'string') {
      // If it's a string, create a reference to the client document
      clientDoc = await db.collection("clients").doc(clientRef).get();
    } else {
      // If it's already a Firestore reference, use it directly
      clientDoc = await clientRef.get();
    }
    
    if (!clientDoc.exists) {
      return { success: false, error: "Client not found" };
    }

    return {
      success: true,
      client: { id: clientDoc.id, ...clientDoc.data() }
    };
  } catch (error) {
    console.error("Error fetching client by reference:", error);
    return { success: false, error: error.message };
  }
}

async function getDestinationById(destinationId) {
  const db = getFirestore();
  try {
    if (!destinationId) {
      return { success: false, error: "Destination ID is required" };
    }

    // Handle both document ID (string) and Firestore reference
    let destinationDoc;
    if (typeof destinationId === 'string') {
      // Try both "destination" (lowercase) and "Destination" (capital D) for compatibility
      let destRef = db.collection("destination").doc(destinationId);
      destinationDoc = await destRef.get();
      
      if (!destinationDoc.exists) {
        destRef = db.collection("Destination").doc(destinationId);
        destinationDoc = await destRef.get();
      }
    } else if (destinationId && typeof destinationId === 'object' && destinationId.get) {
      // It's a Firestore reference
      destinationDoc = await destinationId.get();
    } else {
      return { success: false, error: "Invalid destination ID format" };
    }
    
    if (!destinationDoc.exists) {
      return { success: false, error: "Destination not found" };
    }

    return {
      success: true,
      destination: { id: destinationDoc.id, ...destinationDoc.data() }
    };
  } catch (error) {
    console.error("Error fetching destination:", error);
    return { success: false, error: error.message };
  }
}

// Organization CRUD functions
async function createOrganization(orgData) {
  const db = getFirestore();
  try {
    console.log("Creating organization with data:", JSON.stringify(orgData, null, 2));
    
    // Check if organization with same org_id already exists
    if (orgData.org_id) {
      const existingOrgQuery = await db.collection("organizations")
        .where("org_id", "==", orgData.org_id)
        .get();
      
      if (!existingOrgQuery.empty) {
        console.log("Organization with org_id already exists:", orgData.org_id);
        return { success: false, error: "Organization with this org_id already exists" };
      }
    }

    // Check if organization with same email already exists
    if (orgData.email) {
      const existingEmailQuery = await db.collection("organizations")
        .where("email", "==", orgData.email)
        .get();
      
      if (!existingEmailQuery.empty) {
        console.log("Organization with email already exists:", orgData.email);
        return { success: false, error: "Organization with this email already exists" };
      }
    }

    // Set creation_date if not provided
    if (!orgData.creation_date) {
      orgData.creation_date = new Date();
    } else if (typeof orgData.creation_date === 'string') {
      orgData.creation_date = new Date(orgData.creation_date);
    }

    // Create the organization document
    const orgRef = db.collection("organizations").doc();
    console.log("About to create document with ID:", orgRef.id);

    // Enforce canonical org_id to be the Firestore document id
    orgData.org_id = orgRef.id;

    await orgRef.set(orgData);
    console.log("Organization document created successfully with ID:", orgRef.id);

    return { 
      success: true, 
      orgId: orgRef.id,
      organizationId: orgRef.id,
      message: "Organization created successfully"
    };
  } catch (error) {
    console.error("Error creating organization:", error);
    console.error("Error stack:", error.stack);
    return { success: false, error: error.message };
  }
}

async function getOrganizationById(orgId) {
  const db = getFirestore();
  try {
    const doc = await db.collection("organizations").doc(orgId).get();
    
    if (!doc.exists) {
      return { success: false, error: "Organization not found" };
    }

    return { 
      success: true, 
      organization: { id: doc.id, ...doc.data() }
    };
  } catch (error) {
    console.error("Error fetching organization by ID:", error);
    return { success: false, error: error.message };
  }
}

async function getOrganizationByOrgId(orgId) {
  const db = getFirestore();
  try {
    const snapshot = await db.collection("organizations")
      .where("org_id", "==", orgId)
      .get();
    
    if (snapshot.empty) {
      return { success: false, error: "Organization not found" };
    }

    const doc = snapshot.docs[0];
    return { 
      success: true, 
      organization: { id: doc.id, ...doc.data() }
    };
  } catch (error) {
    console.error("Error fetching organization by org_id:", error);
    return { success: false, error: error.message };
  }
}

async function getAllOrganizations() {
  const db = getFirestore();
  try {
    const snapshot = await db.collection("organizations").get();
    
    const organizations = [];
    snapshot.forEach(doc => {
      organizations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, organizations: organizations };
  } catch (error) {
    console.error("Error fetching all organizations:", error);
    return { success: false, error: error.message };
  }
}

async function updateOrganization(orgId, updateData) {
  const db = getFirestore();
  try {
    // Check if organization exists
    const orgDoc = await db.collection("organizations").doc(orgId).get();
    if (!orgDoc.exists) {
      return { success: false, error: "Organization not found" };
    }

    const currentData = orgDoc.data();

    // If org_id is being changed, check it's not already taken by another organization
    if (updateData.org_id && updateData.org_id !== currentData.org_id) {
      const existingOrgQuery = await db.collection("organizations")
        .where("org_id", "==", updateData.org_id)
        .get();
      
      if (!existingOrgQuery.empty) {
        // Make sure it's not the same organization
        const existingDoc = existingOrgQuery.docs[0];
        if (existingDoc.id !== orgId) {
          return { success: false, error: "Organization ID already in use by another organization" };
        }
      }
    }

    // If email is being changed, check it's not already taken by another organization
    if (updateData.email && updateData.email !== currentData.email) {
      const existingEmailQuery = await db.collection("organizations")
        .where("email", "==", updateData.email)
        .get();
      
      if (!existingEmailQuery.empty) {
        // Make sure it's not the same organization
        const existingDoc = existingEmailQuery.docs[0];
        if (existingDoc.id !== orgId) {
          return { success: false, error: "Email address already in use by another organization" };
        }
      }
    }

    // Convert creation_date string to Date if needed (but don't update it if it's not in updateData)
    if (updateData.creation_date && typeof updateData.creation_date === 'string') {
      updateData.creation_date = new Date(updateData.creation_date);
    }

    // Update the organization document
    await db.collection("organizations").doc(orgId).update(updateData);

    return { 
      success: true, 
      orgId: orgId,
      message: "Organization updated successfully"
    };
  } catch (error) {
    console.error("Error updating organization:", error);
    return { success: false, error: error.message };
  }
}

async function deleteOrganization(orgId) {
  const db = getFirestore();
  try {
    // Check if organization exists
    const orgDoc = await db.collection("organizations").doc(orgId).get();
    if (!orgDoc.exists) {
      return { success: false, error: "Organization not found" };
    }

    const orgData = orgDoc.data();

    // Delete the organization document
    await db.collection("organizations").doc(orgId).delete();

    return { 
      success: true, 
      orgId: orgId,
      organizationId: orgData.org_id,
      message: "Organization deleted successfully"
    };
  } catch (error) {
    console.error("Error deleting organization:", error);
    return { success: false, error: error.message };
  }
}

async function getVolunteerById(volunteerId) {
  const db = getFirestore();
  try {
    const volunteerDoc = await db.collection("volunteers").doc(volunteerId).get();

    if (!volunteerDoc.exists) {
      return { success: false, error: "Volunteer not found" };
    }

    return {
      success: true,
      volunteer: {
        id: volunteerDoc.id,
        ...volunteerDoc.data()
      }
    };
  } catch (error) {
    console.error("Error fetching volunteer by ID:", error);
    return { success: false, error: error.message };
  }
}

async function addVolunteerUnavailability(volunteerId, entries = []) {
  const db = getFirestore();
  try {
    const volunteerRef = db.collection("volunteers").doc(volunteerId);
    const volunteerDoc = await volunteerRef.get();

    if (!volunteerDoc.exists) {
      return { success: false, error: "Volunteer not found" };
    }

    const existingUnavailability = volunteerDoc.data().unavailability;
    const updatedUnavailability = Array.isArray(existingUnavailability)
      ? existingUnavailability.slice()
      : [];
    const submissionTimestamp = Timestamp.fromDate(new Date());

    const sanitizedEntries = Array.isArray(entries)
      ? entries.map(entry => ({
          repeated: entry.repeated === true,
          unavailabilityString: entry.unavailabilityString,
          effectiveFrom: entry.effectiveFrom ? Timestamp.fromDate(entry.effectiveFrom) : null,
          effectiveTo: entry.effectiveTo ? Timestamp.fromDate(entry.effectiveTo) : null,
          createdAt: submissionTimestamp,
          updatedAt: submissionTimestamp,
          source: entry.source || "api"
        }))
      : [];

    if (sanitizedEntries.length === 0) {
      return {
        success: false,
        error: "No unavailability entries to record"
      };
    }

    updatedUnavailability.push(...sanitizedEntries);

    await volunteerRef.update({
      unavailability: updatedUnavailability,
      unavailabilityUpdatedAt: submissionTimestamp,
      updated_at: submissionTimestamp
    });

    const responseUnavailability = updatedUnavailability.map(entry => ({
      repeated: entry.repeated === true,
      unavailabilityString: entry.unavailabilityString,
      effectiveFrom: entry.effectiveFrom ? entry.effectiveFrom.toDate() : null,
      effectiveTo: entry.effectiveTo ? entry.effectiveTo.toDate() : null,
      createdAt: entry.createdAt ? entry.createdAt.toDate() : null,
      updatedAt: entry.updatedAt ? entry.updatedAt.toDate() : null,
      source: entry.source || "api"
    }));

    return {
      success: true,
      unavailability: responseUnavailability
    };
  } catch (error) {
    console.error("Error updating volunteer unavailability:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { 
  login, 
  createRole,
  updateRole, 
  createPermission,
  createPermissionAndUpdateRole, 
  getRoleByName,
  getRolesByOrganization,
  getPermissionSetByRoleName,
  getParentRoleView,
  getAllVolunteers, 
  getVolunteersByOrganization,
  getVolunteerById,
  addVolunteerUnavailability,
  getRideById,
  createRide,
  getRideByUID,
  updateRideByUID,
  updateRideById,
  getClientByReference,
  getDestinationById,
  getRidesByDriverId,
  getRidesByDriverIdentifiers,
  getUnassignedRidesByOrganizationAndVolunteer,
  createUser,
  getUserByEmail,
  getUserById,
  getUserByUserID,
  updateUser,
  resetPassword,
  resetPasswordByUserID,
  deleteUser,
  fetchRidesInRange,
  createOrganization,
  getOrganizationById,
  getOrganizationByOrgId,
  getAllOrganizations,
  updateOrganization,
  deleteOrganization
  ,
  // Migration helpers
  createBatch,
  commitBatch,
  setBatchDoc
};
