# Permission System Documentation

## Overview

All API endpoints (except `/api/login`) now require `org_id` and `signed_in_role` parameters for authentication and authorization. The system validates:

1. The role exists in the role table
2. The `org_id` matches the organization associated with the role
3. The role's permission set allows the requested action

## Required Parameters

### For POST, PUT, PATCH requests:
Include `org_id` and `signed_in_role` in the request body:
```json
{
  "org_id": "your-org-id",
  "signed_in_role": "role-name",
  // ... other request data
}
```

### For GET, DELETE requests:
Include `org_id` and `signed_in_role` as query parameters:
```
GET /api/organizations?org_id=your-org-id&signed_in_role=role-name
DELETE /api/organizations/123?org_id=your-org-id&signed_in_role=role-name
```

## Permission Mapping

Permissions follow the pattern: `{action}_{resource}`

### Actions:
- `create` - POST requests
- `read` - GET requests
- `update` - PUT/PATCH requests
- `delete` - DELETE requests

### Resources:
- `org` - Organization endpoints (`/api/organizations`)
- `clients` - Client endpoints (`/api/clients`)
- `rides` - Ride endpoints (`/api/rides`, `/api/calendar`, `/api/drivers`)
- `volunteers` - Volunteer/User endpoints (`/api/volunteers`, `/api/users`)
- `roles` - Role and Permission endpoints (`/api/roles`, `/api/permissions`)
- `logs` - Report and Export endpoints (`/api/reports`, `/api/exports`)

### Example Permissions:
- `create_org` - Create organizations
- `read_clients` - Read client data
- `update_rides` - Update ride information
- `delete_volunteers` - Delete volunteers
- `read_logs` - Access reports and exports

## Excluded Endpoints

The following endpoints are excluded from permission checking:

### 1. `/api/login`
- **Reason**: Authentication endpoint - users need to login before they have a role
- **Status**: Explicitly excluded

### 2. `/api/maps/*`
- **Endpoints**: 
  - `GET /api/maps/verify`
  - `GET /api/maps/route`
- **Reason**: Utility endpoints for address verification and route calculation
- **Status**: Excluded from permission checking (utility functions)

### 3. `/api/notify-org`
- **Endpoint**: `POST /api/notify-org`
- **Reason**: Notification utility endpoint
- **Status**: Excluded from permission checking (may need special handling in future)

## Error Responses

### 400 Bad Request
Missing required parameters:
```json
{
  "success": false,
  "message": "org_id and signed_in_role are required",
  "details": {
    "org_id": "missing",
    "signed_in_role": "missing",
    "method": "GET",
    "path": "/api/organizations",
    "note": "For POST/PUT/PATCH: include in request body. For GET/DELETE: include as query parameters."
  }
}
```

### 401 Unauthorized
Role not found:
```json
{
  "success": false,
  "message": "Role not found",
  "details": {
    "role_name": "invalid-role",
    "error": "Role does not exist in role table"
  }
}
```

### 403 Forbidden
Organization ID mismatch:
```json
{
  "success": false,
  "message": "Organization ID mismatch",
  "details": {
    "provided_org_id": "org-123",
    "role_org_id": "org-456",
    "role_name": "coordinator",
    "error": "The provided org_id does not match the organization associated with this role"
  }
}
```

Permission denied:
```json
{
  "success": false,
  "message": "Permission denied",
  "details": {
    "required_permission": "create_org",
    "role_name": "driver",
    "org_id": "org-123",
    "method": "POST",
    "path": "/api/organizations",
    "error": "Role 'driver' does not have permission 'create_org'"
  }
}
```

### 500 Internal Server Error
Permission set not found or other server errors:
```json
{
  "success": false,
  "message": "Permission set not found for role",
  "details": {
    "role_name": "coordinator",
    "error": "Permission set could not be retrieved"
  }
}
```

## Special Cases

### Default Roles
Roles with `org_id` set to `"default"` are available to all organizations. When checking organization ID, if a role's `org_id` is `"default"`, it will match any provided `org_id`.

### Role Hierarchy
The permission system supports role hierarchies through the `parentRole` field. If a role doesn't have its own permission set, it may inherit permissions from its parent role.

## Implementation Notes

- The permission middleware runs for all `/api/*` routes except `/api/login`
- Permission checks happen before route handlers execute
- If permission check passes, the authenticated role information is attached to `req.authenticatedRole` for use in route handlers
- Unknown endpoints are excluded from permission checking with a warning logged to the console

## Testing

When testing endpoints, ensure:
1. Valid `org_id` and `signed_in_role` are provided
2. The role exists in the database
3. The role's `org_id` matches the provided `org_id` (or is "default")
4. The role's permission set includes the required permission for the action

Example test request:
```bash
curl -X GET "http://localhost:3000/api/organizations?org_id=test-org&signed_in_role=coordinator" \
  -H "Content-Type: application/json"
```

Example test request with body:
```bash
curl -X POST "http://localhost:3000/api/organizations" \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "test-org",
    "signed_in_role": "coordinator",
    "name": "New Organization",
    "email": "org@example.com"
  }'
```

