// Set up a login User and role/permission management
// Enhanced driver matching system for ride requests

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

// Helper function to parse day abbreviation to day name
function parseDayAbbreviation(dayAbbr) {
  const dayMap = {
    'M': 'Monday',
    'T': 'Tuesday', 
    'W': 'Wednesday',
    'Th': 'Thursday',
    'F': 'Friday'
  };
  return dayMap[dayAbbr] || null;
}

// Helper function to convert Firestore timestamp to Date
function convertFirestoreTimestamp(timestamp) {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  } else if (timestamp instanceof Date) {
    return timestamp;
  } else if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return null;
}

// Helper function to parse availability string and return structured availability
function parseDriverAvailability(availabilityString) {
  if (!availabilityString || typeof availabilityString !== 'string') {
    return [];
  }
  
  const availability = [];
  const segments = availabilityString.split(';').filter(segment => segment.trim() !== '');
  
  for (let i = 0; i < segments.length; i += 2) {
    if (i + 1 < segments.length) {
      const startSegment = segments[i].trim();
      const endSegment = segments[i + 1].trim();
      
      // Extract day and time from start segment (e.g., "F09" -> day: "F", time: "09")
      const startMatch = startSegment.match(/^([MTWThF]+)(\d{2})$/);
      const endMatch = endSegment.match(/^([MTWThF]+)(\d{2})$/);
      
      if (startMatch && endMatch) {
        const startDay = startMatch[1];
        const startTime = parseInt(startMatch[2]);
        const endDay = endMatch[1];
        const endTime = parseInt(endMatch[2]);
        
        // Convert to day names
        const startDayName = parseDayAbbreviation(startDay);
        const endDayName = parseDayAbbreviation(endDay);
        
        if (startDayName && endDayName) {
          availability.push({
            startDay: startDayName,
            startTime: startTime,
            endDay: endDayName,
            endTime: endTime
          });
        }
      }
    }
  }
  
  return availability;
}

// Helper function to calculate ride timeframe based on new schema
function calculateRideTimeframe(ride) {
  if (!ride.PickupTime || !ride.AppointmentTime || !ride.EstimatedDuration) {
    return null;
  }
  
  const pickupTime = convertFirestoreTimestamp(ride.PickupTime);
  const appointmentTime = convertFirestoreTimestamp(ride.AppointmentTime);
  const estimatedDuration = ride.EstimatedDuration; // in minutes
  const tripType = ride.TripType;
  
  if (!pickupTime || !appointmentTime) {
    return null;
  }
  
  // Calculate the total timeframe based on trip type
  let totalDurationMinutes = 0;
  let endTime;
  
  switch (tripType) {
    case 'RoundTrip':
      // Round trip: pickup to appointment + appointment duration + return trip
      totalDurationMinutes = (appointmentTime - pickupTime) / (1000 * 60) + estimatedDuration;
      endTime = new Date(pickupTime.getTime() + totalDurationMinutes * 60 * 1000);
      break;
      
    case 'OneWayTo':
      // One way to appointment: pickup to appointment + appointment duration
      totalDurationMinutes = (appointmentTime - pickupTime) / (1000 * 60) + estimatedDuration;
      endTime = new Date(appointmentTime.getTime() + estimatedDuration * 60 * 1000);
      break;
      
    case 'OneWayFrom':
      // One way from appointment: appointment duration only
      totalDurationMinutes = estimatedDuration;
      endTime = new Date(appointmentTime.getTime() + estimatedDuration * 60 * 1000);
      break;
      
    default:
      return null;
  }
  
  return {
    startTime: pickupTime,
    endTime: endTime,
    totalDurationMinutes: totalDurationMinutes,
    tripType: tripType,
    appointmentTime: appointmentTime,
    estimatedDuration: estimatedDuration
  };
}

