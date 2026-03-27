# Smart Internship & Career Tracker Backend

Node.js + Express + MongoDB backend for the Smart Internship & Career Tracker project.

## Current Capabilities

- local email/password authentication
- Google OAuth2 login with Passport.js
- JWT access tokens
- refresh-token sessions with HTTP-only cookies
- Role-Based Access Control with:
  - `student`
  - `admin`
  - `reviewer`
- profile updates and resume upload support
- internship application CRUD APIs
- admin dashboard route
- reviewer queue route
- analytics and reminders
- Swagger / OpenAPI documentation
- RBAC test suite with Jest and Supertest

## Authentication Flow

The backend uses:

- access token:
  - contains `userId` and `role`
  - expires in 15 minutes
- refresh token:
  - expires in 7 days
  - stored hashed in MongoDB
  - sent to the browser as an HTTP-only cookie

Refresh tokens are rotated on every refresh. If an old token is reused, all refresh tokens for that user are revoked.

## Environment

Create `server/.env`:

```bash
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/career-tracker
JWT_SECRET=replace-with-a-long-random-secret
ACCESS_TOKEN_SECRET=replace-with-a-long-random-access-secret
REFRESH_TOKEN_SECRET=replace-with-a-long-random-refresh-secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REFRESH_TOKEN_COOKIE_NAME=careerTrackerRefreshToken
CLIENT_URL=http://localhost:5173
EMAIL_FROM=no-reply@careertracker.dev
GOOGLE_CLIENT_ID=replace-with-google-client-id
GOOGLE_CLIENT_SECRET=replace-with-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

## Run Locally

```bash
npm install
npm run dev
```

Swagger UI will be available at:

```bash
http://localhost:5001/api/docs
```

## Useful Scripts

```bash
npm run seed-test-users
npm run make-admin -- admin@example.com
npm test
npm run rbac-preflight
```

## Key Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/me`
- `GET /api/docs`

### RBAC Example Routes

- `GET /api/admin/dashboard`
- `GET /api/applications`
- `GET /api/review`

### Other Routes

- `GET /api/profile`
- `PUT /api/profile`
- `POST /api/applications`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`
- `GET /api/analytics`
- `GET /api/reminders`
- `POST /api/reminders/send`

Swagger currently documents auth, RBAC, profile, analytics, and reminder routes through `GET /api/docs`.
