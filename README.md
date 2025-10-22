# TeamSlinkies Backend API

A comprehensive HIPAA-compliant Node.js backend service for TeamSlinkies, a medical transportation platform that connects volunteers with individuals needing rides to medical appointments. The system provides intelligent driver matching, real-time notifications, route planning, and comprehensive audit logging.

## 🚀 Features

### Core Functionality
- **User Management**: Complete user account lifecycle (creation, update, deletion) with role-based permissions
- **JWT Authentication**: Secure token-based authentication with configurable session timeouts
- **Role-Based Access Control**: Granular permission system for different user types
- **Driver Matching System**: Intelligent matching of available drivers based on ride timeframes and volunteer availability
- **Ride Management**: Comprehensive ride scheduling with multiple trip types (Round Trip, One Way)
- **Calendar Integration**: Monthly and weekly calendar views for ride scheduling
- **Reports & Analytics**: Client and donation reporting capabilities
- **Notifications**: Multi-channel notification system (Email via SendGrid, SMS via Twilio)
- **Maps Integration**: Address verification and route planning using OpenStreetMap APIs

### Security & Compliance
- **HIPAA Compliance**: Full implementation of HIPAA technical safeguards for PHI protection
- **Audit Logging**: Comprehensive audit trail for all PHI access and modifications (6-year retention)
- **Data Encryption**: AES-256-GCM encryption for sensitive data at rest
- **TLS/HTTPS**: Secure transmission of all data in transit
- **Security Headers**: Helmet.js integration for enhanced security
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Input Validation**: Comprehensive validation on all endpoints

### Infrastructure
- **Firestore Database**: Cloud-native NoSQL database with real-time capabilities
- **Firebase Functions**: Serverless background triggers and scheduled tasks
- **CSV Migration Tools**: Import existing data from legacy systems

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account with Firestore enabled
- SendGrid account (for email notifications)
- Twilio account (for SMS notifications)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd TeamSlinkies
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# JWT Configuration
JWT_SECRET=<your-64-byte-hex-jwt-secret>
SESSION_TIMEOUT_MINUTES=15

# Encryption
ENCRYPTION_KEY=<your-32-byte-hex-encryption-key>

# Environment
NODE_ENV=development
PORT=3000

# Security
ENABLE_HTTPS_REDIRECT=false  # Set to true in production
ENABLE_RATE_LIMITING=true

# SendGrid (Email Notifications)
SENDGRID_API_KEY=<your-sendgrid-api-key>
SENDGRID_FROM_EMAIL=noreply@yourapp.com

# Twilio (SMS Notifications)
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-phone-number>
```

**Generate secure secrets:**

```bash
# Generate JWT secret (64-byte hex string)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate encryption key (32-byte hex string)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Configure Firebase

Place your `serviceAccountKey.json` in the project root. You can download this from your Firebase Console:
1. Go to Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the file as `serviceAccountKey.json`

### 5. Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

## 🚀 Running the Application

### Option 1: Node.js (Traditional)

#### Development Mode

```bash
npm start
```

The server will start on `http://localhost:3000`

#### Using Firestore Emulator (Development)

```bash
# Start the emulator
npm run emulator

# In a separate terminal, run migrations
npm run migrate:dev
```

### Option 2: Docker (Recommended for Production)

**Quick Start:**

```bash
# Copy environment template
cp env.template .env
# Edit .env with your actual values

# Build and run
npm run docker:build
npm run docker:run:detached

# View logs
npm run docker:logs
```

**Development with hot-reload:**

```bash
npm run docker:run:dev
```

For detailed Docker deployment instructions, see:
- **[QUICK_START_DOCKER.md](./QUICK_START_DOCKER.md)** - Get started in 5 minutes
- **[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)** - Complete deployment guide

## 📚 API Documentation

### Authentication

#### Login
```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "firebase-doc-id",
    "email": "user@example.com",
    "role": "admin",
    "organizationId": "org-001"
  }
}
```

### User Management

#### Create User Account
```http
POST /api/users
Content-Type: application/json
Authorization: Bearer <token> (optional - required for admin creation)

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

#### Update User Account
```http
PUT /api/users/:userID
Content-Type: application/json
Authorization: Bearer <token> (optional)

