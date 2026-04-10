# Smart Internship & Career Tracker

A full-stack internship management platform built with React, Node.js, Express, and MongoDB. It helps students track internship applications, interview progress, notes, reminders, and profile assets, while also demonstrating production-style authentication and authorization patterns.

## What This Project Demonstrates

- React + Vite frontend development
- Express + MongoDB backend API design
- Google OAuth2 login with Passport.js
- JWT-based authentication with access + refresh tokens
- Role-Based Access Control (RBAC) with `student`, `admin`, and `reviewer`
- HTTP-only cookie refresh-token sessions
- Swagger / OpenAPI API documentation
- Protected frontend routes and role-aware UI
- File uploads with Multer
- Analytics dashboards with Recharts
- RBAC testing with Jest, Supertest, Vitest, and React Testing Library
- Preflight validation scripts before pushing to production

## Core Features

### Authentication and Session Management

- email/password registration and login
- Google OAuth2 login with Passport.js
- short-lived access tokens for API calls
- long-lived refresh tokens stored in MongoDB
- refresh tokens sent as HTTP-only cookies
- automatic access-token refresh on `401`
- logout with refresh-token revocation

### Security Hardening

- global API rate limiting
- stricter throttling on login, register, and refresh endpoints
- brute-force login protection for repeated failed attempts
- Helmet security headers
- request validation for authentication endpoints

### Authorization

- role-based authorization using:
  - `student`
  - `admin`
  - `reviewer`
- protected backend routes using `verifyJWT` and `authorizeRoles(...)`
- protected frontend routes using role-aware route guards
- admin-only dashboard route
- reviewer-only review queue route

### Internship Tracking

- create and manage internship applications
- track role, company, applied date, status, notes, and follow-up dates
- manage interview stages and results
- store portfolio links and track whether a portfolio was viewed

### Profile and Resume Support

- editable profile with name, email, phone, and skills
- resume link support
- resume file upload support

### Analytics and Reminders

- dashboard summaries for applications
- application status breakdown
- role-type distribution
- rejection insights
- reminder and follow-up summary endpoints
- live Swagger UI for backend API exploration

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Recharts
- Vitest
- React Testing Library

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- Passport.js
- Google OAuth2 Strategy
- JWT
- bcryptjs
- cookie-parser
- Multer
- Nodemailer
- express-rate-limit
- helmet
- express-validator
- swagger-jsdoc
- swagger-ui-express
- Jest
- Supertest

## Project Structure

```text
Smart-Internship-Career-Tracker/
├── client/                  React frontend
├── server/                  Express backend
├── docs/                    validation notes and supporting docs
├── rbac-check.sh            root RBAC preflight runner
└── README.md
```

## Authentication Architecture

The app uses two-token session management:

1. The backend issues an access token with:
   - `userId`
   - `role`
   - expiry of 15 minutes
2. The backend also issues a refresh token with:
   - expiry of 7 days
   - storage in MongoDB as a hashed token record
   - delivery to the browser as an HTTP-only cookie
3. Protected API calls use the access token.
4. When the access token expires, the frontend calls `POST /api/auth/refresh`.
5. The server rotates the refresh token and returns a new access token.
6. If a revoked or reused refresh token is detected, all user refresh sessions are revoked.

This mirrors enterprise identity platforms by separating short-lived API authorization from longer-lived session continuity.

## API Security Policies

- Global throttle: `100` requests per `15` minutes per IP
- Auth throttle:
  - `POST /api/auth/login` -> `10` requests per `15` minutes per IP
  - `POST /api/auth/register` -> `10` requests per `15` minutes per IP
  - `POST /api/auth/refresh` -> `20` requests per `15` minutes per IP
- Brute-force login protection:
  - after `10` failed login attempts from the same IP
  - block that IP for `15` minutes
- Validation:
  - register requires `name`, `email`, and `password`
  - login requires `email` and `password`

## RBAC Model

### Student

- manage personal applications
- update profile
- upload resume

### Admin

- access admin dashboard
- view platform-level metrics

### Reviewer

- access reviewer queue
- inspect applications assigned for review

