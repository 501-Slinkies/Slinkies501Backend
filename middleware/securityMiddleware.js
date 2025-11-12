// HIPAA Security Middleware
// Implements security controls required for HIPAA compliance

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const auditLogger = require('../AuditLogger');

/**
 * Extract client IP address from request
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Extract user agent from request
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Middleware to extract and attach request metadata
 */
function attachRequestMetadata(req, res, next) {
  req.metadata = {
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    timestamp: new Date(),
    requestId: require('crypto').randomBytes(16).toString('hex')
  };
  next();
}

/**
 * Rate limiting to prevent brute force attacks
 * HIPAA requires protection against unauthorized access attempts
 */
const createRateLimiter = (options = {}) => {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
  const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

  return rateLimit({
    windowMs: options.windowMs || windowMs,
    max: options.max || max,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((options.windowMs || windowMs) / 1000 / 60) + ' minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Store in memory - in production, use Redis for distributed rate limiting
    handler: async (req, res) => {
      // Log rate limit violation
      await auditLogger.logAccess({
        userId: req.user?.userId || 'anonymous',
        userEmail: req.user?.email || 'unknown',
        userRole: req.user?.role || 'unknown',
        organizationId: req.user?.org || req.user?.org_id || req.user?.organization_id || 'unknown',
        action: 'RATE_LIMIT_EXCEEDED',
        resourceType: 'api',
        resourceId: req.path,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
        success: false,
        failureReason: 'Rate limit exceeded'
      });

      res.status(429).json({
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((options.windowMs || windowMs) / 1000 / 60) + ' minutes'
      });
    }
  });
};

/**
 * Strict rate limiter for authentication endpoints
 */
const authRateLimiter = createRateLimiter({
  windowMs: 900000, // 15 minutes
  max: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5
});

/**
 * General API rate limiter
 */
const apiRateLimiter = createRateLimiter();

/**
 * Security headers middleware using Helmet
 * HIPAA requires data transmission security
 */
function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  });
}

/**
 * HTTPS enforcement middleware
 * HIPAA requires encryption in transit
 */
function enforceHttps(req, res, next) {
  if (process.env.NODE_ENV === 'production' && 
      process.env.ENABLE_HTTPS_REDIRECT === 'true' &&
      req.headers['x-forwarded-proto'] !== 'https') {
    return res.status(403).json({
      success: false,
      message: 'HTTPS required for secure communication'
    });
  }
  next();
}

/**
 * Session timeout middleware
 * HIPAA requires automatic logoff for inactive sessions
 */
function checkSessionTimeout(req, res, next) {
  if (!req.user) {
    return next();
  }

  const sessionTimeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES) || 15;
  const tokenIssuedAt = req.user.iat * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const sessionAge = (currentTime - tokenIssuedAt) / 1000 / 60; // in minutes

  if (sessionAge > sessionTimeoutMinutes) {
    return res.status(401).json({
      success: false,
      message: 'Session expired due to inactivity. Please log in again.',
      code: 'SESSION_TIMEOUT'
    });
  }

  next();
}

/**
 * Audit middleware - logs all PHI access
 */
function auditMiddleware(resourceType) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    // Wrap res.json to capture response
    res.json = function(data) {
      // Log the access
      if (req.user && data.success !== false) {
        const action = req.method === 'GET' ? 'READ' : 
                      req.method === 'POST' ? 'CREATE' :
                      req.method === 'PUT' || req.method === 'PATCH' ? 'UPDATE' :
                      req.method === 'DELETE' ? 'DELETE' : 'UNKNOWN';
        
        auditLogger.logAccess({
          userId: req.user.userId,
          userEmail: req.user.email,
          userRole: req.user.role,
          organizationId: req.user.org || req.user.org_id || req.user.organization_id,
          action: action,
          resourceType: resourceType,
          resourceId: req.params.id || req.params.rideId || req.params.clientId || 'multiple',
          ipAddress: req.metadata?.ipAddress || 'unknown',
          userAgent: req.metadata?.userAgent || 'unknown',
          success: data.success !== false
        }).catch(err => console.error('Audit logging failed:', err));
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Sanitize response to remove sensitive fields not needed by client
 * Data minimization principle required by HIPAA
 */
function sanitizeResponse(fieldsToRemove = []) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      if (data && typeof data === 'object') {
        const sanitized = JSON.parse(JSON.stringify(data));
        
        function removeSensitiveFields(obj) {
          if (Array.isArray(obj)) {
            obj.forEach(item => removeSensitiveFields(item));
          } else if (obj && typeof obj === 'object') {
            fieldsToRemove.forEach(field => delete obj[field]);
            Object.values(obj).forEach(value => {
              if (typeof value === 'object') {
                removeSensitiveFields(value);
              }
            });
          }
        }
        
        removeSensitiveFields(sanitized);
        return originalJson(sanitized);
      }
      return originalJson(data);
    };
    
    next();
  };
}

module.exports = {
  attachRequestMetadata,
  authRateLimiter,
  apiRateLimiter,
  securityHeaders,
  enforceHttps,
  checkSessionTimeout,
  auditMiddleware,
  sanitizeResponse,
  getClientIp,
  getUserAgent
};


