# Smart Internship & Career Tracker Backend

Node.js + Express + MongoDB backend for the Smart Internship & Career Tracker project.

## Features

- JWT authentication
- Password hashing with bcrypt
- Profile update endpoint with resume upload support
- Internship application CRUD APIs
- Analytics endpoint for status and role breakdowns
- Simulated email reminder digest with nodemailer JSON transport

## Environment

Create a `.env` file:

```bash
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/career-tracker
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
EMAIL_FROM=no-reply@careertracker.dev
```

## Run locally

```bash
npm install
npm run dev
```

## Key routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/applications`
- `POST /api/applications`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`
- `GET /api/analytics`
- `GET /api/reminders`
- `POST /api/reminders/send`
