# Smart Internship & Career Tracker

A full-stack web application that helps students manage internship applications, interview stages, company feedback, portfolio links, reminders, and profile assets in one place.

This project is designed as a strong portfolio piece for software engineering internships because it demonstrates:

- frontend development with React
- backend API development with Node.js and Express
- authentication with JWT and bcrypt
- database design with MongoDB
- file upload handling
- analytics dashboards and charts
- deployment with Vercel and Render

## Overview

Job hunting can get messy very quickly. Students often track applications in spreadsheets, interview schedules in calendars, notes in documents, and portfolio links in separate places. This project centralizes that workflow into one dashboard where users can:

- create an account and log in securely
- manage their profile and resume
- add internship applications
- record interview stages and outcomes
- save notes and feedback for each company
- track whether a company viewed their portfolio
- view analytics on application progress
- generate reminder summaries for upcoming follow-ups

## Features

### User Management

- user registration and login
- JWT-based protected routes
- password hashing with bcrypt
- editable profile with name, email, phone, skills, and resume support

### Application Tracking

- add company name, role, applied date, and role type
- track statuses such as Pending, Interviewed, Accepted, Rejected, and Offer
- manage interview stages like First Round, Technical Round, PM Round, and HR Round
- store company-specific notes, feedback, rejection reasons, and follow-up dates

### Portfolio and Resume Tracking

- store portfolio links for each application
- mark whether the portfolio was viewed
- upload a resume file or save a resume link from the profile page

### Analytics and Insights

- application counts by status
- success rate tracking
- role-type breakdown
- rejection reason visualization

### Notifications and Reminders

- reminder digest endpoint for upcoming follow-ups and interviews
- simulated email sending using Nodemailer JSON transport

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Recharts

### Backend

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT
- bcryptjs
- Multer
- Nodemailer

## Project Structure

```text
Smart-Internship-Career-Tracker/
├── client/   React + Vite frontend
├── server/   Express + MongoDB backend
└── README.md
```

## Frontend Highlights

The frontend lives inside `client/` and provides the user-facing application experience.

- `AuthPage` handles login and signup
- `DashboardPage` displays statistics, filters, charts, reminders, and application data
- `ProfilePage` manages personal details, skills, and resume data
- reusable components support forms, badges, tables, and dashboard cards

## Backend Highlights

The backend lives inside `server/` and provides the REST API for the app.

- authentication endpoints for register, login, and current user
- protected profile route with resume upload support
- application CRUD endpoints
- analytics endpoint for dashboard summaries
- reminder endpoints for weekly or upcoming action summaries

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
CLIENT_URL=http://localhost:5173
EMAIL_FROM=no-reply@careertracker.dev
```

## Local Setup

### 1. Install dependencies

```bash
npm install --prefix client
npm install --prefix server
```

### 2. Start MongoDB

Make sure MongoDB is running locally before starting the backend.

### 3. Start the backend

```bash
npm run dev:server
```

### 4. Start the frontend

In a second terminal:

```bash
npm run dev:client
```

### 5. Open the app

- Frontend: `http://localhost:5173`
- Backend health route: `http://localhost:5001/api/health`

## API Routes

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Profile

- `GET /api/profile`
- `PUT /api/profile`

### Applications

- `GET /api/applications`
- `POST /api/applications`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`

### Analytics

- `GET /api/analytics`

### Reminders

- `GET /api/reminders`
- `POST /api/reminders/send`

## Deployment

### Frontend on Vercel

- import the GitHub repo into Vercel
- set the root directory to `client`
- build command: `npm run build`
- output directory: `dist`
- add `VITE_API_URL` with your deployed backend API URL

### Backend on Render

- create a new Web Service from the same GitHub repo
- set the root directory to `server`
- build command: `npm install`
- start command: `npm run start`
- add environment variables for `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, and `EMAIL_FROM`

## Why This Project Is Strong for a Portfolio

This project is more than a basic CRUD app. It shows the ability to design and build a complete product with:

- a responsive frontend
- protected authentication flows
- real backend business logic
- structured database models
- file handling
- chart-based analytics
- deployment-ready configuration

It is easy to explain in interviews because it solves a real student problem while also showing full-stack engineering skills.

## Future Improvements

- add form validation with `zod` or `yup`
- add test coverage for frontend and backend
- add real email delivery instead of simulated transport
- add company enrichment APIs
- add admin reporting or recruiter-facing insights
- add screenshot previews and a live demo link
