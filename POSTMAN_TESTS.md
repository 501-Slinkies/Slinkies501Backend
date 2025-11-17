# Postman Tests for TeamSlinkies API

## Base URL
```
http://localhost:3000
```

## Prerequisites

1. **Start your server** (if not already running):
   ```bash
   node server.js
   ```
   Server should be running on `http://localhost:3000`

2. **Authentication Token** (optional for most endpoints):
   - Get a token by logging in via `POST /api/login`
   - Include in headers: `Authorization: Bearer YOUR_TOKEN`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Roles](#roles)
3. [Users](#users)
4. [Organizations](#organizations)
5. [Drivers](#drivers)
6. [Rides](#rides)
7. [Calendar](#calendar)
8. [Maps](#maps)
9. [Notifications](#notifications)
10. [Clients](#clients)
11. [Volunteers](#volunteers)
12. [Reports](#reports)

---

## Authentication

### 1. Login (POST)

#### Endpoint
```
POST /api/login
```

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "username": "user@example.com",
  "password": "your-password"
}
```

#### Expected Response (Success - 200)
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

#### Expected Response (Error - 401)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Roles

### 1. Create Role (POST)

#### Endpoint
```
POST /api/roles
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional - currently disabled)
```

#### Description
Creates a new role document with only `name`, `org_id`, and optionally `parentRole`. Permissions are created separately using the `/api/permissions` endpoint. Token checking is currently disabled.

#### Request Body
```json
{
  "name": "coordinator",
  "org_id": "bripen",
  "parentRole": "default_coordinator"
}
```

#### Request Body (Minimal - without parentRole)
```json
{
  "name": "coordinator",
  "org_id": "bripen"
}
```

#### Expected Response (Success - 201)
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

#### Expected Response (Error - 400)
```json
{
  "success": false,
  "message": "Role name and org_id are required",
  "required_fields": {
    "name": "string - unique identifier for the role",
    "org_id": "string - organization ID",
    "parentRole": "string (optional) - parent role name"
  }
}
```

#### Expected Response (Error - 400 - Role Exists)
```json
{
  "success": false,
  "message": "Failed to create role",
  "error": "Role with this name already exists"
}
```

---

### 2. Create Permissions for Role (POST)

#### Endpoint
```
POST /api/permissions
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional - currently disabled)
```

#### Description
Creates a permissions document in the Permissions collection with all the boolean permission values, and updates the role document to have a `permission_set` field that is a Firestore document reference to the Permissions document. The role must already exist before creating permissions. Token checking is currently disabled.

#### Request Body
```json
{
  "roleName": "coordinator",
  "create_clients": true,
  "read_clients": true,
  "update_clients": true,
  "delete_clients": false,
  "create_org": false,
  "read_org": true,
  "update_org": false,
  "delete_org": false,
  "create_rides": true,
  "read_rides": true,
  "update_rides": true,
  "delete_rides": false,
  "create_roles": true,
  "read_roles": true,
  "update_roles": true,
  "delete_roles": false,
  "create_volunteers": false,
  "read_volunteers": true,
  "update_volunteers": false,
  "delete_volunteers": false,
  "read_logs": true
}
```

#### Expected Response (Success - 201)
```json
{
  "success": true,
  "message": "Permission created and role updated successfully",
  "data": {
    "permissionId": "coordinator",
    "roleName": "coordinator",
    "roleCollection": "roles"
  }
}
```

#### Expected Response (Error - 400)
```json
{
  "success": false,
  "message": "Role name is required",
  "required_fields": {
    "roleName": "string - name of the role to attach permissions to",
    "create_clients": "boolean (optional)",
    "read_clients": "boolean (optional)",
    "update_clients": "boolean (optional)",
    "delete_clients": "boolean (optional)",
    "create_org": "boolean (optional)",
    "read_org": "boolean (optional)",
    "update_org": "boolean (optional)",
    "delete_org": "boolean (optional)",
    "create_rides": "boolean (optional)",
    "read_rides": "boolean (optional)",
    "update_rides": "boolean (optional)",
    "delete_rides": "boolean (optional)",
    "create_roles": "boolean (optional)",
    "read_roles": "boolean (optional)",
    "update_roles": "boolean (optional)",
    "delete_roles": "boolean (optional)",
    "create_volunteers": "boolean (optional)",
    "read_volunteers": "boolean (optional)",
    "update_volunteers": "boolean (optional)",
    "delete_volunteers": "boolean (optional)",
    "read_logs": "boolean (optional)"
  }
}
```

#### Expected Response (Error - 400 - Role Not Found)
```json
{
  "success": false,
  "message": "Failed to create permission and update role",
  "error": "Permission created but role not found to update. Role may need to be created first."
}
```

#### Expected Response (Error - 400 - Permission Exists)
```json
{
  "success": false,
  "message": "Failed to create permission and update role",
  "error": "Permission with this name already exists"
}
```

#### Notes
- The `roleName` must match an existing role document name
- All permission fields are optional boolean values (defaults to `false` if not provided)
- The `permission_set` field in the role document will be a Firestore DocumentReference pointing to the Permissions document
- Permissions are stored in the `Permissions` collection (capital P)

---

### 3. Get Parent Role (GET)

#### Endpoint
```
GET /api/roles/:roleName/parent
```

#### Example
```
GET /api/roles/coordinator/parent
```

#### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "parentRole": {
    "id": "admin",
    "name": "admin",
    "title": "Administrator"
  }
}
```

### 4. Get Parent Role View (GET)

#### Endpoint
```
GET /api/roles/:roleName/parent/view
```

#### Example
```
GET /api/roles/bripen_dispatcher/parent/view
```

#### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "view": "Dispatcher"
}
```

#### Expected Response (Error - 404)
```json
{
  "success": false,
  "message": "Role not found"
}
```

#### Expected Response (Error - 404 - Parent Role Not Found)
```json
{
  "success": false,
  "message": "Parent role not found for this role"
}
```

#### Expected Response (Error - 404 - View Field Not Found)
```json
{
  "success": false,
  "message": "View field not found in parent role"
}
```

**Notes:**
- This endpoint takes a role name (e.g., `bripen_dispatcher`), finds its `parent_role` field (`default_dispatcher`), then returns the `view` field from the parent role document.
- The role must have a `parent_role` field pointing to another role.
- The parent role document must have a `view` field.

---

## Users

### 1. Create User Account (POST)

#### Endpoint
```
POST /api/users
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional - required for admin creation)
```

#### Request Body
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email_address": "john@example.com",
  "password": "SecurePass123!",
  "phone_number": "555-1234",
  "role": "driver",
  "organization_ID": "org-001"
}
```

#### Expected Response (Success - 201)
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "userId": "firestore-doc-id",
    "userID": "USER-001"
  }
}
```

### 2. Update User Account (PUT)

#### Endpoint
```
PUT /api/users/:userID
```

#### Example
```
PUT /api/users/USER-001
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Request Body
```json
{
  "first_name": "Jane",
  "phone_number": "555-5678"
}
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "userId": "firestore-doc-id",
    "userID": "USER-001",
    "user": {
      "first_name": "Jane",
      "email_address": "john@example.com",
      ...
    }
  }
}
```

### 3. Delete User Account (DELETE)

#### Endpoint
```
DELETE /api/users/:userID
```

#### Example
```
DELETE /api/users/USER-001
```

#### Headers
```
Authorization: Bearer YOUR_TOKEN (recommended)
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "userId": "firestore-doc-id",
    "userID": "USER-001",
    "deletedUser": {
      "first_name": "John",
      "last_name": "Doe",
      "email_address": "john@example.com"
    }
  }
}
```

## Prerequisites

1. **Start your server** (if not already running):
   ```bash
   node server.js
   ```
   Server should be running on `http://localhost:3000`

2. **Authentication Token** (optional for most endpoints):
   - Get a token by logging in via `POST /api/login`
   - Include in headers: `Authorization: Bearer YOUR_TOKEN`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Roles](#roles)
3. [Users](#users)
4. [Organizations](#organizations)
5. [Drivers](#drivers)
6. [Rides](#rides)
7. [Calendar](#calendar)
8. [Maps](#maps)
9. [Notifications](#notifications)
10. [Clients](#clients)
11. [Volunteers](#volunteers)
12. [Reports](#reports)

---

## Authentication

### 1. Login (POST)

#### Endpoint
```
POST /api/login
```

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "username": "user@example.com",
  "password": "your-password"
}
```

#### Expected Response (Success - 200)
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

#### Expected Response (Error - 401)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Roles

### 1. Create Role (POST)

#### Endpoint
```
POST /api/roles
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional - currently disabled)
```

#### Description
Creates a new role document with only `name`, `org_id`, and optionally `parentRole`. Permissions are created separately using the `/api/permissions` endpoint. Token checking is currently disabled.

#### Request Body
```json
{
  "name": "coordinator",
  "org_id": "bripen",
  "parentRole": "default_coordinator"
}
```

#### Request Body (Minimal - without parentRole)
```json
{
  "name": "coordinator",
  "org_id": "bripen"
}
```

#### Expected Response (Success - 201)
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

#### Expected Response (Error - 400)
```json
{
  "success": false,
  "message": "Role name and org_id are required",
  "required_fields": {
    "name": "string - unique identifier for the role",
    "org_id": "string - organization ID",
    "parentRole": "string (optional) - parent role name"
  }
}
```

#### Expected Response (Error - 400 - Role Exists)
```json
{
  "success": false,
  "message": "Failed to create role",
  "error": "Role with this name already exists"
}
```

---

### 2. Create Permissions for Role (POST)

#### Endpoint
```
POST /api/permissions
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional - currently disabled)
```

#### Description
Creates a permissions document in the Permissions collection with all the boolean permission values, and updates the role document to have a `permission_set` field that is a Firestore document reference to the Permissions document. The role must already exist before creating permissions. Token checking is currently disabled.

#### Request Body
```json
{
  "roleName": "coordinator",
  "create_clients": true,
  "read_clients": true,
  "update_clients": true,
  "delete_clients": false,
  "create_org": false,
  "read_org": true,
  "update_org": false,
  "delete_org": false,
  "create_rides": true,
  "read_rides": true,
  "update_rides": true,
  "delete_rides": false,
  "create_roles": true,
  "read_roles": true,
  "update_roles": true,
  "delete_roles": false,
  "create_volunteers": false,
  "read_volunteers": true,
  "update_volunteers": false,
  "delete_volunteers": false,
  "read_logs": true
}
```

#### Expected Response (Success - 201)
```json
{
  "success": true,
  "message": "Permission created and role updated successfully",
  "data": {
    "permissionId": "coordinator",
    "roleName": "coordinator",
    "roleCollection": "roles"
  }
}
```

#### Expected Response (Error - 400)
```json
{
  "success": false,
  "message": "Role name is required",
  "required_fields": {
    "roleName": "string - name of the role to attach permissions to",
    "create_clients": "boolean (optional)",
    "read_clients": "boolean (optional)",
    "update_clients": "boolean (optional)",
    "delete_clients": "boolean (optional)",
    "create_org": "boolean (optional)",
    "read_org": "boolean (optional)",
    "update_org": "boolean (optional)",
    "delete_org": "boolean (optional)",
    "create_rides": "boolean (optional)",
    "read_rides": "boolean (optional)",
    "update_rides": "boolean (optional)",
    "delete_rides": "boolean (optional)",
    "create_roles": "boolean (optional)",
    "read_roles": "boolean (optional)",
    "update_roles": "boolean (optional)",
    "delete_roles": "boolean (optional)",
    "create_volunteers": "boolean (optional)",
    "read_volunteers": "boolean (optional)",
    "update_volunteers": "boolean (optional)",
    "delete_volunteers": "boolean (optional)",
    "read_logs": "boolean (optional)"
  }
}
```

#### Expected Response (Error - 400 - Role Not Found)
```json
{
  "success": false,
  "message": "Failed to create permission and update role",
  "error": "Permission created but role not found to update. Role may need to be created first."
}
```

#### Expected Response (Error - 400 - Permission Exists)
```json
{
  "success": false,
  "message": "Failed to create permission and update role",
  "error": "Permission with this name already exists"
}
```

#### Notes
- The `roleName` must match an existing role document name
- All permission fields are optional boolean values (defaults to `false` if not provided)
- The `permission_set` field in the role document will be a Firestore DocumentReference pointing to the Permissions document
- Permissions are stored in the `Permissions` collection (capital P)

---

### 3. Get Parent Role (GET)

#### Endpoint
```
GET /api/roles/:roleName/parent
```

#### Example
```
GET /api/roles/coordinator/parent
```

#### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "parentRole": {
    "id": "admin",
    "name": "admin",
    "title": "Administrator"
  }
}
```

### 4. Get Parent Role View (GET)

#### Endpoint
```
GET /api/roles/:roleName/parent/view
```

#### Example
```
GET /api/roles/bripen_dispatcher/parent/view
```

#### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "view": "Dispatcher"
}
```

#### Expected Response (Error - 404)
```json
{
  "success": false,
  "message": "Role not found"
}
```

#### Expected Response (Error - 404 - Parent Role Not Found)
```json
{
  "success": false,
  "message": "Parent role not found for this role"
}
```

#### Expected Response (Error - 404 - View Field Not Found)
```json
{
  "success": false,
  "message": "View field not found in parent role"
}
```

**Notes:**
- This endpoint takes a role name (e.g., `bripen_dispatcher`), finds its `parent_role` field (`default_dispatcher`), then returns the `view` field from the parent role document.
- The role must have a `parent_role` field pointing to another role.
- The parent role document must have a `view` field.

---

## Users

### 1. Create User Account (POST)

#### Endpoint
```
POST /api/users
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional - required for admin creation)
```

#### Request Body
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email_address": "john@example.com",
  "password": "SecurePass123!",
  "phone_number": "555-1234",
  "role": "driver",
  "organization_ID": "org-001"
}
```

#### Expected Response (Success - 201)
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "userId": "firestore-doc-id",
    "userID": "USER-001"
  }
}
```

### 2. Update User Account (PUT)

#### Endpoint
```
PUT /api/users/:userID
```

#### Example
```
PUT /api/users/USER-001
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Request Body
```json
{
  "first_name": "Jane",
  "phone_number": "555-5678"
}
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "userId": "firestore-doc-id",
    "userID": "USER-001",
    "user": {
      "first_name": "Jane",
      "email_address": "john@example.com",
      ...
    }
  }
}
```

### 3. Delete User Account (DELETE)

#### Endpoint
```
DELETE /api/users/:userID
```

#### Example
```
DELETE /api/users/USER-001
```

#### Headers
```
Authorization: Bearer YOUR_TOKEN (recommended)
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "userId": "firestore-doc-id",
    "userID": "USER-001",
    "deletedUser": {
      "first_name": "John",
      "last_name": "Doe",
      "email_address": "john@example.com"
    }
  }
}
```

---

## Organizations

### 1. Create Organization (POST)

#### Endpoint
```
POST /api/organizations
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Description
Creates a new organization. When `sys_admin_role` and `sys_admin_password` are provided along with primary contact (`pc_email`) and/or secondary contact (`sc_email`), the system will automatically create volunteer accounts for those contacts with the specified role and password.

**Automatic Volunteer Creation:**
- If `pc_email` is provided, a volunteer account is created for the primary contact
- If `sc_email` is provided, a volunteer account is created for the secondary contact
- Both volunteers are assigned the `sys_admin_role` and `sys_admin_password`
- Both volunteers are linked to the new organization
- Contact information (name, phone, address) is automatically populated from the organization data

#### Request Body (Full Example with Volunteer Creation)
```json
{
  "name": "Greater Southern Tier Transportation Services",
  "org_id": "GST-TRANS-001",
  "address": "123 Main Street",
  "email": "info@gsttransport.org",
  "short_name": "GST Transport",
  "phone_number": "607-555-0100",
  "lisence_number": "NY-12345",
  "website": "https://www.gsttransport.org",
  "creation_date": "2024-01-15T10:00:00Z",
  "address2": "Suite 100",
  "city": "Elmira",
  "state": "NY",
  "zip": "14901",
  "pc_name": "John Smith",
  "pc_phone_number": "607-555-0101",
  "pc_email": "john.smith@gsttransport.org",
  "pc_address": "123 Main Street",
  "pc_address2": "Suite 100",
  "pc_city": "Elmira",
  "pc_state": "NY",
  "pc_zip": "14901",
  "sc_name": "Jane Doe",
  "sc_phone_number": "607-555-0102",
  "sc_email": "jane.doe@gsttransport.org",
  "sc_address": "123 Main Street",
  "sc_address2": "Suite 100",
  "sc_city": "Elmira",
  "sc_state": "NY",
  "sc_zip": "14901",
  "sys_admin_role": "sys_admin",
  "sys_admin_password": "SecurePassword123!",
  "sys_admin_phone_number": "607-555-0103",
  "sys_admin_user_id": "admin-user-001",
  "sys_admin_security_level": "Super Admin"
}
```

#### Request Body (Minimal Example - Only Required Fields)
```json
{
  "short_name": "Test Organization"
}
```

#### Request Body (With Volunteer Creation)
```json
{
  "short_name": "Test Organization",
  "name": "Test Organization Inc",
  "pc_name": "John Smith",
  "pc_email": "john@testorg.com",
  "pc_phone_number": "555-0100",
  "sc_name": "Jane Doe",
  "sc_email": "jane@testorg.com",
  "sc_phone_number": "555-0101",
  "sys_admin_role": "sys_admin",
  "sys_admin_password": "SecurePassword123!"
}
```

#### Expected Response (Success - 201 - Without Volunteers)
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "orgId": "firestore-document-id",
    "organizationId": "firestore-document-id"
  }
}
```

#### Expected Response (Success - 201 - With Volunteers Created)
```json
{
  "success": true,
  "message": "Organization created successfully. Created 2 volunteer(s) with sys_admin role.",
  "data": {
    "orgId": "firestore-document-id",
    "organizationId": "firestore-document-id",
    "volunteers": [
      {
        "type": "primary_contact",
        "userId": "volunteer-firebase-id-1",
        "userID": "user-id-1",
        "email": "john.smith@gsttransport.org"
      },
      {
        "type": "secondary_contact",
        "userId": "volunteer-firebase-id-2",
        "userID": "user-id-2",
        "email": "jane.doe@gsttransport.org"
      }
    ]
  }
}
```

#### Expected Response (Success - 201 - With Partial Volunteer Creation)
```json
{
  "success": true,
  "message": "Organization created successfully. Created 1 volunteer(s) with sys_admin role. Warning: 1 volunteer creation(s) failed.",
  "data": {
    "orgId": "firestore-document-id",
    "organizationId": "firestore-document-id",
    "volunteers": [
      {
        "type": "primary_contact",
        "userId": "volunteer-firebase-id-1",
        "userID": "user-id-1",
        "email": "john.smith@gsttransport.org"
      }
    ],
    "volunteerErrors": [
      {
        "type": "secondary_contact",
        "error": "User with this email already exists"
      }
    ]
  }
}
```

### 2. Get All Organizations (GET)

#### Endpoint
```
GET /api/organizations
```

#### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "organizations": [
    {
      "id": "firestore-document-id",
      "name": "Greater Southern Tier Transportation Services",
      "org_id": "GST-TRANS-001",
      "email": "info@gsttransport.org",
      ...
    }
  ],
  "count": 1
}
```

### 3. Get Single Organization by ID (GET)

#### Endpoint
```
GET /api/organizations/:orgId
```

#### Examples
```
GET /api/organizations/firestore-document-id-here
GET /api/organizations/GST-TRANS-001
```

#### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "organization": {
    "id": "firestore-document-id",
    "name": "Greater Southern Tier Transportation Services",
    "org_id": "GST-TRANS-001",
    "address": "123 Main Street",
    "email": "info@gsttransport.org",
    ...
  }
}
```

### 4. Update Organization (PUT)

#### Endpoint
```
PUT /api/organizations/:orgId
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Request Body (Partial Update Example)
```json
{
  "phone_number": "607-555-9999",
  "email": "newemail@gsttransport.org",
  "website": "https://www.newwebsite.org"
}
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "message": "Organization updated successfully",
  "organization": {
    "id": "firestore-document-id",
    "name": "Greater Southern Tier Transportation Services",
    "org_id": "GST-TRANS-001",
    "phone_number": "607-555-9999",
    ...
  }
}
```

### 5. Delete Organization (DELETE)

#### Endpoint
```
DELETE /api/organizations/:orgId
```

#### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "message": "Organization deleted successfully",
  "deletedOrganization": {
    "id": "firestore-document-id",
    "name": "Greater Southern Tier Transportation Services",
    "org_id": "GST-TRANS-001",
    ...
  }
}
```

### 6. Get Unassigned Rides for Organization and Volunteer (GET)

#### Endpoint
```
GET /api/organizations/:orgId/volunteers/:volunteerId/unassigned-rides
```

#### Description
Returns all unassigned rides for a specific volunteer within an organization where:
- The ride's `organization` field matches the provided `orgId`
- The `volunteerId` is found in the ride's `driverUID` field (CSV string)
- The ride's `status` is "unassigned" (case-insensitive)

#### Examples
```
GET /api/organizations/bripen/volunteers/zvco96u8CWM2ryR1CyKvyJ17VHC3/unassigned-rides
GET /api/organizations/GST-TRANS-001/volunteers/volunteer-firebase-id/unassigned-rides
```

#### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "rides": [
    {
      "id": "ride-firebase-doc-id",
      "UID": "RIDE-001",
      "organization": "bripen",
      "status": "Unassigned",
      "driverUID": "zvco96u8CWM2ryR1CyKvyJ17VHC3,Ca0vqvSfcDREseZK0n0c",
      "clientUID": "client-id",
      "Date": "2025-11-04",
      "pickupTime": "2:00 PM",
      "appointmentTime": "2:30 PM",
      ...
    }
  ],
  "count": 1,
  "orgId": "bripen",
  "volunteerId": "zvco96u8CWM2ryR1CyKvyJ17VHC3"
}
```

#### Expected Response (Success - No Rides Found - 200)
```json
{
  "success": true,
  "rides": [],
  "count": 0,
  "orgId": "bripen",
  "volunteerId": "zvco96u8CWM2ryR1CyKvyJ17VHC3"
}
```

#### Expected Response (Error - 400)
```json
{
  "success": false,
  "message": "Organization ID is required"
}
```

or

```json
{
  "success": false,
  "message": "Volunteer ID is required"
}
```

#### Expected Response (Error - 500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

#### Notes
- The `volunteerId` can be either a Firestore document ID or a `volunteer_id` field value
- The `driverUID` field is parsed as a comma-separated list (CSV) of volunteer IDs
- Status matching is case-insensitive (e.g., "Unassigned", "unassigned", "UNASSIGNED" all match)
- Supports multiple organization field name variations: `organization`, `Organization`, `org_id`, `orgId`, `organization_ID`
- Queries both "rides" and "Rides" collections

---

## Drivers

### 1. Get Driver's Rides (GET)

#### Endpoint
```
GET /api/drivers/:driverID/rides
```

#### Example
```
GET /api/drivers/driver-firebase-id/rides
```

#### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "message": "Rides retrieved successfully",
  "data": {
    "driverFirestoreId": "driver-firebase-id",
    "driverId": "driver-user-id",
    "rides": [
      {
        "id": "ride-id",
        "UID": "RIDE-001",
        "Date": "2025-09-15",
        "appointmentTime": "11:30 AM",
        "status": "Scheduled",
        ...
      }
    ],
    "count": 1
  }
}
```

---

## Rides

### 1. Create Ride Request (POST)

#### Endpoint
```
POST /api/rides
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Description
Creates a new ride request. The UID will be auto-generated if not provided. 

**Recurring Rides:** When the `recurring` field is set, the system automatically generates future ride instances based on the pattern:
- **Weekly**: Every 7 days
- **Bi-Weekly**: Every 14 days
- **Monthly**: Every month
- **Bi-Monthly**: Every 2 months
- **Yearly**: Every year
- **Bi-Yearly**: Every 2 years

By default, recurring rides are generated for 6 months from the start date. You can control this with:
- `recurringEndDate`: Stop generating instances after this date (ISO format)
- `recurringCount`: Generate exactly this many instances (alternative to end date)

Each generated instance is a separate ride document with:
- Unique UID
- Updated Date and appointmentTime
- `isRecurringInstance: true`
- `parentRideUID`: Links back to the original ride
- `recurringInstanceNumber`: Sequence number (1, 2, 3, etc.)

#### Request Body (Required Fields)
```json
{
  "clientUID": "client123",
  "Date": "2025-01-15",
  "appointmentTime": "2025-01-15T10:00:00Z",
  "appointment_type": "Medical",
  "purpose": "Doctor appointment"
}
```

#### Request Body (Full Example with Optional Fields)
```json
{
  "clientUID": "client123",
  "Date": "2025-01-15",
  "appointmentTime": "2025-01-15T10:00:00Z",
  "appointment_type": "Medical",
  "purpose": "Doctor appointment",
  "status": "Scheduled",
  "tripType": "RoundTrip",
  "recurring": "Weekly",
  "recurringEndDate": "2025-07-15",
  "driverUID": "driver123",
  "dispatcherUID": "dispatcher123",
  "destinationUID": "destination123",
  "organization": "org123",
  "pickupTime": "09:00 AM",
  "estimatedDuration": 60,
  "milesDriven": 0,
  "volunteerHours": 0,
  "donationReceived": "None",
  "donationAmount": 0,
  "internalComment": "Internal notes",
  "externalComment": "External notes",
  "startLocation": "123 Main St",
  "endLocation": "456 Oak Ave",
  "additionalClient1_Name": "Jane Doe",
  "additionalClient1_Rel": "Spouse"
}
```

#### Request Body (With Recurring Field)
```json
{
  "clientUID": "client123",
  "Date": "2025-01-15",
  "appointmentTime": "2025-01-15T10:00:00Z",
  "appointment_type": "Medical",
  "purpose": "Weekly checkup",
  "recurring": "Weekly"
}
```

#### Valid Recurring Values
- `Weekly`
- `Bi-Weekly`
- `Monthly`
- `Bi-Monthly`
- `Yearly`
- `Bi-Yearly`

#### Expected Response (Success - 201 - Single Ride)
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
    "appointment_type": "Medical",
    "purpose": "Doctor appointment",
    "status": "Scheduled",
    "tripType": "RoundTrip",
    "CreatedAt": "2025-01-10T12:00:00.000Z",
    "UpdatedAt": "2025-01-10T12:00:00.000Z"
  }
}
```

#### Expected Response (Success - 201 - Recurring Ride)
```json
{
  "success": true,
  "message": "Ride created successfully with 26 recurring instances",
  "ride": {
    "id": "firestore-doc-id",
    "UID": "ride_1234567890_abc123",
    "clientUID": "client123",
    "Date": "2025-01-15",
    "appointmentTime": "2025-01-15T10:00:00Z",
    "appointment_type": "Medical",
    "purpose": "Weekly checkup",
    "status": "Scheduled",
    "tripType": "RoundTrip",
    "recurring": "Weekly",
    "isRecurringParent": true,
    "CreatedAt": "2025-01-10T12:00:00.000Z",
    "UpdatedAt": "2025-01-10T12:00:00.000Z"
  },
  "recurringInstances": [
    {
      "id": "firestore-doc-id-2",
      "UID": "ride_1234567890_abc123_1",
      "clientUID": "client123",
      "Date": "2025-01-22",
      "appointmentTime": "2025-01-22T10:00:00Z",
      "appointment_type": "Medical",
      "purpose": "Weekly checkup",
      "status": "Scheduled",
      "tripType": "RoundTrip",
      "recurring": "Weekly",
      "isRecurringInstance": true,
      "parentRideUID": "ride_1234567890_abc123",
      "recurringInstanceNumber": 1,
      "CreatedAt": "2025-01-10T12:00:00.000Z",
      "UpdatedAt": "2025-01-10T12:00:00.000Z"
    }
    // ... more instances
  ],
  "totalRidesCreated": 27
}
```

#### Expected Response (Error - 400 - Missing Required Fields)
```json
{
  "success": false,
  "message": "Missing required fields: clientUID, Date",
  "error": null
}
```

#### Expected Response (Error - 400 - Invalid Recurring Value)
```json
{
  "success": false,
  "message": "Invalid recurring value. Must be one of: Weekly, Bi-Weekly, Monthly, Bi-Monthly, Yearly, Bi-Yearly",
  "error": "Provided value: Daily"
}
```

#### Expected Response (Error - 409 - Duplicate UID)
```json
{
  "success": false,
  "message": "Ride with this UID already exists",
  "error": null
}
```

#### Expected Response (Error - 500 - Server Error)
```json
{
  "success": false,
  "message": "Server error creating ride.",
  "error": "Error message details"
}
```

---

### 2. Match Drivers for a Ride (GET)

#### Endpoint
```
GET /api/rides/:rideId/match-drivers
```

#### Example
```
GET /api/rides/firestore-ride-id/match-drivers
```

**Note:** This endpoint accepts either a Firestore document ID or a ride UID.

#### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "ride": {
    "id": "ride-doc-id",
    "rideId": "TEST-001",
    "organizationId": "all-volunteers",
    "pickupTime": "2025-09-15T15:05:00.000Z",
    "appointmentTime": "2025-09-15T15:30:00.000Z",
    "estimatedDuration": 30,
    "tripType": "RoundTrip",
    "totalDurationMinutes": 55,
    "status": "Scheduled",
    "purpose": "Doctor Visit"
  },
  "available": [
    {
      "id": "driver-id-1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-0100",
      "vehicle": "Sedan",
      "maxRidesPerWeek": 10,
      "availability": "M09;M17;T09;T17;W09;W17;Th09;Th17;F09;F17"
    }
  ],
  "unavailable": [
    {
      "id": "driver-id-2",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "555-0200",
      "vehicle": "SUV",
      "maxRidesPerWeek": 5,
      "availability": "M08;M12",
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

#### Ride Date/Time Format Notes:
- `Date` field: String format `'M/D/YYYY'` (e.g., `'9/15/2025'`)
- `appointmentTime` field: String format `'H:MM AM/PM'` (e.g., `'11:30 AM'`)
- `pickupTme` field: String format `'H:MM AM/PM'` (e.g., `'11:05 AM'`) - Note: Database uses 'pickupTme' (typo) instead of 'pickupTime'

### 2. Get Rides Calendar (GET)

#### Endpoint
```
GET /api/rides/calendar
```

#### Query Parameters
- `start` (optional): Start date (ISO format: `2025-09-01`)
- `end` (optional): End date (ISO format: `2025-12-31`)
- `status` (optional): Filter by status (e.g., `unassigned`, `scheduled`)
- `driver_id` (optional): Filter by driver UID
- `organization` (optional): Filter by organization

#### Example
```
GET /api/rides/calendar?start=2025-09-01&end=2025-12-31&status=unassigned
```

#### Expected Response (Success - 200)
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
      "clientUID": "client-123",
      "driverUID": "driver-456",
      "destinationUID": "dest-789",
      "milesDriven": 15,
      "wheelchair": false
    }
  ],
  "count": 1
}
```

---

## Calendar

### 1. Get Rides by Timeframe (GET)

#### Endpoint
```
GET /api/calendar
```

#### Query Parameters (Required)
- `startDate`: ISO date string (e.g., `2025-09-01`)
- `endDate`: ISO date string (e.g., `2025-12-31`)

#### Example
```
GET /api/calendar?startDate=2025-09-01&endDate=2025-12-31
```

#### Expected Response (Success - 200)
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

## Maps

### 1. Verify Address (GET)

#### Endpoint
```
GET /api/maps/verify
```

#### Query Parameters (Required)
- `address`: Address string (URL encoded)

#### Example
```
GET /api/maps/verify?address=1600+Pennsylvania+Ave+NW+Washington+DC
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "verified": true,
  "address": {
    "display_name": "1600 Pennsylvania Avenue Northwest, Washington, DC, USA",
    "lat": "38.8977",
    "lon": "-77.0365"
  }
}
```

### 2. Get Route (GET)

#### Endpoint
```
GET /api/maps/route
```

#### Query Parameters (Required)
- `start`: Start coordinates (format: `lat,lon` or `lon,lat`)
- `end`: End coordinates (format: `lat,lon` or `lon,lat`)

#### Example
```
GET /api/maps/route?start=-73.935242,40.730610&end=-74.0060,40.7128
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "route": {
    "distance": 12345.67,
    "duration": 2345.67,
    "geometry": "..."
  }
}
```

---

## Notifications

### 1. Send Notification (POST)

#### Endpoint
```
POST /api/notify
```

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "userId": "user-firebase-id",
  "message": "Your ride is confirmed for tomorrow at 2:00 PM",
  "type": "email"
}
```

