// Set up a login User and role/permission management
// Enhanced driver matching system for ride requests

const dataAccess = require('./DataAccessLayer');
const jwt = require('jsonwebtoken');

function normalizeVolunteerRoles(user) {
  if (!user || typeof user !== 'object') {
    return [];
  }

  const roleSources = [
    user.roles,
    user.role,
    user.role_name
  ];

  const normalized = [];

  for (const source of roleSources) {
    if (!source) {
      continue;
    }

    if (Array.isArray(source)) {
      for (const entry of source) {
        if (typeof entry === 'string' && entry.trim()) {
          normalized.push(entry.trim());
        }
      }
      continue;
    }

    if (typeof source === 'string' && source.trim()) {
      normalized.push(source.trim());
    }
  }

  // Remove duplicates while preserving order.
  return [...new Set(normalized)];
}

async function loginUser(username, password) {
  const user = await dataAccess.login(username, password);
  if (user) {
    const roles = normalizeVolunteerRoles(user);
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
      roles: roles,
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
        roles: roles, // Available roles from user document
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

async function getParentRole(roleName) {
  try {
    if (!roleName || typeof roleName !== 'string' || !roleName.trim()) {
      return {
        success: false,
        message: 'Role name is required'
      };
    }

    const roleResult = await dataAccess.getRoleByName(roleName.trim());

    if (!roleResult.success) {
      return {
        success: false,
        message: roleResult.error || 'Role not found'
      };
    }

    const role = roleResult.role || {};
    return {
      success: true,
      role: role.name || role.id || roleName.trim(),
      parent_role: role.parent_role || null
    };
  } catch (error) {
    console.error('Error fetching parent role:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
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
const DEFAULT_UTC_OFFSET_HOURS = 5; // EST offset (UTC-5)
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

function parseUnavailabilityDateTimeSegment(segment) {
  if (!segment || typeof segment !== 'string') {
    return null;
  }

  const parts = segment.split(',').map(part => part.trim()).filter(part => part !== '');
  if (parts.length < 4) {
    return null;
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  const timeToken = parts.slice(3).join(',');

  const timeMatch = timeToken.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) {
    return null;
  }

  const hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);

  if (
    isNaN(day) || isNaN(month) || isNaN(year) ||
    isNaN(hour) || isNaN(minute) ||
    day < 1 || day > 31 ||
    month < 1 || month > 12 ||
    hour < 0 || hour > 23 ||
    minute < 0 || minute > 59
  ) {
    return null;
  }

  const dateTime = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (isNaN(dateTime.getTime())) {
    return null;
  }

  return dateTime;
}

function parseVolunteerUnavailabilityRange(rangeStr) {
  if (!rangeStr || typeof rangeStr !== 'string') {
    return { success: false, message: 'Unavailability entry must be a string' };
  }

  const segments = rangeStr.split(';').map(segment => segment.trim()).filter(segment => segment !== '');
  if (segments.length !== 2) {
    return { success: false, message: 'Unavailability entry must contain exactly two date-time values separated by a semicolon' };
  }

  const start = parseUnavailabilityDateTimeSegment(segments[0]);
  const end = parseUnavailabilityDateTimeSegment(segments[1]);

  if (!start || !end) {
    return { success: false, message: 'Unable to parse start or end date-time value. Expected format: DD,MM,YYYY,HH:MM;DD,MM,YYYY,HH:MM' };
  }

  if (end <= start) {
    return { success: false, message: 'Unavailability end time must be after start time' };
  }

  return {
    success: true,
    start,
    end
  };
}

function normalizeWeekday(weekdayStr) {
  if (!weekdayStr || typeof weekdayStr !== 'string') {
    return null;
  }

  const normalized = weekdayStr.trim().toLowerCase();
  const weekdayMap = {
    'sunday': 'Sunday',
    'sun': 'Sunday',
    'su': 'Sunday',
    '0': 'Sunday',
    '7': 'Sunday',
    'monday': 'Monday',
    'mon': 'Monday',
    'm': 'Monday',
    '1': 'Monday',
    'tuesday': 'Tuesday',
    'tues': 'Tuesday',
    'tue': 'Tuesday',
    't': 'Tuesday',
    '2': 'Tuesday',
    'wednesday': 'Wednesday',
    'wed': 'Wednesday',
    'w': 'Wednesday',
    '3': 'Wednesday',
    'thursday': 'Thursday',
    'thu': 'Thursday',
    'thur': 'Thursday',
    'thurs': 'Thursday',
    'th': 'Thursday',
    '4': 'Thursday',
    'friday': 'Friday',
    'fri': 'Friday',
    'f': 'Friday',
    '5': 'Friday',
    'saturday': 'Saturday',
    'sat': 'Saturday',
    'sa': 'Saturday',
    's': 'Saturday',
    '6': 'Saturday'
  };

  return weekdayMap[normalized] || null;
}

function parseTwentyFourHourTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return null;
  }

  const normalized = timeStr.trim();
  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  if (
    isNaN(hour) || isNaN(minute) ||
    hour < 0 || hour > 23 ||
    minute < 0 || minute > 59
  ) {
    return null;
  }

  return {
    hour,
    minute,
    minutesTotal: hour * 60 + minute
  };
}

function formatMinutesToTime(minutes) {
  if (typeof minutes !== 'number' || !isFinite(minutes)) {
    return '';
  }
  const normalized = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const hour = Math.floor(normalized / 60);
  const minute = Math.floor(normalized % 60);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function formatDateISO(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().split('T')[0];
}

function parseUnavailabilityStringToSlots(unavailabilityString) {
  if (!unavailabilityString || typeof unavailabilityString !== 'string') {
    return [];
  }

  const slots = parseDriverAvailability(unavailabilityString);
  if (!Array.isArray(slots) || slots.length === 0) {
    return [];
  }

  const parsedSlots = [];
  for (const slot of slots) {
    if (!slot || typeof slot !== 'object') {
      continue;
    }

    const weekday = slot.startDay;
    const startMinutes = typeof slot.startTime === 'number' ? Math.round(slot.startTime * 60) : null;
    const endMinutes = typeof slot.endTime === 'number' ? Math.round(slot.endTime * 60) : null;

    if (
      !weekday ||
      startMinutes === null ||
      endMinutes === null ||
      endMinutes <= startMinutes
    ) {
      continue;
    }

    parsedSlots.push({
      weekday,
      startMinutes,
      endMinutes,
      startHour: Math.floor(startMinutes / 60),
      startMinute: startMinutes % 60,
      endHour: Math.floor(endMinutes / 60),
      endMinute: endMinutes % 60
    });
  }

  return parsedSlots;
}

function clampDateToStartOfDay(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  const cloned = new Date(date);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
}

function parseEffectiveDate(dateInput) {
  if (!dateInput) {
    return null;
  }

  if (dateInput instanceof Date) {
    const normalized = clampDateToStartOfDay(dateInput);
    return normalized && !isNaN(normalized.getTime()) ? normalized : null;
  }

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) {
      return null;
    }

    let parsed = parseDateString(trimmed);
    if (!parsed) {
      const isoParsed = new Date(trimmed);
      parsed = isNaN(isoParsed.getTime()) ? null : isoParsed;
    }

    return parsed ? clampDateToStartOfDay(parsed) : null;
  }

  if (typeof dateInput === 'number' && isFinite(dateInput)) {
    const parsed = new Date(dateInput);
    return clampDateToStartOfDay(parsed);
  }

  return null;
}

function normalizeDateInput(dateInput) {
  if (dateInput === null || dateInput === undefined) {
    return null;
  }

  const timestampDate = convertFirestoreTimestamp(dateInput);
  if (timestampDate) {
    return clampDateToStartOfDay(timestampDate);
  }

  if (dateInput instanceof Date) {
    return clampDateToStartOfDay(dateInput);
  }

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) {
      return null;
    }

    const isoParsed = new Date(trimmed);
    if (!isNaN(isoParsed.getTime())) {
      return clampDateToStartOfDay(isoParsed);
    }

    const fallback = parseDateString(trimmed);
    if (fallback) {
      return clampDateToStartOfDay(fallback);
    }
  }

  if (typeof dateInput === 'number' && isFinite(dateInput)) {
    const parsed = new Date(dateInput);
    return clampDateToStartOfDay(parsed);
  }

  return null;
}

