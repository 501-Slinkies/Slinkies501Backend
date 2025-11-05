// Set up a login User and role/permission management
// Enhanced driver matching system for ride requests

const dataAccess = require('./DataAccessLayer');
const jwt = require('jsonwebtoken');

async function loginUser(username, password) {
  const user = await dataAccess.login(username, password);
  if (user) {
    // Get JWT secret from environment or use default (for development only)
    const secretKey = process.env.JWT_SECRET || 'your-secret-key';
    
    // Fetch organization information if volunteer has organization field
    let organizationInfo = null;
    if (user.organization) {
      try {
        // Match volunteer's organization field to org_id in organizations collection
        const orgResult = await dataAccess.getOrganizationByOrgId(user.organization);
        if (orgResult.success && orgResult.organization) {
          organizationInfo = {
            id: orgResult.organization.id,
            org_id: orgResult.organization.org_id,
            name: orgResult.organization.name,
            email: orgResult.organization.email
          };
        } else {
          console.warn(`Organization not found for org_id: ${user.organization}`);
        }
      } catch (error) {
        console.error('Error fetching organization during login:', error);
        // Continue with login even if organization fetch fails
      }
    }
    
    // Prepare the payload for the JWT token
    // Include user info and roles array from the user document
    const tokenPayload = {
      userId: user.id,
      email: user.email_address,
      roles: user.roles || [], // Include the roles array from user document
      org: organizationInfo ? organizationInfo.org_id : null, // Include organization org_id if found
      orgId: organizationInfo ? organizationInfo.id : null, // Include organization document ID if found
      iat: Math.floor(Date.now() / 1000) // Issued at timestamp
    };
    
    // Generate JWT token with expiration (default: 24 hours)
    const expiresIn = process.env.SESSION_TIMEOUT_MINUTES || '24h';
    const token = jwt.sign(tokenPayload, secretKey, { expiresIn });
    
    console.log('Login successful for user:', user.email_address);
    return { 
      success: true, 
      token: token,
      user: { 
        email: user.email_address, 
        roles: user.roles || [], // Available roles from user document
        userId: user.volunteer_id,
        organizationId: organizationInfo ? organizationInfo.org_id : null, // Organization ID (org_id)
        organization: organizationInfo // Full organization details (optional)
      } 
    };
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
    'F': 'Friday',
    'S': 'Saturday',  // Support Saturday
    'Sa': 'Saturday', // Alternative Saturday format
    'Su': 'Sunday',   // Support Sunday
    'Sun': 'Sunday'   // Alternative Sunday format
  };
  return dayMap[dayAbbr] || null;
}

