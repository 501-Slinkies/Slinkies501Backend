# Ride API Updates

## Overview
This document describes the updated ride functionality that now uses the new Firestore schema with UID-based access.

## New Schema Fields
- `clientUID` - ClientRef
- `UID` - String (unique identifier for the ride)
- `additionalClient1_name` - String
- `additionalClient1_rel` - String
- `driverUID` - VolunteerRef
- `dispatcherUID` - String
- `startLocation` - AddressRef
- `destinationUID` - AddressRef
- `Date` - String
- `appointmentTime` - DateTime
- `appointment_type` - String
- `pickupTme` - DateTime
- `estimatedDuration` - Integer
- `purpose` - String
- `tripType` - String
- `status` - String
- `wheelchair` - Boolean
- `wheelchairType` - String
- `milesDriven` - Decimal
- `volunteerHours` - Decimal
- `donationReceived` - String
- `donationAmount` - Decimal
- `confirmation1_Date` - Date
- `confirmation1_By` - String
- `confirmation2_Date` - Date
- `confirmation2_By` - String
- `internalComment` - String
- `externalComment` - String
- `incidentReport` - String
- `CreatedAt` - DateTime
- `UpdatedAt` - DateTime

## API Endpoints

### 1. GET `/api/rides/:uid/match-drivers`
Matches available drivers for a ride by UID instead of rideId.

**Request:**
```
GET /api/rides/ABC123/match-drivers
```

**Response:**
```json
{
  "success": true,
  "ride": {
    "id": "doc_id",
    "uid": "ABC123",
    "appointmentTime": "2024-01-15T10:00:00Z",
    "appointmentType": "Medical",
    "status": "Scheduled"
  },
  "available": [
    {
      "id": "driver_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "123-456-7890",
      "vehicle": "Sedan"
    }
  ],
  "summary": {
    "totalDrivers": 10,
    "availableCount": 5,
    "unavailableCount": 5
  }
}
```

### 2. GET `/api/rides/:uid/appointment-info`
Returns appointment date, time, and client name.

**Request:**
```
GET /api/rides/ABC123/appointment-info
```

**Response:**
```json
{
  "success": true,
  "appointmentInfo": {
    "uid": "ABC123",
    "date": "2024-01-15",
    "appointmentTime": "2024-01-15T10:00:00Z",
    "clientName": "Jane Smith",
    "appointmentType": "Medical",
    "status": "Scheduled"
  }
}
```

### 3. PUT `/api/rides/:uid`
Updates a ride's data. Only fields in the schema are allowed.

**Request:**
```
PUT /api/rides/ABC123
Content-Type: application/json

{
  "status": "Completed",
  "milesDriven": 25.5,
  "internalComment": "Ride completed successfully"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ride updated successfully",
  "ride": {
    "id": "doc_id",
    "UID": "ABC123",
    "status": "Completed",
    ...
  },
  "updatedFields": ["status", "milesDriven", "internalComment"]
}
```

### 4. GET `/api/rides/:uid`
Gets a single ride by UID.

**Request:**
```
GET /api/rides/ABC123
```

**Response:**
```json
{
  "success": true,
  "ride": {
    "id": "doc_id",
    "UID": "ABC123",
    "clientUID": {...},
    "appointmentTime": "2024-01-15T10:00:00Z",
    ...
  }
}
```

### 5. GET `/api/rides/calendar`
Provides ride data for a calendar view (updated to use appointmentTime field).

**Request:**
```
GET /api/rides/calendar?viewType=month&startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "total": 50,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-31T23:59:59.999Z",
  "rides": [...],
  "grouped": {
    "assigned": [...],
    "unassigned": [...],
    "completed": [...],
    "canceled": [...]
  }
}
```

## Implementation Details

### Architecture
All endpoints follow the three-layer architecture:
1. **Routes** (`routes/rides.js`) - Handle HTTP requests
2. **Application Layer** (`ApplicationLayer.js`) - Business logic
3. **Data Access Layer** (`DataAccessLayer.js`) - Database operations

### Permission Checks
All endpoints should include permission checks using the middleware. Currently, the endpoints don't require authentication, but this should be added in production.

### Field Validation
The update endpoint only allows fields that are part of the schema. Invalid fields are silently ignored.

## Migration Notes
- The driver matching endpoint now uses UID instead of rideId
- Calendar endpoint now uses `appointmentTime` instead of `rideDate`
- All ride operations now query by UID field instead of document ID
- Updated timestamp is automatically added when updating a ride