#### Request Body (SMS)
```json
{
  "userId": "user-firebase-id",
  "message": "Your ride is confirmed for tomorrow at 2:00 PM",
  "type": "sms"
}
```

#### Types
- `"email"` - Send via email (SendGrid)
- `"sms"` - Send via SMS (Twilio/Mocked)

#### Expected Response (Success - 200)
```json
{
  "success": true
}
```

#### Expected Response (Error - 400)
```json
{
  "success": false,
  "message": "Missing userId, message, or type"
}
```

### 2. Notify Organization Drivers (POST)

#### Endpoint
```
POST /api/notify-org
```

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "org_id": "bripen"
}
```

#### Description
This endpoint sends email notifications to all drivers in an organization who have unassigned rides available for acceptance.

**How it works:**
1. Queries all rides with `organization` field matching the provided `org_id`
2. Filters for rides with `status: "unassigned"` and populated `driverUID` field
3. Extracts `volunteer_id`'s from the CSV `driverUID` field (e.g., `",volunteer_id1,volunteer_id2"`)
4. Looks up each volunteer by `volunteer_id` field
5. Sends an email to each volunteer's email address

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "notified": 3
}
```

#### Expected Response (Success - No Rides)
```json
{
  "success": true,
  "message": "No rides available."
}
```