// Helper function to convert Firestore timestamp to Date
function convertFirestoreTimestamp(timestamp) {
  if (!timestamp) {
    return null;
  }
  
  // Firestore Timestamp object
  if (timestamp && typeof timestamp === 'object' && timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // ISO string or other string format
  if (typeof timestamp === 'string') {
    const parsed = new Date(timestamp);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // Firestore Timestamp-like object (check for seconds/nanoseconds)
  if (timestamp && typeof timestamp === 'object' && (timestamp.seconds !== undefined || timestamp._seconds !== undefined)) {
    const seconds = timestamp.seconds || timestamp._seconds || 0;
    const nanoseconds = timestamp.nanoseconds || timestamp._nanoseconds || 0;
    return new Date(seconds * 1000 + nanoseconds / 1000000);
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
// Format: DHH:MM;DHH:MM; where D is day (M, T, W, Th, F) and HH:MM is time in 24-hour format
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
      
      // Extract day and time from start segment (e.g., "M09:00" -> day: "M", hour: 9, minute: 0)
      // Format: DHH:MM where D is day abbreviation and HH:MM is 24-hour time
      // Support: M, T, W, Th, F, S, Sa, Su, Sun
      // Match order: longest first (Sun, Su, Sa, S, then weekday abbreviations)
      const startMatch = startSegment.match(/^(Sun|Su|Sa|S|[MTWThF]+)(\d{2}):(\d{2})$/);
      const endMatch = endSegment.match(/^(Sun|Su|Sa|S|[MTWThF]+)(\d{2}):(\d{2})$/);
      
      if (startMatch && endMatch) {
        const startDay = startMatch[1];
        const startHour = parseInt(startMatch[2], 10);
        const startMinute = parseInt(startMatch[3], 10);
        const endDay = endMatch[1];
        const endHour = parseInt(endMatch[2], 10);
        const endMinute = parseInt(endMatch[3], 10);
        
        // Validate time values
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
          continue;
        }
        if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
          continue;
        }
        if (startMinute < 0 || startMinute > 59 || endMinute < 0 || endMinute > 59) {
          continue;
        }
        
        // Convert to day names
        const startDayName = parseDayAbbreviation(startDay);
        const endDayName = parseDayAbbreviation(endDay);
        
        // Only create availability slot if both days are valid and match (same day)
        if (startDayName && endDayName && startDayName === endDayName) {
          // Store time as decimal hours (hours + minutes/60) for easier comparison
          availability.push({
            startDay: startDayName,
            startTime: startHour + (startMinute / 60),
            endDay: endDayName,
            endTime: endHour + (endMinute / 60)
          });
        } else {
          // Log skipped slots for debugging
          if (startDayName && endDayName && startDayName !== endDayName) {
            console.log(`Skipping availability slot: ${startDayName} ${startHour}:${startMinute} to ${endDayName} ${endHour}:${endMinute} (different days)`);
          }
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
  
  // Handle case where appointmentTime is already a Date/timestamp
  // Prioritize timestamp fields over string fields
  const appointmentTimeField = ride.appointmentTime || ride.AppointmentTime;
  // Check timestamp fields first (pickupTime, PickupTime), then string field (pickupTme)
  const pickupTimeField = ride.pickupTime || ride.PickupTime || ride.pickupTme;
  
  // Convert appointmentTime to Date object if it exists
  let appointmentTime = null;
  if (appointmentTimeField) {
    appointmentTime = convertFirestoreTimestamp(appointmentTimeField);
  }
  
  // Convert pickupTime to Date object if it exists
  // Only use timestamp fields, ignore string fields (they're handled above)
  let pickupTime = null;
  if (pickupTimeField) {
    // Only convert if it's a timestamp (Date object or Firestore timestamp), not a string
    if (pickupTimeField instanceof Date || (pickupTimeField && typeof pickupTimeField === 'object' && pickupTimeField.toDate)) {
      pickupTime = convertFirestoreTimestamp(pickupTimeField);
      
      // Validate pickupTime is before appointmentTime
      // If pickupTime is after appointmentTime, it's invalid - recalculate
      if (pickupTime && appointmentTime && pickupTime >= appointmentTime) {
        console.warn('Invalid pickup time (after appointment time), recalculating:', {
          pickupTime: pickupTime,
          appointmentTime: appointmentTime
        });
        pickupTime = null; // Reset to recalculate
      }
    } else if (typeof pickupTimeField === 'string') {
      // If it's a string, it's the old format (pickupTme), skip it - we'll calculate default
      console.log('Skipping string pickup time field, will calculate default');
      pickupTime = null;
    }
  }
  
  // If we have appointmentTime but no pickupTime, calculate default pickup time
  // Default: 25 minutes before appointment (allows travel time)
  if (appointmentTime && !pickupTime && estimatedDuration && tripType) {
    pickupTime = new Date(appointmentTime.getTime() - (25 * 60 * 1000)); // 25 minutes before
    console.log('Pickup time not provided or invalid, using default 25 minutes before appointment:', pickupTime);
  }
  
  // If we have both times, calculate the timeframe
  if (pickupTime && appointmentTime && estimatedDuration && tripType) {
    return calculateTimeframeFromTimestamps(pickupTime, appointmentTime, estimatedDuration, tripType);
  }
  
  // If we only have appointmentTime but missing required fields, log error
  if (appointmentTime && (!estimatedDuration || !tripType)) {
    console.error('Missing required fields for ride timeframe calculation:', {
      hasAppointmentTime: !!appointmentTime,
      estimatedDuration: estimatedDuration,
      tripType: tripType
    });
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
  // The database timestamps represent local time values directly
  // Use the time components as-is without timezone conversion
  // Example: If DB shows "10:30 AM", extract 10:30 directly from the timestamp
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Extract time components directly from the timestamp
  // The timestamp already represents the local time, so we use getHours() and getMinutes()
  // which will give us the local time components based on the server's timezone
  // OR we manually extract from UTC if the timestamp is stored in UTC but represents local time
  // Since DB shows "10:30 AM UTC-5" and Firestore stores as "15:30 UTC", we need to convert back
  const utcStartHour = rideTimeframe.startTime.getUTCHours();
  const utcStartMinute = rideTimeframe.startTime.getUTCMinutes();
  const utcEndHour = rideTimeframe.endTime.getUTCHours();
  const utcEndMinute = rideTimeframe.endTime.getUTCMinutes();
  
  // Database stores local time as UTC, so convert back: UTC hour - offset = local hour
  // For UTC-5 (EST): if UTC is 15:30, local is 15:30 - 5 = 10:30
  const utcOffsetHours = 5; // Hours to subtract (EST is UTC-5)
  let localStartHour = utcStartHour - utcOffsetHours;
  let localEndHour = utcEndHour - utcOffsetHours;
  
  // Handle hour rollover
  if (localStartHour < 0) localStartHour += 24;
  if (localStartHour >= 24) localStartHour -= 24;
  if (localEndHour < 0) localEndHour += 24;
  if (localEndHour >= 24) localEndHour -= 24;
  
  // Get day of week - use UTC day and adjust if needed for day boundary
  let rideDayIndex = rideTimeframe.startTime.getUTCDay();
  const adjustedStartHour = utcStartHour - utcOffsetHours;
  if (adjustedStartHour < 0) {
    rideDayIndex = (rideDayIndex - 1 + 7) % 7; // Previous day
  } else if (adjustedStartHour >= 24) {
    rideDayIndex = (rideDayIndex + 1) % 7; // Next day
  }
  const rideDay = dayNames[rideDayIndex];
  
  // Convert to decimal hours (hours + minutes/60) - these should directly reflect DB times
  // Example: 10:30 AM = 10.50, 10:00 AM = 10.00
  const rideStartTime = localStartHour + (utcStartMinute / 60);
  const rideEndTime = localEndHour + (utcEndMinute / 60);
  
  // Debug logging
  console.log('Checking availability:', {
    volunteer: volunteer.first_name + ' ' + volunteer.last_name,
    rideDay,
    rideStartTime: rideStartTime.toFixed(2),
    rideEndTime: rideEndTime.toFixed(2),
    availabilitySlots: availability.length,
    parsedSlots: availability.map(s => `${s.startDay} ${s.startTime.toFixed(2)}-${s.endTime.toFixed(2)}`)
  });
  
  // Check if the volunteer is available on the ride day
  if (availability.length === 0) {
    console.log(`No availability slots parsed for ${volunteer.first_name} ${volunteer.last_name}`);
    return false;
  }
  
  let foundMatchingDay = false;
  for (const slot of availability) {
    if (slot.startDay === rideDay) {
      foundMatchingDay = true;
      console.log(`Checking slot: ${slot.startDay} ${slot.startTime.toFixed(2)}-${slot.endTime.toFixed(2)}`);
      // Check if the entire ride timeframe falls within the volunteer's availability
      // We need the volunteer to be available from start to end of the ride
      if (rideStartTime >= slot.startTime && rideEndTime <= slot.endTime) {
        console.log(`✓ MATCH FOUND for ${volunteer.first_name} ${volunteer.last_name}: ride ${rideStartTime.toFixed(2)}-${rideEndTime.toFixed(2)} fits in ${slot.startTime.toFixed(2)}-${slot.endTime.toFixed(2)}`);
        return true;
      } else {
        console.log(`✗ No match: ride ${rideStartTime.toFixed(2)}-${rideEndTime.toFixed(2)} not within slot ${slot.startTime.toFixed(2)}-${slot.endTime.toFixed(2)}`);
        console.log(`  Details: rideStartTime (${rideStartTime.toFixed(2)}) >= slot.startTime (${slot.startTime.toFixed(2)}) = ${rideStartTime >= slot.startTime}`);
        console.log(`           rideEndTime (${rideEndTime.toFixed(2)}) <= slot.endTime (${slot.endTime.toFixed(2)}) = ${rideEndTime <= slot.endTime}`);
      }
    }
  }
  
  if (!foundMatchingDay) {
    console.log(`No slots found for ${rideDay} (available days: ${[...new Set(availability.map(s => s.startDay))].join(', ')})`);
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
    
    // Get destination town for limitation checking
    let destinationTown = null;
    if (ride.destinationUID) {
      const destResult = await dataAccess.getDestinationById(ride.destinationUID);
      if (destResult.success && destResult.destination) {
        destinationTown = destResult.destination.town || null;
        console.log(`Ride destination town: ${destinationTown}`);
      } else {
        console.warn(`Could not fetch destination for ride ${rideId}: ${destResult.error}`);
      }
    }
    
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
      
      // Check if volunteer is on leave and if the leave period has ended
      let isOnLeave = false;
      if (status.includes('leave')) {
        // Extract date from status like "on leave until 09/25/2025"
        const dateMatch = status.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (dateMatch) {
          const leaveEndDate = new Date(dateMatch[1]);
          const rideDate = rideTimeframe ? rideTimeframe.startTime : null;
          // If ride date is after leave end date, volunteer is available
          isOnLeave = rideDate && rideDate <= leaveEndDate;
        } else {
          // If status contains "leave" but no date, assume currently on leave
          isOnLeave = true;
        }
      }
      
      const isActive = status === 'active' || (!status.includes('leave') && !status.includes('inactive'));
      
      // Include active volunteers who are not on leave (or whose leave has ended)
      if (isActive && !isOnLeave) {
        // Check destination limitations if destination town is available
        if (destinationTown) {
          const limitations = volunteer.destination_limitations || '';
          if (limitations && typeof limitations === 'string') {
            // Parse comma-separated towns and check for case-insensitive match
            const limitedTowns = limitations.split(',').map(town => town.trim().toLowerCase());
            const rideTownLower = destinationTown.trim().toLowerCase();
            
            if (limitedTowns.includes(rideTownLower)) {
              unavailable.push({
                id: volunteer.id,
                name: `${volunteer.first_name} ${volunteer.last_name}`,
                email: volunteer.email_address,
                phone: volunteer.primary_phone,
                vehicle: volunteer.type_of_vehicle,
                maxRidesPerWeek: volunteer.max_rides_week,
                availability: volunteer.driver_availability_by_day_and_time,
                reason: `Destination town (${destinationTown}) is in driver's limitations`
              });
              continue; // Skip to next volunteer
            }
          }
        }
        
        // Check wheelchair requirement if ride requires wheelchair
        const rideRequiresWheelchair = ride.wheelchair === true;
        const volunteerCanHandleWheelchair = volunteer.wheelchair === true; // Default to false if field doesn't exist
        
        // If ride requires wheelchair but volunteer cannot handle it, skip this volunteer
        if (rideRequiresWheelchair && !volunteerCanHandleWheelchair) {
          unavailable.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
            maxRidesPerWeek: volunteer.max_rides_week,
            availability: volunteer.driver_availability_by_day_and_time,
            reason: 'Ride requires wheelchair capability'
          });
          continue; // Skip to next volunteer
        }
        
        // Check availability for timeframe
        if (isVolunteerAvailableForTimeframe(volunteer, rideTimeframe)) {
          available.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
            maxRidesPerWeek: volunteer.max_rides_week,
            availability: volunteer.driver_availability_by_day_and_time,
            wheelchairCapable: volunteerCanHandleWheelchair
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
    
    // Get destination town for limitation checking
    let destinationTown = null;
    if (ride.destinationUID) {
      const destResult = await dataAccess.getDestinationById(ride.destinationUID);
      if (destResult.success && destResult.destination) {
        destinationTown = destResult.destination.town || null;
        console.log(`Ride destination town: ${destinationTown}`);
      } else {
        console.warn(`Could not fetch destination for ride ${ride.UID}: ${destResult.error}`);
      }
    }
    
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
        // Check destination limitations if destination town is available
        if (destinationTown) {
          const limitations = volunteer.destination_limitations || '';
          if (limitations && typeof limitations === 'string') {
            // Parse comma-separated towns and check for case-insensitive match
            const limitedTowns = limitations.split(',').map(town => town.trim().toLowerCase());
            const rideTownLower = destinationTown.trim().toLowerCase();
            
            if (limitedTowns.includes(rideTownLower)) {
              unavailable.push({
                id: volunteer.id,
                name: `${volunteer.first_name} ${volunteer.last_name}`,
                email: volunteer.email_address,
                phone: volunteer.primary_phone,
                vehicle: volunteer.type_of_vehicle,
                reason: `Destination town (${destinationTown}) is in driver's limitations`
              });
              continue; // Skip to next volunteer
            }
          }
        }
        
        // Check wheelchair requirement if ride requires wheelchair
        const rideRequiresWheelchair = ride.wheelchair === true;
        const volunteerCanHandleWheelchair = volunteer.wheelchair === true; // Default to false if field doesn't exist
        
        // If ride requires wheelchair but volunteer cannot handle it, skip this volunteer
        if (rideRequiresWheelchair && !volunteerCanHandleWheelchair) {
          unavailable.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
            reason: 'Ride requires wheelchair capability'
          });
          continue; // Skip to next volunteer
        }
        
        // Check availability for timeframe
        if (isVolunteerAvailableForTimeframe(volunteer, rideTimeframe)) {
          available.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
            wheelchairCapable: volunteerCanHandleWheelchair
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
      "assignedTo",
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

// Assign a driver to a ride
async function assignDriverToRide(rideId, volunteerId) {
  try {
    // Validate inputs
    if (!rideId || !volunteerId) {
      return {
        success: false,
        message: 'Ride ID and volunteer ID are required'
      };
    }

    // Verify the ride exists
    const rideResult = await dataAccess.getRideById(rideId);
    if (!rideResult.success) {
      return {
        success: false,
        message: 'Ride not found',
        error: rideResult.error
      };
    }

    // Prepare update data
    const updateData = {
      assignedTo: volunteerId,
      status: 'assigned',
      UpdatedAt: new Date()
    };

    // Update the ride document
    const result = await dataAccess.updateRideById(rideId, updateData);

    if (result.success) {
      return {
        success: true,
        message: 'Driver assigned to ride successfully',
        ride: result.ride
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to assign driver to ride'
      };
    }
  } catch (error) {
    console.error('Error in assignDriverToRide:', error);
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
  assignDriverToRide,
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