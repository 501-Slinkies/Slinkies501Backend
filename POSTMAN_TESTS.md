# Postman Tests for Organization Endpoints

## Base URL
```
http://localhost:3000
```

---

## 1. Create Organization (POST)

### Endpoint
```
POST /api/organizations
```

### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional)
```

### Request Body (Full Example)
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
  "sys_admin_phone_number": "607-555-0103",
  "sys_admin_user_id": "admin-user-001",
  "sys_admin_security_level": "Super Admin"
}
```

### Request Body (Minimal Example - Only Required Fields)
```json
{
  "name": "Test Organization",
  "org_id": "TEST-ORG-001"
}
```

### Expected Response (Success - 201)
```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "orgId": "firestore-document-id",
    "organizationId": "GST-TRANS-001"
  }
}
```

### Expected Response (Error - 409 Conflict)
```json
{
  "success": false,
  "message": "Organization with this org_id already exists",
  "errors": null
}
```

---

## 2. Get All Organizations (GET)

### Endpoint
```
GET /api/organizations
```

### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

### Query Parameters
None

### Expected Response (Success - 200)
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

---

## 3. Get Single Organization by ID (GET)

### Endpoint
```
GET /api/organizations/:orgId
```

### Examples
```
GET /api/organizations/firestore-document-id-here
GET /api/organizations/GST-TRANS-001
```

### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

### Expected Response (Success - 200)
```json
{
  "success": true,
  "organization": {
    "id": "firestore-document-id",
    "name": "Greater Southern Tier Transportation Services",
    "org_id": "GST-TRANS-001",
    "address": "123 Main Street",
    "email": "info@gsttransport.org",
    "short_name": "GST Transport",
    "phone_number": "607-555-0100",
    "lisence_number": "NY-12345",
    "website": "https://www.gsttransport.org",
    "creation_date": "2024-01-15T10:00:00.000Z",
    ...
  }
}
```

### Expected Response (Error - 404)
```json
{
  "success": false,
  "message": "Organization not found"
}
```

---

## 4. Update Organization (PUT)

### Endpoint
```
PUT /api/organizations/:orgId
```

### Examples
```
PUT /api/organizations/firestore-document-id-here
PUT /api/organizations/GST-TRANS-001
```

### Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN (optional)
```

### Request Body (Partial Update Example)
```json
{
  "phone_number": "607-555-9999",
  "email": "newemail@gsttransport.org",
  "website": "https://www.newwebsite.org"
}
```

### Request Body (Update Contact Information)
```json
{
  "pc_name": "John Smith Updated",
  "pc_email": "john.updated@gsttransport.org",
  "pc_phone_number": "607-555-0200",
  "sc_name": "Jane Doe Updated",
  "sc_email": "jane.updated@gsttransport.org"
}
```

### Request Body (Update Address)
```json
{
  "address": "456 New Street",
  "address2": "Suite 200",
  "city": "Corning",
  "state": "NY",
  "zip": "14830"
}
```

### Expected Response (Success - 200)
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

### Expected Response (Error - 404)
```json
{
  "success": false,
  "message": "Organization not found"
}
```

### Expected Response (Error - 409 Conflict)
```json
{
  "success": false,
  "message": "Email address already in use by another organization"
}
```

---

## 5. Delete Organization (DELETE)

### Endpoint
```
DELETE /api/organizations/:orgId
```

### Examples
```
DELETE /api/organizations/firestore-document-id-here
DELETE /api/organizations/GST-TRANS-001
```

### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

### Expected Response (Success - 200)
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

### Expected Response (Error - 404)
```json
{
  "success": false,
  "message": "Organization not found"
}
```

---

## Test Scenarios

### Scenario 1: Create and Retrieve Flow
1. **Create** an organization with full data
2. **Get all** organizations to verify it was created
3. **Get single** organization by org_id to verify details
4. **Update** the organization with new contact info
5. **Get single** organization again to verify update
6. **Delete** the organization
7. **Get all** organizations to verify deletion

### Scenario 2: Validation Tests
1. Try to create organization **without required fields** (name, org_id) - should return 400
2. Try to create organization with **duplicate org_id** - should return 409
3. Try to create organization with **duplicate email** - should return 409
4. Try to get organization with **non-existent ID** - should return 404
5. Try to update organization with **non-existent ID** - should return 404
6. Try to delete organization with **non-existent ID** - should return 404

### Scenario 3: Update Tests
1. Create organization
2. Update only **phone_number** - verify only that field changed
3. Update **primary contact** fields - verify pc_* fields updated
4. Update **secondary contact** fields - verify sc_* fields updated
5. Update **system admin** fields - verify sys_admin_* fields updated
6. Try to update with **invalid org_id** (duplicate) - should return 409

---

## Postman Collection Setup Tips

### Environment Variables
Create a Postman environment with:
- `base_url`: `http://localhost:3000`
- `auth_token`: `your-jwt-token` (if using authentication)
- `test_org_id`: `TEST-ORG-001`
- `test_org_doc_id`: `firestore-document-id` (save after creation)