#### Expected Response (Success - No Drivers)
```json
{
  "success": true,
  "message": "No drivers to notify."
}
```

#### Expected Response (Error - 400)
```json
{
  "success": false,
  "message": "Missing org_id"
}
```

#### Expected Response (Error - 500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error message details"
}
```

#### Email Content
The email sent to drivers contains:
- **Subject:** "Rides Available for Acceptance"
- **Message:** "You have rides you can accept for {org_id}, accept them here: {driverAcceptanceEndpoint}"

The `driverAcceptanceEndpoint` can be configured via the `DRIVER_ACCEPTANCE_ENDPOINT` environment variable, or defaults to `"https://axo-lift.webdev.gccis.rit.edu/driver/accept"`.

#### Requirements
- Rides must have:
  - `organization` field matching the provided `org_id`
  - `status: "unassigned"` (case-insensitive)
  - `driverUID` field populated with comma-separated `volunteer_id` values
- Volunteers must have:
  - `volunteer_id` field matching the IDs in the ride's `driverUID` field
  - `email` or `email_address` field populated

#### Example Use Case
Send notifications to all drivers in the "bripen" organization about unassigned rides they can accept:
```json
POST /api/notify-org
Content-Type: application/json

{
  "org_id": "bripen"
}
```

---

## Clients

### 1. Get Client Donations (GET)

#### Endpoint
```
GET /api/clients/:clientId/donations
```

#### Example
```
GET /api/clients/client-firebase-id/donations
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "clientId": "client-firebase-id",
  "total": 2,
  "donations": [
    {
      "id": "donation-id-1",
      "clientId": "client-firebase-id",
      "amount": 50.00,
      "date": "2025-09-01",
      "type": "Cash",
      ...
    },
    {
      "id": "donation-id-2",
      "clientId": "client-firebase-id",
      "amount": 100.00,
      "date": "2025-09-15",
      "type": "Check",
      ...
    }
  ]
}
```

---

## Volunteers

### 1. Add Volunteer Unavailability (POST)

#### Endpoint
```
POST /api/volunteers/:volunteerId/unavailability
```

#### Example
```
POST /api/volunteers/volunteer-firebase-id/unavailability
```

#### Headers
```
Content-Type: application/json
```

#### Request Body (Single Entry)
```json
{
  "repeated": false,
  "unavailabilityString": "2025-09-20 09:00 AM to 2025-09-20 05:00 PM",
  "effectiveFrom": "2025-09-20T09:00:00Z",
  "effectiveTo": "2025-09-20T17:00:00Z",
  "source": "api"
}
```

#### Request Body (Multiple Entries)
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

#### Expected Response (Success - 200)
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

## Reports

### 1. Get Reports (GET)

#### Endpoint
```
GET /api/reports
```

#### Query Parameters
- Field filters: Set any field to `true` to include it in the report
  - `client_name=true`
  - `date_of_birth=true`
  - `ride_status=true`
  - `trip_mileage=true`
  - `driver_id=true`
  - `volunteering_status=true`
  - `mobility_assistance=true`
  - `security_assignment=true`
  - `date_enrolled=true`
  - `m_f=true`
- `start` (optional): Start date (ISO format)
- `end` (optional): End date (ISO format)
- `organization` (optional): Filter by organization

#### Example
```
GET /api/reports?client_name=true&ride_status=true&start=2025-01-01&end=2025-12-31
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "reports": {
    "clients": [
      {
        "client_name": "John Doe",
        "date_of_birth": "1950-01-15"
      }
    ],
    "rides": [
      {
        "ride_status": "Scheduled",
        "trip_mileage": 15,
        "driver_id": "driver-123"
      }
    ],
    "volunteers": [
      {
        "volunteering_status": "Active",
        "mobility_assistance": "Wheelchair"
      }
    ],
    "client_metadata": [
      {
        "security_assignment": "Low",
        "date_enrolled": "2024-01-01",
        "m_f": "M"
      }
    ]
  }
}
```

### 2. Save Report Preferences (POST)

#### Endpoint
```
POST /api/reports/save
```

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "user_id": "user-firebase-id",
  "selectedParams": ["client_name", "ride_status", "trip_mileage"]
}
```

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "message": "Saved successfully",
  "document_id": "saved-report-doc-id"
}
```

### 3. Get User's Saved Report (GET)

#### Endpoint
```
GET /api/reports/:user_id
```

#### Example
```
GET /api/reports/user-firebase-id
```

#### Query Parameters (Optional)
- `start`: Start date (ISO format)
- `end`: End date (ISO format)
- `organization`: Filter by organization

#### Expected Response (Success - 200)
```json
{
  "success": true,
  "filters_used": ["client_name", "ride_status"],
  "reports": {
    "clients": [...],
    "rides": [...]
  }
}
```

---

## Postman Collection Setup Tips

### Environment Variables
Create a Postman environment with:
- `base_url`: `http://localhost:3000`
- `auth_token`: `your-jwt-token` (set after login)
- `test_org_id`: `TEST-ORG-001`
- `test_org_doc_id`: `firestore-document-id` (save after creation)
- `test_user_id`: `USER-001` (save after creation)
- `test_ride_id`: `ride-firebase-id` (save after creation)
- `test_driver_id`: `driver-firebase-id` (save after creation)

