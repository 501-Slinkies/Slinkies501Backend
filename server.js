require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { admin, db } = require('./firebase');         
const applicationLayer = require('./ApplicationLayer');
const calendarRoutes = require("./calendar");
const ridesRouter = require("./routes/rides");
const clientsRouter = require("./routes/clients");  
const volunteersRouter = require("./routes/volunteers");
const { verifyAddress, getRoute } = require("./integrations/maps");
const { sendNotification } = require("./services/notifications");
const reportsRouter = require("./routes/reports");


const app = express();
const port = 3000;

// ================================
// Middleware
// ================================

// --- CORS Configuration ---
// configure CORS to allow resource sharing between specific origins
const allowedOrigins = [
    'https://app.flutterflow.io', // Flutterflow testing domain
    'https://slinkies-712r84.flutterflow.app', // Live flutterflow domain
    'http://localhost:3000', // Local development
    'https://axo-lift.webdev.gccis.rit.edu', // RIT GCCIS Axo Lift domain
    // Other domains that need to access the API go here
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
};
// --- CORS Configuration stays the same above this ---
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Keep bodyParser for backwards compatibility:
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));



app.use("/api/volunteers", volunteersRouter);
// ================================
// Login Endpoint
// ================================
app.post('/api/login', async (req, res) => {
  console.log('Login request body:', req.body);
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send({ message: 'Username and password are required' });
  }

  const result = await applicationLayer.loginUser(username, password);
  if (result.success) {
    res.status(200).send(result);
  } else {
    res.status(401).send(result);
  }
});