### Tests Script Examples (Postman Tests Tab)

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

**For Get Organization:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Organization contains required fields", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.organization).to.have.property('name');
    pm.expect(jsonData.organization).to.have.property('org_id');
});
```

**For Update Organization:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Updated field matches request", function () {
    var jsonData = pm.response.json();
    var requestBody = JSON.parse(pm.request.body.raw);
    pm.expect(jsonData.organization.phone_number).to.eql(requestBody.phone_number);
});
```

---

## Quick Copy-Paste Examples

### Minimal Create
```json
POST http://localhost:3000/api/organizations
Content-Type: application/json

{
  "name": "Quick Test Org",
  "org_id": "QUICK-001"
}
```

### Get All
```
GET http://localhost:3000/api/organizations
```

### Get One (use org_id from create response)
```
GET http://localhost:3000/api/organizations/QUICK-001
```

### Update
```json
PUT http://localhost:3000/api/organizations/QUICK-001
Content-Type: application/json

{
  "email": "test@example.com",
  "phone_number": "555-1234"
}
```

### Delete
```
DELETE http://localhost:3000/api/organizations/QUICK-001
```

---

# Driver Ride Lookup Tests

## 1. Get Rides for Driver (GET)

### Endpoint
```
GET /api/drivers/:driverId/rides
```

### Headers
```
Authorization: Bearer YOUR_TOKEN (optional)
```

### Example Request
```bash
curl --location --request GET "http://localhost:3000/api/drivers/abc123/rides" \
  --header "Authorization: Bearer {{token}}"
```

### Expected Response (Success - 200)
```json
{
  "success": true,
  "message": "Found 3 rides for volunteer",
  "data": {
    "driverFirestoreId": "abc123",
    "driver": {
      "id": "abc123",
      "first_name": "Joan",
      "last_name": "Driver"
    },
    "identifiersQueried": [
      "abc123",
      "VOL-001"
    ],
    "identifiersMatched": [
      "abc123"
    ],
    "total": 3,
    "rides": [
      {
        "id": "rideDocId1",
        "Date": "9/15/2025",
        "pickupTme": "10:15 AM",
        "appointmentTime": "11:00 AM",
        "status": "assigned"
      }
    ]
  }
}
```

### Expected Response (Success, No Assignments - 200)
```json
{
  "success": true,
  "message": "Found 0 rides for volunteer",
  "data": {
    "driverFirestoreId": "abc123",
    "driver": {
      "id": "abc123",
      "first_name": "Joan",
      "last_name": "Driver"
    },
    "identifiersQueried": [
      "abc123"
    ],
    "identifiersMatched": [],
    "total": 0,
    "rides": []
  }
}
```

### Expected Response (Driver Not Found - 404)
```json
{
  "success": false,
  "message": "Driver not found"
}
```

### Postman Tests
```javascript
pm.test("status code is 200", () => pm.response.to.have.status(200));

const body = pm.response.json();
pm.test("query succeeded", () => pm.expect(body.success).to.be.true);
pm.test("rides array exists", () => pm.expect(body?.data?.rides).to.be.an("array"));
pm.test("identifiers tracked", () => pm.expect(body?.data?.identifiersQueried).to.be.an("array"));
```

These tests cover both populated and empty ride assignments. When using a volunteer ID with no rides, the API still returns `success: true` and an empty `rides` array, making it safe to include this test in automated smoke checks.

---

## 2. Get Rides by Driver and Organization (POST)

### Endpoint
```
POST /api/rides/by-driver
```

### Request Body
```json
{
  "orgId": "org123",
  "driverId": "zvco96u8CWM2ryR1CyKvyJ17VHC3"
}
```

### Headers
```
Content-Type: application/json
```

### Example Request
```bash
curl --location --request POST "http://localhost:3000/api/rides/by-driver" \
  --header "Content-Type: application/json" \
  --data '{
    "orgId": "org123",
    "driverId": "zvco96u8CWM2ryR1CyKvyJ17VHC3"
  }'
```

### Example Request (Postman)
```
POST http://localhost:3000/api/rides/by-driver
Content-Type: application/json

{
  "orgId": "org123",
  "driverId": "zvco96u8CWM2ryR1CyKvyJ17VHC3"
}
```

### Expected Response (Success - 200)
```json
{
  "success": true,
  "rides": [
    {
      "id": "rideDocId1",
      "driverUID": "zvco96u8CWM2ryR1CyKvyJ17VHC3,Ca0vqvSfcDREseZK0n0c",
      "Date": "2025-09-15T10:00:00Z",
      "pickupTime": "10:15 AM",
      "appointmentTime": "11:00 AM",
      "status": "assigned",
      "organization": "org123"
    },
    {
      "id": "rideDocId2",
      "driverUID": "zvco96u8CWM2ryR1CyKvyJ17VHC3",
      "Date": "2025-09-16T10:00:00Z",
      "pickupTime": "9:00 AM",
      "appointmentTime": "10:00 AM",
      "status": "assigned",
      "organization": "org123"
    }
  ],
  "count": 2,
  "orgId": "org123",
  "driverId": "zvco96u8CWM2ryR1CyKvyJ17VHC3"
}
```

