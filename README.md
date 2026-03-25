# Smart Internship & Career Tracker

A full-stack starter project for tracking internship applications, interview stages, company feedback, portfolio links, reminders, and profile assets.

## What is included

- React frontend with login, signup, dashboard, profile page, analytics charts, filters, and application forms
- Express + MongoDB backend with JWT auth, password hashing, protected routes, analytics, reminder digest endpoints, and profile updates
- Resume upload support through `multer`
- Simulated reminder emails through `nodemailer` JSON transport

## Project structure

```text
client/   React + Vite frontend
server/   Express + MongoDB API
```

## Quick start

1. Copy `server/.env.example` to `server/.env`
2. Copy `client/.env.example` to `client/.env`
3. Install dependencies:

```bash
npm install --prefix server
npm install --prefix client
```

4. Start the backend:

```bash
npm run dev:server
```

5. Start the frontend in another terminal:

```bash
npm run dev:client
```

## Main API routes

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

## Suggested next steps

- Add form validation with a schema library like `zod` or `yup`
- Add automated tests for auth, applications, and analytics
- Deploy the frontend to Vercel and the backend to Render
- Swap simulated reminder emails for real SMTP credentials
- Add admin analytics or company enrichment APIs if you want extra polish
