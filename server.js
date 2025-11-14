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
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');


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
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send({ 
        success: false, 
        message: 'Authorization token required. Please provide a Bearer token in the Authorization header.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Extract role data from request body
    const { name, title, permissions } = req.body;
    
    // Validate required fields
    if (!name || !title || !permissions) {
      return res.status(400).send({
        success: false,
        message: 'Role name, title, and permissions are required',
        required_fields: {
          name: 'string - unique identifier for the role',
          title: 'string - display title for the role',
          permissions: {
            create_clients: 'boolean',
            read_clients: 'boolean',
            update_clients: 'boolean',
            delete_clients: 'boolean',
            create_org: 'boolean',
            read_org: 'boolean',
            update_org: 'boolean',
            delete_org: 'boolean',
            create_rides: 'boolean',
            read_rides: 'boolean',
            update_rides: 'boolean',
            delete_rides: 'boolean',
            create_users: 'boolean',
            read_users: 'boolean',
            update_users: 'boolean',
            delete_users: 'boolean',
            create_volunteers: 'boolean',
            read_volunteers: 'boolean',
            update_volunteers: 'boolean',
            delete_volunteers: 'boolean',
            read_logs: 'boolean'
          }
        }
      });
    }

    const roleData = { name, title, permissions };
    
    // Create role and permissions
    const result = await applicationLayer.createRoleWithPermissions(roleData, token);
    
    if (result.success) {
      res.status(201).send(result);
    } else {
      // Determine appropriate status code based on error type
      let statusCode = 500; // Default to internal server error
      if (result.message.includes('Authentication failed') || result.message.includes('token')) {
        statusCode = 401;
      } else if (result.message.includes('required') || result.message.includes('Organization information not found')) {
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

      res.status(201).send({
        success: true,
        message: result.message,
        data: result.data
      });
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
app.post("/api/notify", async (req, res) => {
  const { userId, message, type } = req.body;

  if (!userId || !message || !type) {
    return res.status(400).json({ success: false, message: "Missing userId, message, or type" });
  }

  const result = await sendNotification(userId, message, type);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json(result);
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

// --- Firebase Admin & GCS Setup ---
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'your-project-id.appspot.com'; 
const bucket = admin.storage().bucket(GCS_BUCKET_NAME);

// Middleware to verify JWT using ApplicationLayer
const verifyExportToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authorization token required' 
      });
    }

    const token = authHeader.substring(7);
    const verification = applicationLayer.verifyToken(token);

    if (!verification.success) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    const user = verification.user;
    
    // Normalize organization field
    const effectiveOrg = user.org || user.org_id || user.organization || user.organization_id;
    
    if (!effectiveOrg) {
      return res.status(403).json({ 
        success: false, 
        error: 'Organization information not found in token' 
      });
    }

    // Attach user info to request
    req.user = {
      ...user,
      org: effectiveOrg
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Token verification failed' 
    });
  }
};

// ---
// REUSABLE HELPER FUNCTIONS
// ---

// Data fetching logic
const fetchDataFromFirestore = async (collection, effectiveOrg) => {
  let snapshot;
  const collRef = db.collection(collection);
  
  snapshot = await collRef.where('organization', '==', effectiveOrg).get();
  if (snapshot.empty) {
    snapshot = await collRef.where('organization_id', '==', effectiveOrg).get();
  }
  if (snapshot.empty) {
    snapshot = await collRef.where('organizationId', '==', effectiveOrg).get();
  }
  if (snapshot.empty && collection === 'organizations') {
    snapshot = await collRef.where('org_id', '==', effectiveOrg).get();
    if (snapshot.empty) {
      const doc = await collRef.doc(effectiveOrg).get();
      if (doc.exists) {
        snapshot = { empty: false, docs: [doc], size: 1 };
      }
    }
  }

  if (snapshot.empty) {
    return []; // Return an empty array if no data
  }

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Field filtering logic
const filterDataByFields = (data, fields) => {
  if (!fields) {
    return data; // Return all data if no fields specified
  }
  
  const fieldList = fields.split(',').map(f => f.trim());
  return data.map(item => {
    const filtered = {};
    fieldList.forEach(field => {
      if (item.hasOwnProperty(field)) {
        filtered[field] = item[field];
      }
    });
    return filtered;
  });
};

// PDF generation logic (returns buffer)
const generatePdfBuffer = (data, collection) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      doc.fontSize(20).text(`${collection.charAt(0).toUpperCase() + collection.slice(1)} Export`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.text(`Total Records: ${data.length}`, { align: 'center' });
      doc.moveDown(2);

      const allKeys = new Set();
      data.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
      const keys = Array.from(allKeys);

      doc.fontSize(8);
      data.forEach((item, index) => {
        if (doc.y > 700) doc.addPage();
        
        doc.fontSize(10).font('Helvetica-Bold').text(`Record ${index + 1}:`, { underline: true });
        doc.fontSize(8).font('Helvetica');
        doc.moveDown(0.3);

        keys.forEach(key => {
          const value = item[key];
          if (value !== undefined && value !== null) {
            let displayValue = value;
            if (typeof value === 'object') displayValue = JSON.stringify(value);
            else if (typeof value === 'boolean') displayValue = value ? 'Yes' : 'No';
            
            if (String(displayValue).length > 80) {
              displayValue = String(displayValue).substring(0, 77) + '...';
            }
            doc.text(`${key}: ${displayValue}`);
          }
        });
        doc.moveDown(1);
      });

      doc.end(); // Finalize the PDF

    } catch (err) {
      reject(err);
    }
  });
};