### Tests Script Examples (Postman Tests Tab)

**For Login:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success: true", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response contains token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('token');
    // Save token for later use
    pm.environment.set("auth_token", jsonData.token);
});
```

**For Create Organization:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has success: true", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response contains orgId", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('orgId');
    // Save orgId for later use
    pm.environment.set("test_org_doc_id", jsonData.data.orgId);
});
```

**For Match Drivers:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response contains available drivers array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('available');
    pm.expect(jsonData.available).to.be.an('array');
});

pm.test("Response contains summary", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('summary');
    pm.expect(jsonData.summary).to.have.property('totalDrivers');
});
```

---

## Quick Copy-Paste Examples

### Login
```json
POST http://localhost:3000/api/login
Content-Type: application/json

{
  "username": "admin@example.com",
  "password": "password123"
}
```

### Create Organization
```json
POST http://localhost:3000/api/organizations
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "name": "Quick Test Org",
  "org_id": "QUICK-001"
}
```

### Get All Organizations
```
GET http://localhost:3000/api/organizations
Authorization: Bearer {{auth_token}}
```

### Match Drivers for Ride
```
GET http://localhost:3000/api/rides/{{test_ride_id}}/match-drivers
Authorization: Bearer {{auth_token}}
```

### Create Role
```json
POST http://localhost:3000/api/roles
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "name": "coordinator",
  "org_id": "bripen",
  "parentRole": "default_coordinator"
}
```

### Create Permissions for Role
```json
POST http://localhost:3000/api/permissions
Content-Type: application/json
Authorization: Bearer {{auth_token}}