// Helper function to extract day and time from ride date/time (legacy function for backward compatibility)
function parseRideDateTime(rideDate, rideTime) {
  if (!rideDate || !rideTime) {
    return null;
  }
  
  // Parse the date to get the day of the week
  const date = new Date(rideDate);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[date.getDay()];
  
  // Parse time (assuming format like "09:00" or "9:00")
  const timeMatch = rideTime.match(/^(\d{1,2}):(\d{2})/);
  if (!timeMatch) {
    return null;
  }
  
  const hour = parseInt(timeMatch[1]);
  const minute = parseInt(timeMatch[2]);
  const timeInHours = hour + (minute / 60);
  
  return {
    day: dayName,
    time: timeInHours
  };
}

// Helper function to check if a volunteer is available for a specific ride timeframe
function isVolunteerAvailableForTimeframe(volunteer, rideTimeframe) {
  if (!volunteer.driver_availability_by_day_and_time || !rideTimeframe) {
    return false;
  }
  
  const availability = parseDriverAvailability(volunteer.driver_availability_by_day_and_time);
  
  // Get the day of the week for the ride
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const rideDay = dayNames[rideTimeframe.startTime.getDay()];
  const rideStartHour = rideTimeframe.startTime.getHours();
  const rideEndHour = rideTimeframe.endTime.getHours();
  
  // Check if the volunteer is available on the ride day
  for (const slot of availability) {
    if (slot.startDay === rideDay) {
      // Check if the entire ride timeframe falls within the volunteer's availability
      // We need the volunteer to be available from start to end of the ride
      if (rideStartHour >= slot.startTime && rideEndHour <= slot.endTime) {
        return true;
      }
    }
  }
  
  return false;
}

// Legacy function for backward compatibility
function isVolunteerAvailable(volunteer, rideDateTime) {
  if (!volunteer.driver_availability_by_day_and_time || !rideDateTime) {
    return false;
  }
  
  const availability = parseDriverAvailability(volunteer.driver_availability_by_day_and_time);
  
  for (const slot of availability) {
    // Check if the ride day matches the availability day
    if (slot.startDay === rideDateTime.day && slot.endDay === rideDateTime.day) {
      // Check if the ride time falls within the availability window
      if (rideDateTime.time >= slot.startTime && rideDateTime.time < slot.endTime) {
        return true;
      }
    }
  }
  
  return false;
}

