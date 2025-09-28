// Set up a login User and role/permission management

const dataAccess = require('./DataAccessLayer');
const jwt = require('jsonwebtoken');

async function loginUser(email, password, role) {
  const user = await dataAccess.login(email, password, role);
  if (user) {
    // In a real application, you would generate a JWT token here
    // and send it back to the user for session management.
    console.log('Login successful for user:', user.email);
    return { success: true, user: { email: user.email, role: user.role } };
  } else {
    console.log('Login failed');
    return { success: false, message: 'Invalid credentials or role' };
  }
}

// Middleware to verify JWT and extract user information
function verifyToken(token) {
  try {
    // In production, use a secret key from environment variables
    const secretKey = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secretKey);
    return { success: true, user: decoded };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return { success: false, message: 'Invalid or expired token' };
  }
}

async function createRoleWithPermissions(roleData, authToken) {
  try {
    // Verify the JWT token and extract user information
    const tokenVerification = verifyToken(authToken);
    if (!tokenVerification.success) {
      return { success: false, message: 'Authentication failed' };
    }

    // Extract organization from JWT
    const userInfo = tokenVerification.user;
    if (!userInfo.org) {
      return { success: false, message: 'Organization information not found in session' };
    }

    // Validate required fields
    if (!roleData.name || !roleData.title) {
      return { success: false, message: 'Role name and title are required' };
    }

    // Prepare role data with organization from JWT
    const roleDataWithOrg = {
      name: roleData.name,
      title: roleData.title,
      org: userInfo.org
    };

    // Prepare permission data
    const permissionData = {
      name: roleData.name,
      ...roleData.permissions // All the CRUD boolean fields
    };

    // Create both role and permission documents
    const [roleResult, permissionResult] = await Promise.all([
      dataAccess.createRole(roleDataWithOrg),
      dataAccess.createPermission(permissionData)
    ]);

    if (roleResult.success && permissionResult.success) {
      return {
        success: true,
        message: 'Role and permissions created successfully',
        data: {
          roleId: roleResult.roleId,
          permissionId: permissionResult.permissionId
        }
      };
    } else {
      // If either creation failed, return the error
      const errors = [];
      if (!roleResult.success) errors.push(`Role creation failed: ${roleResult.error}`);
      if (!permissionResult.success) errors.push(`Permission creation failed: ${permissionResult.error}`);
      
      return {
        success: false,
        message: 'Failed to create role and/or permissions',
        errors: errors
      };
    }
  } catch (error) {
    console.error('Error in createRoleWithPermissions:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

module.exports = { loginUser, createRoleWithPermissions, verifyToken };
