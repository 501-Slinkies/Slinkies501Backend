# Security Policy

## Supported Versions

Security updates are provided for the current major version. Please keep your dependencies up to date.

## Reporting a Vulnerability

**⚠️ IMPORTANT**: If you discover a security vulnerability, please **DO NOT** open a public issue.

Instead, please report it via one of the following methods:

1. **Email**: [Your Security Email] (please set up a security@yourdomain.com email)
2. **Private Security Advisory**: Create a private security advisory on GitHub
3. **Direct Contact**: Contact the repository maintainers directly

We will acknowledge receipt of your vulnerability report within 48 hours and provide a detailed response within 7 days indicating the next steps in handling your report.

## Security Best Practices

### For Contributors

1. **Never commit secrets**:
   - API keys
   - Passwords
   - Service account keys (`.json` files)
   - `.env` files
   - Private keys or certificates

2. **Use environment variables** for all sensitive configuration:
   ```bash
   # Good
   const apiKey = process.env.API_KEY;
   
   # Bad
   ```

3. **Review your commits** before pushing:
   ```bash
   git log -p  # Review changes
   git diff    # Review staged changes
   ```

4. **Use `.gitignore`** for sensitive files:
   ```
   .env
   .env.*
   *.env
   serviceAccountKey.json
   serviceAccountKey*.json
   *.pem
   *.key
   ```

### For Deployment

1. **Use secret management services**:
   - AWS Secrets Manager
   - Google Secret Manager
   - Azure Key Vault
   - HashiCorp Vault

2. **Rotate credentials regularly**:
   - Service account keys: Every 90 days
   - API keys: Every 90-180 days
   - Passwords: As per your organization's policy

3. **Use environment-specific configurations**:
   - Development: Use mock/test credentials
   - Staging: Use test credentials with limited permissions
   - Production: Use production credentials with minimal required permissions

4. **Enable audit logging** (already implemented):
   - All user actions are logged to `audit_logs` collection
   - Logs are retained for 6 years (HIPAA compliance)

5. **Use HTTPS in production**:
   - Set `ENABLE_HTTPS_REDIRECT=true` in production
   - Use valid SSL/TLS certificates

### Code Security

1. **Input validation**: All user inputs are validated before processing
2. **SQL injection prevention**: Using parameterized queries (Firestore handles this)
3. **XSS prevention**: Content Security Policy headers via Helmet.js
4. **Password hashing**: SHA-256 with salt (ENCRYPTION_KEY)
5. **JWT tokens**: Short-lived tokens (15 minutes) with refresh tokens (7 days)

## Known Security Considerations

### Current Architecture

- **Firebase Admin SDK**: Server-side operations bypass Firestore security rules
- **Firestore Rules**: Currently allow open access (`if true`) - these apply to client SDK access
- **Authentication**: JWT-based authentication using Express middleware
- **Authorization**: Role-based permission system

### Security Rules Status

**⚠️ IMPORTANT**: The Firestore security rules in `firestore.rules` currently allow open access. This is acceptable because:
- Server-side operations use Admin SDK (bypasses rules)
- Client SDK access is restricted by the JWT middleware in the Express API

However, if you use the client SDK directly (e.g., from a mobile app), you should implement proper Firestore rules based on authentication.

## Incident Response

If a security vulnerability is discovered in production:

1. **Immediate Response**:
   - Rotate all potentially exposed credentials
   - Revoke compromised API keys
   - Review audit logs for unauthorized access

2. **Investigation**:
   - Review git history for accidentally committed secrets
   - Check access logs
   - Review audit_logs collection

3. **Notification**:
   - Notify affected users if PHI/PII is compromised (HIPAA requirement)
   - Report to appropriate authorities if required

4. **Prevention**:
   - Update security practices
   - Add additional safeguards
   - Review and update this security policy

## HIPAA Compliance

This application handles Protected Health Information (PHI). Security measures include:

- **Access Controls**: Role-based access control (RBAC)
- **Audit Logging**: All PHI access is logged
- **Encryption**: Passwords are hashed, JWT tokens are signed
- **Session Management**: Auto-logoff after 15 minutes of inactivity
- **Data Integrity**: Input validation and data verification

See `docs/HIPAA_COMPLIANCE.md` for detailed compliance information.

## Security Checklist Before Making Repository Public

Before making this repository public on GitHub:

- [ ] Remove all secrets from git history (use `REMOVE_COMMITTED_SECRETS.md` guide)
- [ ] Rotate all credentials that were ever committed
- [ ] Verify `.gitignore` includes all sensitive files
- [ ] Remove or sanitize any PHI/PII from test data files
- [ ] Review `firestore.rules` and update if client SDK is used
- [ ] Remove hardcoded test credentials from code
- [ ] Review CORS configuration for exposed internal domains
- [ ] Ensure no service account keys or `.env` files are tracked
- [ ] Add pre-commit hooks to prevent future secret commits
- [ ] Review all documentation for exposed secrets or credentials

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [HIPAA Compliance Guide](./docs/HIPAA_COMPLIANCE.md)
- [Removing Committed Secrets](./REMOVE_COMMITTED_SECRETS.md)