{
  "roleName": "coordinator",
  "create_clients": true,
  "read_clients": true,
  "update_clients": true,
  "delete_clients": false,
  "create_org": false,
  "read_org": true,
  "update_org": false,
  "delete_org": false,
  "create_rides": true,
  "read_rides": true,
  "update_rides": true,
  "delete_rides": false,
  "create_roles": true,
  "read_roles": true,
  "update_roles": true,
  "delete_roles": false,
  "create_volunteers": false,
  "read_volunteers": true,
  "update_volunteers": false,
  "delete_volunteers": false,
  "read_logs": true
}
```

### Get Parent Role View
```
GET http://localhost:3000/api/roles/bripen_dispatcher/parent/view
Authorization: Bearer {{auth_token}}
```

### Get Rides Calendar
```
GET http://localhost:3000/api/rides/calendar?start=2025-09-01&end=2025-12-31&status=scheduled
```

### Verify Address
```
GET http://localhost:3000/api/maps/verify?address=1600+Pennsylvania+Ave+NW+Washington+DC
```

### Send Notification
```json
POST http://localhost:3000/api/notify
Content-Type: application/json

{
  "userId": "user-firebase-id",
  "message": "Your ride is confirmed",
  "type": "email"
}
```

### Notify Organization Drivers
```json
POST http://localhost:3000/api/notify-org
Content-Type: application/json

