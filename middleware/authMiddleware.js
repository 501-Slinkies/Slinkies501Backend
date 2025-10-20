// Authentication and Authorization Middleware for HIPAA Compliance

const jwt = require('jsonwebtoken');
const auditLogger = require('../AuditLogger');
const { getClientIp, getUserAgent } = require('./securityMiddleware');

/**
 * Get JWT secret from environment variable
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'your-secret-key-change-this-in-production') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
    console.warn('WARNING: Using default JWT secret. Set JWT_SECRET in production!');
    return 'dev-secret-not-for-production';
  }
  return secret;
}

/**
 * Generate a JWT token for authenticated user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
function generateToken(user) {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRATION || '15m'; // HIPAA: short-lived tokens
  
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    org: user.org || user.organization
  };
  
  return jwt.sign(payload, secret, { 
    expiresIn,
    issuer: 'teamslinkies-hipaa',
    audience: 'teamslinkies-api'
  });
}

/**
 * Generate a refresh token (longer expiration)
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
function generateRefreshToken(user) {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_REFRESH_EXPIRATION || '7d';
  
  const payload = {
    userId: user.id,
    email: user.email,
    type: 'refresh'
  };
  
  return jwt.sign(payload, secret, { 
    expiresIn,
    issuer: 'teamslinkies-hipaa',
    audience: 'teamslinkies-api'
  });
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token or error
 */
function verifyToken(token) {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      issuer: 'teamslinkies-hipaa',
      audience: 'teamslinkies-api'
    });
    return { success: true, user: decoded };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' };
    } else if (error.name === 'JsonWebTokenError') {
      return { success: false, message: 'Invalid token', code: 'INVALID_TOKEN' };
    }
    return { success: false, message: 'Token verification failed', code: 'VERIFICATION_FAILED' };
  }
}

/**
 * Middleware to authenticate JWT token
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token required. Please provide a Bearer token in the Authorization header.',
      code: 'NO_TOKEN'
    });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const verification = verifyToken(token);
  
  if (!verification.success) {
    // Log failed authentication attempt
    auditLogger.logAccessDenied(
      'unknown',
      'unknown',
      'unknown',
      'AUTHENTICATE',
      'api',
      req.path,
      getClientIp(req),
      getUserAgent(req),
      verification.message
    ).catch(err => console.error('Audit logging failed:', err));
    
    return res.status(401).json({
      success: false,
      message: verification.message,
      code: verification.code
    });
  }
  
  // Attach user information to request
  req.user = verification.user;
  next();
}

/**
 * Middleware to check if user has specific permission
 * @param {string} permission - Permission name (e.g., 'read_clients')
 */
function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    try {
      const { getFirestore } = require('firebase-admin/firestore');
      const db = getFirestore();
      
      // Get user's role permissions
      const permissionDoc = await db.collection('permissions').doc(req.user.role).get();
      
      if (!permissionDoc.exists) {
        // Log unauthorized access attempt
        await auditLogger.logAccessDenied(
          req.user.userId,
          req.user.email,
          req.user.role,
          permission.toUpperCase(),
          'api',
          req.path,
          getClientIp(req),
          getUserAgent(req),
          'Role permissions not found'
        );
        
        return res.status(403).json({
          success: false,
          message: 'Role permissions not found',
          code: 'NO_PERMISSIONS'
        });
      }
      
      const permissions = permissionDoc.data();
      
      if (!permissions[permission]) {
        // Log unauthorized access attempt
        await auditLogger.logAccessDenied(
          req.user.userId,
          req.user.email,
          req.user.role,
          permission.toUpperCase(),
          'api',
          req.path,
          getClientIp(req),
          getUserAgent(req),
          `Missing permission: ${permission}`
        );
        
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${permission}`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission verification failed',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
}

/**
 * Middleware to ensure user can only access their organization's data
 */
function requireSameOrganization(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    });
  }
  
  // This will be checked at the data access layer
  // Just ensure organization exists in user token
  if (!req.user.org) {
    return res.status(403).json({
      success: false,
      message: 'Organization information not found in user session',
      code: 'NO_ORGANIZATION'
    });
  }
  
  next();
}

/**
 * Middleware to validate organization access for specific resource
 * @param {Function} getResourceOrg - Function that returns organization ID from request
 */
function validateOrganizationAccess(getResourceOrg) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    try {
      const resourceOrg = await getResourceOrg(req);
      
      if (resourceOrg !== req.user.org) {
        await auditLogger.logAccessDenied(
          req.user.userId,
          req.user.email,
          req.user.role,
          req.method,
          'resource',
          req.path,
          getClientIp(req),
          getUserAgent(req),
          'Cross-organization access denied'
        );
        
        return res.status(403).json({
          success: false,
          message: 'Access denied: resource belongs to different organization',
          code: 'CROSS_ORG_ACCESS_DENIED'
        });
      }
      
      next();
    } catch (error) {
      console.error('Organization validation failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Organization validation failed',
        code: 'ORG_VALIDATION_ERROR'
      });
    }
  };
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  authenticate,
  requirePermission,
  requireSameOrganization,
  validateOrganizationAccess
};


