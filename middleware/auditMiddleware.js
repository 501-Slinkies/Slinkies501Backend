// Comprehensive HIPAA-Compliant Audit Logging Middleware
// Logs all access to PHI (Protected Health Information) across the application

const auditLogger = require('../AuditLogger');
const { getClientIp, getUserAgent } = require('./securityMiddleware');

/**
 * Extract user information from request
 * Handles both authenticated and unauthenticated requests
 */
function getUserInfo(req) {
  if (req.user) {
    return {
      userId: req.user.userId || req.user.id || 'unknown',
      userEmail: req.user.email || req.user.email_address || 'unknown',
      userRole: req.user.role || (Array.isArray(req.user.roles) ? req.user.roles[0] : 'unknown') || 'unknown',
      organizationId: req.user.org || req.user.org_id || req.user.organization_id || req.user.organization || 'N/A'
    };
  }
  
  // Try to extract from token if available
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const token = authHeader.substring(7);
      const decoded = jwt.decode(token);
      if (decoded) {
        return {
          userId: decoded.userId || 'unknown',
          userEmail: decoded.email || 'unknown',
          userRole: decoded.role || (Array.isArray(decoded.roles) ? decoded.roles[0] : 'unknown') || 'unknown',
          organizationId: decoded.org || decoded.org_id || decoded.organization_id || 'N/A'
        };
      }
    } catch (e) {
      // Token decode failed, continue with anonymous
    }
  }
  
  return {
    userId: 'anonymous',
    userEmail: 'unknown',
    userRole: 'unknown',
    organizationId: 'N/A'
  };
}

/**
 * Determine resource type from request path
 */
function getResourceType(path) {
  if (path.includes('/clients')) return 'client';
  if (path.includes('/rides')) return 'ride';
  if (path.includes('/volunteers')) return 'volunteer';
  if (path.includes('/users')) return 'user';
  if (path.includes('/organizations')) return 'organization';
  if (path.includes('/reports')) return 'report';
  if (path.includes('/exports')) return 'export';
  if (path.includes('/notifications')) return 'notification';
  if (path.includes('/calendar')) return 'calendar';
  if (path.includes('/login')) return 'authentication';
  if (path.includes('/roles')) return 'role';
  if (path.includes('/permissions')) return 'permission';
  return 'api';
}

/**
 * Determine action from HTTP method
 */
function getAction(method) {
  const methodMap = {
    'GET': 'READ',
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE'
  };
  return methodMap[method] || 'UNKNOWN';
}

/**
 * Extract resource ID from request
 */
function getResourceId(req) {
  // Try various parameter names
  return req.params.id || 
         req.params.clientId || 
         req.params.rideId || 
         req.params.volunteerId || 
         req.params.userID || 
         req.params.orgId ||
         req.params.roleName ||
         req.body?.id ||
         req.body?.clientId ||
         req.body?.rideId ||
         'multiple';
}

/**
 * Comprehensive audit logging middleware
 * Logs all requests that access or modify PHI
 */
function auditLogMiddleware(req, res, next) {
  // Skip logging for health checks and non-PHI endpoints
  const skipPaths = ['/', '/health', '/favicon.ico'];
  if (skipPaths.includes(req.path)) {
    return next();
  }

  const startTime = Date.now();
  const userInfo = getUserInfo(req);
  const resourceType = getResourceType(req.path);
  const action = getAction(req.method);
  const resourceId = getResourceId(req);
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  // Store original response methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  const originalEnd = res.end.bind(res);

  // Track if response has been sent
  let responseSent = false;

  // Helper to log the audit entry
  const logAudit = async (success, failureReason = null, metadata = {}) => {
    if (responseSent) return; // Prevent duplicate logging
    responseSent = true;

    const duration = Date.now() - startTime;
    
    const logEntry = {
      ...userInfo,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      success,
      failureReason,
      metadata: {
        ...metadata,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      }
    };

    try {
      await auditLogger.logAccess(logEntry);
    } catch (error) {
      // Critical: Log audit failures separately
      console.error('[AUDIT ERROR] Failed to create audit log:', error);
    }
  };

  // Override res.json to capture response
  res.json = function(data) {
    const success = res.statusCode < 400 && (data?.success !== false);
    const failureReason = success ? null : (data?.message || `HTTP ${res.statusCode}`);
    
    logAudit(success, failureReason, {
      responseSize: JSON.stringify(data).length,
      hasData: !!data
    });

    return originalJson(data);
  };

  // Override res.send for non-JSON responses
  res.send = function(data) {
    const success = res.statusCode < 400;
    const failureReason = success ? null : `HTTP ${res.statusCode}`;
    
    logAudit(success, failureReason, {
      contentType: res.get('Content-Type'),
      responseSize: typeof data === 'string' ? data.length : JSON.stringify(data).length
    });

    return originalSend(data);
  };

  // Override res.end for stream responses
  res.end = function(data) {
    if (!responseSent) {
      const success = res.statusCode < 400;
      logAudit(success, success ? null : `HTTP ${res.statusCode}`);
    }
    return originalEnd(data);
  };

  // Log on error
  res.on('finish', () => {
    if (!responseSent) {
      const success = res.statusCode < 400;
      logAudit(success, success ? null : `HTTP ${res.statusCode}`);
    }
  });

  next();
}

