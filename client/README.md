# Smart Internship & Career Tracker Frontend

React + Vite frontend for the Smart Internship & Career Tracker project.

## Features

- Login and signup flow
- Internship dashboard with filters and status overview
- Application create and edit form
- Analytics charts for roles and rejection reasons
- Profile management with resume link and upload support

## Environment

Create a `.env` file:

```bash
VITE_API_URL=http://localhost:5001/api
```

## Run locally

```bash
npm install
npm run dev
```

## Backend dependency

This app expects the backend API to be running at the URL defined by `VITE_API_URL`.

For Choreo or any other production deployment, set `VITE_API_URL` to your deployed backend origin plus `/api`, for example:

```bash
VITE_API_URL=https://your-server.choreoapps.dev/api
```

The production build no longer falls back to `localhost`, so a missing `VITE_API_URL` now shows a clear deployment error instead of sending button clicks to the wrong host.
