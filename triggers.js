
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Firestore trigger: Audit changes to user documents
 * Logs CRUD operations (create, update, delete) to auditLogs collection
 */
exports.auditUserChanges = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    try {
      let action;
      let beforeData = change.before.exists ? change.before.data() : null;
      let afterData = change.after.exists ? change.after.data() : null;

      if (!beforeData && afterData) {
        action = 'CREATE';
      } else if (beforeData && !afterData) {
        action = 'DELETE';
      } else if (beforeData && afterData) {
        action = 'UPDATE';
      } else {
        // No meaningful change
        return null;
      }

      // Determine the actor
      const actorId = (afterData && afterData.lastModifiedBy) || context.auth?.uid || 'system';

      // Calculate the difference (diff)
      let changes = {};
      if (action === 'UPDATE') {
        for (const key in afterData) {
          if (JSON.stringify(beforeData[key]) !== JSON.stringify(afterData[key])) {
            changes[key] = { from: beforeData[key], to: afterData[key] };
          }
        }
      } else if (action === 'CREATE') {
        changes = { created: afterData };
      } else if (action === 'DELETE') {
        changes = { deleted: beforeData };
      }

      // Only log if there are changes
      if (Object.keys(changes).length > 0) {
        const logEntry = {
          timestamp: new Date(),
          actorId,
          action,
          resourcePath: context.resource.name,
          changeDetails: changes,
        };
        await db.collection('auditLogs').add(logEntry);
      }
      return null;
    } catch (error) {
      console.error('Error auditing user change:', error);
      return null;
    }
  });
