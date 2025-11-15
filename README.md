# Slinkies501Backend

Backend API for the Slinkies volunteer transportation platform. The service is built with Node.js/Express and Firebase Admin, and provides authentication, scheduling, driver matching, notifications, and HIPAA-focused auditing.

## Highlights
- Authentication and session management with JWT.
- User, volunteer, and client CRUD with role-based authorization checks.
- Ride scheduling, driver matching, and calendar queries backed by Firestore.
- Volunteer availability ingestion (including bulk strings) and conflict validation.
- Email notifications through SendGrid with optional SMS stubs for future Twilio support.
- Audit logging, rate limiting, security headers, and session timeout helpers geared toward HIPAA requirements.
- Firestore emulator support plus CSV import utilities for legacy data.

For a deeper walk-through of endpoints and example payloads, see `POSTMAN_TESTS.md` and the docs in `./docs`.

## Prerequisites
- Node.js 18+
- npm 9+
- Firebase project (or Firestore emulator) and a service account key
- SendGrid API credentials for email delivery

## Getting Started
1. Clone the repository and install dependencies.
   ```bash
   git clone <repository-url>
   cd Slinkies501Backend
   npm install
   ```

2. Create a `.env` file in `Slinkies501Backend/` and populate it with the values your deployment needs:
   ```env
   # Auth
   JWT_SECRET=change-me
   SESSION_TIMEOUT_MINUTES=15
   JWT_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d

   # Password hashing salt
   ENCRYPTION_KEY=change-me

   # Security controls
   ENABLE_HTTPS_REDIRECT=false
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   MAX_LOGIN_ATTEMPTS=5

   # SendGrid
   SENDGRID_API_KEY=your-sendgrid-api-key
   SENDGRID_FROM_EMAIL=notifications@example.com

   # Environment
   NODE_ENV=development
   PORT=3000
   ```
   Optional values:
- `FIRESTORE_EMULATOR_HOST` if you want to use the local emulator instead of production Firestore.
- `ENABLE_RATE_LIMITING` or other flags referenced in `middleware/securityMiddleware.js`.
- Twilio credentials if you intend to replace the mocked SMS branch in `services/notifications.js`.

3. Place your Firebase Admin `serviceAccountKey.json` in the project root. When running against the emulator, exporting `FIRESTORE_EMULATOR_HOST=localhost:8080` is sufficient and no key file is loaded.

4. Start the API.
   ```bash
   npm start
   ```
   The server listens on `http://localhost:3000` by default. Use `npm run emulator` to launch the Firebase emulator suite, and `npm run migrate:dev` to seed sample data from CSVs while the emulator is running.

## Core Endpoints
- `POST /api/login` – authenticate a user and receive a JWT.
- `POST /api/users`, `PUT /api/users/:userID`, `DELETE /api/users/:userID` – manage user accounts (audited).
- `POST /api/roles` and `GET /api/roles/:roleName/parent` – manage role definitions and hierarchy.
- `GET /api/volunteers/:volunteerId/unavailability` – fetch normalized recurring and single unavailability entries.
- `POST /api/volunteers/:volunteerId/unavailability` – register unavailability blocks.
- `GET /api/rides/...` – ride creation, retrieval, matching, and calendar aggregation routines.
- `GET /api/organizations/:orgId/volunteers/:volunteerId/unassigned-rides` – get unassigned rides for a volunteer within an organization.
- `GET /api/calendar` – fetch rides in a date window.
- `GET /api/maps/verify`, `GET /api/maps/route` – address verification and routing (OpenStreetMap).
- `GET /api/clients/:clientId/donations` – client donation history (Firestore query example).
- `POST /api/notify` – email notification helper (SMS currently logs a mock message).
- `POST /api/notify-org` – notify all drivers in an organization about available unassigned rides.

Many more endpoints are defined in `routes/` and documented in `POSTMAN_TESTS.md`.

## Security Notes
- `middleware/securityMiddleware.js` contains Helmet configuration, rate limiting, HTTPS enforcement, request metadata helpers, and audit logging hooks.
- Audit events are written to the `audit_logs` collection with a calculated retention horizon (six years).
- Passwords are salted and hashed with SHA-256 in `utils/encryption.js`. Ensure `ENCRYPTION_KEY` is strong and rotated on credential changes.
- Session expiry and auto logoff are based on the `SESSION_TIMEOUT_MINUTES` setting plus the issued-at (`iat`) claim embedded in JWTs.

For additional compliance guidance review `HIPAA_COMPLIANCE.md` and `SETUP_HIPAA.md`.

## Data & Migration Utilities
- `csvMigration.js` and the `npm run migrate:dev` script load CSV fixtures (see `fake*.csv` files).
- `DataAccessLayer.js` encapsulates Firestore CRUD and multi-step operations (roles, permissions, organizations, rides, etc.).
- Long-form availability format FAQs live in `example_driver_availability_strings.md`.

## Testing and Tooling
- `npm test` runs `test.js` (extend this file with assertions as the API grows).
- `POSTMAN_TESTS.md` contains ready-to-run collections and environment templates.
- Use `nodemon` during development by running `npx nodemon server.js` if you prefer auto reloads.

## Project Structure
```
Slinkies501Backend/
├── server.js                # Express bootstrap and route wiring
├── ApplicationLayer.js      # Business logic and orchestration
├── DataAccessLayer.js       # Firestore queries and persistence helpers
├── routes/                  # Express routers (rides, clients, volunteers, reports, etc.)
├── middleware/              # Auth, security, and audit utilities
├── services/                # Notifications and third-party integrations
├── integrations/            # Maps/address helpers
├── utils/                   # Encryption and shared helpers
├── docs/                    # Supplementary API docs and guides
├── POSTMAN_TESTS.md         # Postman collection and usage notes
└── README.md
```

## Maintenance Guidelines
- Keep endpoint changes mirrored in `POSTMAN_TESTS.md` and the docs under `./docs`.
- Run the linter/test suite before committing (`npm test`, plus any project-specific checks).
- Maintain HIPAA auditing hooks when touching PHI-related code paths.
- Open pull requests with context on data model impacts and required environment changes.

## Support
- Team procedures, role-based workflows, and compliance checklists are in `SETUP_HIPAA.md`.
- For general questions, start with project maintainers or open an issue in the repository tracker.
