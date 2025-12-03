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
 * 
 * Resource mapping follows the pattern: {action}{resource}
 * - Actions: read, create, update, delete (mapped from HTTP methods)
 * - Resources: org, clients, rides, volunteers, roles, logs
 */
function getResourceFromPath(path) {
  // Remove query parameters and hash
  const pathWithoutQuery = path.split('?')[0].split('#')[0];
  // Normalize path (remove leading/trailing slashes, convert to lowercase)
  const normalizedPath = pathWithoutQuery.toLowerCase().replace(/^\/+|\/+$/g, '');
  
  // Excluded endpoints (utility endpoints that don't need permission checks)
  const excludedPaths = [
    'api/login',           // Login endpoint - users need to login before they have a role
    'api/maps',            // Maps API - utility endpoint
    'api/notify-org',      // Notification endpoint - may need special handling
    ''                     // Root endpoint
  ];
  
  for (const excluded of excludedPaths) {
    if (normalizedPath === excluded || normalizedPath.startsWith(excluded + '/')) {
      return null; // Excluded from permission checking
    }
  }
  
  // Map paths to resources (using singular forms to match permission_set structure)
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
  } else if (normalizedPath.startsWith('api/roles') || 
             normalizedPath.startsWith('api/permissions')) {
    return 'role';
  } else if (normalizedPath.startsWith('api/reports') || 
             normalizedPath.startsWith('api/exports')) {
    return 'log';
  }
  
  // Unknown endpoint - return null to exclude but log it
  console.warn(`[Permission Middleware] Unknown endpoint path: ${path} - excluding from permission check`);
  return null;
}

/**
 * Extracts org_id and selected_role_name from request
 * For POST/PUT/PATCH: from body
 * For GET/DELETE: from query parameters
 */
function extractAuthParams(req) {
  const method = req.method.toUpperCase();
  let org_id, selected_role_name;
  
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    org_id = req.body?.org_id;
    selected_role_name = req.body?.selected_role_name;
  } else if (['GET', 'DELETE'].includes(method)) {
    org_id = req.query?.org_id;
    selected_role_name = req.query?.selected_role_name;
  }
  
  return { org_id, selected_role_name };
}

/**
 * Main permission checking middleware
 */
async function checkPermission(req, res, next) {
  try {
    // Get the full path (handles both req.path and req.originalUrl)
    const fullPath = req.originalUrl || req.path;
    
    // Skip permission check for login endpoint (users need to login before they have a role)
    if (fullPath === '/api/login' || fullPath.startsWith('/api/login')) {
      return next();
    }
    
    // Determine resource from path
    const resource = getResourceFromPath(fullPath);
    
    // If resource is null, endpoint is excluded from permission checking
    // This includes /api/login, /api/maps, /api/notify-org, and root endpoint
    if (resource === null) {
      return next();
    }
    
    // Extract org_id and selected_role_name
    const { org_id, selected_role_name } = extractAuthParams(req);
    
    // Validate required parameters
    if (!org_id || !selected_role_name) {
      return res.status(400).json({
        success: false,
        message: 'org_id and selected_role_name are required',
        details: {
          org_id: org_id ? 'provided' : 'missing',
          selected_role_name: selected_role_name ? 'provided' : 'missing',
          method: req.method,
          path: fullPath,
          note: 'For POST/PUT/PATCH: include in request body. For GET/DELETE: include as query parameters.'
        }
      });
    }
    
    // Step 1: Check that role exists in roles collection
    const roleResult = await dataAccess.getRoleByName(selected_role_name);
    
    if (!roleResult.success || !roleResult.role) {
      return res.status(401).json({
        success: false,
        message: 'Role not found',
        details: {
          role_name: selected_role_name,
          error: roleResult.error || 'Role does not exist in roles collection'
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
          role_name: selected_role_name,
          error: 'The provided org_id does not match the organization associated with this role'
        }
      });
    }
    
    // Step 3: Get the permission_set for the role (handles role hierarchies via parentRole)
    const permissionResult = await dataAccess.getPermissionSetByRoleName(selected_role_name);
    
    if (!permissionResult.success || !permissionResult.permissionSet) {
      return res.status(500).json({
        success: false,
        message: 'Permission set not found for role',
        details: {
          role_name: selected_role_name,
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
    // Examples: read_org, create_client, update_ride, delete_volunteer, read_role, read_log
    // Note: Resources use singular forms to match permission_set structure (e.g., create_client, not create_clients)
    const requiredPermission = `${action}_${resource}`;
    
    // Step 5: Check if the permission is allowed
    // Permission sets are stored separately and referenced by roles via permission_set field
    // Role hierarchies are handled by getPermissionSetByRoleName which checks parentRole
    const hasPermission = permissionSet[requiredPermission] === true;
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied',
        details: {
          required_permission: requiredPermission,
          role_name: selected_role_name,
          org_id: org_id,
          method: req.method,
          path: fullPath,
          error: `Role '${selected_role_name}' does not have permission '${requiredPermission}'`
        }
      });
    }
    
    // Permission check passed - attach role and org info to request for use in endpoints
    req.authenticatedRole = {
      name: selected_role_name,
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

