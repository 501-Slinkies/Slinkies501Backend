// Set up a login User and role/permission management
// Enhanced driver matching system for ride requests

const dataAccess = require('./DataAccessLayer');
const jwt = require('jsonwebtoken');

async function loginUser(username, password) {
  const user = await dataAccess.login(username, password);
  if (user) {
    // In a real application, you would generate a JWT token here
    // and send it back to the user for session management.
    console.log('Login successful for user:', user.email_address);
    return { success: true, user: { email: user.email_address, roles: user.roles || [] } };
  } else {
    console.log('Login failed');
    return { success: false, message: 'Invalid credentials' };
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

// Helper function to parse date string (format: '9/15/2025' or 'M/D/YYYY')
function parseDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }
  
  // Parse format: M/D/YYYY or MM/DD/YYYY
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    return null;
  }
  
  const month = parseInt(parts[0], 10) - 1; // Month is 0-indexed in JS Date
  const day = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  if (isNaN(month) || isNaN(day) || isNaN(year)) {
    return null;
  }
  
  return new Date(year, month, day);
}

// Helper function to parse time string (format: '11:30 AM' or '11:05 AM')
function parseTimeString(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return null;
  }
  
  // Remove extra spaces and convert to uppercase for matching
  const normalized = timeStr.trim().toUpperCase();
  
  // Match pattern: HH:MM AM/PM
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) {
    return null;
  }
  
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const period = match[3];
  
  if (isNaN(hour) || isNaN(minute)) {
    return null;
  }
  
  // Convert to 24-hour format
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return { hour, minute };
}

// Helper function to combine date and time strings into a Date object
function parseDateTimeString(dateStr, timeStr) {
  const date = parseDateString(dateStr);
  const time = parseTimeString(timeStr);
  
  if (!date || !time) {
    return null;
  }
  
  // Create a new Date object with the parsed date and time
  const dateTime = new Date(date);
  dateTime.setHours(time.hour, time.minute, 0, 0);
  
  return dateTime;
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
      
      // Extract day and time from start segment (e.g., "F09" or "F9" -> day: "F", time: "09" or "9")
      // Support both 1-digit and 2-digit hour formats
      const startMatch = startSegment.match(/^([MTWThF]+)(\d{1,2})$/);
      const endMatch = endSegment.match(/^([MTWThF]+)(\d{1,2})$/);
      
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
  // New schema: Date (String '9/15/2025'), appointmentTime (String '11:30 AM'), pickupTme (String '11:05 AM')
  // Note: Database uses 'pickupTme' (typo) instead of 'pickupTime'
  const rideDate = ride.Date;
  const pickupTimeStr = ride.pickupTme || ride.pickupTime; // Support both typo and correct spelling
  const appointmentTimeStr = ride.appointmentTime;
  const estimatedDuration = ride.estimatedDuration || ride.EstimatedDuration;
  const tripType = ride.tripType || ride.TripType;

  // Check if we have the required string fields (new schema with string dates/times)
  if (rideDate && pickupTimeStr && appointmentTimeStr && estimatedDuration) {
    // Check if these are strings (new format) or timestamps (old format)
    const isStringFormat = typeof rideDate === 'string' && 
                          typeof pickupTimeStr === 'string' && 
                          typeof appointmentTimeStr === 'string';
    
    if (isStringFormat) {
      // Parse the date and time strings
      const pickupTime = parseDateTimeString(rideDate, pickupTimeStr);
      const appointmentTime = parseDateTimeString(rideDate, appointmentTimeStr);
      
      if (pickupTime && appointmentTime) {
        return calculateTimeframeFromTimestamps(pickupTime, appointmentTime, estimatedDuration, tripType);
      } else {
        console.error('Failed to parse ride date/time:', { rideDate, pickupTimeStr, appointmentTimeStr });
        return null;
      }
    }
  }
  
  // Fallback to old schema for backward compatibility (Firestore timestamps)
  const pickupTimeField = ride.pickupTme || ride.pickupTime || ride.PickupTime;
  const appointmentTimeField = ride.appointmentTime || ride.AppointmentTime;
  
  if (pickupTimeField && appointmentTimeField) {
    // Check if these are timestamps (old format)
    const pickupTime = convertFirestoreTimestamp(pickupTimeField);
    const appointmentTime = convertFirestoreTimestamp(appointmentTimeField);
    
    if (pickupTime && appointmentTime) {
      return calculateTimeframeFromTimestamps(pickupTime, appointmentTime, estimatedDuration, tripType);
    }
  }
  
  return null;
}