/**
 * Specialized middleware for authentication endpoints
 */
function auditAuthMiddleware(req, res, next) {
  const startTime = Date.now();
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);
  const email = req.body?.username || req.body?.email_address || req.body?.email || 'unknown';

  const originalJson = res.json.bind(res);

  res.json = function(data) {
    const success = data?.success === true || res.statusCode === 200;
    const failureReason = success ? null : (data?.message || 'Authentication failed');
    
    // Extract role from response if available
    const role = data?.user?.role || 
                 (Array.isArray(data?.user?.roles) ? data?.user?.roles[0] : null) || 
                 'unknown';

    auditLogger.logAuthAttempt(
      email,
      role,
      ipAddress,
      userAgent,
      success,
      failureReason
    ).catch(err => console.error('[AUDIT ERROR] Failed to log auth attempt:', err));

    return originalJson(data);
  };

  next();
}

/**
 * Middleware for logging PHI access (read operations)
 */
function auditPHIAccessMiddleware(resourceType) {
  return async (req, res, next) => {
    const userInfo = getUserInfo(req);
    const resourceId = getResourceId(req);
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (data?.success !== false && res.statusCode < 400) {
        auditLogger.logPHIAccess(
          userInfo.userId,
          userInfo.userEmail,
          userInfo.userRole,
          userInfo.organizationId,
          resourceType,
          resourceId,
          ipAddress,
          userAgent
        ).catch(err => console.error('[AUDIT ERROR] Failed to log PHI access:', err));
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Middleware for logging PHI modifications (create, update, delete)
 */
function auditPHIModificationMiddleware(resourceType) {
  return async (req, res, next) => {
    const userInfo = getUserInfo(req);
    const action = getAction(req.method);
    const resourceId = getResourceId(req);
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (data?.success !== false && res.statusCode < 400) {
        const metadata = {
          method: req.method,
          path: req.path,
          fieldsModified: action === 'UPDATE' ? Object.keys(req.body || {}) : undefined
        };

        auditLogger.logPHIModification(
          userInfo.userId,
          userInfo.userEmail,
          userInfo.userRole,
          userInfo.organizationId,
          action,
          resourceType,
          resourceId,
          ipAddress,
          userAgent,
          metadata
        ).catch(err => console.error('[AUDIT ERROR] Failed to log PHI modification:', err));
      } else {
        // Log failed modification attempt
        auditLogger.logAccess({
          ...userInfo,
          action,
          resourceType,
          resourceId,
          ipAddress,
          userAgent,
          success: false,
          failureReason: data?.message || `HTTP ${res.statusCode}`
        }).catch(err => console.error('[AUDIT ERROR] Failed to log failed modification:', err));
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Middleware for logging export operations (contains PHI)
 */
function auditExportMiddleware(req, res, next) {
  const userInfo = getUserInfo(req);
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);
  const collection = req.params.collection || req.body?.collection || 'unknown';

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = function(data) {
    if (data?.success !== false && res.statusCode < 400) {
      auditLogger.logAccess({
        ...userInfo,
        action: 'EXPORT',
        resourceType: 'export',
        resourceId: collection,
        ipAddress,
        userAgent,
        success: true,
        metadata: {
          collection,
          format: req.query?.format || req.body?.format || 'unknown',
          downloadUrl: data?.downloadUrl ? 'generated' : undefined
        }
      }).catch(err => console.error('[AUDIT ERROR] Failed to log export:', err));
    }

    return originalJson(data);
  };

  res.send = function(data) {
    // For direct file downloads
    if (res.get('Content-Disposition')?.includes('attachment')) {
      auditLogger.logAccess({
        ...userInfo,
        action: 'EXPORT',
        resourceType: 'export',
        resourceId: collection,
        ipAddress,
        userAgent,
        success: true,
        metadata: {
          collection,
          format: req.query?.format || 'unknown',
          directDownload: true
        }
      }).catch(err => console.error('[AUDIT ERROR] Failed to log export:', err));
    }

    return originalSend(data);
  };

  next();
}

module.exports = {
  auditLogMiddleware,
  auditAuthMiddleware,
  auditPHIAccessMiddleware,
  auditPHIModificationMiddleware,
  auditExportMiddleware,
  getUserInfo,
  getResourceType,
  getAction,
  getResourceId
};

