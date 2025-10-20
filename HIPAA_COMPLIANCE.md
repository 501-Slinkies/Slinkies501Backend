# HIPAA Compliance Guide

## Overview

This document outlines the HIPAA (Health Insurance Portability and Accountability Act) compliance measures implemented in the TeamSlinkies backend system. This application handles Protected Health Information (PHI) including patient medical appointment data, personal information, and health-related transportation records.

## Table of Contents

1. [Technical Safeguards Implemented](#technical-safeguards-implemented)
2. [Setup Instructions](#setup-instructions)
3. [Security Features](#security-features)
4. [Audit Logging](#audit-logging)
5. [Data Protection](#data-protection)
6. [Access Controls](#access-controls)
7. [Compliance Checklist](#compliance-checklist)
8. [Ongoing Maintenance](#ongoing-maintenance)

---

## Technical Safeguards Implemented

### 1. Access Control (§ 164.312(a)(1))

✅ **Unique User Identification**: Each user has a unique identifier and role
✅ **Automatic Logoff**: Sessions expire after 15 minutes of inactivity (configurable)
✅ **Encryption**: JWT tokens with secure authentication
✅ **Role-Based Access Control**: Granular permissions system

### 2. Audit Controls (§ 164.312(b))

✅ **Comprehensive Audit Logging**: All PHI access is logged
✅ **Audit Log Retention**: 6-year retention period (HIPAA requirement)
✅ **Tamper-Proof Logs**: Write-only audit log collection

### 3. Integrity (§ 164.312(c)(1))

✅ **Data Validation**: Input validation on all endpoints
✅ **Authentication Tags**: AES-256-GCM encryption with authentication
✅ **Secure Transmission**: HTTPS enforcement in production

### 4. Person or Entity Authentication (§ 164.312(d))

✅ **JWT Authentication**: Industry-standard token-based authentication
✅ **Password Requirements**: Strong password policies
✅ **Multi-Factor Ready**: Architecture supports MFA integration

### 5. Transmission Security (§ 164.312(e)(1))

✅ **Encryption in Transit**: HTTPS/TLS required
✅ **Security Headers**: Helmet.js security headers
✅ **HSTS**: HTTP Strict Transport Security enabled

---

## Setup Instructions

### 1. Environment Configuration

**CRITICAL**: Before deploying to production, you MUST configure the environment variables.

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Generate secure secrets:
   ```bash
   # Generate JWT secret (64-byte hex string)
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Generate encryption key (32-byte hex string)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Edit `.env` and set the values:
   ```env
   JWT_SECRET=<your-generated-jwt-secret>
   ENCRYPTION_KEY=<your-generated-encryption-key>
   NODE_ENV=production
   ENABLE_HTTPS_REDIRECT=true
   SESSION_TIMEOUT_MINUTES=15
   ```

### 2. Install Dependencies

```bash
npm install
```

The following HIPAA-compliance packages will be installed:
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `jsonwebtoken` - JWT authentication
- `bcrypt` - Password hashing
- `dotenv` - Environment variable management

### 3. Deploy Firestore Security Rules

Deploy the HIPAA-compliant Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

### 4. Start the Server

**Development**:
```bash
npm start
```

**Production**:
```bash
NODE_ENV=production npm start
```

---

## Security Features

### Authentication & Authorization

#### JWT Token-Based Authentication
- **Access Tokens**: 15-minute expiration (configurable)
- **Refresh Tokens**: 7-day expiration (configurable)
- **Token Claims**: User ID, email, role, organization

#### Login Endpoint
```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "role": "admin"
}
```

Response includes:
- `accessToken`: Use for API requests
- `refreshToken`: Use to obtain new access tokens
- `expiresIn`: Token expiration time

#### Protected Endpoints

All endpoints (except `/login` and `/health`) require authentication:

```http
GET /rides/123/match-drivers
Authorization: Bearer <your-access-token>
```

### Rate Limiting

Protection against brute force attacks:

- **Login endpoint**: 5 attempts per 15 minutes per IP
- **API endpoints**: 100 requests per 15 minutes per IP
- Configurable via environment variables

### Session Management

- **Automatic Timeout**: 15 minutes of inactivity
- **Token Expiration**: Short-lived access tokens
- **Secure Storage**: Never store tokens in localStorage (use httpOnly cookies in production)

### Password Requirements

Strong password policy enforced:
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No sequential characters (123, abc, etc.)
- No repeating characters

---

## Audit Logging

### What Gets Logged

Every access to PHI is logged with:
- User ID and email
- Action performed (READ, CREATE, UPDATE, DELETE)
- Resource type (client, ride, volunteer, etc.)
- Resource ID
- IP address
- User agent
- Timestamp
- Success/failure status
- Organization ID

### Audit Log Structure

```javascript
{
  timestamp: Date,
  userId: "user-123",
  userEmail: "user@example.com",
  userRole: "admin",
  organizationId: "org-001",
  action: "READ",
  resourceType: "client",
  resourceId: "client-456",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  success: true,
  failureReason: null,
  metadata: {},
  retentionDate: Date (6 years from timestamp)
}
```

### Accessing Audit Logs

Audit logs can be queried through the Firestore console or via API (requires `read_logs` permission):

```javascript
// Example: Query audit logs
const auditLogger = require('./AuditLogger');

const logs = await auditLogger.queryLogs({
  userId: 'user-123',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  resourceType: 'client',
  limit: 100
});
```

### Audit Log Retention

- **Retention Period**: 6 years (HIPAA requirement)
- **Storage**: Firestore `audit_logs` collection
- **Deletion**: Implement automated cleanup based on `retentionDate` field

---

## Data Protection

### Encryption at Rest

Field-level encryption for sensitive data using AES-256-GCM:

```javascript
const { encryptFields, decryptFields } = require('./utils/encryption');

// Encrypt sensitive fields before storing
const encryptedData = encryptFields(userData, ['ssn', 'medical_notes']);

// Decrypt when retrieving
const decryptedData = decryptFields(storedData, ['ssn', 'medical_notes']);
```

### Encryption in Transit

- **HTTPS Enforcement**: All production traffic must use HTTPS
- **TLS 1.2+**: Minimum TLS version
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.

### Data Minimization

The `sanitizeResponse` middleware removes unnecessary sensitive fields:

```javascript
// Automatically removes: password, ssn, driver_license_number
// from API responses to minimize PHI exposure
```

### Firestore Security Rules

Database-level access control:
- Organization-based data isolation
- Role-based permissions
- Authenticated access only
- No cross-organization access

---

## Access Controls

### Role-Based Access Control (RBAC)

#### Permission Types

```javascript
{
  // Client permissions
  create_clients: boolean,
  read_clients: boolean,
  update_clients: boolean,
  delete_clients: boolean,
  
  // Organization permissions
  create_org: boolean,
  read_org: boolean,
  update_org: boolean,
  delete_org: boolean,
  
  // Ride permissions
  create_rides: boolean,
  read_rides: boolean,
  update_rides: boolean,
  delete_rides: boolean,
  
  // User permissions
  create_users: boolean,
  read_users: boolean,
  update_users: boolean,
  delete_users: boolean,
  
  // Volunteer permissions
  create_volunteers: boolean,
  read_volunteers: boolean,
  update_volunteers: boolean,
  delete_volunteers: boolean,
  
  // Audit log access
  read_logs: boolean
}
```

#### Creating Roles

```http
POST /roles
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "driver_coordinator",
  "title": "Driver Coordinator",
  "permissions": {
    "read_clients": true,
    "read_rides": true,
    "update_rides": true,
    "read_volunteers": true,
    "update_volunteers": true,
    "create_clients": false,
    "delete_clients": false,
    ...
  }
}
```

### Organization Isolation

- Users can only access data from their organization
- Organization ID is embedded in JWT token
- Firestore rules enforce organization boundaries
- Cross-organization access is denied and logged

---

## Compliance Checklist

### Administrative Safeguards

- [ ] **Security Management Process**: Documented policies and procedures
- [ ] **Workforce Security**: Background checks for users with PHI access
- [ ] **Information Access Management**: Role-based access implemented ✅
- [ ] **Security Awareness Training**: Train all workforce members
- [ ] **Security Incident Procedures**: Breach notification process
- [ ] **Contingency Plan**: Data backup and disaster recovery
- [ ] **Business Associate Agreements**: Required for third-party services

### Physical Safeguards

- [ ] **Facility Access Controls**: Secure data center (if self-hosting)
- [ ] **Workstation Security**: Secure workstations accessing PHI
- [ ] **Device Security**: Encrypt devices with PHI access

### Technical Safeguards

- [x] **Access Control**: Unique user IDs, automatic logoff, encryption
- [x] **Audit Controls**: Comprehensive logging system
- [x] **Integrity**: Data validation and secure transmission
- [x] **Authentication**: JWT-based authentication
- [x] **Transmission Security**: HTTPS/TLS encryption

### Required Documentation

- [ ] **Privacy Policies**: HIPAA privacy notice
- [ ] **Security Policies**: Document all security procedures
- [ ] **Risk Assessment**: Annual risk analysis
- [ ] **Breach Notification**: Procedures for reporting breaches
- [ ] **BAA Templates**: For third-party vendors

---

## Ongoing Maintenance

### Regular Security Tasks

#### Daily
- Monitor audit logs for suspicious activity
- Review failed authentication attempts
- Check for rate limit violations

#### Weekly
- Review user access permissions
- Audit new user accounts
- Check for software updates

#### Monthly
- Review and update security policies
- Test backup and recovery procedures
- Security awareness training

#### Annually
- Conduct comprehensive risk assessment
- Review and update Business Associate Agreements
- Security audit by independent assessor
- Update disaster recovery plan

### Third-Party Services

Ensure all third-party services have signed Business Associate Agreements (BAA):

- [x] **Google Cloud Platform / Firebase**: BAA available ([sign up here](https://cloud.google.com/terms/hipaa))
- [ ] **Monitoring Services**: Ensure BAA coverage
- [ ] **Backup Services**: Ensure BAA coverage
- [ ] **Email Services**: Ensure BAA coverage

### Breach Notification

If a PHI breach occurs:

1. **Immediate Actions** (within 1 hour):
   - Contain the breach
   - Document the incident
   - Notify security officer

2. **Short-term** (within 24 hours):
   - Assess scope of breach
   - Identify affected individuals
   - Begin breach investigation

3. **Required Notifications**:
   - **Individuals**: Within 60 days
   - **HHS**: Within 60 days (if 500+ affected)
   - **Media**: Within 60 days (if 500+ affected in same state)
   - **Business Associates**: Without unreasonable delay

### Security Incident Response

Query audit logs to investigate incidents:

```javascript
// Find all failed login attempts in last 24 hours
const logs = await auditLogger.queryLogs({
  action: 'LOGIN',
  startDate: new Date(Date.now() - 24*60*60*1000),
  endDate: new Date()
});

// Filter for failures
const failedLogins = logs.logs.filter(log => !log.success);
```

---

## API Security Best Practices

### For Frontend Developers

1. **Store tokens securely**:
   - Use httpOnly cookies (recommended)
   - Never use localStorage for tokens
   - Implement CSRF protection

2. **Handle token expiration**:
   ```javascript
   if (response.code === 'TOKEN_EXPIRED') {
     // Use refresh token to get new access token
     // Or redirect to login
   }
   ```

3. **Implement timeout warning**:
   - Warn users 2 minutes before session expires
   - Offer "extend session" option

4. **Clear session on logout**:
   - Remove all tokens
   - Clear any cached PHI data

### For Backend Developers

1. **Never log PHI**:
   - Don't log request bodies with PHI
   - Sanitize error messages
   - Use audit logger for PHI access

2. **Validate all input**:
   - Check data types
   - Validate against schema
   - Sanitize to prevent injection

3. **Use prepared statements**:
   - Already handled by Firestore SDK
   - Prevents NoSQL injection

4. **Keep dependencies updated**:
   ```bash
   npm audit
   npm update
   ```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Generate and set strong `JWT_SECRET`
- [ ] Generate and set strong `ENCRYPTION_KEY`
- [ ] Enable HTTPS (`ENABLE_HTTPS_REDIRECT=true`)
- [ ] Deploy Firestore security rules
- [ ] Set up SSL/TLS certificates
- [ ] Configure proper CORS origins
- [ ] Set up log monitoring/alerting
- [ ] Enable firewall rules
- [ ] Document security procedures
- [ ] Sign BAA with Google Cloud
- [ ] Train workforce on HIPAA compliance
- [ ] Perform security audit
- [ ] Test backup/recovery procedures
- [ ] Set up intrusion detection
- [ ] Enable DDoS protection
- [ ] Configure automatic security updates

---

## Support and Resources

### HIPAA Resources
- [HHS HIPAA Portal](https://www.hhs.gov/hipaa/index.html)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [HIPAA Privacy Rule](https://www.hhs.gov/hipaa/for-professionals/privacy/index.html)

### Firebase HIPAA Resources
- [Google Cloud HIPAA Compliance](https://cloud.google.com/security/compliance/hipaa)
- [Firebase BAA Request](https://cloud.google.com/terms/hipaa)

### Security Tools
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Check for vulnerabilities
- [Snyk](https://snyk.io/) - Continuous security scanning
- [OWASP ZAP](https://www.zaproxy.org/) - Security testing

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-14 | Initial HIPAA compliance implementation | System |

---

## Contact

For security concerns or HIPAA compliance questions:
- Security Officer: [security@yourorganization.com]
- Privacy Officer: [privacy@yourorganization.com]
- Compliance Hotline: [compliance hotline number]

**IMPORTANT**: Report all suspected security incidents immediately using the contact information above.