function buildVolunteerUnavailabilityIndex(volunteer) {
  const singles = [];
  const recurring = [];

  if (!volunteer || typeof volunteer !== 'object') {
    return { singles, recurring };
  }

  const unavailabilityEntries = Array.isArray(volunteer.unavailability)
    ? volunteer.unavailability
    : [];

  for (const entry of unavailabilityEntries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    // Legacy single-entry format with explicit start/end
    if (entry.start || entry.end) {
      const start = convertFirestoreTimestamp(entry.start || entry.startTime || entry.begin);
      const end = convertFirestoreTimestamp(entry.end || entry.endTime || entry.finish);
      if (start instanceof Date && end instanceof Date && start < end) {
        singles.push({ start, end, source: entry.source || 'legacy_single' });
      }
      continue;
    }

    const unavailabilityString = typeof entry.unavailabilityString === 'string'
      ? entry.unavailabilityString
      : typeof entry.unavailability_string === 'string'
        ? entry.unavailability_string
        : null;

    if (!unavailabilityString) {
      continue;
    }

    const slots = parseUnavailabilityStringToSlots(unavailabilityString);
    if (slots.length === 0) {
      continue;
    }

    const repeated = entry.repeated === true;
    const effectiveFrom = normalizeDateInput(entry.effectiveFrom ?? entry.effective_from ?? entry.startDate);
    const effectiveToInput = normalizeDateInput(entry.effectiveTo ?? entry.effective_to ?? entry.endDate);
    const effectiveTo = effectiveToInput || effectiveFrom;

    if (repeated) {
      for (const slot of slots) {
        recurring.push({
          weekday: slot.weekday,
          startMinutes: slot.startMinutes,
          endMinutes: slot.endMinutes,
          effectiveFrom,
          effectiveTo,
          source: entry.source || 'recurring_unavailability'
        });
      }
    } else {
      if (!effectiveFrom) {
        // Cannot expand non-recurring entry without a start date
        continue;
      }

      const rangeStart = effectiveFrom;
      const rangeEnd = effectiveTo && effectiveTo >= rangeStart ? effectiveTo : rangeStart;

      for (let current = new Date(rangeStart); current <= rangeEnd; current.setDate(current.getDate() + 1)) {
        const currentDayName = DAY_NAMES[current.getDay()];

        for (const slot of slots) {
          if (slot.weekday !== currentDayName) {
            continue;
          }

          const start = new Date(current);
          start.setHours(slot.startHour, slot.startMinute, 0, 0);

          const end = new Date(current);
          end.setHours(slot.endHour, slot.endMinute, 0, 0);

          if (start < end) {
            singles.push({
              start,
              end,
              source: entry.source || 'single_unavailability'
            });
          }
        }
      }
    }
  }

  // Legacy recurring array support
  const legacyRecurring = Array.isArray(volunteer.recurringUnavailability)
    ? volunteer.recurringUnavailability
    : [];

  for (const entry of legacyRecurring) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const weekday = normalizeWeekday(entry.weekday || entry.day || entry.dayOfWeek);
    let startMinutes = typeof entry.startMinutes === 'number' ? entry.startMinutes : null;
    let endMinutes = typeof entry.endMinutes === 'number' ? entry.endMinutes : null;

    if ((startMinutes === null || endMinutes === null) && typeof entry.startTime === 'number' && typeof entry.endTime === 'number') {
      startMinutes = Math.round(entry.startTime * 60);
      endMinutes = Math.round(entry.endTime * 60);
    }

    if (
      !weekday ||
      startMinutes === null ||
      endMinutes === null ||
      endMinutes <= startMinutes
    ) {
      continue;
    }

    recurring.push({
      weekday,
      startMinutes,
      endMinutes,
      effectiveFrom: normalizeDateInput(entry.effectiveFrom ?? entry.effective_from ?? entry.startDate),
      effectiveTo: normalizeDateInput(entry.effectiveTo ?? entry.effective_to ?? entry.endDate),
      source: entry.source || 'legacy_recurring'
    });
  }

  return { singles, recurring };
}

function parseRecurringUnavailabilityEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return {
      success: false,
      message: 'Recurring unavailability entry must be an object'
    };
  }

  const weekdayInput = entry.weekday || entry.day || entry.dayOfWeek;
  const weekday = normalizeWeekday(weekdayInput);
  if (!weekday) {
    return {
      success: false,
      message: 'Recurring unavailability requires a valid weekday'
    };
  }

  const startInput = entry.start || entry.startTime;
  const endInput = entry.end || entry.endTime;
  const parsedStart = parseTwentyFourHourTime(startInput);
  const parsedEnd = parseTwentyFourHourTime(endInput);

  if (!parsedStart || !parsedEnd) {
    return {
      success: false,
      message: 'Recurring unavailability requires start and end times in HH:MM 24-hour format'
    };
  }

  if (parsedEnd.minutesTotal <= parsedStart.minutesTotal) {
    return {
      success: false,
      message: 'Recurring unavailability end time must be after start time'
    };
  }

  const effectiveFrom = parseEffectiveDate(entry.effectiveFrom || entry.effective_from || entry.startDate);
  const effectiveTo = parseEffectiveDate(entry.effectiveTo || entry.effective_to || entry.endDate);

  if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) {
    return {
      success: false,
      message: 'Recurring unavailability effectiveTo date must be on or after effectiveFrom date'
    };
  }

  return {
    success: true,
    entry: {
      weekday,
      startMinutes: parsedStart.minutesTotal,
      endMinutes: parsedEnd.minutesTotal,
      effectiveFrom,
      effectiveTo,
      source: entry.source || 'volunteer_api_recurring'
    }
  };
}

function getVolunteerUnavailabilityConflict(volunteer, rideTimeframe) {
  if (!rideTimeframe || !(rideTimeframe.startTime instanceof Date) || !(rideTimeframe.endTime instanceof Date)) {
    return null;
  }

  const { singles } = buildVolunteerUnavailabilityIndex(volunteer);
  if (singles.length === 0) {
    return null;
  }

  const rideStart = rideTimeframe.startTime;
  const rideEnd = rideTimeframe.endTime;

  for (const entry of singles) {
    if (rideStart < entry.end && rideEnd > entry.start) {
      return { start: entry.start, end: entry.end };
    }
  }

  return null;
}

function getLocalRideWindow(rideTimeframe) {
  if (
    !rideTimeframe ||
    !(rideTimeframe.startTime instanceof Date) ||
    !(rideTimeframe.endTime instanceof Date)
  ) {
    return null;
  }

  const dayNames = DAY_NAMES;

  const utcStartMinutes = rideTimeframe.startTime.getUTCHours() * 60 + rideTimeframe.startTime.getUTCMinutes();
  const utcEndMinutes = rideTimeframe.endTime.getUTCHours() * 60 + rideTimeframe.endTime.getUTCMinutes();

  let localStartMinutes = utcStartMinutes - DEFAULT_UTC_OFFSET_HOURS * 60;
  let localEndMinutes = utcEndMinutes - DEFAULT_UTC_OFFSET_HOURS * 60;

  // Adjust for wrap-around
  while (localStartMinutes < 0) {
    localStartMinutes += 1440;
  }
  while (localStartMinutes >= 1440) {
    localStartMinutes -= 1440;
  }
  while (localEndMinutes < 0) {
    localEndMinutes += 1440;
  }
  while (localEndMinutes >= 1440) {
    localEndMinutes -= 1440;
  }

  let rideDayIndex = rideTimeframe.startTime.getUTCDay();
  const adjustedStartHour = rideTimeframe.startTime.getUTCHours() - DEFAULT_UTC_OFFSET_HOURS;
  if (adjustedStartHour < 0) {
    rideDayIndex = (rideDayIndex - 1 + 7) % 7;
  } else if (adjustedStartHour >= 24) {
    rideDayIndex = (rideDayIndex + 1) % 7;
  }
  const rideDay = dayNames[rideDayIndex];

  return {
    rideDay,
    rideStartDecimal: localStartMinutes / 60,
    rideEndDecimal: localEndMinutes / 60,
    rideStartMinutes: localStartMinutes,
    rideEndMinutes: localEndMinutes
  };
}