{
  "first_name": "Jane",
  "phone_number": "555-5678"
}
```

#### Delete User Account
```http
DELETE /api/users/:userID
Authorization: Bearer <token> (recommended)
```

### Role Management

#### Create Role with Permissions
```http
POST /roles
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "coordinator",
  "title": "Ride Coordinator",
  "permissions": {
    "create_clients": true,
    "read_clients": true,
    "update_clients": true,
    "delete_clients": false,
    "create_rides": true,
    "read_rides": true,
    "update_rides": true,
    "delete_rides": false,
    "create_volunteers": false,
    "read_volunteers": true,
    "update_volunteers": false,
    "delete_volunteers": false,
    "read_logs": true
  }
}
```

### Driver & Ride Management

#### Get Driver's Rides
```http
GET /api/drivers/:driverID/rides
Authorization: Bearer <token> (optional)
```

#### Match Drivers for a Ride
```http
GET /rides/:rideId/match-drivers
```

**Response:**
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

### Ride Calendar

#### Get Calendar View
```http
GET /api/rides/calendar?viewType=month&startDate=2025-10-01&endDate=2025-10-31&status=scheduled
```

**Query Parameters:**
- `viewType`: "month" or "week" (default: "month")
- `startDate`: ISO date string
- `endDate`: ISO date string
- `status`: Filter by ride status
- `driverId`: Filter by specific driver

### Maps & Routing

#### Verify Address
```http
GET /api/maps/verify?address=1600+Pennsylvania+Ave+NW+Washington+DC
```

#### Get Route
```http
GET /api/maps/route?start=-73.935242,40.730610&end=-74.0060,40.7128
```

### Notifications

#### Send Notification
```http
POST /api/notify
Content-Type: application/json