// Helper function to calculate timeframe from Date objects
function calculateTimeframeFromTimestamps(pickupTime, appointmentTime, estimatedDuration, tripType) {
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
      // Check status case-insensitively (Active, active, ACTIVE, etc.)
      const status = volunteer.volunteering_status ? volunteer.volunteering_status.toLowerCase() : '';
      if (status === 'active') {
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
        totalDrivers: volunteers.filter(v => v.volunteering_status && v.volunteering_status.toLowerCase() === 'active').length,
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
  try {
    const allRides = await dataAccess.fetchRidesInRange(startDate, endDate);

    const grouped = {
      assigned: [],
      unassigned: [],
      completed: [],
      canceled: []
    };

    for (const ride of allRides) {
      if (ride.status === 'assigned' || ride.status === 'Assigned') grouped.assigned.push(ride);
      else if (ride.status === 'unassigned' || ride.status === 'Unassigned') grouped.unassigned.push(ride);
      else if (ride.status === 'completed' || ride.status === 'Completed') grouped.completed.push(ride);
      else if (ride.status === 'canceled' || ride.status === 'Canceled' || ride.status === 'cancelled' || ride.status === 'Cancelled') grouped.canceled.push(ride);
    }

    return {
      success: true,
      total: allRides.length,
      startDate,
      endDate,
      rides: allRides,
      grouped
    };
  } catch (error) {
    console.error('Error in getRidesByTimeframe:', error);
    return {
      success: false,
      message: 'Failed to fetch rides',
      error: error.message
    };
  }
}

// Match drivers for a ride by UID
async function matchDriversForRideByUID(uid) {
  try {
    // Get the ride by UID
    const rideResult = await dataAccess.getRideByUID(uid);
    if (!rideResult.success) {
      return {
        success: false,
        message: 'Ride not found',
        error: rideResult.error
      };
    }

    const ride = rideResult.ride;
    
    // Calculate the ride timeframe using the new schema
    const rideTimeframe = calculateRideTimeframe(ride);
    if (!rideTimeframe) {
      return {
        success: false,
        message: 'Invalid ride data: Missing pickupTime, appointmentTime, estimatedDuration, or tripType'
      };
    }

    // Get all volunteers
    const volunteersResult = await dataAccess.getAllVolunteers();
    if (!volunteersResult.success) {
      return {
        success: false,
        message: 'Failed to fetch volunteers',
        error: volunteersResult.error
      };
    }

    const volunteers = volunteersResult.volunteers;

    // Sort volunteers into available and unavailable lists
    const available = [];
    const unavailable = [];

    for (const volunteer of volunteers) {
      // Check status case-insensitively (Active, active, ACTIVE, etc.)
      const status = volunteer.volunteering_status ? volunteer.volunteering_status.toLowerCase() : '';
      if (status === 'active') {
        if (isVolunteerAvailableForTimeframe(volunteer, rideTimeframe)) {
          available.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
          });
        } else {
          unavailable.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
            reason: 'Not available during requested timeframe'
          });
        }
      }
    }

    return {
      success: true,
      ride: {
        id: ride.id,
        uid: ride.UID,
        appointmentTime: ride.appointmentTime,
        appointmentType: ride.appointment_type,
        status: ride.status,
      },
      available,
      summary: {
        totalDrivers: volunteers.filter(v => v.volunteering_status && v.volunteering_status.toLowerCase() === 'active').length,
        availableCount: available.length,
        unavailableCount: unavailable.length
      }
    };
  } catch (error) {
    console.error('Error in matchDriversForRideByUID:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

// Get ride appointment info by UID
async function getRideAppointmentInfo(uid) {
  try {
    const rideResult = await dataAccess.getRideByUID(uid);
    if (!rideResult.success) {
      return {
        success: false,
        message: 'Ride not found',
        error: rideResult.error
      };
    }

    const ride = rideResult.ride;

    // Get client information
    let clientName = "Unknown";
    if (ride.clientUID) {
      const clientResult = await dataAccess.getClientByReference(ride.clientUID);
      if (clientResult.success && clientResult.client) {
        const client = clientResult.client;
        clientName = `${client.first_name || ""} ${client.last_name || ""}`.trim();
      }
    }

    return {
      success: true,
      appointmentInfo: {
        uid: ride.UID,
        date: ride.Date,
        appointmentTime: ride.appointmentTime,
        clientName: clientName,
        appointmentType: ride.appointment_type,
        status: ride.status,
      }
    };
  } catch (error) {
    console.error('Error in getRideAppointmentInfo:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

// Create a new ride
async function createRide(rideData) {
  try {
    // Define required fields
    const requiredFields = ['UID', 'clientUID', 'Date', 'appointmentTime', 'appointment_type', 'purpose'];
    
    // Validate required fields
    const missingFields = requiredFields.filter(field => !rideData[field]);
    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Add timestamps
    rideData.CreatedAt = new Date();
    rideData.UpdatedAt = new Date();

    // Set default values for optional fields
    if (!rideData.status) rideData.status = 'Scheduled';
    if (!rideData.tripType) rideData.tripType = 'RoundTrip';
    if (rideData.wheelchair === undefined) rideData.wheelchair = false;

    const result = await dataAccess.createRide(rideData);

    if (result.success) {
      return {
        success: true,
        message: 'Ride created successfully',
        ride: result.ride
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to create ride'
      };
    }
  } catch (error) {
    console.error('Error in createRide:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

// Get all rides appointment info
async function getAllRidesAppointmentInfo() {
  try {
    // Get all rides
    const { db } = require('./firebase');
    const ridesSnapshot = await db.collection("rides").get();

    if (ridesSnapshot.empty) {
      return {
        success: true,
        appointmentInfo: []
      };
    }

    const appointmentInfoList = [];

    for (const doc of ridesSnapshot.docs) {
      const ride = doc.data();

      // Get client information
      let clientName = "Unknown";
      if (ride.clientUID) {
        const clientResult = await dataAccess.getClientByReference(ride.clientUID);
        if (clientResult.success && clientResult.client) {
          const client = clientResult.client;
          clientName = `${client.first_name || ""} ${client.last_name || ""}`.trim();
        }
      }

      appointmentInfoList.push({
        uid: ride.UID,
        date: ride.Date,
        appointmentTime: ride.appointmentTime,
        clientName: clientName,
        appointmentType: ride.appointment_type,
        status: ride.status,
      });
    }

    return {
      success: true,
      appointmentInfo: appointmentInfoList,
      total: appointmentInfoList.length
    };
  } catch (error) {
    console.error('Error in getAllRidesAppointmentInfo:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

// Get ride by UID
async function getRideByUID(uid) {
  try {
    const result = await dataAccess.getRideByUID(uid);
    if (!result.success) {
      return {
        success: false,
        message: 'Ride not found',
        error: result.error
      };
    }

    return {
      success: true,
      ride: result.ride
    };
  } catch (error) {
    console.error('Error in getRideByUID:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

// Update ride by UID
async function updateRideByUID(uid, updateData) {
  try {
    // Define allowed fields based on schema
    const allowedFields = [
      "clientUID",
      "additionalClient1_name",
      "additionalClient1_rel",
      "driverUID",
      "dispatcherUID",
      "startLocation",
      "destinationUID",
      "Date",
      "appointmentTime",
      "appointment_type",
      "pickupTme",
      "estimatedDuration",
      "purpose",
      "tripType",
      "status",
      "wheelchair",
      "wheelchairType",
      "milesDriven",
      "volunteerHours",
      "donationReceived",
      "donationAmount",
      "confirmation1_Date",
      "confirmation1_By",
      "confirmation2_Date",
      "confirmation2_By",
      "internalComment",
      "externalComment",
      "incidentReport",
    ];

    // Filter out any fields that are not allowed
    const validUpdates = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value;
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return {
        success: false,
        message: 'No valid fields to update'
      };
    }

    // Add UpdatedAt timestamp
    validUpdates.UpdatedAt = new Date();

    const result = await dataAccess.updateRideByUID(uid, validUpdates);

    if (result.success) {
      return {
        success: true,
        message: 'Ride updated successfully',
        ride: result.ride,
        updatedFields: Object.keys(validUpdates)
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to update ride'
      };
    }
  } catch (error) {
    console.error('Error in updateRideByUID:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

// Organization CRUD functions
async function createOrganization(orgData, authToken) {
  try {
    // Optional: Verify the JWT token if authToken is provided
    if (authToken) {
      const tokenVerification = verifyToken(authToken);
      if (!tokenVerification.success) {
        return { success: false, message: 'Authentication failed' };
      }
    }

    // Define required fields based on schema
    const requiredFields = ['name', 'org_id'];
    const missingFields = requiredFields.filter(field => !orgData[field]);
    if (missingFields.length > 0) {
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Define all allowed fields from schema
    const allowedFields = [
      'name',
      'org_id',
      'address',
      'email',
      'short_name',
      'phone_number',
      'lisence_number',
      'website',
      'creation_date',
      'address2',
      'city',
      'state',
      'zip',
      'pc_name',
      'pc_phone_number',
      'pc_email',
      'pc_address',
      'pc_address2',
      'pc_city',
      'pc_state',
      'pc_zip',
      'sc_name',
      'sc_phone_number',
      'sc_email',
      'sc_address',
      'sc_address2',
      'sc_city',
      'sc_state',
      'sc_zip',
      'sys_admin_phone_number',
      'sys_admin_user_id',
      'sys_admin_security_level'
    ];

    // Filter to only include allowed fields
    const filteredOrgData = {};
    for (const field of allowedFields) {
      if (orgData[field] !== undefined) {
        filteredOrgData[field] = orgData[field];
      }
    }

    const result = await dataAccess.createOrganization(filteredOrgData);

    if (result.success) {
      return {
        success: true,
        message: result.message,
        data: {
          orgId: result.orgId,
          organizationId: result.organizationId
        }
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to create organization'
      };
    }
  } catch (error) {
    console.error('Error in createOrganization:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

async function getOrganization(orgId, authToken) {
  try {
    // Optional: Verify the JWT token if authToken is provided
    if (authToken) {
      const tokenVerification = verifyToken(authToken);
      if (!tokenVerification.success) {
        return { success: false, message: 'Authentication failed' };
      }
    }

    // Try to get by document ID first, then by org_id
    let result = await dataAccess.getOrganizationById(orgId);
    
    if (!result.success) {
      // Try by org_id instead
      result = await dataAccess.getOrganizationByOrgId(orgId);
    }

    if (result.success) {
      return {
        success: true,
        organization: result.organization
      };
    } else {
      return {
        success: false,
        message: result.error || 'Organization not found'
      };
    }
  } catch (error) {
    console.error('Error in getOrganization:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

async function getAllOrganizations(authToken) {
  try {
    // Optional: Verify the JWT token if authToken is provided
    if (authToken) {
      const tokenVerification = verifyToken(authToken);
      if (!tokenVerification.success) {
        return { success: false, message: 'Authentication failed' };
      }
    }

    const result = await dataAccess.getAllOrganizations();

    if (result.success) {
      return {
        success: true,
        organizations: result.organizations,
        count: result.organizations.length
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to fetch organizations'
      };
    }
  } catch (error) {
    console.error('Error in getAllOrganizations:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

async function updateOrganization(orgId, updateData, authToken) {
  try {
    // Optional: Verify the JWT token if authToken is provided
    if (authToken) {
      const tokenVerification = verifyToken(authToken);
      if (!tokenVerification.success) {
        return { success: false, message: 'Authentication failed' };
      }
    }

    // Define all allowed fields from schema
    const allowedFields = [
      'name',
      'org_id',
      'address',
      'email',
      'short_name',
      'phone_number',
      'lisence_number',
      'website',
      'creation_date',
      'address2',
      'city',
      'state',
      'zip',
      'pc_name',
      'pc_phone_number',
      'pc_email',
      'pc_address',
      'pc_address2',
      'pc_city',
      'pc_state',
      'pc_zip',
      'sc_name',
      'sc_phone_number',
      'sc_email',
      'sc_address',
      'sc_address2',
      'sc_city',
      'sc_state',
      'sc_zip',
      'sys_admin_phone_number',
      'sys_admin_user_id',
      'sys_admin_security_level'
    ];

    // Filter to only include allowed fields
    const filteredUpdateData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    }

    if (Object.keys(filteredUpdateData).length === 0) {
      return {
        success: false,
        message: 'No valid fields to update'
      };
    }

    // Try to get by document ID first, then by org_id
    let orgResult = await dataAccess.getOrganizationById(orgId);
    
    if (!orgResult.success) {
      // Try by org_id instead
      orgResult = await dataAccess.getOrganizationByOrgId(orgId);
      if (orgResult.success) {
        orgId = orgResult.organization.id; // Use the document ID for update
      }
    }

    if (!orgResult.success) {
      return {
        success: false,
        message: 'Organization not found'
      };
    }

    const result = await dataAccess.updateOrganization(orgId, filteredUpdateData);

    if (result.success) {
      // Get the updated organization
      const updatedOrg = await dataAccess.getOrganizationById(orgId);
      return {
        success: true,
        message: result.message,
        organization: updatedOrg.success ? updatedOrg.organization : null
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to update organization'
      };
    }
  } catch (error) {
    console.error('Error in updateOrganization:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

async function deleteOrganization(orgId, authToken) {
  try {
    // Optional: Verify the JWT token if authToken is provided
    if (authToken) {
      const tokenVerification = verifyToken(authToken);
      if (!tokenVerification.success) {
        return { success: false, message: 'Authentication failed' };
      }
    }

    // Try to get by document ID first, then by org_id
    let orgResult = await dataAccess.getOrganizationById(orgId);
    
    if (!orgResult.success) {
      // Try by org_id instead
      orgResult = await dataAccess.getOrganizationByOrgId(orgId);
      if (orgResult.success) {
        orgId = orgResult.organization.id; // Use the document ID for deletion
      }
    }

    if (!orgResult.success) {
      return {
        success: false,
        message: 'Organization not found'
      };
    }

    const deletedOrg = orgResult.organization;
    const result = await dataAccess.deleteOrganization(orgId);

    if (result.success) {
      return {
        success: true,
        message: result.message,
        deletedOrganization: deletedOrg
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to delete organization'
      };
    }
  } catch (error) {
    console.error('Error in deleteOrganization:', error);
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
  createRide,
  matchDriversForRide,
  matchDriversForRideByUID,
  getRideAppointmentInfo,
  getAllRidesAppointmentInfo,
  getRideByUID,
  updateRideByUID,
  parseDriverAvailability,
  parseRideDateTime,
  isVolunteerAvailable,
  calculateRideTimeframe,
  isVolunteerAvailableForTimeframe,
  convertFirestoreTimestamp,
  getRidesByTimeframe,
  createOrganization,
  getOrganization,
  getAllOrganizations,
  updateOrganization,
  deleteOrganization
};