function getVolunteerRecurringUnavailabilityConflict(volunteer, rideTimeframe) {
  if (!rideTimeframe || !(rideTimeframe.startTime instanceof Date) || !(rideTimeframe.endTime instanceof Date)) {
    return null;
  }

  const { recurring } = buildVolunteerUnavailabilityIndex(volunteer);
  if (recurring.length === 0) {
    return null;
  }

  const localWindow = getLocalRideWindow(rideTimeframe);
  if (!localWindow) {
    return null;
  }

  const rideDate = clampDateToStartOfDay(rideTimeframe.startTime);
  for (const entry of recurring) {
    if (entry.weekday !== localWindow.rideDay) {
      continue;
    }

    const effectiveFrom = entry.effectiveFrom ? clampDateToStartOfDay(entry.effectiveFrom) : null;
    const effectiveTo = entry.effectiveTo ? clampDateToStartOfDay(entry.effectiveTo) : null;

    if (effectiveFrom && rideDate && rideDate < effectiveFrom) {
      continue;
    }
    if (effectiveTo && rideDate && rideDate > effectiveTo) {
      continue;
    }

    if (localWindow.rideStartMinutes < entry.endMinutes && localWindow.rideEndMinutes > entry.startMinutes) {
      return {
        type: 'recurring',
        weekday: entry.weekday,
        startMinutes: entry.startMinutes,
        endMinutes: entry.endMinutes,
        effectiveFrom: effectiveFrom ? clampDateToStartOfDay(effectiveFrom) : null,
        effectiveTo: effectiveTo ? clampDateToStartOfDay(effectiveTo) : null
      };
    }
  }

  return null;
}

function getVolunteerAvailabilityConflict(volunteer, rideTimeframe) {
  if (!rideTimeframe || !(rideTimeframe.startTime instanceof Date) || !(rideTimeframe.endTime instanceof Date)) {
    return null;
  }

  const { singles, recurring } = buildVolunteerUnavailabilityIndex(volunteer);

  if (singles.length > 0) {
    const rideStart = rideTimeframe.startTime;
    const rideEnd = rideTimeframe.endTime;

    for (const entry of singles) {
      if (rideStart < entry.end && rideEnd > entry.start) {
        return {
          type: 'single',
          start: entry.start,
          end: entry.end
        };
      }
    }
  }

  if (recurring.length > 0) {
    const localWindow = getLocalRideWindow(rideTimeframe);
    if (!localWindow) {
      return null;
    }

    const rideDate = clampDateToStartOfDay(rideTimeframe.startTime);

    for (const entry of recurring) {
      const effectiveFrom = entry.effectiveFrom ? clampDateToStartOfDay(entry.effectiveFrom) : null;
      const effectiveTo = entry.effectiveTo ? clampDateToStartOfDay(entry.effectiveTo) : null;

      if (effectiveFrom && rideDate && rideDate < effectiveFrom) {
        continue;
      }
      if (effectiveTo && rideDate && rideDate > effectiveTo) {
        continue;
      }

      if (
        entry.weekday === localWindow.rideDay &&
        localWindow.rideStartMinutes < entry.endMinutes &&
        localWindow.rideEndMinutes > entry.startMinutes
      ) {
        return {
          type: 'recurring',
          weekday: entry.weekday,
          startMinutes: entry.startMinutes,
          endMinutes: entry.endMinutes,
          effectiveFrom,
          effectiveTo
        };
      }
    }
  }

  return null;
}

function hasUnavailabilityConflict(volunteer, rideTimeframe) {
  return !!getVolunteerAvailabilityConflict(volunteer, rideTimeframe);
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

function getWeekBounds(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    return null;
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay(); // Sunday = 0
  start.setDate(start.getDate() - day);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function extractAssignedDriverIdentifiers(ride) {
  if (!ride || typeof ride !== 'object') {
    return [];
  }

  const identifiers = new Set();

  const addIdentifier = (value) => {
    if (!value) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      identifiers.add(trimmed);
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (last) {
          identifiers.add(last.trim());
        }
      }
      return;
    }

    if (typeof value === 'object') {
      if (typeof value.id === 'string') {
        addIdentifier(value.id);
      }
      if (typeof value.path === 'string') {
        addIdentifier(value.path);
      }
      if (typeof value.uid === 'string') {
        addIdentifier(value.uid);
      }
      if (typeof value.UID === 'string') {
        addIdentifier(value.UID);
      }
    }
  };

  addIdentifier(ride.assignedTo);
  addIdentifier(ride.assigned_to);
  addIdentifier(ride.driverUID);
  addIdentifier(ride.driverUid);
  addIdentifier(ride.DriverUID);
  addIdentifier(ride.driverId);
  addIdentifier(ride.driver_id);
  addIdentifier(ride.driverVolunteerId);
  addIdentifier(ride.driverVolunteerUID);
  addIdentifier(ride.driver_volunteer_uid);
  addIdentifier(ride.driver_volunteer_ref);
  addIdentifier(ride.driver_volunteer_reference);
  addIdentifier(ride.driverReference);
  addIdentifier(ride.Driver);

  return Array.from(identifiers);
}

function getVolunteerIdentifiers(volunteer) {
  if (!volunteer || typeof volunteer !== 'object') {
    return [];
  }

  const identifiers = new Set();

  const addIdentifier = (value) => {
    if (!value) {
      return;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      identifiers.add(trimmed);
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (last) {
          identifiers.add(last.trim());
        }
      }
      return;
    }

    if (typeof value === 'object') {
      if (typeof value.id === 'string') {
        addIdentifier(value.id);
      }
      if (typeof value.path === 'string') {
        addIdentifier(value.path);
      }
    }
  };

  addIdentifier(volunteer.id);
  addIdentifier(volunteer.uid);
  addIdentifier(volunteer.UID);
  addIdentifier(volunteer.user_ID);
  addIdentifier(volunteer.userId);
  addIdentifier(volunteer.volunteer_id);
  addIdentifier(volunteer.volunteerId);
  addIdentifier(volunteer.assignedTo);
  addIdentifier(volunteer.referencePath);
  addIdentifier(volunteer.documentPath);

  return Array.from(identifiers);
}

function parseMaxRidesPerWeek(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const numeric = typeof value === 'number' ? value : parseInt(value, 10);
  if (!Number.isFinite(numeric) || isNaN(numeric)) {
    return null;
  }

  return numeric;
}

const WEEKLY_LIMIT_EXCLUDED_STATUSES = new Set(['unassigned', 'canceled', 'cancelled', 'declined']);

function shouldCountRideStatusForWeeklyLimit(status) {
  if (!status) {
    return true;
  }

  if (typeof status !== 'string') {
    return true;
  }

  const normalized = status.toLowerCase();
  return !WEEKLY_LIMIT_EXCLUDED_STATUSES.has(normalized);
}

