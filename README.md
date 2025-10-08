# TeamSlinkies Backend API

This is a Node.js backend service for TeamSlinkies, a ride-sharing platform for medical appointments. The system manages users, volunteers, rides, and provides intelligent driver matching based on availability and ride requirements.

## Features

- **User Authentication & Role Management**: JWT-based authentication with role-based permissions
- **Driver Matching System**: Intelligent matching of available drivers based on ride timeframes and volunteer availability
- **Firestore Integration**: Full CRUD operations with Firestore database
- **Ride Management**: Comprehensive ride scheduling with different trip types (Round Trip, One Way)

## API Endpoints

### Authentication
- `POST /login` - User login with email, password, and role

### Role Management
- `POST /roles` - Create roles with permissions (requires JWT token)

### Driver Matching
- `GET /rides/:rideId/match-drivers` - Get available and unavailable drivers for a specific ride

## Driver Matching System

The driver matching system calculates ride timeframes based on:
- **PickupTime**: When the driver needs to pick up the client
- **AppointmentTime**: When the client's appointment is scheduled
- **EstimatedDuration**: Duration of the appointment in minutes
- **TripType**: Type of trip (RoundTrip, OneWayTo, OneWayFrom)

### Trip Type Calculations

1. **RoundTrip**: Total duration = (AppointmentTime - PickupTime) + EstimatedDuration
2. **OneWayTo**: Duration = (AppointmentTime - PickupTime) + EstimatedDuration  
3. **OneWayFrom**: Duration = EstimatedDuration only

### Volunteer Availability Format

Volunteers specify availability using this format: `"F11;F13;M11;M12;T11;Th12;W11"`
- Days: M=Monday, T=Tuesday, W=Wednesday, Th=Thursday, F=Friday
- Times: 11=11:00 AM, 13=1:00 PM, etc.

## Running the Project

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Ensure `serviceAccountKey.json` is in the project root
   - Or set up Firestore emulator for development

3. **Run the application:**
   ```bash
   npm start
   ```
   or
   ```bash
   node server.js
   ```

4. **Test Driver Matching:**
   ```bash
   node driver-matching-test.js
   ```

## Database Schema

### Rides Collection
```javascript
{
  RideID: number,
  OrganizationID: string,
  PickupTime: timestamp,
  AppointmentTime: timestamp,
  EstimatedDuration: number, // minutes
  TripType: "RoundTrip" | "OneWayTo" | "OneWayFrom",
  Status: string,
  Purpose: string,
  // ... other fields
}
```

### Volunteers Collection
```javascript
{
  OrganizationID: string,
  "VOLUNTEER POSITION": "driver",
  VOLUNTEERING_STATUS: "Active",
  driver_availability_by_day_and_time: "F11;F13;M11;M12;T11;Th12;W11",
  // ... other fields from CSV
}
```

## Example API Response

```json
{
  "success": true,
  "ride": {
    "id": "ride-doc-id",
    "rideId": 1,
    "organizationId": "org-001",
    "pickupTime": "2025-10-05T15:30:00.000Z",
    "appointmentTime": "2025-10-05T16:00:00.000Z",
    "tripType": "RoundTrip",
    "totalDurationMinutes": 90
  },
  "available": [
    {
      "id": "volunteer-id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-1234",
      "vehicle": "sedan",
      "maxRidesPerWeek": 5
    }
  ],
  "unavailable": [
    {
      "id": "volunteer-id-2",
      "name": "Jane Smith",
      "reason": "Not available during requested timeframe"
    }
  ],
  "summary": {
    "totalDrivers": 10,
    "availableCount": 3,
    "unavailableCount": 7
  }
}
```