app.post('/api/roles', async (req, res) => {
  try {
    // Extract role data from request body - only name, org_id, and parentRole
    const { name, org_id, parentRole } = req.body;
    
    // Validate required fields
    if (!name || !org_id) {
      return res.status(400).send({
        success: false,
        message: 'Role name and org_id are required',
        required_fields: {
          name: 'string - unique identifier for the role',
          org_id: 'string - organization ID',
          parentRole: 'string (optional) - parent role name'
        }
      });
    }

    const roleData = { name, org_id, parentRole };
    
    // Create role only (no permissions) - no token checking
    const result = await applicationLayer.createRoleWithPermissions(roleData, null);
    
    if (result.success) {
      res.status(201).send(result);
    } else {
      // Determine appropriate status code based on error type
      let statusCode = 500; // Default to internal server error
      if (result.message && result.message.includes('required')) {
        statusCode = 400;
      }
      
      res.status(statusCode).send(result);
    }
  } catch (error) {
    console.error('Error in /roles endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Create permissions for a role and update the role with a document reference
app.post('/api/permissions', async (req, res) => {
  try {
    // Extract permission data from request body
    const { roleName, ...permissionBooleans } = req.body;
    
    // Validate required fields
    if (!roleName) {
      return res.status(400).send({
        success: false,
        message: 'Role name is required',
        required_fields: {
          roleName: 'string - name of the role to attach permissions to',
          create_client: 'boolean (optional, defaults to false)',
          read_client: 'boolean (optional, defaults to false)',
          update_client: 'boolean (optional, defaults to false)',
          delete_client: 'boolean (optional, defaults to false)',
          create_org: 'boolean (optional, defaults to false)',
          read_org: 'boolean (optional, defaults to false)',
          update_org: 'boolean (optional, defaults to false)',
          delete_org: 'boolean (optional, defaults to false)',
          create_ride: 'boolean (optional, defaults to false)',
          read_ride: 'boolean (optional, defaults to false)',
          update_ride: 'boolean (optional, defaults to false)',
          delete_ride: 'boolean (optional, defaults to false)',
          create_role: 'boolean (optional, defaults to false)',
          read_role: 'boolean (optional, defaults to false)',
          update_role: 'boolean (optional, defaults to false)',
          delete_role: 'boolean (optional, defaults to false)',
          create_volunteer: 'boolean (optional, defaults to false)',
          read_volunteer: 'boolean (optional, defaults to false)',
          update_volunteer: 'boolean (optional, defaults to false)',
          delete_volunteer: 'boolean (optional, defaults to false)',
          read_log: 'boolean (optional, defaults to false)'
        }
      });
    }

    // Create permission document and update role with reference - no token checking
    const result = await applicationLayer.createPermissionForRole(roleName, permissionBooleans, null);
    
    if (result.success) {
      res.status(201).send(result);
    } else {
      // Determine appropriate status code based on error type
      let statusCode = 500; // Default to internal server error
      if (result.message && (result.message.includes('required') || result.message.includes('not found'))) {
        statusCode = 400;
      }
      
      res.status(statusCode).send(result);
    }
  } catch (error) {
    console.error('Error in /permissions endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update permissions for a role
app.put('/api/permissions', async (req, res) => {
  try {
    // Extract permission data from request body
    const { roleName, ...permissionBooleans } = req.body;
    
    // Validate required fields
    if (!roleName) {
      return res.status(400).send({
        success: false,
        message: 'Role name is required',
        required_fields: {
          roleName: 'string - name of the role to update permissions for',
          create_client: 'boolean (optional)',
          read_client: 'boolean (optional)',
          update_client: 'boolean (optional)',
          delete_client: 'boolean (optional)',
          create_org: 'boolean (optional)',
          read_org: 'boolean (optional)',
          update_org: 'boolean (optional)',
          delete_org: 'boolean (optional)',
          create_ride: 'boolean (optional)',
          read_ride: 'boolean (optional)',
          update_ride: 'boolean (optional)',
          delete_ride: 'boolean (optional)',
          create_role: 'boolean (optional)',
          read_role: 'boolean (optional)',
          update_role: 'boolean (optional)',
          delete_role: 'boolean (optional)',
          create_volunteer: 'boolean (optional)',
          read_volunteer: 'boolean (optional)',
          update_volunteer: 'boolean (optional)',
          delete_volunteer: 'boolean (optional)',
          read_log: 'boolean (optional)'
        }
      });
    }

    // Update permission document and update role with reference - no token checking
    const result = await applicationLayer.updatePermissionForRole(roleName, permissionBooleans, null);
    
    if (result.success) {
      res.status(200).send(result);
    } else {
      // Determine appropriate status code based on error type
      let statusCode = 500; // Default to internal server error
      if (result.message && (result.message.includes('required') || result.message.includes('not found'))) {
        statusCode = 400;
      }
      
      res.status(statusCode).send(result);
    }
  } catch (error) {
    console.error('Error in PUT /permissions endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

app.get('/api/roles/:roleName/parent', async (req, res) => {
  try {
    const { roleName } = req.params;

    if (!roleName) {
      return res.status(400).send({
        success: false,
        message: 'Role name is required'
      });
    }

    const result = await applicationLayer.getParentRole(roleName);

    if (result.success) {
      return res.status(200).send(result);
    }

    const statusCode =
      result.message && result.message.toLowerCase().includes('not found') ? 404 : 400;

    return res.status(statusCode).send(result);
  } catch (error) {
    console.error('Error in GET /roles/:roleName/parent endpoint:', error);
    return res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// User account creation endpoint
app.post('/api/users', async (req, res) => {
  try {
    const auditLogger = require('./AuditLogger');
    const { getClientIp, getUserAgent } = require('./middleware/securityMiddleware');
    
    // Extract authentication token if provided (optional - for admin user creation)
    let authToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    // Extract user data from request body
    const userData = req.body;

    // Create the user account
    const result = await applicationLayer.createUserAccount(userData, authToken);

    // Log the account creation attempt
    const ipAddress = getClientIp ? getClientIp(req) : req.ip;
    const userAgent = getUserAgent ? getUserAgent(req) : req.get('user-agent');

    if (result.success) {
      // Log successful account creation
      await auditLogger.logPHIModification(
        result.userId,
        userData.email_address,
        'new_user',
        'N/A',
        'CREATE',
        'user',
        result.userId,
        ipAddress,
        userAgent,
        { 
          user_ID: result.userID,
          created_by: authToken ? 'admin' : 'self-registration'
        }
      );

      res.status(201).send({
        success: true,
        message: result.message,
        data: {
          userId: result.userId,
          userID: result.userID
        }
      });
    } else {
      // Log failed account creation attempt
      await auditLogger.logAccess({
        userId: 'unknown',
        userEmail: userData.email_address || 'unknown',
        userRole: 'unknown',
        organizationId: 'N/A',
        action: 'CREATE',
        resourceType: 'user',
        resourceId: 'N/A',
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: false,
        failureReason: result.message
      });

      // Determine appropriate status code
      let statusCode = 400;
      if (result.message && result.message.includes('already exists')) {
        statusCode = 409; // Conflict
      } else if (result.message && result.message.includes('authentication')) {
        statusCode = 401; // Unauthorized
      }

      res.status(statusCode).send({
        success: false,
        message: result.message,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in /api/users endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// User account update endpoint
app.put('/api/users/:userID', async (req, res) => {
  try {
    const auditLogger = require('./AuditLogger');
    const { getClientIp, getUserAgent } = require('./middleware/securityMiddleware');
    
    // Extract the userID from URL parameters
    const { userID } = req.params;
    
    // Extract authentication token if provided (optional for now, required in production)
    let authToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    // Extract update data from request body
    const updateData = req.body;

    // Update the user account
    const result = await applicationLayer.updateUserAccount(userID, updateData, authToken);

    // Log the update attempt
    const ipAddress = getClientIp ? getClientIp(req) : req.ip;
    const userAgent = getUserAgent ? getUserAgent(req) : req.get('user-agent');
    
    if (result.success) {
      // Log successful account update
      await auditLogger.logPHIModification(
        result.userId,
        result.user.email_address,
        'user',
        'N/A',
        'UPDATE',
        'user',
        result.userId,
        ipAddress,
        userAgent,
        { 
          user_ID: result.userID,
          updated_by: authToken ? 'admin' : 'self-update',
          fields_updated: Object.keys(updateData)
        }
      );

      res.status(200).send({
        success: true,
        message: result.message,
        data: {
          userId: result.userId,
          userID: result.userID,
          user: result.user
        }
      });
    } else {
      // Log failed update attempt
      await auditLogger.logAccess({
        userId: 'unknown',
        userEmail: updateData.email_address || 'unknown',
        userRole: 'unknown',
        organizationId: 'N/A',
        action: 'UPDATE',
        resourceType: 'user',
        resourceId: userID,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: false,
        failureReason: result.message
      });

      // Determine appropriate status code
      let statusCode = 400;
      if (result.message && result.message.includes('not found')) {
        statusCode = 404; // Not Found
      } else if (result.message && result.message.includes('authentication')) {
        statusCode = 401; // Unauthorized
      } else if (result.message && result.message.includes('already in use')) {
        statusCode = 409; // Conflict
      }

      res.status(statusCode).send({
        success: false,
        message: result.message,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in /api/users/:userID endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Password reset endpoint
app.post('/api/users/:userID/reset-password', async (req, res) => {
  try {
    const auditLogger = require('./AuditLogger');
    const { getClientIp, getUserAgent } = require('./middleware/securityMiddleware');
    
    // Extract the userID from URL parameters
    const { userID } = req.params;
    
    // Extract authentication token (recommended for password resets)
    let authToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    // Extract new password from request body
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).send({
        success: false,
        message: 'New password is required'
      });
    }

    // Reset the user password
    const result = await applicationLayer.resetUserPassword(userID, newPassword, authToken);

    // Log the password reset attempt
    const ipAddress = getClientIp ? getClientIp(req) : req.ip;
    const userAgent = getUserAgent ? getUserAgent(req) : req.get('user-agent');
    
    if (result.success) {
      // Log successful password reset
      await auditLogger.logPHIModification(
        result.userId,
        'N/A',
        'user',
        'N/A',
        'UPDATE',
        'user',
        result.userId,
        ipAddress,
        userAgent,
        { 
          user_ID: result.userID,
          action: 'password_reset',
          reset_by: authToken ? 'admin' : 'user'
        }
      );

      res.status(200).send({
        success: true,
        message: result.message,
        data: {
          userId: result.userId,
          userID: result.userID
        }
      });
    } else {
      // Log failed password reset attempt
      await auditLogger.logAccess({
        userId: 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: 'N/A',
        action: 'PASSWORD_RESET',
        resourceType: 'user',
        resourceId: userID,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: false,
        failureReason: result.message
      });

      // Determine appropriate status code
      let statusCode = 400;
      if (result.message && result.message.includes('not found')) {
        statusCode = 404; // Not Found
      } else if (result.message && result.message.includes('Authentication failed')) {
        statusCode = 401; // Unauthorized
      }

      res.status(statusCode).send({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in POST /api/users/:userID/reset-password endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// User account deletion endpoint
app.delete('/api/users/:userID', async (req, res) => {
  try {
    const auditLogger = require('./AuditLogger');
    const { getClientIp, getUserAgent } = require('./middleware/securityMiddleware');
    
    // Extract the userID from URL parameters
    const { userID } = req.params;
    
    // Extract authentication token if provided (should be REQUIRED in production)
    let authToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    // Delete the user account
    const result = await applicationLayer.deleteUserAccount(userID, authToken);

    // Log the deletion attempt
    const ipAddress = getClientIp ? getClientIp(req) : req.ip;
    const userAgent = getUserAgent ? getUserAgent(req) : req.get('user-agent');
    
    if (result.success) {
      // Log successful account deletion
      await auditLogger.logPHIModification(
        result.userId,
        result.deletedUser.email_address,
        'user',
        'N/A',
        'DELETE',
        'user',
        result.userId,
        ipAddress,
        userAgent,
        { 
          user_ID: result.userID,
          deleted_by: authToken ? 'admin' : 'self-delete',
          deleted_user: {
            user_ID: result.deletedUser.user_ID,
            first_name: result.deletedUser.first_name,
            last_name: result.deletedUser.last_name,
            email_address: result.deletedUser.email_address
          }
        }
      );

      res.status(200).send({
        success: true,
        message: result.message,
        data: {
          userId: result.userId,
          userID: result.userID,
          deletedUser: result.deletedUser
        }
      });
    } else {
      // Log failed deletion attempt
      await auditLogger.logAccess({
        userId: 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: 'N/A',
        action: 'DELETE',
        resourceType: 'user',
        resourceId: userID,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: false,
        failureReason: result.message
      });

      // Determine appropriate status code
      let statusCode = 400;
      if (result.message && result.message.includes('not found')) {
        statusCode = 404; // Not Found
      } else if (result.message && result.message.includes('authentication')) {
        statusCode = 401; // Unauthorized
      }

      res.status(statusCode).send({
        success: false,
        message: result.message,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in DELETE /api/users/:userID endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ================================
// Organization Endpoints
// ================================

// Create organization endpoint
app.post('/api/organizations', async (req, res) => {
  try {
    const auditLogger = require('./AuditLogger');
    const { getClientIp, getUserAgent } = require('./middleware/securityMiddleware');
    
    // Extract authentication token if provided (optional - for admin organization creation)
    let authToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    // Extract organization data from request body
    const orgData = req.body;
    console.log('POST /api/organizations - Received organization data:', JSON.stringify(orgData, null, 2));

    // Create the organization
    const result = await applicationLayer.createOrganization(orgData, authToken);
    console.log('POST /api/organizations - Result:', JSON.stringify(result, null, 2));

    // Log the organization creation attempt
    const ipAddress = getClientIp ? getClientIp(req) : req.ip;
    const userAgent = getUserAgent ? getUserAgent(req) : req.get('user-agent');
    
    if (result.success) {
      // Log successful organization creation
      await auditLogger.logAccess({
        userId: authToken ? 'authenticated' : 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: result.data?.organizationId || 'N/A',
        action: 'CREATE',
        resourceType: 'organization',
        resourceId: result.data?.orgId || 'N/A',
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: true
      });

      const response = {
        success: true,
        message: result.message,
        data: result.data
      };
      
      // Include volunteer creation details if present
      if (result.data.createdVolunteers && result.data.createdVolunteers.length > 0) {
        response.data.volunteers = result.data.createdVolunteers;
      }
      if (result.data.volunteerErrors) {
        response.data.volunteerErrors = result.data.volunteerErrors;
      }
      
      res.status(201).send(response);
    } else {
      // Log failed organization creation attempt
      await auditLogger.logAccess({
        userId: 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: 'N/A',
        action: 'CREATE',
        resourceType: 'organization',
        resourceId: 'N/A',
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: false,
        failureReason: result.message
      });

      // Determine appropriate status code
      let statusCode = 400;
      if (result.message && result.message.includes('already exists')) {
        statusCode = 409; // Conflict
      } else if (result.message && result.message.includes('authentication')) {
        statusCode = 401; // Unauthorized
      }

      res.status(statusCode).send({
        success: false,
        message: result.message,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in /api/organizations endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get organization by ID endpoint
app.get('/api/organizations/:orgId', async (req, res) => {
  try {
    const auditLogger = require('./AuditLogger');
    const { getClientIp, getUserAgent } = require('./middleware/securityMiddleware');
    
    // Extract the orgId from URL parameters
    const { orgId } = req.params;
    
    // Extract authentication token if provided (optional)
    let authToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    // Get the organization
    const result = await applicationLayer.getOrganization(orgId, authToken);

    // Log the access attempt
    const ipAddress = getClientIp ? getClientIp(req) : req.ip;
    const userAgent = getUserAgent ? getUserAgent(req) : req.get('user-agent');
    
    if (result.success) {
      // Log successful organization access
      await auditLogger.logAccess({
        userId: authToken ? 'authenticated' : 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: result.organization?.org_id || 'N/A',
        action: 'READ',
        resourceType: 'organization',
        resourceId: result.organization?.id || orgId,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: true
      });

      res.status(200).send({
        success: true,
        organization: result.organization
      });
    } else {
      // Log failed access attempt
      await auditLogger.logAccess({
        userId: 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: 'N/A',
        action: 'READ',
        resourceType: 'organization',
        resourceId: orgId,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: false,
        failureReason: result.message
      });

      // Determine appropriate status code
      let statusCode = 400;
      if (result.message && result.message.includes('not found')) {
        statusCode = 404; // Not Found
      } else if (result.message && result.message.includes('authentication')) {
        statusCode = 401; // Unauthorized
      }

      res.status(statusCode).send({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in GET /api/organizations/:orgId endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all organizations endpoint
app.get('/api/organizations', async (req, res) => {
  try {
    const auditLogger = require('./AuditLogger');
    const { getClientIp, getUserAgent } = require('./middleware/securityMiddleware');
    
    // Extract authentication token if provided (optional)
    let authToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    // Get all organizations
    const result = await applicationLayer.getAllOrganizations(authToken);

    // Log the access attempt
    const ipAddress = getClientIp ? getClientIp(req) : req.ip;
    const userAgent = getUserAgent ? getUserAgent(req) : req.get('user-agent');
    
    if (result.success) {
      // Log successful organizations access
      await auditLogger.logAccess({
        userId: authToken ? 'authenticated' : 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: 'all',
        action: 'READ',
        resourceType: 'organizations',
        resourceId: 'all',
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: true
      });

      res.status(200).send({
        success: true,
        organizations: result.organizations,
        count: result.count
      });
    } else {
      // Log failed access attempt
      await auditLogger.logAccess({
        userId: 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: 'N/A',
        action: 'READ',
        resourceType: 'organizations',
        resourceId: 'all',
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: false,
        failureReason: result.message
      });

      // Determine appropriate status code
      let statusCode = 400;
      if (result.message && result.message.includes('authentication')) {
        statusCode = 401; // Unauthorized
      }

      res.status(statusCode).send({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in GET /api/organizations endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update organization endpoint
app.put('/api/organizations/:orgId', async (req, res) => {
  try {
    const auditLogger = require('./AuditLogger');
    const { getClientIp, getUserAgent } = require('./middleware/securityMiddleware');
    
    // Extract the orgId from URL parameters
    const { orgId } = req.params;
    
    // Extract authentication token if provided (optional for now, required in production)
    let authToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    // Extract update data from request body
    const updateData = req.body;

    // Update the organization
    const result = await applicationLayer.updateOrganization(orgId, updateData, authToken);

    // Log the update attempt
    const ipAddress = getClientIp ? getClientIp(req) : req.ip;
    const userAgent = getUserAgent ? getUserAgent(req) : req.get('user-agent');
    
    if (result.success) {
      // Log successful organization update
      await auditLogger.logAccess({
        userId: authToken ? 'authenticated' : 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: result.organization?.org_id || 'N/A',
        action: 'UPDATE',
        resourceType: 'organization',
        resourceId: result.organization?.id || orgId,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: true
      });

      res.status(200).send({
        success: true,
        message: result.message,
        organization: result.organization
      });
    } else {
      // Log failed update attempt
      await auditLogger.logAccess({
        userId: 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: 'N/A',
        action: 'UPDATE',
        resourceType: 'organization',
        resourceId: orgId,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: false,
        failureReason: result.message
      });

      // Determine appropriate status code
      let statusCode = 400;
      if (result.message && result.message.includes('not found')) {
        statusCode = 404; // Not Found
      } else if (result.message && result.message.includes('authentication')) {
        statusCode = 401; // Unauthorized
      } else if (result.message && result.message.includes('already in use')) {
        statusCode = 409; // Conflict
      }

      res.status(statusCode).send({
        success: false,
        message: result.message,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in PUT /api/organizations/:orgId endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete organization endpoint
app.delete('/api/organizations/:orgId', async (req, res) => {
  try {
    const auditLogger = require('./AuditLogger');
    const { getClientIp, getUserAgent } = require('./middleware/securityMiddleware');
    
    // Extract the orgId from URL parameters
    const { orgId } = req.params;
    
    // Extract authentication token if provided (should be REQUIRED in production)
    let authToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    // Delete the organization
    const result = await applicationLayer.deleteOrganization(orgId, authToken);

    // Log the deletion attempt
    const ipAddress = getClientIp ? getClientIp(req) : req.ip;
    const userAgent = getUserAgent ? getUserAgent(req) : req.get('user-agent');
    
    if (result.success) {
      // Log successful organization deletion
      await auditLogger.logAccess({
        userId: authToken ? 'authenticated' : 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: result.deletedOrganization?.org_id || 'N/A',
        action: 'DELETE',
        resourceType: 'organization',
        resourceId: result.deletedOrganization?.id || orgId,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: true
      });

      res.status(200).send({
        success: true,
        message: result.message,
        deletedOrganization: result.deletedOrganization
      });
    } else {
      // Log failed deletion attempt
      await auditLogger.logAccess({
        userId: 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: 'N/A',
        action: 'DELETE',
        resourceType: 'organization',
        resourceId: orgId,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: false,
        failureReason: result.message
      });

      // Determine appropriate status code
      let statusCode = 400;
      if (result.message && result.message.includes('not found')) {
        statusCode = 404; // Not Found
      } else if (result.message && result.message.includes('authentication')) {
        statusCode = 401; // Unauthorized
      }

      res.status(statusCode).send({
        success: false,
        message: result.message,
        errors: result.errors
      });
    }
  } catch (error) {
    console.error('Error in DELETE /api/organizations/:orgId endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get roles for an organization (including default roles)
app.get('/api/organizations/:orgId/roles', async (req, res) => {
  try {
    const { orgId } = req.params;
    const result = await applicationLayer.getRolesForOrganization(orgId);

    if (result.success) {
      return res.status(200).send(result);
    }

    let statusCode = 400;
    if (result.message && result.message.toLowerCase().includes('not found')) {
      statusCode = 404;
    } else if (result.message && result.message.toLowerCase().includes('required')) {
      statusCode = 400;
    }

    return res.status(statusCode).send(result);
  } catch (error) {
    console.error('Error in GET /api/organizations/:orgId/roles endpoint:', error);
    return res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get permission set details for a specific role name
app.get('/api/roles/:roleName/permission-set', async (req, res) => {
  try {
    const { roleName } = req.params;
    const result = await applicationLayer.getPermissionSetByRoleName(roleName);

    if (result.success) {
      return res.status(200).send(result);
    }

    let statusCode = 400;
    if (result.message && result.message.toLowerCase().includes('not found')) {
      statusCode = 404;
    } else if (result.message && result.message.toLowerCase().includes('required')) {
      statusCode = 400;
    }

    return res.status(statusCode).send(result);
  } catch (error) {
    console.error('Error in GET /api/roles/:roleName/permission-set endpoint:', error);
    return res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get parent role's view field for a specific role name
app.get('/api/roles/:roleName/parent/view', async (req, res) => {
  try {
    const { roleName } = req.params;

    if (!roleName) {
      return res.status(400).send({
        success: false,
        message: 'Role name is required'
      });
    }

    const result = await applicationLayer.getParentRoleView(roleName);

    if (result.success) {
      return res.status(200).send(result);
    }

    const statusCode =
      result.message && result.message.toLowerCase().includes('not found') ? 404 : 400;

    return res.status(statusCode).send(result);
  } catch (error) {
    console.error('Error in GET /api/roles/:roleName/parent/view endpoint:', error);
    return res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update role endpoint
app.put('/api/roles/:roleName', async (req, res) => {
  try {
    const auditLogger = require('./AuditLogger');
    const { getClientIp, getUserAgent } = require('./middleware/securityMiddleware');
    
    // Extract the roleName from URL parameters
    const { roleName } = req.params;
    
    // Extract authentication token if provided (optional for now, required in production)
    let authToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    // Extract update data from request body
    const updateData = req.body;

    // Update the role
    const result = await applicationLayer.updateRole(roleName, updateData, authToken);

    // Log the update attempt
    const ipAddress = getClientIp ? getClientIp(req) : req.ip;
    const userAgent = getUserAgent ? getUserAgent(req) : req.get('user-agent');
    
    if (result.success) {
      // Log successful role update
      await auditLogger.logAccess({
        userId: authToken ? 'authenticated' : 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: result.role?.org_id || 'N/A',
        action: 'UPDATE',
        resourceType: 'role',
        resourceId: roleName,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: true
      });

      const response = {
        success: true,
        message: result.message,
        role: result.role
      };

      // Include rename information if the role was renamed
      if (result.renamed !== undefined) {
        response.renamed = result.renamed;
        if (result.renamed && result.oldId && result.newId) {
          response.oldId = result.oldId;
          response.newId = result.newId;
        }
      }

      res.status(200).send(response);
    } else {
      // Log failed update attempt
      await auditLogger.logAccess({
        userId: 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: 'N/A',
        action: 'UPDATE',
        resourceType: 'role',
        resourceId: roleName,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: false,
        failureReason: result.message
      });

      // Determine appropriate status code
      let statusCode = 400;
      if (result.message && result.message.includes('not found')) {
        statusCode = 404; // Not Found
      } else if (result.message && result.message.includes('authentication')) {
        statusCode = 401; // Unauthorized
      } else if (result.message && result.message.includes('already exists')) {
        statusCode = 409; // Conflict
      }

      res.status(statusCode).send({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in PUT /api/roles/:roleName endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all rides for a specific driver
app.get('/api/drivers/:driverID/rides', async (req, res) => {
  try {
    const auditLogger = require('./AuditLogger');
    const { getClientIp, getUserAgent } = require('./middleware/securityMiddleware');
    
    // Extract the driverID from URL parameters
    const { driverID } = req.params;
    
    // Extract authentication token if provided (optional)
    let authToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      authToken = authHeader.substring(7);
    }

    // Get rides for the driver
    const result = await applicationLayer.getDriverRides(driverID, authToken);

    // Log the access attempt
    const ipAddress = getClientIp ? getClientIp(req) : req.ip;
    const userAgent = getUserAgent ? getUserAgent(req) : req.get('user-agent');
    
    if (result.success) {
      // Log successful ride data access
      await auditLogger.logPHIAccess(
        result.data.driverFirestoreId,
        'unknown', // email not needed for this log
        'driver',
        'N/A',
        'rides',
        driverID,
        ipAddress,
        userAgent
      );

      res.status(200).send({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      // Log failed access attempt
      await auditLogger.logAccess({
        userId: 'unknown',
        userEmail: 'unknown',
        userRole: 'unknown',
        organizationId: 'N/A',
        action: 'READ',
        resourceType: 'rides',
        resourceId: driverID,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: false,
        failureReason: result.message
      });

      // Determine appropriate status code
      let statusCode = 400;
      if (result.message && result.message.includes('not found')) {
        statusCode = 404; // Not Found
      } else if (result.message && result.message.includes('authentication')) {
        statusCode = 401; // Unauthorized
      }

      res.status(statusCode).send({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in GET /api/drivers/:driverID/rides endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get unassigned rides for an organization and volunteer
// Returns all rides where:
// - organization matches orgId
// - volunteer_id is in the driverUID CSV string
// - status is "unassigned" (case-insensitive)
app.get('/api/organizations/:orgId/volunteers/:volunteerId/unassigned-rides', async (req, res) => {
  try {
    const { orgId, volunteerId } = req.params;
    
    if (!orgId) {
      return res.status(400).send({
        success: false,
        message: 'Organization ID is required'
      });
    }

    if (!volunteerId) {
      return res.status(400).send({
        success: false,
        message: 'Volunteer ID is required'
      });
    }
    
    const result = await applicationLayer.getUnassignedRidesByOrganizationAndVolunteer(orgId, volunteerId);
    
    if (result.success) {
      return res.status(200).send({
        success: true,
        rides: result.rides,
        count: result.count,
        orgId: result.orgId,
        volunteerId: result.volunteerId
      });
    } else {
      // Determine appropriate status code
      let statusCode = 400;
      if (result.message && result.message.includes('not found')) {
        statusCode = 404; // Not Found
      } else if (result.message && result.message.includes('authentication')) {
        statusCode = 401; // Unauthorized
      }

      return res.status(statusCode).send({
        success: false,
        message: result.message || 'Failed to fetch rides',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in GET /api/organizations/:orgId/volunteers/:volunteerId/unassigned-rides endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Endpoint to match drivers for a specific ride
// This endpoint takes a ride document ID and returns available/unavailable drivers
// based on their availability and the ride's timeframe (Date, pickupTme, appointmentTime, estimatedDuration, tripType)
app.get('/api/rides/:rideId/match-drivers', async (req, res) => {
  try {
    const { rideId } = req.params;
    
    if (!rideId) {
      return res.status(400).send({
        success: false,
        message: 'Ride ID is required'
      });
    }
    
    const result = await applicationLayer.matchDriversForRide(rideId);
    
    if (result.success) {
      res.status(200).send(result);
    } else {
      // Determine appropriate status code based on error type
      let statusCode = 500;
      if (result.message.includes('not found') || result.message.includes('Invalid')) {
        statusCode = 404;
      } else if (result.message.includes('Failed to fetch')) {
        statusCode = 500;
      }
      
      res.status(statusCode).send(result);
    }
  } catch (error) {
    console.error('Error in /rides/:rideId/match-drivers endpoint:', error);
    res.status(500).send({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ================================
// Maps API Endpoints (OpenStreetMap)
// ================================

// Verify an address using OSM Nominatim API Example: /api/maps/verify?address=1600+Pennsylvania+Ave+NW+Washington+DC
app.get("/api/maps/verify", async (req, res) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ success: false, message: "Missing address" });

  const result = await verifyAddress(address);
  res.json(result);
});

//Get route between two coordinates using OSRM Format: /api/maps/route?start=-73.935242,40.730610&end=-74.0060,40.7128
app.get("/api/maps/route", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ success: false, message: "Missing start or end" });

  const result = await getRoute(start, end);
  res.json(result);
});

// ================================
// Notification Endpoint (SendGrid + Mocked SMS)
// ================================

// Send notification to a user by ID, Body: { "userId": "abc123", "message": "Your ride is confirmed", "type": "sms" }
app.post("/api/notify-org", async (req, res) => {
  const { org_id } = req.body;

  if (!org_id) {
      return res.status(400).json({ success: false, message: "Missing org_id" });
  }

  try {
      const { notifyDriversForOrganization } = require("./services/notifications");
      const result = await notifyDriversForOrganization(org_id);

      if (result.success) {
          return res.json(result);
      } else {
          return res.status(500).json(result);
      }
  } catch (error) {
      console.error("notify-org endpoint error:", error);
      return res.status(500).json({ success: false, message: error.message });
  }
});

// ================================
// Calendar & Rides Endpoints
// ================================
app.use('/api/calendar', calendarRoutes);
app.use('/api/rides', ridesRouter);

// ================================
// Clients / Donations Reporting
// ================================
app.use('/api/clients', clientsRouter);


// ================================
// Reports
// ================================
app.use("/api/reports", reportsRouter);


// ================================
// Notification
// ================================
// app.use("/api/notifications", require("./routes/notifications"));


// ================================
// Exports
// ================================

const exportsModule = require('./exports');

// exports endpoint (POST) — default mode is 'stream'.
app.post('/api/exports', async (req, res) => {
  try {
    let authToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) authToken = authHeader.substring(7);

    // mode can be provided in body: 'stream' (default) | 'url'
    const mode = req.body && req.body.mode ? req.body.mode : 'stream';

    await exportsModule.handleExport(req, res, authToken, mode);
  } catch (err) {
    console.error('Error in POST /api/exports route:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ================================
// Root Endpoint
// ================================
app.get('/', (req, res) => {
  res.send('🚀 Server is running!');
});


// ================================
// Start Server
// ================================
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = { app, db };