{
  "userId": "user-firebase-id",
  "message": "Your ride is confirmed for tomorrow at 2:00 PM",
  "type": "email"
}
```

**Types:** `"email"` or `"sms"`

### Clients & Reports

#### Client Management
```http
GET /api/clients
POST /api/clients
PUT /api/clients/:clientId
DELETE /api/clients/:clientId
```

#### Reports
```http
GET /api/reports
```

## 🔐 Security Features

### HIPAA Compliance

This system implements all required HIPAA technical safeguards:

1. **Access Control (§ 164.312(a)(1))**
   - Unique user identification
   - Automatic session timeout (15 minutes default)
   - JWT-based authentication
   - Role-based access control

2. **Audit Controls (§ 164.312(b))**
   - Comprehensive audit logging for all PHI access
   - 6-year audit log retention
   - Tamper-proof write-only audit collection

3. **Integrity (§ 164.312(c)(1))**
   - Data validation on all endpoints
   - AES-256-GCM encryption with authentication tags

4. **Person Authentication (§ 164.312(d))**
   - JWT token authentication
   - Strong password requirements
   - MFA-ready architecture

5. **Transmission Security (§ 164.312(e)(1))**
   - HTTPS/TLS encryption
   - Security headers via Helmet.js
   - HSTS enforcement

For detailed HIPAA compliance information, see [HIPAA_COMPLIANCE.md](./HIPAA_COMPLIANCE.md) and [SETUP_HIPAA.md](./SETUP_HIPAA.md).

## 🗄️ Database Schema

### Collections

#### Users
```javascript
{
  user_ID: string,           // Unique user identifier
  first_name: string,
  last_name: string,
  email_address: string,
  password_hash: string,     // Bcrypt hashed
  phone_number: string,
  role: string,              // "admin", "driver", "coordinator", etc.
  organization_ID: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### Rides
```javascript
{
  RideID: number,
  OrganizationID: string,
  PickupTime: timestamp,
  AppointmentTime: timestamp,
  EstimatedDuration: number,  // minutes
  TripType: string,           // "RoundTrip", "OneWayTo", "OneWayFrom"
  Status: string,             // "scheduled", "completed", "cancelled"
  Purpose: string,
  AssignedDriverID: string,
  ClientID: string,
  PickupAddress: string,
  DropoffAddress: string,
  Notes: string
}
```

#### Volunteers
```javascript
{
  OrganizationID: string,
  "VOLUNTEER POSITION": "driver",
  VOLUNTEERING_STATUS: "Active",
  driver_availability_by_day_and_time: string,  // "F11;F13;M11;M12;T11;Th12;W11"
  max_rides_per_week: number,
  vehicle_type: string,
  first_name: string,
  last_name: string,
  email: string,
  phone: string
}
```

#### Audit_Logs
```javascript
{
  timestamp: timestamp,
  userId: string,
  userEmail: string,
  userRole: string,
  organizationId: string,
  action: string,            // "CREATE", "READ", "UPDATE", "DELETE"
  resourceType: string,      // "user", "ride", "client", etc.
  resourceId: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  details: object
}
```

## 🧩 Driver Matching System

The driver matching system intelligently matches available drivers based on:

### Trip Type Calculations

1. **RoundTrip**: 
   - Duration = (AppointmentTime - PickupTime) + EstimatedDuration
   - Driver needed from pickup until after appointment

2. **OneWayTo**: 
   - Duration = (AppointmentTime - PickupTime) + EstimatedDuration
   - Driver takes client to appointment

3. **OneWayFrom**: 
   - Duration = EstimatedDuration
   - Driver picks up client after appointment

### Volunteer Availability Format

Volunteers specify availability using: `"F11;F13;M11;M12;T11;Th12;W11"`

- **Days**: M=Monday, T=Tuesday, W=Wednesday, Th=Thursday, F=Friday
- **Times**: 11=11:00 AM, 13=1:00 PM, 14=2:00 PM, etc.
- **Format**: DayHour separated by semicolons

## 📁 Project Structure

```
TeamSlinkies/
├── server.js                 # Main Express server
├── ApplicationLayer.js       # Business logic layer
├── DataAccessLayer.js        # Database access layer
├── AuditLogger.js           # HIPAA audit logging
├── userCreation.js          # User account management
├── firebase.js              # Firebase/Firestore configuration
├── csvMigration.js          # Data migration utilities
├── calendar.js              # Calendar utilities
├── routes/
│   ├── rides.js             # Ride management endpoints
│   ├── clients.js           # Client management endpoints
│   └── reports.js           # Reporting endpoints
├── middleware/
│   ├── authMiddleware.js    # JWT authentication
│   └── securityMiddleware.js # Security utilities
├── integrations/
│   └── maps.js              # OpenStreetMap integration
├── services/
│   └── notifications.js     # SendGrid & Twilio integration
├── utils/
│   └── encryption.js        # Encryption utilities
├── functions/
│   ├── index.js             # Firebase Cloud Functions
│   └── triggers.js          # Database triggers
├── docs/                    # API documentation
├── HIPAA_COMPLIANCE.md      # HIPAA compliance guide
├── SETUP_HIPAA.md          # HIPAA setup instructions
└── README.md               # This file
```

## 🔄 Data Migration

### Import CSV Data

The system supports importing existing data from CSV files:

```bash
# Using Firebase emulator
npm run migrate:dev

# Direct migration (ensure proper environment setup)
node csvMigration.js
```

**Supported CSV Files:**
- `fakeClients.csv` - Client records
- `fakeStaff.csv` - Staff and volunteer records
- `fakeCalls.csv` - Historical ride requests

## 🧪 Testing

```bash
# Run tests
npm test

# Test specific functionality
node driver-matching-test.js
```

## 📊 Monitoring & Audit Logs

All PHI access and modifications are logged to the `Audit_Logs` collection. Access logs include:

- User identification (ID, email, role)
- Action performed (CREATE, READ, UPDATE, DELETE)
- Resource accessed (type and ID)
- Timestamp
- IP address and user agent
- Success/failure status
- Detailed information about the operation

**Audit Log Retention**: 6 years (HIPAA requirement)

## 🚨 Error Handling

The API uses standard HTTP status codes:

- `200 OK` - Successful GET, PUT, DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication failed
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

Error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

## 📝 Environment-Specific Configuration

### Development
```env
NODE_ENV=development
ENABLE_HTTPS_REDIRECT=false
ENABLE_RATE_LIMITING=false
```

### Production
```env
NODE_ENV=production
ENABLE_HTTPS_REDIRECT=true
ENABLE_RATE_LIMITING=true
SESSION_TIMEOUT_MINUTES=15
```

## 🤝 Contributing

1. Follow the existing code style
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Ensure HIPAA compliance for any PHI-related changes
5. Run linters before committing

## 📄 License

[Add your license information here]

## 📞 Support

For questions or issues:
- Check the `/docs` folder for detailed API documentation
- Review `HIPAA_COMPLIANCE.md` for security-related questions
- Contact the development team

## 🔗 Additional Resources

- [User API Complete Guide](./docs/USER_API_COMPLETE_GUIDE.md)
- [Driver Rides API](./docs/API_DRIVER_RIDES.md)
- [Rides Creation API](./docs/API_RIDES_CREATE.md)
- [User Management Endpoints](./docs/API_USERS_ENDPOINT.md)
- [HIPAA Setup Guide](./SETUP_HIPAA.md)

---

**Version**: 1.0.0  
**Last Updated**: October 2025