// ---
// EXPORT ENDPOINTS
// ---

app.post('/api/exports/prepare', verifyExportToken, async (req, res) => {
  try {
    const { user } = req;
    const effectiveOrg = user.org;
    const { collection, format = 'csv', fields } = req.body;

    const allowedCollections = ['clients', 'volunteers', 'rides', 'destination', 'mileage_logs', 'audit_logs'];
    if (!allowedCollections.includes(collection)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid collection. Allowed collections: ${allowedCollections.join(', ')}` 
      });
    }

    // Fetch and process data
    let data = await fetchDataFromFirestore(collection, effectiveOrg);

    if (data.length === 0) {
      return res.status(404).json({ success: false, error: 'No documents found in collection' });
    }

    data = filterDataByFields(data, fields);

    // Generate file buffer
    let fileBuffer;
    let contentType;
    let fileExtension;

    if (format === 'csv') {
      try {
        const parser = new Parser();
        const csv = parser.parse(data);
        fileBuffer = Buffer.from(csv, 'utf8');
        contentType = 'text/csv';
        fileExtension = 'csv';
      } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to convert to CSV: ' + err.message });
      }
    } else if (format === 'pdf') {
      try {
        fileBuffer = await generatePdfBuffer(data, collection);
        contentType = 'application/pdf';
        fileExtension = 'pdf';
      } catch (err) {
        return res.status(500).json({ success: false, error: 'Failed to convert to PDF: ' + err.message });
      }
    } else {
      return res.status(400).json({ success: false, error: 'Invalid format. Supported formats are csv and pdf.' });
    }

    // Upload file to GCS
    const uniqueFilename = `exports/${user.userId || 'unknown'}/${collection}-${Date.now()}.${fileExtension}`;
    const file = bucket.file(uniqueFilename);

    await file.save(fileBuffer, {
      metadata: { contentType: contentType }
    });

    // Generate and return signed URL
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes validity
    });

    res.status(200).json({
      success: true,
      downloadUrl: signedUrl
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/exports/:collection', verifyExportToken, async (req, res) => {
  try {
    const { collection } = req.params;
    const { format = 'csv', fields } = req.query;
    const effectiveOrg = req.user.org;

    const allowedCollections = ['clients', 'volunteers', 'rides', 'destination', 'mileage_logs', 'audit_logs'];
    if (!allowedCollections.includes(collection)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid collection. Allowed collections: ${allowedCollections.join(', ')}` 
      });
    }

    let data = await fetchDataFromFirestore(collection, effectiveOrg);

    if (data.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No documents found in collection' 
      });
    }

    data = filterDataByFields(data, fields);

    if (format === 'csv') {
      try {
        const parser = new Parser();
        const csv = parser.parse(data);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${collection}_export.csv"`);
        return res.send(csv);
      } catch (err) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to convert to CSV: ' + err.message 
        });
      }
    } else if (format === 'pdf') {
      try {
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${collection}_export.pdf"`);

        doc.pipe(res);

        doc.fontSize(20).text(`${collection.charAt(0).toUpperCase() + collection.slice(1)} Export`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.text(`Total Records: ${data.length}`, { align: 'center' });
        doc.moveDown(2);

        const allKeys = new Set();
        data.forEach(item => {
          Object.keys(item).forEach(key => allKeys.add(key));
        });
        const keys = Array.from(allKeys);

        doc.fontSize(8);
        data.forEach((item, index) => {
          if (doc.y > 700) {
            doc.addPage();
          }

          doc.fontSize(10).font('Helvetica-Bold').text(`Record ${index + 1}:`, { underline: true });
          doc.fontSize(8).font('Helvetica');
          doc.moveDown(0.3);

          keys.forEach(key => {
            const value = item[key];
            if (value !== undefined && value !== null) {
              let displayValue = value;
              if (typeof value === 'object') {
                displayValue = JSON.stringify(value);
              } else if (typeof value === 'boolean') {
                displayValue = value ? 'Yes' : 'No';
              }
              
              if (String(displayValue).length > 80) {
                displayValue = String(displayValue).substring(0, 77) + '...';
              }
              
              doc.text(`${key}: ${displayValue}`);
            }
          });
          
          doc.moveDown(1);
        });
        
        doc.end();
        
      } catch (err) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to convert to PDF: ' + err.message 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid format. Supported formats are csv and pdf.' 
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
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