// Main function to match drivers for a ride
async function matchDriversForRide(rideId) {
  try {
    console.log(`Attempting to fetch ride with ID: ${rideId}`);
    
    // Get the ride details
    const rideResult = await dataAccess.getRideById(rideId);
    if (!rideResult.success) {
      console.log(`Failed to fetch ride: ${rideResult.error}`);
      return {
        success: false,
        message: 'Failed to fetch ride details',
        error: rideResult.error
      };
    }
    
    console.log('Ride fetched successfully:', rideResult.ride);
    
    const ride = rideResult.ride;
    
    // Calculate the ride timeframe using the new schema
    const rideTimeframe = calculateRideTimeframe(ride);
    if (!rideTimeframe) {
      return {
        success: false,
        message: 'Invalid ride data: Missing PickupTime, AppointmentTime, EstimatedDuration, or TripType'
      };
    }
    
    // COMMENTED OUT: Organization matching - using all volunteers for testing
    // const organizationId = ride.OrganizationID || ride.organization;
    // if (!organizationId) {
    //   console.warn('No OrganizationID found in ride, using default for testing');
    //   const defaultOrgId = 'default-org';
    // }
    
    // Get all volunteers (no organization filtering for testing)
    const volunteersResult = await dataAccess.getAllVolunteers();
    if (!volunteersResult.success) {
      return {
        success: false,
        message: 'Failed to fetch volunteers',
        error: volunteersResult.error
      };
    }
    
    const volunteers = volunteersResult.volunteers;
    console.log(`Found ${volunteers.length} volunteers in database`);
    
    // Sort volunteers into available and unavailable lists
    const available = [];
    const unavailable = [];
    
    for (const volunteer of volunteers) {
      console.log(`Processing volunteer: ${volunteer.first_name} ${volunteer.last_name}, status: ${volunteer.volunteering_status}`);
      
      // Only include volunteers who are active (assuming all volunteers in your DB are drivers)
      // Your volunteer documents don't have VOLUNTEER POSITION field, so we'll assume all are drivers
      if (volunteer.volunteering_status === 'Active') {
        if (isVolunteerAvailableForTimeframe(volunteer, rideTimeframe)) {
          available.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
            maxRidesPerWeek: volunteer.max_rides_week,
            availability: volunteer.driver_availability_by_day_and_time
          });
        } else {
          unavailable.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
            maxRidesPerWeek: volunteer.max_rides_week,
            availability: volunteer.driver_availability_by_day_and_time,
            reason: 'Not available during requested timeframe'
          });
        }
      }
    }
    
    return {
      success: true,
      ride: {
        id: ride.id,
        rideId: ride.RideID,
        organizationId: 'all-volunteers', // Placeholder since we're not filtering by organization
        pickupTime: rideTimeframe.startTime,
        appointmentTime: rideTimeframe.appointmentTime,
        estimatedDuration: rideTimeframe.estimatedDuration,
        tripType: rideTimeframe.tripType,
        totalDurationMinutes: rideTimeframe.totalDurationMinutes,
        status: ride.Status,
        purpose: ride.Purpose
      },
      available: available,
      unavailable: unavailable,
      summary: {
        totalDrivers: volunteers.filter(v => v.volunteering_status === 'Active').length,
        availableCount: available.length,
        unavailableCount: unavailable.length
      },
      note: 'Organization filtering disabled for testing - showing all volunteers'
    };
    
  } catch (error) {
    console.error('Error in matchDriversForRide:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

// User account creation function
async function createUserAccount(userData, creatorToken = null) {
  try {
    const { hashPassword, validatePasswordStrength } = require('./utils/encryption');

    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email_address', 'password', 'primary_phone'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email_address)) {
      return {
        success: false,
        message: 'Invalid email address format'
      };
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(userData.password);
    if (!passwordValidation.valid) {
      return {
        success: false,
        message: 'Password does not meet strength requirements',
        errors: passwordValidation.errors
      };
    }

    // If creator token is provided, verify it (for admin-created accounts)
    let creatorInfo = null;
    if (creatorToken) {
      const tokenVerification = verifyToken(creatorToken);
      if (!tokenVerification.success) {
        return { success: false, message: 'Invalid creator authentication' };
      }
      creatorInfo = tokenVerification.user;
    }

    // Hash the password
    const hashedPassword = await hashPassword(userData.password);

    // Generate user_ID if not provided (FirstInitialLastName format)
    const userID = userData.user_ID || `${userData.first_name.charAt(0)}${userData.last_name}`;

    // Prepare user data for database
    const userDataToStore = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      email_address: userData.email_address,
      password: hashedPassword,
      primary_phone: userData.primary_phone,
      user_ID: userID,
      
      // Optional fields with defaults
      contact_type_preference: userData.contact_type_preference || 'phone',
      volunteering_status: userData.volunteering_status || 'Active',
      city: userData.city || '',
      state: userData.state || '',
      street_address: userData.street_address || '',
      zip: userData.zip || '',
      month_year_of_birth: userData.month_year_of_birth || '',
      
      // Volunteer-specific fields with defaults
      type_of_vehicle: userData.type_of_vehicle || '',
      color: userData.color || '',
      seat_height_from_ground: userData.seat_height_from_ground || 0,
      allergens_in_car: userData.allergens_in_car || '',
      max_rides_week: userData.max_rides_week || 0,
      mileage_reimbursement: userData.mileage_reimbursement || false,
      driver_availability_by_day_and_time: userData.driver_availability_by_day_and_time || '',
      
      // Emergency contact
      emergency_contact_name: userData.emergency_contact_name || '',
      emergency_contact_phone: userData.emergency_contact_phone || '',
      relationship_to_volunteer: userData.relationship_to_volunteer || '',
      
      // Training dates
      when_trained_by_lifespan: userData.when_trained_by_lifespan || '',
      when_oriented_to_position: userData.when_oriented_to_position || '',
      date_began_volunteering: userData.date_began_volunteering || '',
      how_did_they_hear_about_us: userData.how_did_they_hear_about_us || '',
      
      // Metadata
      created_at: new Date(),
      updated_at: new Date(),
      created_by: creatorInfo ? creatorInfo.userId : 'self-registration'
    };

    // Create user in database
    const result = await dataAccess.createUser(userDataToStore);

    if (result.success) {
      return {
        success: true,
        message: 'User account created successfully',
        userId: result.userId,
        userID: userID
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to create user account'
      };
    }
  } catch (error) {
    console.error('Error in createUserAccount:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

// User account update function
async function updateUserAccount(userID, updateData, authToken = null) {
  try {
    const { hashPassword, validatePasswordStrength } = require('./utils/encryption');

    // Verify authentication token if provided
    let authenticatedUser = null;
    if (authToken) {
      const tokenVerification = verifyToken(authToken);
      if (!tokenVerification.success) {
        return { success: false, message: 'Invalid authentication token' };
      }
      authenticatedUser = tokenVerification.user;
    }

    // Get the user to update by user_ID
    const userResult = await dataAccess.getUserByUserID(userID);
    if (!userResult.success) {
      return { success: false, message: 'User not found' };
    }

    const existingUser = userResult.user;
    const userId = existingUser.id; // Firestore document ID

    // Authorization check: users can only update their own profile unless they're admin
    // For now, we'll allow updates if authenticated or if no auth is required
    // In production, you'd want to verify the user is updating their own account
    // or has admin privileges

    // Prepare update data - only include fields that are provided
    const updateDataToStore = {};

    // Protected fields that cannot be updated
    const protectedFields = [
      'password', // Handle separately
      'created_at',
      'created_by',
      'id'
    ];

    // Allowed fields for update
    const allowedFields = [
      'first_name',
      'last_name',
      'email_address',
      'primary_phone',
      'user_ID',
      'contact_type_preference',
      'volunteering_status',
      'city',
      'state',
      'street_address',
      'zip',
      'month_year_of_birth',
      'type_of_vehicle',
      'color',
      'seat_height_from_ground',
      'allergens_in_car',
      'max_rides_week',
      'mileage_reimbursement',
      'driver_availability_by_day_and_time',
      'emergency_contact_name',
      'emergency_contact_phone',
      'relationship_to_volunteer',
      'when_trained_by_lifespan',
      'when_oriented_to_position',
      'date_began_volunteering',
      'how_did_they_hear_about_us',
      'data1_from_date',
      'data2_to_date',
      'how_did_they_hear_about_us'
    ];

    // Copy allowed fields from updateData
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateDataToStore[field] = updateData[field];
      }
    }

    // Validate email format if email is being updated
    if (updateData.email_address) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email_address)) {
        return {
          success: false,
          message: 'Invalid email address format'
        };
      }
    }

    // Handle password update separately (only if provided)
    if (updateData.password) {
      // Validate password strength
      const passwordValidation = validatePasswordStrength(updateData.password);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: 'Password does not meet strength requirements',
          errors: passwordValidation.errors
        };
      }

      // Hash the new password
      const hashedPassword = await hashPassword(updateData.password);
      updateDataToStore.password = hashedPassword;
    }

    // Add metadata about who updated the record
    if (authenticatedUser) {
      updateDataToStore.updated_by = authenticatedUser.userId;
    }

    // If no fields to update, return error
    if (Object.keys(updateDataToStore).length === 0) {
      return {
        success: false,
        message: 'No valid fields provided for update'
      };
    }

    // Update user in database
    const result = await dataAccess.updateUser(userId, updateDataToStore);

    if (result.success) {
      // Get the updated user data (without password)
      const updatedUserResult = await dataAccess.getUserById(userId);
      const updatedUser = updatedUserResult.user;
      
      // Remove password from response
      delete updatedUser.password;

      return {
        success: true,
        message: 'User account updated successfully',
        userId: userId,
        userID: updatedUser.user_ID,
        user: updatedUser
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to update user account'
      };
    }
  } catch (error) {
    console.error('Error in updateUserAccount:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

module.exports = { 
  loginUser, 
  createRoleWithPermissions, 
  verifyToken, 
  matchDriversForRide,
  parseDriverAvailability,
  parseRideDateTime,
  isVolunteerAvailable,
  calculateRideTimeframe,
  isVolunteerAvailableForTimeframe,
  convertFirestoreTimestamp,
  createUserAccount,
  updateUserAccount
};