## Important API Routes

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/me`

### RBAC Example Routes

- `GET /api/admin/dashboard` -> admin only
- `GET /api/applications` -> student only
- `GET /api/review` -> reviewer only

### Other App Routes

- `GET /api/profile`
- `PUT /api/profile`
- `POST /api/applications`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`
- `GET /api/analytics`
- `GET /api/reminders`
- `POST /api/reminders/send`

### API Documentation

- `GET /api/docs` -> Swagger UI for auth, RBAC, profile, analytics, and reminder endpoints

## Environment Variables

### Frontend

Create `client/.env`:

```bash
VITE_API_URL=http://localhost:5001/api
```

### Backend

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
ASGARDEO_CLIENT_ID=replace-with-asgardeo-client-id
ASGARDEO_CLIENT_SECRET=replace-with-asgardeo-client-secret
ASGARDEO_BASE_URL=https://api.asgardeo.io/t/{your-tenant-name}
ASGARDEO_TENANT=your-tenant-name
ASGARDEO_CALLBACK_URL=http://localhost:5001/api/auth/asgardeo/callback
```

## Docker & Choreo

This project is containerized for easy local development and automated deployment via **Choreo**.

### Local Development with Docker
Run the entire stack (Frontend, Backend, MongoDB) using Docker Compose:

```bash
docker-compose up --build
```
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **MongoDB**: http://localhost:27017

### Choreo Deployment
The repository includes `.choreo/` configuration for seamless deployment:

1. **Connect Repository**: Connect this GitHub repository to your Choreo Project.
2. **Component Configuration**: Choreo automatically detects `.choreo/component.yaml` to configure the NodeJS build and start commands.
3. **API Exposure**: The `.choreo/endpoints.yaml` file exposes the backend service as a Public REST API.
4. **API Integration**: The Choreo endpoint links directly to `apim/openapi.yaml`, ensuring that the deployed API matches the WSO2 APIM standard defined in the project.

## Local Setup

### 1. Install dependencies

```bash
npm install --prefix client
npm install --prefix server
```

### 2. Start MongoDB

Make sure MongoDB is running locally.

### 3. Start the backend

```bash
npm run dev:server
```

### 4. Start the frontend

```bash
npm run dev:client
```

### 5. Open the app

- frontend: `http://localhost:5173`
- backend health route: `http://localhost:5001/api/health`
- Swagger UI: `http://localhost:5001/api/docs`

## Testing and RBAC Validation

### Backend tests

```bash
npm run test --prefix server
```

### Frontend tests

```bash
npm run test --prefix client
```

### Seed RBAC test users

```bash
npm run seed-test-users --prefix server
```

This creates:

- `student@test.com`
- `admin@test.com`
- `reviewer@test.com`

### RBAC preflight

Server:

```bash
npm run rbac-preflight --prefix server
```

Client:

```bash
npm run rbac-preflight --prefix client
```

Root runner:

```bash
./rbac-check.sh
```

Optional auto-push after all checks pass:

```bash
./rbac-check.sh --auto-push
```

## Current Frontend Pages

- `AuthPage` for login, signup, and Google sign-in
- `GoogleAuthCallbackPage` for OAuth completion
- `DashboardPage` for student application tracking
- `ProfilePage` for profile and resume updates
- `AdminDashboardPage` for admin-only metrics
- `ReviewQueuePage` for reviewer-only access

## Why This Architecture Matters

This project now goes beyond basic CRUD. It demonstrates:

- authentication
- authorization
- role-based route protection
- secure session management
- refresh-token rotation
- defensive token revocation
- API contract documentation with OpenAPI
- backend and frontend access-control testing

That makes it much closer to how real internal tools and enterprise identity-aware apps are built.

## Deployment Notes

### Frontend

- build command: `npm run build`
- output directory: `dist`
- set `VITE_API_URL` to the deployed backend API

### Backend

- build command: `npm install`
- start command: `npm run start`
- configure all backend auth environment variables
- enable secure cookies in production using HTTPS

## Future Improvements

- add Redis-backed token/session introspection
- add audit logs for role changes and refresh-token reuse events
- add email verification and password reset flow
- add Swagger/OpenAPI documentation
- add refresh-token tests that exercise real cookie handling end to end
