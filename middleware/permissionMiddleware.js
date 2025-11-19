const dataAccess = require('../DataAccessLayer');

/**
 * Maps HTTP methods to permission action prefixes
 */
function getActionFromMethod(method) {
  const methodMap = {
    'GET': 'read',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete'
  };
  return methodMap[method] || null;
}

/**
 * Maps endpoint paths to resource names for permission checking
 * Returns null if endpoint should be excluded from permission checking
 */
function getResourceFromPath(path) {
  // Remove query parameters and hash
  const pathWithoutQuery = path.split('?')[0].split('#')[0];
  // Normalize path (remove leading/trailing slashes, convert to lowercase)
  const normalizedPath = pathWithoutQuery.toLowerCase().replace(/^\/+|\/+$/g, '');
  
  // Excluded endpoints (utility endpoints that don't need permission checks)
  const excludedPaths = [
    'api/maps',
    'api/notify-org' // This might need special handling later
  ];
  
  for (const excluded of excludedPaths) {
    if (normalizedPath.startsWith(excluded)) {
      return null; // Excluded from permission checking
    }
  }
  
  // Map paths to resources (using singular names to match permission schema)
  if (normalizedPath.startsWith('api/organizations')) {
    return 'org';
  } else if (normalizedPath.startsWith('api/clients')) {
    return 'client';
  } else if (normalizedPath.startsWith('api/rides') || 
             normalizedPath.startsWith('api/calendar') ||
             normalizedPath.startsWith('api/drivers')) {
    return 'ride';
  } else if (normalizedPath.startsWith('api/volunteers') || 
             normalizedPath.startsWith('api/users')) {
    return 'volunteer';
  } else if (normalizedPath.startsWith('api/roles')) {
    return 'role';
  } else if (normalizedPath.startsWith('api/reports') || 
             normalizedPath.startsWith('api/exports')) {
    return 'log'; // Reports and exports likely need read_log permission
  } else if (normalizedPath.startsWith('api/permissions')) {
    return 'role'; // Permission management is part of role management
  }
  
  // Unknown endpoint - return null to exclude but log it
  console.warn(`[Permission Middleware] Unknown endpoint path: ${path} - excluding from permission check`);
  return null;
}

/**
 * Extracts org_id and signed_in_role from request
 * For POST/PUT/PATCH: from body
 * For GET/DELETE: from query parameters
 */
function extractAuthParams(req) {
  const method = req.method.toUpperCase();
  let org_id, signed_in_role;
  
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    org_id = req.body?.org_id;
    signed_in_role = req.body?.signed_in_role;
  } else if (['GET', 'DELETE'].includes(method)) {
    org_id = req.query?.org_id;
    signed_in_role = req.query?.signed_in_role;
  }
  
  return { org_id, signed_in_role };
}

/**
 * Main permission checking middleware
 */
async function checkPermission(req, res, next) {
  try {
    // Get the full path (handles both req.path and req.originalUrl)
    const fullPath = req.originalUrl || req.path;
    
    // Skip permission check for login endpoint
    if (fullPath === '/api/login' || fullPath.startsWith('/api/login')) {
      return next();
    }
    
    // Determine resource from path
    const resource = getResourceFromPath(fullPath);
    
    // If resource is null, endpoint is excluded from permission checking
    if (resource === null) {
      return next();
    }
    
    // Extract org_id and signed_in_role
    const { org_id, signed_in_role } = extractAuthParams(req);
    
    // Validate required parameters
    if (!org_id || !signed_in_role) {
      return res.status(400).json({
        success: false,
        message: 'org_id and signed_in_role are required',
        details: {
          org_id: org_id ? 'provided' : 'missing',
          signed_in_role: signed_in_role ? 'provided' : 'missing',
          method: req.method,
          path: fullPath,
          note: 'For POST/PUT/PATCH: include in request body. For GET/DELETE: include as query parameters.'
        }
      });
    }
    
    // Step 1: Check that role exists in role table
    const roleResult = await dataAccess.getRoleByName(signed_in_role);
    
    if (!roleResult.success || !roleResult.role) {
      return res.status(401).json({
        success: false,
        message: 'Role not found',
        details: {
          role_name: signed_in_role,
          error: roleResult.error || 'Role does not exist in role table'
        }
      });
    }
    
    const role = roleResult.role;
    
    // Step 2: Check that org_id matches the role's org_id
    // Roles can have org_id field or be 'default' (which applies to all orgs)
    const roleOrgId = role.org_id || role.org || role.organization || role.organization_id;
    
    if (roleOrgId !== 'default' && roleOrgId !== org_id) {
      return res.status(403).json({
        success: false,
        message: 'Organization ID mismatch',
        details: {
          provided_org_id: org_id,
          role_org_id: roleOrgId,
          role_name: signed_in_role,
          error: 'The provided org_id does not match the organization associated with this role'
        }
      });
    }
    
    // Step 3: Get the permission_set for the role
    const permissionResult = await dataAccess.getPermissionSetByRoleName(signed_in_role);
    
    if (!permissionResult.success || !permissionResult.permissionSet) {
      return res.status(500).json({
        success: false,
        message: 'Permission set not found for role',
        details: {
          role_name: signed_in_role,
          error: permissionResult.error || 'Permission set could not be retrieved'
        }
      });
    }
    
    const permissionSet = permissionResult.permissionSet;
    
    // Step 4: Determine required permission based on HTTP method and resource
    const action = getActionFromMethod(req.method);
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported HTTP method',
        details: {
          method: req.method,
          error: 'Only GET, POST, PUT, PATCH, DELETE are supported'
        }
      });
    }
    
    // Build permission name: {action}_{resource}
    const requiredPermission = `${action}_${resource}`;
    
    // Step 5: Check if the permission is allowed
    const hasPermission = permissionSet[requiredPermission] === true;
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied',
        details: {
          required_permission: requiredPermission,
          role_name: signed_in_role,
          org_id: org_id,
          method: req.method,
          path: fullPath,
          error: `Role '${signed_in_role}' does not have permission '${requiredPermission}'`
        }
      });
    }
    
    // Permission check passed - attach role and org info to request for use in endpoints
    req.authenticatedRole = {
      name: signed_in_role,
      org_id: org_id,
      role: role,
      permissionSet: permissionSet
    };
    
    // Continue to next middleware/route handler
    next();
    
  } catch (error) {
    console.error('Error in permission middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during permission check',
      error: error.message
    });
  }
}

module.exports = {
  checkPermission,
  getResourceFromPath,
  getActionFromMethod,
  extractAuthParams
};

