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

// Calendar function (startDate, endDate)
async function getRidesByTimeframe(startDate, endDate) {
  const allRides = await dataAccess.fetchRidesInRange(startDate, endDate);

  const grouped = {
    assigned: [],
    unassigned: [],
    completed: [],
    canceled: []
  };

  for (const ride of allRides) {
    if (ride.status === 'assigned') grouped.assigned.push(ride);
    else if (ride.status === 'unassigned') grouped.unassigned.push(ride);
    else if (ride.status === 'completed') grouped.completed.push(ride);
    else if (ride.status === 'canceled') grouped.canceled.push(ride);
  }

  return grouped;
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
  getRidesByTimeframe
};