### Expected Response (Success, No Rides - 200)
```json
{
  "success": true,
  "rides": [],
  "count": 0,
  "message": "No rides found for the specified organization",
  "orgId": "org123",
  "driverId": "zvco96u8CWM2ryR1CyKvyJ17VHC3"
}
```

### Expected Response (Error - 400 Bad Request)
```json
{
  "success": false,
  "message": "orgId and driverId are required in the request body"
}
```

### Postman Tests
```javascript
pm.test("status code is 200", () => pm.response.to.have.status(200));

const body = pm.response.json();
const requestBody = pm.request.body.toJSON();
pm.test("query succeeded", () => pm.expect(body.success).to.be.true);
pm.test("rides array exists", () => pm.expect(body.rides).to.be.an("array"));
pm.test("count is a number", () => pm.expect(body.count).to.be.a("number"));
pm.test("orgId matches request", () => pm.expect(body.orgId).to.eql(requestBody.orgId));
pm.test("driverId matches request", () => pm.expect(body.driverId).to.eql(requestBody.driverId));

// If rides are returned, verify structure
if (body.rides.length > 0) {
  pm.test("ride has id", () => pm.expect(body.rides[0]).to.have.property("id"));
  pm.test("ride has driverUID field", () => pm.expect(body.rides[0]).to.have.property("driverUID"));
  pm.test("driverUID contains driverId", () => {
    const driverUID = body.rides[0].driverUID || "";
    const driverIds = driverUID.split(",").map(id => id.trim());
    pm.expect(driverIds).to.include(body.driverId);
  });
}
```

### Notes
- This endpoint searches for rides where the `driverUID` field contains the provided `driverId` as part of a comma-separated list
- The `driverUID` field can contain multiple driver IDs separated by commas (e.g., "driver1,driver2,driver3")
- The endpoint will return all rides where the `driverId` appears anywhere in the comma-separated `driverUID` field
- Both `orgId` and `driverId` are required in the request body
- The endpoint does not require authentication
- Uses POST method with JSON body for consistency with other endpoints

---

# Role & Permission Tests

## 1. Get Roles for Organization (GET)

### Endpoint
```
GET /api/organizations/:orgId/roles
```

### Example Request
```bash
curl --location --request GET "http://localhost:3000/api/organizations/ORG-001/roles" \
  --header "Authorization: Bearer {{token}}"
```

### Expected Response (Success - 200)
```json
{
  "success": true,
  "organizationId": "ORG-001",
  "total": 4,
  "roles": [
    {
      "id": "dispatcher",
      "title": "Dispatcher",
      "org": "ORG-001",
      "permission_set": "dispatcher",
      "sourceCollection": "roles"
    },
    {
      "id": "driver",
      "title": "Driver",
      "org": "default",
      "permission_set": "driver",
      "sourceCollection": "roles"
    }
  ]
}
```

### Postman Tests
```javascript
pm.test("status is 200", () => pm.response.to.have.status(200));

const body = pm.response.json();
pm.test("response succeeded", () => pm.expect(body.success).to.be.true);
pm.test("roles array returned", () => pm.expect(body.roles).to.be.an("array"));
pm.test("defaults included", () => pm.expect(body.roles.some(r => r.org === "default")).to.be.true);
```

If the organization has no custom roles, the API still returns default ones (if defined); otherwise `roles` can be empty with `success: true`.

## 2. Get Permission Set for Role (GET)

### Endpoint
```
GET /api/roles/:roleName/permission-set
```

### Example Request
```bash
curl --location --request GET "http://localhost:3000/api/roles/dispatcher/permission-set" \
  --header "Authorization: Bearer {{token}}"
```

### Expected Response (Success - 200)
```json
{
  "success": true,
  "role": {
    "id": "dispatcher",
    "title": "Dispatcher",
    "org": "ORG-001",
    "permission_set": "dispatcher"
  },
  "permissionSet": {
    "id": "dispatcher",
    "create_rides": true,
    "read_rides": true,
    "update_rides": true,
    "delete_rides": false,
    "...": "..."
  }
}
```

### Expected Response (Role Not Found - 404)
```json
{
  "success": false,
  "message": "Role not found"
}
```

### Postman Tests
```javascript
pm.test("status is 200", () => pm.response.to.have.status(200));

const json = pm.response.json();
pm.test("lookup succeeded", () => pm.expect(json.success).to.be.true);
pm.test("permission set present", () => pm.expect(json.permissionSet).to.be.an("object"));
pm.test("role metadata returned", () => pm.expect(json.role).to.be.an("object"));
```

Use this request to validate that the permission set referenced by each role is present and that the fields you expect in the permissions document are returned.