async function getAssignedRideCountsByDriver(weekStart, weekEnd, excludeRideIdentifiers = []) {
  if (!(weekStart instanceof Date) || isNaN(weekStart) || !(weekEnd instanceof Date) || isNaN(weekEnd)) {
    return {};
  }

  try {
    const excludeSet = new Set();
    (excludeRideIdentifiers || []).forEach(identifier => {
      if (identifier === undefined || identifier === null) {
        return;
      }
      const normalized = `${identifier}`.trim();
      if (normalized) {
        excludeSet.add(normalized);
      }
    });

    const rides = await dataAccess.fetchRidesInRange(weekStart, weekEnd);
    const counts = {};

    for (const ride of rides) {
      const rideIdentifiers = [
        ride?.id,
        ride?.UID,
        ride?.uid,
        ride?.RideID,
        ride?.ride_id
      ];
      const shouldSkipRide = rideIdentifiers.some(identifier => {
        if (identifier === undefined || identifier === null) {
          return false;
        }
        const normalized = `${identifier}`.trim();
        return normalized && excludeSet.has(normalized);
      });
      if (shouldSkipRide) {
        continue;
      }

      const driverIdentifiers = extractAssignedDriverIdentifiers(ride);
      if (driverIdentifiers.length === 0) {
        continue;
      }

      const status = ride?.status || ride?.Status || ride?.ride_status;
      if (!shouldCountRideStatusForWeeklyLimit(status)) {
        continue;
      }

      let rideStart = null;
      const timeframe = calculateRideTimeframe(ride);
      if (timeframe && timeframe.startTime instanceof Date && !isNaN(timeframe.startTime)) {
        rideStart = timeframe.startTime;
      } else if (ride?.Date) {
        const parsed = new Date(ride.Date);
        if (!isNaN(parsed)) {
          rideStart = parsed;
        }
      } else if (ride?.date) {
        const parsed = new Date(ride.date);
        if (!isNaN(parsed)) {
          rideStart = parsed;
        }
      }

      if (!rideStart || rideStart < weekStart || rideStart > weekEnd) {
        continue;
      }

      const uniqueIdentifiers = new Set(driverIdentifiers);
      for (const identifier of uniqueIdentifiers) {
        counts[identifier] = (counts[identifier] || 0) + 1;
      }
    }

    return counts;
  } catch (error) {
    console.error('Error computing assigned ride counts by driver:', error);
    return {};
  }
}

function getWeeklyAssignmentCountForVolunteer(volunteer, countsByDriver) {
  if (!countsByDriver || typeof countsByDriver !== 'object') {
    return 0;
  }

  const identifiers = getVolunteerIdentifiers(volunteer);
  if (identifiers.length === 0) {
    return 0;
  }

  let maxCount = 0;
  for (const identifier of identifiers) {
    const count = countsByDriver[identifier];
    if (typeof count === 'number' && count > maxCount) {
      maxCount = count;
    }
  }

  return maxCount;
}

async function getDriverRides(volunteerId, authToken = null) {
  try {
    if (!volunteerId || (typeof volunteerId === 'string' && volunteerId.trim() === '')) {
      return {
        success: false,
        message: 'Volunteer ID is required'
      };
    }

    const addIdentifier = (identifier, set) => {
      if (identifier === undefined || identifier === null) {
        return;
      }
      const str = typeof identifier === 'string' ? identifier : `${identifier}`;
      const trimmed = str.trim();
      if (!trimmed) {
        return;
      }
      set.add(trimmed);
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (last) {
          set.add(last.trim());
        }
      }
    };

    const identifierSet = new Set();
    addIdentifier(volunteerId, identifierSet);

    let volunteer = null;
    const primaryLookup = await dataAccess.getUserById(volunteerId);
    if (primaryLookup.success && primaryLookup.user) {
      volunteer = primaryLookup.user;
    } else {
      const fallbackLookup = await dataAccess.getUserByUserID(volunteerId);
      if (fallbackLookup.success && fallbackLookup.user) {
        volunteer = fallbackLookup.user;
        addIdentifier(fallbackLookup.user.id, identifierSet);
      }
    }

    if (volunteer) {
      const volunteerIdentifiers = getVolunteerIdentifiers(volunteer);
      volunteerIdentifiers.forEach(identifier => addIdentifier(identifier, identifierSet));
    }

    if (identifierSet.size === 0) {
      return {
        success: false,
        message: 'Unable to determine identifiers for volunteer'
      };
    }

    const ridesResult = await dataAccess.getRidesByDriverIdentifiers(Array.from(identifierSet));
    if (!ridesResult.success) {
      return {
        success: false,
        message: ridesResult.error || 'Failed to fetch rides for volunteer'
      };
    }

    const rides = Array.isArray(ridesResult.rides) ? ridesResult.rides : [];
    rides.sort((a, b) => {
      const dateA = a.Date || a.date || a.appointmentTime || a.appointment_time || a.pickupTime || a.pickupTme;
      const dateB = b.Date || b.date || b.appointmentTime || b.appointment_time || b.pickupTime || b.pickupTme;

      const toMillis = (value) => {
        if (!value) {
          return 0;
        }
        if (value instanceof Date) {
          return value.getTime();
        }
        if (typeof value === 'object' && typeof value.toDate === 'function') {
          return value.toDate().getTime();
        }
        const parsed = new Date(value);
        if (!isNaN(parsed)) {
          return parsed.getTime();
        }
        return 0;
      };

      return toMillis(dateB) - toMillis(dateA);
    });

    return {
      success: true,
      message: `Found ${rides.length} ride${rides.length === 1 ? '' : 's'} for volunteer`,
      data: {
        driverFirestoreId: volunteer ? volunteer.id : (typeof volunteerId === 'string' ? volunteerId.trim() : `${volunteerId}`),
        driver: volunteer,
        identifiersQueried: Array.from(identifierSet),
        identifiersMatched: ridesResult.matchedIdentifiers || [],
        total: rides.length,
        rides
      }
    };
  } catch (error) {
    console.error('Error in getDriverRides:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

async function getRolesForOrganization(orgId) {
  try {
    if (!orgId || (typeof orgId === 'string' && orgId.trim() === '')) {
      return {
        success: false,
        message: 'Organization ID is required'
      };
    }

    const sanitizedOrgId = typeof orgId === 'string' ? orgId.trim() : `${orgId}`;
    const result = await dataAccess.getRolesByOrganization(sanitizedOrgId);
    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to fetch roles for organization'
      };
    }

    return {
      success: true,
      organizationId: sanitizedOrgId,
      total: result.roles.length,
      roles: result.roles
    };
  } catch (error) {
    console.error('Error in getRolesForOrganization:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

async function getPermissionSetByRoleName(roleName) {
  try {
    if (!roleName || (typeof roleName === 'string' && roleName.trim() === '')) {
      return {
        success: false,
        message: 'Role name is required'
      };
    }

    const normalizedRoleName = typeof roleName === 'string' ? roleName.trim() : `${roleName}`;
    const result = await dataAccess.getPermissionSetByRoleName(normalizedRoleName);
    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to fetch permission set for role'
      };
    }

    return {
      success: true,
      role: result.role,
      permissionSet: result.permissionSet
    };
  } catch (error) {
    console.error('Error in getPermissionSetByRoleName:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: error.message
    };
  }
}

function parsePreferenceList(value) {
  if (!value) {
    return [];
  }

  let items = [];
  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === 'string') {
    items = value.split(/[,;|]/);
  } else {
    return [];
  }

  return items
    .map(item => {
      if (item === undefined || item === null) {
        return '';
      }
      const str = typeof item === 'string' ? item : `${item}`;
      return str.trim();
    })
    .filter(str => str.length > 0);
}

function getTownCandidatesForPreferences(client, ride, destinationTown) {
  const candidates = new Set();
  const addCandidate = (value) => {
    if (!value) {
      return;
    }
    const str = typeof value === 'string' ? value : `${value}`;
    const trimmed = str.trim();
    if (trimmed.length > 0) {
      candidates.add(trimmed);
    }
  };

  addCandidate(destinationTown);

  if (client && typeof client === 'object') {
    addCandidate(client.city);
    addCandidate(client.town);
    addCandidate(client.home_town);
    addCandidate(client.homeTown);
    addCandidate(client.residence_town);
    addCandidate(client.residenceTown);
  }

  const startLocation = ride?.startLocation || ride?.start_location;
  const processLocation = (location) => {
    if (!location) {
      return;
    }
    if (typeof location === 'string') {
      addCandidate(location);
    } else if (typeof location === 'object') {
      addCandidate(location.town);
      addCandidate(location.city);
      addCandidate(location.name);
      addCandidate(location.label);
    }
  };
  processLocation(startLocation);
  processLocation(ride?.pickupLocation || ride?.pickup_location);

  addCandidate(ride?.pickupTown || ride?.pickup_town);
  addCandidate(ride?.startTown || ride?.start_town);

  return Array.from(candidates);
}