{
  "org_id": "bripen"
}
```

### Get Unassigned Rides for Organization and Volunteer
```
GET http://localhost:3000/api/organizations/bripen/volunteers/zvco96u8CWM2ryR1CyKvyJ17VHC3/unassigned-rides
```

---

## Test Scenarios

### Scenario 1: Complete Organization Workflow
1. **Login** to get authentication token
2. **Create** an organization with full data
3. **Get all** organizations to verify it was created
4. **Get single** organization by org_id to verify details
5. **Update** the organization with new contact info
6. **Get single** organization again to verify update
7. **Delete** the organization
8. **Get all** organizations to verify deletion

### Scenario 2: Ride Matching Workflow
1. **Create** a ride (via your application or database)
2. **Match drivers** for the ride using ride ID
3. Verify `available` array contains eligible drivers
4. Verify `unavailable` array shows drivers with reasons
5. Test with different date/time formats

### Scenario 3: Reports Workflow
1. **Get reports** with specific fields (e.g., `client_name=true&ride_status=true`)
2. **Save report preferences** for a user
3. **Get user's saved report** to verify preferences were saved
4. Verify report data includes requested fields

### Scenario 4: Validation Tests
1. Try to create organization **without required fields** (name, org_id) - should return 400
2. Try to create organization with **duplicate org_id** - should return 409
3. Try to get organization with **non-existent ID** - should return 404
4. Try to match drivers with **non-existent ride ID** - should return 404
5. Try to send notification **without required fields** - should return 400

---

## Troubleshooting

### Issue: "Invalid credentials" on login
- **Check**: Username and password are correct
- **Check**: User exists in volunteers collection with correct email_address
- **Check**: Password is correctly hashed in database

### Issue: "Organization not found" error
- **Check**: Using correct orgId (Firestore document ID or org_id field)
- **Check**: Organization exists in organizations collection
- **Check**: Collection name is `organizations` (lowercase)

### Issue: No available drivers in match-drivers response
- **Check**: Ensure you have volunteers with `volunteering_status: "Active"`
- **Check**: Verify volunteer availability matches the ride day/time
- **Check**: Look at the `unavailable` array to see why drivers are unavailable
- **Check**: Ride date/time format matches expected format:
  - Date: `'M/D/YYYY'` (e.g., `'9/15/2025'`)
  - Time: `'H:MM AM/PM'` (e.g., `'11:30 AM'`)

### Issue: Date parsing fails
- **Check**: Console logs will show: `Failed to parse ride date/time: {...}`
- **Verify**: Date string format matches exactly `M/D/YYYY`
- **Verify**: Time string includes AM/PM and matches format `H:MM AM/PM`

### Issue: "Authorization token required" error
- **Check**: Token is included in Authorization header
- **Check**: Token format is: `Bearer YOUR_TOKEN`
- **Check**: Token hasn't expired (default: 24 hours)
- **Check**: Token was obtained from `/api/login` endpoint

---

## Quick Test Checklist

### Authentication
- [ ] Server is running on port 3000
- [ ] Login returns success with token
- [ ] Token can be used in Authorization header

### Organizations
- [ ] Created organization successfully
- [ ] Retrieved all organizations
- [ ] Retrieved single organization by ID
- [ ] Updated organization successfully
- [ ] Deleted organization successfully

### Rides
- [ ] Matched drivers by ride ID - returns success
- [ ] Verified available drivers list is populated
- [ ] Verified unavailable drivers list shows reasons
- [ ] Retrieved rides calendar with filters
- [ ] Tested with different date formats

### Other Endpoints
- [ ] Created user account successfully
- [ ] Updated user account successfully
- [ ] Retrieved driver's rides
- [ ] Verified address via maps API
- [ ] Got route via maps API
- [ ] Sent notification successfully
- [ ] Retrieved client donations
- [ ] Added volunteer unavailability
- [ ] Generated reports with filters
- [ ] Saved report preferences
