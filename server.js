const express = require('express');
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const applicationLayer = require('./ApplicationLayer');

// Conditionally initialize Firebase Admin SDK
if (process.env.FIRESTORE_EMULATOR_HOST) {
  // Connect to the Firestore Emulator
  initializeApp({
    projectId: 'dev-project', // A dummy project ID is fine for the emulator
  });
  console.log('Firebase Admin SDK connected to Firestore Emulator.');
} else {
  // Connect to production Firestore
  const serviceAccount = require('./serviceAccountKey.json');
  initializeApp({
    credential: cert(serviceAccount)
  });
  console.log('Firebase Admin SDK connected to production Firestore.');
}


const db = getFirestore();
const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).send({ message: 'Email, password, and role are required' });
  }

  const result = await applicationLayer.loginUser(email, password, role);
  if (result.success) {
    res.status(200).send(result);
  } else {
    res.status(401).send(result);
  }
});

app.post('/roles', async (req, res) => {
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
// based on their availability and the ride's timeframe (PickupTime, AppointmentTime, EstimatedDuration, TripType)
app.get('/rides/:rideId/match-drivers', async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = { app, db };
