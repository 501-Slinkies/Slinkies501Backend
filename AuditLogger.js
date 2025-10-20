// HIPAA-compliant Audit Logging System
// Logs all access to PHI (Protected Health Information)

const { getFirestore, FieldValue } = require('firebase-admin/firestore');

class AuditLogger {
  constructor() {
    this.db = getFirestore();
  }

  /**
   * Log an action performed on PHI data
   * @param {Object} logEntry - The audit log entry
   * @param {string} logEntry.userId - The user who performed the action
   * @param {string} logEntry.userEmail - Email of the user
   * @param {string} logEntry.userRole - Role of the user
   * @param {string} logEntry.organizationId - Organization ID
   * @param {string} logEntry.action - Action performed (CREATE, READ, UPDATE, DELETE)
   * @param {string} logEntry.resourceType - Type of resource (client, ride, volunteer, user)
   * @param {string} logEntry.resourceId - ID of the resource accessed
   * @param {string} logEntry.ipAddress - IP address of the request
   * @param {string} logEntry.userAgent - User agent string
   * @param {boolean} logEntry.success - Whether the action succeeded
   * @param {string} logEntry.failureReason - Reason for failure if applicable
   * @param {Object} logEntry.metadata - Additional metadata
   */
  async logAccess(logEntry) {
    try {
      const timestamp = new Date();
      
      const auditLog = {
        timestamp: timestamp,
        userId: logEntry.userId || 'anonymous',
        userEmail: logEntry.userEmail || 'unknown',
        userRole: logEntry.userRole || 'unknown',
        organizationId: logEntry.organizationId || 'unknown',
        action: logEntry.action, // CREATE, READ, UPDATE, DELETE
        resourceType: logEntry.resourceType, // client, ride, volunteer, user
        resourceId: logEntry.resourceId || 'unknown',
        ipAddress: logEntry.ipAddress || 'unknown',
        userAgent: logEntry.userAgent || 'unknown',
        success: logEntry.success !== false, // Default to true
        failureReason: logEntry.failureReason || null,
        metadata: logEntry.metadata || {},
        // HIPAA requires retention of audit logs for 6 years
        retentionDate: new Date(timestamp.getTime() + (6 * 365 * 24 * 60 * 60 * 1000))
      };

      // Store in audit_logs collection
      await this.db.collection('audit_logs').add(auditLog);
      
      // Also log to console for immediate monitoring (in production, send to SIEM)
      console.log('[AUDIT]', JSON.stringify({
        timestamp: timestamp.toISOString(),
        userId: auditLog.userId,
        action: auditLog.action,
        resource: `${auditLog.resourceType}/${auditLog.resourceId}`,
        success: auditLog.success
      }));
      
    } catch (error) {
      // Critical: Audit logging failures must be logged separately
      console.error('[AUDIT ERROR] Failed to create audit log:', error);
      // In production, this should trigger an alert
    }
  }

  /**
   * Log PHI access (read operations)
   */
  async logPHIAccess(userId, userEmail, userRole, organizationId, resourceType, resourceId, ipAddress, userAgent) {
    await this.logAccess({
      userId,
      userEmail,
      userRole,
      organizationId,
      action: 'READ',
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      success: true
    });
  }

  /**
   * Log PHI modification (create, update, delete)
   */
  async logPHIModification(userId, userEmail, userRole, organizationId, action, resourceType, resourceId, ipAddress, userAgent, metadata = {}) {
    await this.logAccess({
      userId,
      userEmail,
      userRole,
      organizationId,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      success: true,
      metadata
    });
  }

  /**
   * Log authentication attempts
   */
  async logAuthAttempt(email, role, ipAddress, userAgent, success, failureReason = null) {
    await this.logAccess({
      userId: email,
      userEmail: email,
      userRole: role,
      organizationId: 'N/A',
      action: 'LOGIN',
      resourceType: 'authentication',
      resourceId: email,
      ipAddress,
      userAgent,
      success,
      failureReason
    });
  }

  /**
   * Log failed access attempts (for security monitoring)
   */
  async logAccessDenied(userId, userEmail, userRole, action, resourceType, resourceId, ipAddress, userAgent, reason) {
    await this.logAccess({
      userId,
      userEmail,
      userRole,
      organizationId: 'N/A',
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      success: false,
      failureReason: reason
    });
  }

  /**
   * Query audit logs (for compliance reporting)
   * @param {Object} filters - Query filters
   */
  async queryLogs(filters = {}) {
    try {
      let query = this.db.collection('audit_logs');

      if (filters.userId) {
        query = query.where('userId', '==', filters.userId);
      }
      if (filters.resourceType) {
        query = query.where('resourceType', '==', filters.resourceType);
      }
      if (filters.action) {
        query = query.where('action', '==', filters.action);
      }
      if (filters.startDate) {
        query = query.where('timestamp', '>=', filters.startDate);
      }
      if (filters.endDate) {
        query = query.where('timestamp', '<=', filters.endDate);
      }
      if (filters.organizationId) {
        query = query.where('organizationId', '==', filters.organizationId);
      }

      query = query.orderBy('timestamp', 'desc').limit(filters.limit || 100);

      const snapshot = await query.get();
      const logs = [];
      
      snapshot.forEach(doc => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return { success: true, logs };
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
const auditLogger = new AuditLogger();

module.exports = auditLogger;


