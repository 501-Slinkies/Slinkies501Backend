# Quick HIPAA Setup Guide

This is a quick-start guide to get your HIPAA-compliant server running.

## Prerequisites

- Node.js installed
- Firebase project with Firestore
- Service account key (`serviceAccountKey.json`)

## Step 1: Install Dependencies

```bash
cd TeamSlinkies
npm install
```

## Step 2: Generate Security Keys

Run these commands and save the output:

```bash
# Generate JWT Secret (copy this output)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate Encryption Key (copy this output)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Create .env File

Create a file named `.env` in the TeamSlinkies directory:

```env
# Paste your generated JWT_SECRET here
JWT_SECRET=<paste-your-generated-jwt-secret>

# Paste your generated ENCRYPTION_KEY here
ENCRYPTION_KEY=<paste-your-generated-encryption-key>

# Development settings
NODE_ENV=development
PORT=3000

# Session settings (15 minutes recommended for HIPAA)
SESSION_TIMEOUT_MINUTES=15
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Security settings (set to true in production)
ENABLE_HTTPS_REDIRECT=false
ENABLE_HELMET=true

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30

# Password requirements
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true

# Audit log retention
AUDIT_LOG_RETENTION_YEARS=6
```

## Step 4: Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

## Step 5: Start the Server

```bash
npm start
```

You should see:
```
==============================================
🏥 HIPAA-Compliant Server Starting
==============================================
Environment: development
Port: 3000
HTTPS Enforcement: false
Session Timeout: 15 minutes
JWT Expiration: 15m
Audit Logging: Enabled
Rate Limiting: Enabled
==============================================
Server is running on http://localhost:3000
Health check: http://localhost:3000/health
==============================================
```

## Step 6: Test the Setup

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-14T...",
  "environment": "development"
}
```

## Step 7: Test Login (if you have users)

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password",
    "role": "admin"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "role": "admin",
    "organization": "org-001"
  },
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "expiresIn": "15m"
}
```

## For Production Deployment

1. **Set production environment**:
   ```env
   NODE_ENV=production
   ENABLE_HTTPS_REDIRECT=true
   ```

2. **Enable HTTPS**: Use a reverse proxy (nginx, Apache) or cloud load balancer with SSL/TLS certificate

3. **Sign BAA with Google**: Required for HIPAA compliance
   - Go to https://cloud.google.com/terms/hipaa
   - Complete the BAA request form

4. **Security checklist**:
   - [ ] Strong, unique JWT_SECRET and ENCRYPTION_KEY
   - [ ] HTTPS enabled
   - [ ] Firestore rules deployed
   - [ ] Audit logging tested
   - [ ] Rate limiting tested
   - [ ] Session timeout tested
   - [ ] BAA signed with Google Cloud
   - [ ] Security policies documented
   - [ ] Workforce trained on HIPAA

## Troubleshooting

### Server won't start - "Missing required environment variables"

**Solution**: Make sure your `.env` file is in the TeamSlinkies directory and contains `JWT_SECRET` and `ENCRYPTION_KEY` (for production).

### "Authentication token required" error

**Solution**: Include the JWT token in the Authorization header:
```bash
curl -H "Authorization: Bearer <your-token>" http://localhost:3000/api-endpoint
```

### Rate limit errors

**Solution**: Wait for the rate limit window to expire (15 minutes by default) or adjust `RATE_LIMIT_MAX_REQUESTS` in `.env`.

### Firestore permission denied

**Solution**: 
1. Deploy the Firestore rules: `firebase deploy --only firestore:rules`
2. Make sure you're authenticated with a valid JWT token
3. Check that your user has the required permissions

## Next Steps

1. Read the full compliance guide: `HIPAA_COMPLIANCE.md`
2. Review the Firestore security rules: `firestore.rules`
3. Set up monitoring and alerting
4. Document your security procedures
5. Train your workforce on HIPAA compliance

## Support

For detailed information, see:
- **HIPAA_COMPLIANCE.md** - Complete compliance documentation
- **README.md** - Application features and API documentation
- **firestore.rules** - Database security rules

For security concerns: [security@yourorganization.com]





