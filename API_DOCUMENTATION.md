# TeamSlinkies API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Error Handling](#error-handling)
5. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Users](#users-endpoints)
   - [Organizations](#organizations-endpoints)
   - [Roles & Permissions](#roles--permissions-endpoints)
   - [Rides](#rides-endpoints)
   - [Volunteers](#volunteers-endpoints)
   - [Clients](#clients-endpoints)
   - [Calendar](#calendar-endpoints)
   - [Maps](#maps-endpoints)
   - [Notifications](#notifications-endpoints)
   - [Reports](#reports-endpoints)
   - [Exports](#exports-endpoints)

---

## Overview

The TeamSlinkies API is a RESTful API for managing transportation services, including organizations, volunteers, clients, rides, and related operations. The API uses JSON for request and response payloads.

---

## Base URL

```
http://localhost:3000
```

**Production URL:** (Update when available)

---

## Authentication

Most endpoints support optional authentication via JWT tokens. To authenticate:

1. Login via `POST /api/login` to receive a JWT token
2. Include the token in the Authorization header:
   ```
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

**Token Expiration:** Default 24 hours (configurable via `SESSION_TIMEOUT_MINUTES` environment variable)

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (optional)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, missing required fields)
- `401` - Unauthorized (invalid or missing token)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Endpoints

### Authentication Endpoints

#### Login

**POST** `/api/login`

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "your-password"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@example.com",
    "roles": ["admin"],
    "userId": "firebase-doc-id",
    "organizationId": "org-001",
    "organization": {
      "id": "org-doc-id",
      "org_id": "org-001",
      "name": "Organization Name"
    }
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### Users Endpoints

#### Create User

**POST** `/api/users`

Create a new user/volunteer account.

**Request Body:**
```json
{
  "email_address": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": ["volunteer"],
  "organization": "org-001",
  "phone_number": "555-0100"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "userId": "firebase-doc-id",
    "userID": "user-id-123"
  }
}
```

#### Update User

**PUT** `/api/users/:userID`

Update an existing user account.

**Path Parameters:**
- `userID` - The user ID to update

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone_number": "555-0200"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "userId": "firebase-doc-id",
    "userID": "user-id-123",
    "user": { ... }
  }
}
```

#### Reset Password

**POST** `/api/users/:userID/reset-password`

Reset a user's password.

**Path Parameters:**
- `userID` - The user ID

**Request Body:**
```json
{
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "userId": "firebase-doc-id",
    "userID": "user-id-123"
  }
}
```

#### Delete User

**DELETE** `/api/users/:userID`

Delete a user account.

**Path Parameters:**
- `userID` - The user ID to delete

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "userId": "firebase-doc-id",
    "userID": "user-id-123",
    "deletedUser": { ... }
  }
}
```

---

### Organizations Endpoints

#### Create Organization

**POST** `/api/organizations`

Create a new organization. When `sys_admin_role` and `sys_admin_password` are provided along with contact emails, volunteers are automatically created.

**Request Body:**
```json
{
  "short_name": "Test Organization",
  "name": "Test Organization Inc",
  "email": "info@testorg.com",
  "phone_number": "555-0100",
  "address": "123 Main St",
  "city": "Rochester",
  "state": "NY",
  "zip": "14623",
  "pc_name": "John Smith",
  "pc_email": "john@testorg.com",
  "pc_phone_number": "555-0101",
  "sc_name": "Jane Doe",
  "sc_email": "jane@testorg.com",
  "sc_phone_number": "555-0102",
  "sys_admin_role": "sys_admin",
  "sys_admin_password": "SecurePassword123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Organization created successfully. Created 2 volunteer(s) with sys_admin role.",
  "data": {
    "orgId": "firestore-doc-id",
    "organizationId": "firestore-doc-id",
    "volunteers": [
      {
        "type": "primary_contact",
        "userId": "volunteer-id-1",
        "userID": "user-id-1",
        "email": "john@testorg.com"
      },
      {
        "type": "secondary_contact",
        "userId": "volunteer-id-2",
        "userID": "user-id-2",
        "email": "jane@testorg.com"
      }
    ]
  }
}
```

#### Get Organization by ID

**GET** `/api/organizations/:orgId`

Get a single organization by ID.

**Path Parameters:**
- `orgId` - Organization document ID or org_id

**Response (200):**
```json
{
  "success": true,
  "organization": {
    "id": "firestore-doc-id",
    "org_id": "org-001",
    "name": "Organization Name",
    "email": "info@org.com",
    ...
  }
}
```

#### Get All Organizations

**GET** `/api/organizations`

Get all organizations.

**Response (200):**
```json
{
  "success": true,
  "organizations": [
    {
      "id": "firestore-doc-id",
      "org_id": "org-001",
      "name": "Organization Name",
      ...
    }
  ],
  "count": 1
}
```

#### Update Organization

**PUT** `/api/organizations/:orgId`

Update an organization.

**Path Parameters:**
- `orgId` - Organization document ID

**Request Body:**
```json
{
  "phone_number": "555-9999",
  "email": "newemail@org.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Organization updated successfully",
  "organization": { ... }
}
```

#### Delete Organization

**DELETE** `/api/organizations/:orgId`

Delete an organization.

**Path Parameters:**
- `orgId` - Organization document ID

**Response (200):**
```json
{
  "success": true,
  "message": "Organization deleted successfully",
  "deletedOrganization": { ... }
}
```

#### Get Organization Roles

**GET** `/api/organizations/:orgId/roles`

Get all roles for an organization.

**Path Parameters:**
- `orgId` - Organization ID

**Response (200):**
```json
{
  "success": true,
  "roles": [
    {
      "id": "role-id",
      "name": "coordinator",
      "org_id": "org-001",
      ...
    }
  ]
}
```

---

### Roles & Permissions Endpoints

#### Create Role

**POST** `/api/roles`

Create a new role.

**Request Body:**
```json
{
  "name": "coordinator",
  "org_id": "org-001",
  "parentRole": "default_coordinator"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "roleId": "coordinator",
    "collection": "roles"
  }
}
```

#### Create Permissions for Role

**POST** `/api/permissions`

Create permissions for a role.

**Request Body:**
```json
{
  "roleName": "coordinator",
  "create_clients": true,
  "read_clients": true,
  "update_clients": true,
  "delete_clients": false,
  "create_rides": true,
  "read_rides": true,
  "update_rides": true,
  "delete_rides": false
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Permission created and role updated successfully",
  "data": { ... }
}
```

#### Get Parent Role

**GET** `/api/roles/:roleName/parent`

Get the parent role for a role.

**Path Parameters:**
- `roleName` - Name of the role

**Response (200):**
```json
{
  "success": true,
  "parentRole": {
    "id": "parent-role-id",
    "name": "default_coordinator",
    ...
  }
}
```

#### Get Permission Set by Role

**GET** `/api/roles/:roleName/permission-set`

Get permission set for a role.

**Path Parameters:**
- `roleName` - Name of the role

**Response (200):**
```json
{
  "success": true,
  "role": { ... },
  "permissionSet": {
    "create_clients": true,
    "read_clients": true,
    ...
  }
}
```

#### Get Parent Role View

**GET** `/api/roles/:roleName/parent/view`

Get the view field from a role's parent role.

**Path Parameters:**
- `roleName` - Name of the role

**Response (200):**
```json
{
  "success": true,
  "view": "some-view-value"
}
```

#### Update Role

**PUT** `/api/roles/:roleName`

Update an existing role.

**Path Parameters:**
- `roleName` - Name of the role to update

**Request Body:**
```json
{
  "org_id": "org-002",
  "parentRole": "default_admin",
  "view": "admin-view"
}
```

**Allowed Fields:**
- `org_id` - Organization ID
- `parentRole` - Parent role name
- `view` - View field value

**Response (200):**
```json
{
  "success": true,
  "message": "Role updated successfully",
  "role": {
    "id": "coordinator",
    "name": "coordinator",
    "org_id": "org-002",
    "parentRole": "default_admin",
    "view": "admin-view",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Role not found",
  "error": "Role not found"
}
```

---

### Rides Endpoints

#### Create Ride

**POST** `/api/rides`

Create a new ride request. Supports recurring rides.

**Request Body (Required Fields):**
```json
{
  "clientUID": "client123",
  "Date": "2025-01-15",
  "appointmentTime": "2025-01-15T10:00:00Z",
  "appointment_type": "Medical",
  "purpose": "Doctor appointment"
}
```

**Request Body (With Recurring):**
```json
{
  "clientUID": "client123",
  "Date": "2025-01-15",
  "appointmentTime": "2025-01-15T10:00:00Z",
  "appointment_type": "Medical",
  "purpose": "Weekly checkup",
  "recurring": "Weekly",
  "recurringEndDate": "2025-07-15"
}
```

**Recurring Options:**
- `recurring`: `"Weekly"`, `"Bi-Weekly"`, `"Monthly"`, `"Bi-Monthly"`, `"Yearly"`, `"Bi-Yearly"`
- `recurringEndDate`: ISO date string (default: 6 months from start)
- `recurringCount`: Number of instances to create (alternative to end date)

**Response (201 - Single Ride):**
```json
{
  "success": true,
  "message": "Ride created successfully",
  "ride": {
    "id": "firestore-doc-id",
    "UID": "ride_1234567890_abc123",
    "clientUID": "client123",
    "Date": "2025-01-15",
    "appointmentTime": "2025-01-15T10:00:00Z",
    ...
  }
}
```

**Response (201 - Recurring Ride):**
```json
{
  "success": true,
  "message": "Ride created successfully with 26 recurring instances",
  "ride": { ... },
  "recurringInstances": [
    {
      "id": "instance-id-1",
      "UID": "ride_1234567890_abc123_1",
      "Date": "2025-01-22",
      "appointmentTime": "2025-01-22T10:00:00Z",
      "isRecurringInstance": true,
      "parentRideUID": "ride_1234567890_abc123",
      "recurringInstanceNumber": 1,
      ...
    }
  ],
  "totalRidesCreated": 27
}
```

#### Get Rides Calendar

**GET** `/api/rides/calendar`

Get rides formatted for calendar view.

**Query Parameters:**
- `debug` (optional): `true` to include debug IDs

**Response (200):**
```json
{
  "success": true,
  "rides": [
    {
      "ride_id": "ride-id",
      "date": "2025-09-15",
      "pickupTime": "11:05 AM",
      "appointmentTime": "11:30 AM",
      "status": "Scheduled",
      "appointment_type": "Medical Appointment",
      "clientLastName": "Smith",
      "dispatcherLastName": "Jones",
      "driverLastName": "Doe",
      "milesDriven": 15
    }
  ]
}
```

#### Assign Driver to Rides

**POST** `/api/rides/assign-driver`

Assign a driver to multiple rides.

**Request Body:**
```json
{
  "driverId": "driver123",
  "rideIds": "RideID01,RideID02,RideID03",
  "userId": "user123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Processed 3 ride(s). Updated: 2, Skipped: 1, Not Found: 0, Errors: 0",
  "results": {
    "updated": [
      {
        "rideId": "RideID01",
        "driverId": "driver123",
        "assignedBy": "user123"
      }
    ],
    "skipped": [
      {
        "rideId": "RideID02",
        "reason": "assignedTo field already contains a value",
        "currentValue": "other-driver"
      }
    ],
    "notFound": [],
    "errors": []
  }
}
```

#### Set Driver

**POST** `/api/rides/set-driver`

Set the driverUID field in a ride document.

**Request Body:**
```json
{
  "driverId": "driver123",
  "rideId": "ride456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "driverUID field updated successfully",
  "ride": {
    "rideId": "ride456",
    "driverId": "driver123",
    "updatedRide": { ... }
  }
}
```

#### Update Ride by ID

**PUT** `/api/rides/:rideId`

Update an existing ride by document ID.

**Path Parameters:**
- `rideId` - The ride document ID

**Request Body (any of the following fields):**
```json
{
  "clientUID": "client123",
  "additionalClient1_name": "John Doe",
  "additionalClient1_rel": "Father",
  "driverUID": "driver123",
  "dispatcherUID": "dispatcher123",
  "startLocation": "123 Main St",
  "destinationUID": "destination123",
  "Date": "2025-01-15",
  "appointmentTime": "2025-01-15T10:00:00Z",
  "appointment_type": "Medical",
  "pickupTme": "09:00 AM",
  "estimatedDuration": 60,
  "purpose": "Doctor appointment",
  "tripType": "RoundTrip",
  "status": "Scheduled",
  "wheelchair": false,
  "wheelchairType": "Manual",
  "milesDriven": 15,
  "volunteerHours": 1.5,
  "donationReceived": "Cash",
  "donationAmount": 25.50,
  "confirmation1_Date": "2025-01-14T10:00:00Z",
  "confirmation1_By": "dispatcher123",
  "confirmation2_Date": "2025-01-14T14:00:00Z",
  "confirmation2_By": "client123",
  "internalComment": "Internal note",
  "externalComment": "External note",
  "incidentReport": "No incidents",
  "assignedTo": "driver123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Ride updated successfully",
  "ride": {
    "id": "ride-id",
    "UID": "ride_1234567890_abc123",
    "status": "Scheduled",
    "driverUID": "driver123",
    ...
  },
  "updatedFields": ["status", "driverUID"]
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Ride not found",
  "error": "Ride not found"
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "No valid fields to update",
  "error": "No valid fields to update"
}
```

#### Update Ride by UID

**PUT** `/api/rides/uid/:rideUID`

Update an existing ride by UID (unique identifier field).

**Path Parameters:**
- `rideUID` - The ride UID (unique identifier field)

**Request Body:** Same as Update Ride by ID

**Response (200):**
```json
{
  "success": true,
  "message": "Ride updated successfully",
  "ride": {
    "id": "ride-id",
    "UID": "ride_1234567890_abc123",
    "status": "Scheduled",
    "driverUID": "driver123",
    ...
  },
  "updatedFields": ["status", "driverUID"]
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Ride not found",
  "error": "Ride not found"
}
```

#### Get Rides by Driver

**POST** `/api/rides/by-driver`

Get rides for a specific driver within an organization.

**Request Body:**
```json
{
  "orgId": "org123",
  "driverId": "zvco96u8CWM2ryR1CyKvyJ17VHC3"
}
```

**Response (200):**
```json
{
  "success": true,
  "rides": [
    {
      "id": "ride-id",
      "clientUID": "client123",
      "Date": "2025-01-15",
      ...
    }
  ],
  "count": 5,
  "orgId": "org123",
  "driverId": "zvco96u8CWM2ryR1CyKvyJ17VHC3"
}
```

#### Match Drivers for Ride

**GET** `/api/rides/:rideId/match-drivers`

Match available drivers for a specific ride based on availability.

**Path Parameters:**
- `rideId` - Ride document ID or UID

**Response (200):**
```json
{
  "success": true,
  "ride": {
    "id": "ride-doc-id",
    "appointmentTime": "2025-09-15T15:30:00.000Z",
    "pickupTime": "2025-09-15T15:05:00.000Z",
    ...
  },
  "available": [
    {
      "id": "driver-id-1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-0100",
      "vehicle": "Sedan"
    }
  ],
  "unavailable": [
    {
      "id": "driver-id-2",
      "name": "Jane Smith",
      "reason": "Not available during requested timeframe"
    }
  ],
  "summary": {
    "totalDrivers": 5,
    "availableCount": 2,
    "unavailableCount": 3
  }
}
```

#### Get Unassigned Rides

**GET** `/api/organizations/:orgId/volunteers/:volunteerId/unassigned-rides`

Get unassigned rides for a volunteer in an organization.

**Path Parameters:**
- `orgId` - Organization ID
- `volunteerId` - Volunteer ID

**Response (200):**
```json
{
  "success": true,
  "rides": [
    {
      "id": "ride-id",
      "status": "unassigned",
      "driverUID": "volunteer-id",
      ...
    }
  ],
  "count": 3,
  "orgId": "org123",
  "volunteerId": "volunteer-id"
}
```

#### Get Driver's Rides

**GET** `/api/drivers/:driverID/rides`

Get all rides for a specific driver.

**Path Parameters:**
- `driverID` - Driver ID

**Response (200):**
```json
{
  "success": true,
  "message": "Rides retrieved successfully",
  "data": {
    "driverFirestoreId": "driver-id",
    "rides": [
      {
        "id": "ride-id",
        "clientUID": "client123",
        ...
      }
    ],
    "count": 10
  }
}
```

---

### Volunteers Endpoints

#### Get Volunteer Unavailability

**GET** `/api/volunteers/:volunteerId/unavailability`

Get unavailability entries for a volunteer.

**Path Parameters:**
- `volunteerId` - Volunteer Firebase ID

**Response (200):**
```json
{
  "success": true,
  "unavailability": {
    "singles": [
      {
        "repeated": false,
        "unavailabilityString": "2025-09-20 09:00 AM to 2025-09-20 05:00 PM",
        "effectiveFrom": "2025-09-20T09:00:00.000Z",
        "effectiveTo": "2025-09-20T17:00:00.000Z",
        "createdAt": "2025-09-15T10:00:00.000Z",
        "source": "api"
      }
    ],
    "recurring": [
      {
        "repeated": true,
        "unavailabilityString": "Every Monday 9 AM to 5 PM",
        "effectiveFrom": "2025-09-01T09:00:00.000Z",
        "effectiveTo": null,
        "weekday": "Monday",
        "startMinutes": 540,
        "endMinutes": 1020,
        "source": "api"
      }
    ]
  }
}
```

#### Add Volunteer Unavailability

**POST** `/api/volunteers/:volunteerId/unavailability`

Add unavailability entries for a volunteer.

**Path Parameters:**
- `volunteerId` - Volunteer Firebase ID

**Request Body (Single Entry):**
```json
{
  "repeated": false,
  "unavailabilityString": "2025-09-20 09:00 AM to 2025-09-20 05:00 PM",
  "effectiveFrom": "2025-09-20T09:00:00Z",
  "effectiveTo": "2025-09-20T17:00:00Z",
  "source": "api"
}
```

**Request Body (Multiple Entries):**
```json
{
  "entries": [
    {
      "repeated": false,
      "unavailabilityString": "2025-09-20 09:00 AM to 2025-09-20 05:00 PM",
      "effectiveFrom": "2025-09-20T09:00:00Z",
      "effectiveTo": "2025-09-20T17:00:00Z",
      "source": "api"
    },
    {
      "repeated": true,
      "unavailabilityString": "Every Monday 9 AM to 5 PM",
      "effectiveFrom": "2025-09-01T09:00:00Z",
      "effectiveTo": null,
      "source": "api"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "unavailability": [
    {
      "repeated": false,
      "unavailabilityString": "2025-09-20 09:00 AM to 2025-09-20 05:00 PM",
      "effectiveFrom": "2025-09-20T09:00:00.000Z",
      "effectiveTo": "2025-09-20T17:00:00.000Z",
      "createdAt": "2025-09-15T10:00:00.000Z",
      "updatedAt": "2025-09-15T10:00:00.000Z",
      "source": "api"
    }
  ]
}
```

---

### Clients Endpoints

#### Get Client Donations

**GET** `/api/clients/:clientId/donations`

Get donation history for a specific client.

**Path Parameters:**
- `clientId` - Client ID

**Response (200):**
```json
{
  "success": true,
  "clientId": "client-id",
  "total": 5,
  "donations": [
    {
      "donationId": "ride-id",
      "ride_id": "ride-123",
      "amount": 25.50,
      "method": "Cash",
      "appointmentDate": "2025-01-15T10:00:00.000Z",
      "createdAt": "2025-01-10T12:00:00.000Z"
    }
  ]
}
```

---

### Calendar Endpoints

#### Get Rides by Timeframe

**GET** `/api/calendar`

Get rides within a date range.

**Query Parameters:**
- `startDate` (required): ISO date string (e.g., `2025-09-01`)
- `endDate` (required): ISO date string (e.g., `2025-12-31`)

**Example:**
```
GET /api/calendar?startDate=2025-09-01&endDate=2025-12-31
```

**Response (200):**
```json
{
  "success": true,
  "rides": [
    {
      "id": "ride-id",
      "Date": "2025-09-15",
      "appointmentTime": "11:30 AM",
      "pickupTime": "11:05 AM",
      "status": "Scheduled",
      ...
    }
  ]
}
```

---

### Maps Endpoints

#### Verify Address

**GET** `/api/maps/verify`

Verify an address using OpenStreetMap Nominatim API.

**Query Parameters:**
- `address` (required): Address string

**Example:**
```
GET /api/maps/verify?address=1600+Pennsylvania+Ave+NW+Washington+DC
```

**Response (200):**
```json
{
  "success": true,
  "verified": true,
  "address": {
    "display_name": "1600 Pennsylvania Avenue NW, Washington, DC 20500, USA",
    "lat": "38.8977",
    "lon": "-77.0365"
  }
}
```

#### Get Route

**GET** `/api/maps/route`

Get route between two coordinates using OSRM.

**Query Parameters:**
- `start` (required): Start coordinates (e.g., `-73.935242,40.730610`)
- `end` (required): End coordinates (e.g., `-74.0060,40.7128`)

**Example:**
```
GET /api/maps/route?start=-73.935242,40.730610&end=-74.0060,40.7128
```

**Response (200):**
```json
{
  "success": true,
  "distance": 12345.67,
  "duration": 1800,
  "route": {
    "geometry": "...",
    "waypoints": [...]
  }
}
```

---

### Notifications Endpoints

#### Notify Organization

**POST** `/api/notify-org`

Notify all drivers in an organization about available unassigned rides.

**Request Body:**
```json
{
  "org_id": "org-001"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notifications sent successfully",
  "notificationsSent": 5,
  "driversNotified": [
    {
      "driverId": "driver-id",
      "email": "driver@example.com",
      "unassignedRidesCount": 3
    }
  ]
}
```

---

### Reports Endpoints

#### Create Report Definition

**POST** `/api/reports`

Save a report definition for later use.

**Request Body:**
```json
{
  "selectedParams": ["first_name", "last_name", "email", "phone_number"],
  "collection": "clients"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Report definition saved",
  "document_id": "report-doc-id"
}
```

#### Get Report Data

**GET** `/api/reports`

Get report data based on a saved report definition.

**Query Parameters:**
- `document_id` (required): Report definition document ID

**Example:**
```
GET /api/reports?document_id=report-doc-id
```

**Response (200):**
```json
{
  "success": true,
  "document_id": "report-doc-id",
  "collection": "clients",
  "selectedParams": ["first_name", "last_name", "email"],
  "data": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "client_id": "client-doc-id"
    }
  ]
}
```

---

### Exports Endpoints

#### Prepare Export

**POST** `/api/exports/prepare`

Prepare and upload an export file to Google Cloud Storage (requires authentication).

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "collection": "clients",
  "format": "csv",
  "fields": "first_name,last_name,email"
}
```

**Response (200):**
```json
{
  "success": true,
  "downloadUrl": "https://storage.googleapis.com/..."
}
```

#### Get Export

**GET** `/api/exports/:collection`

Get export data directly (requires authentication).

**Path Parameters:**
- `collection` - Collection name (`clients`, `volunteers`, `rides`, etc.)

**Query Parameters:**
- `format` (optional): `csv` or `pdf` (default: `csv`)
- `fields` (optional): Comma-separated field names

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Example:**
```
GET /api/exports/clients?format=csv&fields=first_name,last_name,email
```

**Response (200):**
- CSV: Returns CSV file with appropriate headers
- PDF: Returns PDF file

---

## Data Models

### Ride Model

```json
{
  "UID": "unique-ride-id",
  "clientUID": "client-id",
  "Date": "2025-01-15",
  "appointmentTime": "2025-01-15T10:00:00Z",
  "appointment_type": "Medical",
  "purpose": "Doctor appointment",
  "status": "Scheduled",
  "tripType": "RoundTrip",
  "recurring": "Weekly",
  "driverUID": "driver-id",
  "dispatcherUID": "dispatcher-id",
  "destinationUID": "destination-id",
  "organization": "org-id",
  "pickupTime": "09:00 AM",
  "estimatedDuration": 60,
  "milesDriven": 0,
  "volunteerHours": 0,
  "donationReceived": "None",
  "donationAmount": 0,
  "internalComment": "",
  "externalComment": "",
  "startLocation": "",
  "endLocation": "",
  "additionalClient1_Name": "",
  "additionalClient1_Rel": "",
  "isRecurringParent": false,
  "isRecurringInstance": false,
  "parentRideUID": null,
  "recurringInstanceNumber": null,
  "CreatedAt": "2025-01-10T12:00:00.000Z",
  "UpdatedAt": "2025-01-10T12:00:00.000Z"
}
```

### Organization Model

```json
{
  "id": "firestore-doc-id",
  "org_id": "org-001",
  "name": "Organization Name",
  "short_name": "Org Short",
  "email": "info@org.com",
  "phone_number": "555-0100",
  "address": "123 Main St",
  "city": "Rochester",
  "state": "NY",
  "zip": "14623",
  "pc_name": "Primary Contact",
  "pc_email": "primary@org.com",
  "pc_phone_number": "555-0101",
  "sc_name": "Secondary Contact",
  "sc_email": "secondary@org.com",
  "sc_phone_number": "555-0102",
  "creation_date": "2024-01-15T10:00:00Z"
}
```

### Volunteer/User Model

```json
{
  "id": "firestore-doc-id",
  "user_ID": "user-id-123",
  "email_address": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": ["volunteer", "driver"],
  "organization": "org-001",
  "phone_number": "555-0100",
  "street_address": "123 Main St",
  "city": "Rochester",
  "state": "NY",
  "zip": "14623",
  "volunteering_status": "Active",
  "unavailability": []
}
```

---

## Rate Limiting

Currently, there are no rate limits implemented. Consider implementing rate limiting for production use.

---

## CORS

The API allows requests from the following origins:
- `https://app.flutterflow.io`
- `https://slinkies-712r84.flutterflow.app`
- `http://localhost:3000`
- `https://axo-lift.webdev.gccis.rit.edu`

---

## Environment Variables

Required environment variables:
- `ENCRYPTION_KEY` - Key for password hashing
- `JWT_SECRET` - Secret for JWT token signing (defaults to 'your-secret-key' if not set)
- `SESSION_TIMEOUT_MINUTES` - JWT token expiration (defaults to '24h' if not set)
- `GCS_BUCKET_NAME` - Google Cloud Storage bucket name for exports

---

## Support

For issues or questions, please contact the development team.

---

**Last Updated:** 2025-01-15
**API Version:** 1.0