function getClientIdentifiersForPreferences(client) {
  const identifiers = new Set();
  const addIdentifier = (value) => {
    if (!value) {
      return;
    }
    const str = typeof value === 'string' ? value : `${value}`;
    const trimmed = str.trim();
    if (trimmed.length > 0) {
      identifiers.add(trimmed);
    }
  };

  if (!client || typeof client !== 'object') {
    return Array.from(identifiers);
  }

  addIdentifier(client.UID);
  addIdentifier(client.uid);
  addIdentifier(client.clientUID);
  addIdentifier(client.client_uid);
  addIdentifier(client.clientId);
  addIdentifier(client.client_id);
  addIdentifier(client.id);

  const firstName = client.first_name ?? client.firstName ?? '';
  const lastName = client.last_name ?? client.lastName ?? '';
  const preferredName = client.preferred_name ?? client.preferredName ?? '';

  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fullName) {
    addIdentifier(fullName);
  }

  const reversedName = [lastName, firstName].filter(Boolean).join(', ').trim();
  if (reversedName) {
    addIdentifier(reversedName);
  }

  if (preferredName) {
    addIdentifier(preferredName);
    if (lastName) {
      addIdentifier(`${preferredName} ${lastName}`);
      addIdentifier(`${lastName}, ${preferredName}`);
    }
  }

  return Array.from(identifiers);
}

function getVolunteerPreferenceMessages(volunteer, client, ride, destinationTown) {
  if (!volunteer || typeof volunteer !== 'object') {
    return [];
  }

  const messages = [];

  const townPreferences = parsePreferenceList(volunteer.town_preference);
  if (townPreferences.length > 0) {
    const normalizedTownPrefs = townPreferences.map(pref => ({
      value: pref,
      normalized: pref.toLowerCase()
    }));

    const townCandidates = getTownCandidatesForPreferences(client, ride, destinationTown);
    const matchedTownPrefs = new Set();

    for (const candidate of townCandidates) {
      const normalizedCandidate = candidate.toLowerCase();
      const match = normalizedTownPrefs.find(pref => pref.normalized === normalizedCandidate);
      if (match && !matchedTownPrefs.has(match.normalized)) {
        matchedTownPrefs.add(match.normalized);
        messages.push(`Matches volunteer town preference (${match.value})`);
      }
    }
  }

  const clientPreferences = parsePreferenceList(volunteer.client_preference_for_drivers);
  if (clientPreferences.length > 0 && client) {
    const normalizedClientPrefs = clientPreferences.map(pref => ({
      value: pref,
      normalized: pref.toLowerCase()
    }));

    const clientIdentifiers = getClientIdentifiersForPreferences(client).map(identifier => ({
      value: identifier,
      normalized: identifier.toLowerCase()
    }));

    const matchedClientPrefs = new Set();
    for (const identifier of clientIdentifiers) {
      const match = normalizedClientPrefs.find(pref => pref.normalized === identifier.normalized);
      if (match && !matchedClientPrefs.has(match.normalized)) {
        matchedClientPrefs.add(match.normalized);
        messages.push(`Volunteer has this client in preferred list (${match.value})`);
      }
    }
  }

  return messages;
}

// Helper function to extract day and time from ride date/time (legacy function for backward compatibility)
function parseRideDateTime(rideDate, rideTime) {
  if (!rideDate || !rideTime) {
    return null;
  }
  
  // Parse the date to get the day of the week
  const date = new Date(rideDate);
  const dayNames = DAY_NAMES;
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

// Helper function to check if car heights match
// client car_height_needed can contain: low, med, high (any combination, comma or semicolon-separated)
// If empty, all car heights are acceptable
// volunteer car_height should match one of the client's needed heights
function matchesCarHeight(clientCarHeightNeeded, volunteerCarHeight) {
  if (!clientCarHeightNeeded || typeof clientCarHeightNeeded !== 'string' || clientCarHeightNeeded.trim() === '') {
    // If client has no car height requirement, all heights are acceptable
    return true;
  }
  
  if (!volunteerCarHeight || typeof volunteerCarHeight !== 'string') {
    // If volunteer has no car height specified, cannot match
    return false;
  }
  
  // Parse client's needed heights (comma or semicolon-separated, case-insensitive)
  // Support both comma and semicolon separators
  const neededHeights = clientCarHeightNeeded.split(/[,;]/)
    .map(h => h.trim().toLowerCase())
    .filter(h => h.length > 0);
  
  // Check if volunteer's car height matches any of the needed heights
  const volunteerHeightLower = volunteerCarHeight.trim().toLowerCase();
  return neededHeights.includes(volunteerHeightLower);
}

// Helper function to check if allergies match
// client allergies is comma-separated string
// volunteer allergens_in_car is comma-separated string (allergens the volunteer allows)
// All client allergies must be in volunteer's allowed list for a match
// If client has no allergies, it's always a match
// If volunteer has no allergens_in_car (empty string), they allow all allergies (no restrictions)
function matchesAllergies(clientAllergies, volunteerAllergiesInCar) {
  if (!clientAllergies || typeof clientAllergies !== 'string' || clientAllergies.trim() === '') {
    // If client has no allergies, it's always a match
    return true;
  }
  
  // If volunteer has no allergens_in_car specified (empty string), they allow all allergies (no restrictions)
  if (!volunteerAllergiesInCar || typeof volunteerAllergiesInCar !== 'string' || volunteerAllergiesInCar.trim() === '') {
    return true; // Empty means no restrictions - allow all
  }
  
  // Parse client allergies (comma-separated, case-insensitive)
  const clientAllergyList = clientAllergies.split(',')
    .map(a => a.trim().toLowerCase())
    .filter(a => a.length > 0);
  
  // Parse volunteer allowed allergies (comma-separated, case-insensitive)
  const volunteerAllergyList = volunteerAllergiesInCar.split(',')
    .map(a => a.trim().toLowerCase())
    .filter(a => a.length > 0);
  
  // If volunteer's list is empty after parsing, they allow all (no restrictions)
  if (volunteerAllergyList.length === 0) {
    return true;
  }
  
  // Check if all client allergies are in volunteer's allowed list
  return clientAllergyList.every(clientAllergy => 
    volunteerAllergyList.includes(clientAllergy)
  );
}

// Helper function to check if mobility assistance matches
// client mobility_assistance is comma-separated string
// volunteer mobility_accommodation is comma-separated string
// All client mobility assistance needs must be in volunteer's accommodations
function matchesMobilityAssistance(clientMobilityAssistance, volunteerMobilityAccommodation) {
  if (!clientMobilityAssistance || typeof clientMobilityAssistance !== 'string' || clientMobilityAssistance.trim() === '') {
    // If client has no mobility assistance needs, it's always a match
    return true;
  }
  
  if (!volunteerMobilityAccommodation || typeof volunteerMobilityAccommodation !== 'string' || volunteerMobilityAccommodation.trim() === '') {
    // If volunteer has no mobility accommodations, they cannot match
    return false;
  }
  
  // Parse client mobility assistance needs (comma-separated, case-insensitive)
  const clientMobilityList = clientMobilityAssistance.split(',')
    .map(m => m.trim().toLowerCase())
    .filter(m => m.length > 0);
  
  // Parse volunteer mobility accommodations (comma-separated, case-insensitive)
  const volunteerMobilityList = volunteerMobilityAccommodation.split(',')
    .map(m => m.trim().toLowerCase())
    .filter(m => m.length > 0);
  
  // Check if all client mobility needs are in volunteer's accommodations
  return clientMobilityList.every(clientMobility => 
    volunteerMobilityList.includes(clientMobility)
  );
}

// Helper function to check all client-volunteer matching criteria
// Returns { match: boolean, reason: string } if match is false
function matchesClientVolunteerCriteria(client, volunteer) {
  // Check car height
  if (!matchesCarHeight(client.car_height_needed, volunteer.car_height)) {
    return { match: false, reason: 'Car height requirement not met' };
  }
  
  // Check oxygen - both must have oxygen capability or both must not require it
  const clientNeedsOxygen = client.oxygen === true;
  const volunteerHasOxygen = volunteer.oxygen === true;
  if (clientNeedsOxygen && !volunteerHasOxygen) {
    return { match: false, reason: 'Client requires oxygen capability' };
  }
  
  // Check service animal - if client has service animal, volunteer must accept it
  const clientHasServiceAnimal = client.service_animal === true;
  const volunteerAcceptsServiceAnimal = volunteer.accepts_service_animal === true;
  if (clientHasServiceAnimal && !volunteerAcceptsServiceAnimal) {
    return { match: false, reason: 'Client has service animal but volunteer does not accept service animals' };
  }
  
  // Check allergies - all client allergies must be in volunteer's allowed list
  if (!matchesAllergies(client.allergies, volunteer.allergens_in_car)) {
    return { match: false, reason: 'Client allergies not compatible with volunteer vehicle' };
  }
  
  // Check mobility assistance - all client needs must be in volunteer's accommodations
  if (!matchesMobilityAssistance(client.mobility_assistance, volunteer.mobility_accommodation)) {
    return { match: false, reason: 'Client mobility assistance needs not met' };
  }
  
  return { match: true };
}

// Helper function to check if a volunteer has a driver role
// Checks if any role in the volunteer's roles array contains "driver" (case-insensitive)
// Supports variants like: "driver", "default_driver", "pen_driver", "fish_rush_driver", etc.
function isDriverRole(volunteer) {
  if (!volunteer) {
    return false;
  }

  const rawRoles = volunteer.roles ?? volunteer.role ?? volunteer.role_name ?? null;
  if (!rawRoles) {
    return false;
  }

  // Handle both array and string formats
  const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  
  // Check if any role contains "driver" (case-insensitive)
  return roles.some(role => {
    if (typeof role !== 'string') {
      return false;
    }
    return role.toLowerCase().includes('driver');
  });
}

// Helper function to check if a volunteer is available for a specific ride timeframe
function isVolunteerAvailableForTimeframe(volunteer, rideTimeframe) {
  if (!volunteer.driver_availability_by_day_and_time || !rideTimeframe) {
    return false;
  }
  
  const availability = parseDriverAvailability(volunteer.driver_availability_by_day_and_time);

  const localWindow = getLocalRideWindow(rideTimeframe);
  if (!localWindow) {
    return false;
  }
  
  // Debug logging
  console.log('Checking availability:', {
    volunteer: volunteer.first_name + ' ' + volunteer.last_name,
    rideDay: localWindow.rideDay,
    rideStartTime: localWindow.rideStartDecimal.toFixed(2),
    rideEndTime: localWindow.rideEndDecimal.toFixed(2),
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
    if (slot.startDay === localWindow.rideDay) {
      foundMatchingDay = true;
      console.log(`Checking slot: ${slot.startDay} ${slot.startTime.toFixed(2)}-${slot.endTime.toFixed(2)}`);
      // Check if the entire ride timeframe falls within the volunteer's availability
      // We need the volunteer to be available from start to end of the ride
      if (localWindow.rideStartDecimal >= slot.startTime && localWindow.rideEndDecimal <= slot.endTime) {
        const conflict = getVolunteerAvailabilityConflict(volunteer, rideTimeframe);
        if (conflict) {
          if (conflict.type === 'single') {
            console.log(`✗ Volunteer marked unavailable between ${conflict.start.toISOString()} and ${conflict.end.toISOString()}`);
          } else if (conflict.type === 'recurring') {
            console.log(`✗ Volunteer has recurring unavailability on ${conflict.weekday} from ${formatMinutesToTime(conflict.startMinutes)} to ${formatMinutesToTime(conflict.endMinutes)}`);
          } else {
            console.log('✗ Volunteer marked unavailable for this timeframe');
          }
          return false;
        }
        console.log(`✓ MATCH FOUND for ${volunteer.first_name} ${volunteer.last_name}: ride ${localWindow.rideStartDecimal.toFixed(2)}-${localWindow.rideEndDecimal.toFixed(2)} fits in ${slot.startTime.toFixed(2)}-${slot.endTime.toFixed(2)}`);
        return true;
      } else {
        console.log(`✗ No match: ride ${localWindow.rideStartDecimal.toFixed(2)}-${localWindow.rideEndDecimal.toFixed(2)} not within slot ${slot.startTime.toFixed(2)}-${slot.endTime.toFixed(2)}`);
        console.log(`  Details: rideStartTime (${localWindow.rideStartDecimal.toFixed(2)}) >= slot.startTime (${slot.startTime.toFixed(2)}) = ${localWindow.rideStartDecimal >= slot.startTime}`);
        console.log(`           rideEndTime (${localWindow.rideEndDecimal.toFixed(2)}) <= slot.endTime (${slot.endTime.toFixed(2)}) = ${localWindow.rideEndDecimal <= slot.endTime}`);
      }
    }
  }
  
  if (!foundMatchingDay) {
    console.log(`No slots found for ${localWindow.rideDay} (available days: ${[...new Set(availability.map(s => s.startDay))].join(', ')})`);
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
    
    // Get client document for matching criteria
    let client = null;
    if (ride.clientUID) {
      const clientResult = await dataAccess.getClientByReference(ride.clientUID);
      if (clientResult.success && clientResult.client) {
        client = clientResult.client;
        console.log(`Client fetched successfully: ${client.first_name} ${client.last_name}`);
      } else {
        console.warn(`Could not fetch client for ride ${rideId}: ${clientResult.error}`);
      }
    } else {
      console.warn(`Ride ${rideId} has no clientUID`);
    }
    
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

    const weekBounds = getWeekBounds(rideTimeframe.startTime);
    let weeklyAssignedCounts = {};
    if (weekBounds) {
      weeklyAssignedCounts = await getAssignedRideCountsByDriver(
        weekBounds.start,
        weekBounds.end,
        [ride.id, ride.UID, ride.uid, ride.RideID, ride.ride_id]
      );
    } else {
      console.warn(`Unable to determine week bounds for ride ${ride.UID || ride.id}`);
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
      
      // Only include volunteers who have a driver role (supports variants like default_driver, pen_driver, fish_rush_driver)
      // Skip non-driver volunteers entirely - don't include them in results
      if (!isDriverRole(volunteer)) {
        continue; // Skip to next volunteer
      }
      
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
        const weeklyAssignedCount = getWeeklyAssignmentCountForVolunteer(volunteer, weeklyAssignedCounts);
        const maxRidesPerWeek = parseMaxRidesPerWeek(volunteer.max_rides_week ?? volunteer.max_rides_per_week);

        if (maxRidesPerWeek !== null && maxRidesPerWeek > 0 && weeklyAssignedCount >= maxRidesPerWeek) {
          unavailable.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
            maxRidesPerWeek: volunteer.max_rides_week,
            currentWeekRideCount: weeklyAssignedCount,
            availability: volunteer.driver_availability_by_day_and_time,
            oxygen: volunteer.oxygen || false,
            mobility_accommodation: volunteer.mobility_accommodation || '',
            accepts_service_animal: volunteer.accepts_service_animal || false,
            destination_limitations: volunteer.destination_limitations || '',
            allergens_in_car: volunteer.allergens_in_car || '',
            reason: `Driver has reached weekly ride limit (${weeklyAssignedCount}/${maxRidesPerWeek})`
          });
          continue;
        }

        const preferenceMatches = getVolunteerPreferenceMessages(volunteer, client, ride, destinationTown);

        // Check destination limitations against both destination town and client's city
        const limitations = volunteer.destination_limitations || '';
        if (limitations && typeof limitations === 'string') {
          // Parse comma-separated towns and check for case-insensitive match
          const limitedTowns = limitations.split(',').map(town => town.trim().toLowerCase());
          
          // Check destination town
          let isLimited = false;
          let limitationReason = '';
          
          if (destinationTown) {
            const rideTownLower = destinationTown.trim().toLowerCase();
            if (limitedTowns.includes(rideTownLower)) {
              isLimited = true;
              limitationReason = `Destination town (${destinationTown}) is in driver's limitations`;
            }
          }
          
          // Check client's city/town
          if (!isLimited && client && client.city) {
            const clientCityLower = client.city.trim().toLowerCase();
            if (limitedTowns.includes(clientCityLower)) {
              isLimited = true;
              limitationReason = `Client's city (${client.city}) is in driver's limitations`;
            }
          }
          
          if (isLimited) {
            unavailable.push({
              id: volunteer.id,
              name: `${volunteer.first_name} ${volunteer.last_name}`,
              email: volunteer.email_address,
              phone: volunteer.primary_phone,
              vehicle: volunteer.type_of_vehicle,
              maxRidesPerWeek: volunteer.max_rides_week,
              currentWeekRideCount: weeklyAssignedCount,
              availability: volunteer.driver_availability_by_day_and_time,
              oxygen: volunteer.oxygen || false,
              mobility_accommodation: volunteer.mobility_accommodation || '',
              accepts_service_animal: volunteer.accepts_service_animal || false,
              destination_limitations: volunteer.destination_limitations || '',
              allergens_in_car: volunteer.allergens_in_car || '',
              reason: limitationReason,
              preferenceMatches
            });
            continue; // Skip to next volunteer
          }
        }
        
        // Check client-volunteer matching criteria (car height, oxygen, service animal, allergies, mobility assistance)
        if (client) {
          const criteriaMatch = matchesClientVolunteerCriteria(client, volunteer);
          if (!criteriaMatch.match) {
            unavailable.push({
              id: volunteer.id,
              name: `${volunteer.first_name} ${volunteer.last_name}`,
              email: volunteer.email_address,
              phone: volunteer.primary_phone,
              vehicle: volunteer.type_of_vehicle,
              maxRidesPerWeek: volunteer.max_rides_week,
              currentWeekRideCount: weeklyAssignedCount,
              availability: volunteer.driver_availability_by_day_and_time,
              oxygen: volunteer.oxygen || false,
              mobility_accommodation: volunteer.mobility_accommodation || '',
              accepts_service_animal: volunteer.accepts_service_animal || false,
              destination_limitations: volunteer.destination_limitations || '',
              allergens_in_car: volunteer.allergens_in_car || '',
              reason: criteriaMatch.reason,
              preferenceMatches
            });
            continue; // Skip to next volunteer
          }
        } else {
          console.warn(`Skipping client-volunteer matching for ride ${ride.UID || ride.id} - client not found`);
        }
        
        // Check availability for timeframe
        const availabilityConflict = getVolunteerAvailabilityConflict(volunteer, rideTimeframe);

        if (!availabilityConflict && isVolunteerAvailableForTimeframe(volunteer, rideTimeframe)) {
          available.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
            maxRidesPerWeek: volunteer.max_rides_week,
            currentWeekRideCount: weeklyAssignedCount,
            availability: volunteer.driver_availability_by_day_and_time,
            oxygen: volunteer.oxygen || false,
            mobility_accommodation: volunteer.mobility_accommodation || '',
            accepts_service_animal: volunteer.accepts_service_animal || false,
            destination_limitations: volunteer.destination_limitations || '',
            allergens_in_car: volunteer.allergens_in_car || '',
            preferenceMatches
          });
        } else {
          let reason = 'Not available during requested timeframe';
          if (availabilityConflict) {
            if (availabilityConflict.type === 'single') {
              reason = `Volunteer reported unavailable from ${availabilityConflict.start.toISOString()} to ${availabilityConflict.end.toISOString()}`;
            } else if (availabilityConflict.type === 'recurring') {
              let rangeDetails = '';
              if (availabilityConflict.effectiveFrom && availabilityConflict.effectiveTo) {
                rangeDetails = ` between ${formatDateISO(availabilityConflict.effectiveFrom)} and ${formatDateISO(availabilityConflict.effectiveTo)}`;
              } else if (availabilityConflict.effectiveFrom) {
                rangeDetails = ` starting ${formatDateISO(availabilityConflict.effectiveFrom)}`;
              } else if (availabilityConflict.effectiveTo) {
                rangeDetails = ` until ${formatDateISO(availabilityConflict.effectiveTo)}`;
              }
              reason = `Volunteer has recurring unavailability on ${availabilityConflict.weekday} from ${formatMinutesToTime(availabilityConflict.startMinutes)} to ${formatMinutesToTime(availabilityConflict.endMinutes)}${rangeDetails}`;
            }
          }

          unavailable.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
            maxRidesPerWeek: volunteer.max_rides_week,
            currentWeekRideCount: weeklyAssignedCount,
            availability: volunteer.driver_availability_by_day_and_time,
            oxygen: volunteer.oxygen || false,
            mobility_accommodation: volunteer.mobility_accommodation || '',
            accepts_service_animal: volunteer.accepts_service_animal || false,
            destination_limitations: volunteer.destination_limitations || '',
            allergens_in_car: volunteer.allergens_in_car || '',
            reason,
            preferenceMatches
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
    
    // Get client document for matching criteria
    let client = null;
    if (ride.clientUID) {
      const clientResult = await dataAccess.getClientByReference(ride.clientUID);
      if (clientResult.success && clientResult.client) {
        client = clientResult.client;
        console.log(`Client fetched successfully: ${client.first_name} ${client.last_name}`);
      } else {
        console.warn(`Could not fetch client for ride ${ride.UID}: ${clientResult.error}`);
      }
    } else {
      console.warn(`Ride ${ride.UID} has no clientUID`);
    }
    
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
      // Only include volunteers who have a driver role (supports variants like default_driver, pen_driver, fish_rush_driver)
      // Skip non-driver volunteers entirely - don't include them in results
      if (!isDriverRole(volunteer)) {
        continue; // Skip to next volunteer
      }
      
      // Check status case-insensitively (Active, active, ACTIVE, etc.)
      const status = volunteer.volunteering_status ? volunteer.volunteering_status.toLowerCase() : '';
      if (status === 'active') {
        const preferenceMatches = getVolunteerPreferenceMessages(volunteer, client, ride, destinationTown);

        // Check destination limitations against both destination town and client's city
        const limitations = volunteer.destination_limitations || '';
        if (limitations && typeof limitations === 'string') {
          // Parse comma-separated towns and check for case-insensitive match
          const limitedTowns = limitations.split(',').map(town => town.trim().toLowerCase());
          
          // Check destination town
          let isLimited = false;
          let limitationReason = '';
          
          if (destinationTown) {
            const rideTownLower = destinationTown.trim().toLowerCase();
            if (limitedTowns.includes(rideTownLower)) {
              isLimited = true;
              limitationReason = `Destination town (${destinationTown}) is in driver's limitations`;
            }
          }
          
          // Check client's city/town
          if (!isLimited && client && client.city) {
            const clientCityLower = client.city.trim().toLowerCase();
            if (limitedTowns.includes(clientCityLower)) {
              isLimited = true;
              limitationReason = `Client's city (${client.city}) is in driver's limitations`;
            }
          }
          
          if (isLimited) {
            unavailable.push({
              id: volunteer.id,
              name: `${volunteer.first_name} ${volunteer.last_name}`,
              email: volunteer.email_address,
              phone: volunteer.primary_phone,
              vehicle: volunteer.type_of_vehicle,
              oxygen: volunteer.oxygen || false,
              mobility_accommodation: volunteer.mobility_accommodation || '',
              accepts_service_animal: volunteer.accepts_service_animal || false,
              destination_limitations: volunteer.destination_limitations || '',
              allergens_in_car: volunteer.allergens_in_car || '',
              reason: limitationReason,
              preferenceMatches
            });
            continue; // Skip to next volunteer
          }
        }
        
        // Check client-volunteer matching criteria (car height, oxygen, service animal, allergies, mobility assistance)
        if (client) {
          const criteriaMatch = matchesClientVolunteerCriteria(client, volunteer);
          if (!criteriaMatch.match) {
            unavailable.push({
              id: volunteer.id,
              name: `${volunteer.first_name} ${volunteer.last_name}`,
              email: volunteer.email_address,
              phone: volunteer.primary_phone,
              vehicle: volunteer.type_of_vehicle,
              oxygen: volunteer.oxygen || false,
              mobility_accommodation: volunteer.mobility_accommodation || '',
              accepts_service_animal: volunteer.accepts_service_animal || false,
              destination_limitations: volunteer.destination_limitations || '',
              allergens_in_car: volunteer.allergens_in_car || '',
              reason: criteriaMatch.reason,
              preferenceMatches
            });
            continue; // Skip to next volunteer
          }
        } else {
          console.warn(`Skipping client-volunteer matching for ride ${ride.UID} - client not found`);
        }
        
        // Check availability for timeframe
        const availabilityConflict = getVolunteerAvailabilityConflict(volunteer, rideTimeframe);

        if (!availabilityConflict && isVolunteerAvailableForTimeframe(volunteer, rideTimeframe)) {
          available.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
            oxygen: volunteer.oxygen || false,
            mobility_accommodation: volunteer.mobility_accommodation || '',
            accepts_service_animal: volunteer.accepts_service_animal || false,
            destination_limitations: volunteer.destination_limitations || '',
            allergens_in_car: volunteer.allergens_in_car || '',
            preferenceMatches
          });
        } else {
          let reason = 'Not available during requested timeframe';
          if (availabilityConflict) {
            if (availabilityConflict.type === 'single') {
              reason = `Volunteer reported unavailable from ${availabilityConflict.start.toISOString()} to ${availabilityConflict.end.toISOString()}`;
            } else if (availabilityConflict.type === 'recurring') {
              let rangeDetails = '';
              if (availabilityConflict.effectiveFrom && availabilityConflict.effectiveTo) {
                rangeDetails = ` between ${formatDateISO(availabilityConflict.effectiveFrom)} and ${formatDateISO(availabilityConflict.effectiveTo)}`;
              } else if (availabilityConflict.effectiveFrom) {
                rangeDetails = ` starting ${formatDateISO(availabilityConflict.effectiveFrom)}`;
              } else if (availabilityConflict.effectiveTo) {
                rangeDetails = ` until ${formatDateISO(availabilityConflict.effectiveTo)}`;
              }
              reason = `Volunteer has recurring unavailability on ${availabilityConflict.weekday} from ${formatMinutesToTime(availabilityConflict.startMinutes)} to ${formatMinutesToTime(availabilityConflict.endMinutes)}${rangeDetails}`;
            }
          }

          unavailable.push({
            id: volunteer.id,
            name: `${volunteer.first_name} ${volunteer.last_name}`,
            email: volunteer.email_address,
            phone: volunteer.primary_phone,
            vehicle: volunteer.type_of_vehicle,
            oxygen: volunteer.oxygen || false,
            mobility_accommodation: volunteer.mobility_accommodation || '',
            accepts_service_animal: volunteer.accepts_service_animal || false,
            destination_limitations: volunteer.destination_limitations || '',
            allergens_in_car: volunteer.allergens_in_car || '',
            reason,
            preferenceMatches
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

async function addVolunteerUnavailability(volunteerId, payload) {
  try {
    if (!volunteerId) {
      return {
        success: false,
        message: 'Volunteer ID is required'
      };
    }

    if (payload === undefined || payload === null) {
      return {
        success: false,
        message: 'Unavailability data is required'
      };
    }

    const entriesInput = Array.isArray(payload) ? payload : [payload];

    if (entriesInput.length === 0) {
      return {
        success: false,
        message: 'No unavailability entries provided'
      };
    }

    const parsedEntries = [];
    const validationErrors = [];

    entriesInput.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        validationErrors.push({
          index,
          value: entry,
          reason: 'Entry must be an object'
        });
        return;
      }

      const repeated = entry.repeated === true;
      const unavailabilityStringRaw = typeof entry.unavailabilityString === 'string'
        ? entry.unavailabilityString
        : typeof entry.unavailability_string === 'string'
          ? entry.unavailability_string
          : null;

      const unavailabilityString = unavailabilityStringRaw ? unavailabilityStringRaw.trim() : '';
      if (!unavailabilityString) {
        validationErrors.push({
          index,
          value: entry,
          reason: 'unavailabilityString is required'
        });
        return;
      }

      const slots = parseUnavailabilityStringToSlots(unavailabilityString);
      if (slots.length === 0) {
        validationErrors.push({
          index,
          value: entry,
          reason: 'unavailabilityString could not be parsed into valid day/time pairs'
        });
        return;
      }

      const effectiveFrom = normalizeDateInput(entry.effectiveFrom ?? entry.effective_from ?? entry.startDate);
      const effectiveTo = normalizeDateInput(entry.effectiveTo ?? entry.effective_to ?? entry.endDate);

      if (!repeated && !effectiveFrom) {
        validationErrors.push({
          index,
          value: entry,
          reason: 'effectiveFrom is required for non-recurring unavailability'
        });
        return;
      }

      if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) {
        validationErrors.push({
          index,
          value: entry,
          reason: 'effectiveTo must be on or after effectiveFrom'
        });
        return;
      }

      parsedEntries.push({
        repeated,
        unavailabilityString,
        effectiveFrom,
        effectiveTo: effectiveTo || effectiveFrom || null
      });
    });

    if (validationErrors.length > 0) {
      return {
        success: false,
        message: 'One or more unavailability entries are invalid',
        errors: validationErrors
      };
    }

    if (parsedEntries.length === 0) {
      return {
        success: false,
        message: 'No valid unavailability entries parsed'
      };
    }

    const volunteerResult = await dataAccess.getVolunteerById(volunteerId);
    if (!volunteerResult.success) {
      return {
        success: false,
        message: 'Volunteer not found',
        error: volunteerResult.error
      };
    }

    const volunteer = volunteerResult.volunteer;
    if (!isDriverRole(volunteer)) {
      return {
        success: false,
        message: 'Volunteer is not registered as a driver'
      };
    }

    const updateResult = await dataAccess.addVolunteerUnavailability(
      volunteerId,
      parsedEntries
    );

    if (!updateResult.success) {
      return {
        success: false,
        message: 'Failed to update volunteer unavailability',
        error: updateResult.error
      };
    }

    const normalizedUnavailability = Array.isArray(updateResult.unavailability)
      ? updateResult.unavailability.map(entry => {
          const effectiveFromDate = normalizeDateInput(entry.effectiveFrom ?? entry.effective_from);
          const effectiveToDate = normalizeDateInput(entry.effectiveTo ?? entry.effective_to);

          const createdAt = convertFirestoreTimestamp(entry.createdAt ?? entry.created_at);
          const updatedAt = convertFirestoreTimestamp(entry.updatedAt ?? entry.updated_at ?? entry.submittedAt);

          return {
            repeated: entry.repeated === true,
            unavailabilityString: entry.unavailabilityString || entry.unavailability_string || '',
            effectiveFrom: effectiveFromDate ? formatDateISO(effectiveFromDate) : null,
            effectiveTo: effectiveToDate ? formatDateISO(effectiveToDate) : null,
            createdAt: createdAt ? createdAt.toISOString() : null,
            updatedAt: updatedAt ? updatedAt.toISOString() : null
          };
        })
      : [];

    return {
      success: true,
      message: 'Unavailability recorded successfully',
      unavailability: normalizedUnavailability
    };
  } catch (error) {
    console.error('Error in addVolunteerUnavailability:', error);
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
  getParentRole,
  verifyToken, 
  createRide,
  matchDriversForRide,
  getDriverRides,
  getRolesForOrganization,
  getPermissionSetByRoleName,
  matchDriversForRideByUID,
  addVolunteerUnavailability,
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
  getVolunteerUnavailabilityConflict,
  convertFirestoreTimestamp,
  getRidesByTimeframe,
  createOrganization,
  getOrganization,
  getAllOrganizations,
  updateOrganization,
  deleteOrganization
};