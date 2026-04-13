# Smart Internship & Career Tracker

A production-grade full-stack internship management platform built with React, Node.js, Express, and MongoDB. This project demonstrates advanced patterns in modern web development, including multi-provider authentication (Google OAuth2 + Asgardeo OIDC), enterprise API governance with WSO2 API Manager, and cloud-native deployment via Docker and WSO2 Choreo.

## What This Project Demonstrates

- **Modern Frontend**: React + Vite with role-aware UIs, analytics dashboards, and Kanban-style pipeline tracking.
- **Robust Backend**: Node.js/Express API with MongoDB and Mongoose.
- **Enterprise Identity**: Multi-provider auth using Google OAuth2 and **WSO2 Asgardeo (OIDC)**.
- **API Governance**: Complete **WSO2 API Manager** integration with OpenAPI 3.0 specs and throttling policies.
- **Cloud Native**: Containerization with **Docker** and automated deployment via **WSO2 Choreo**.
- **Security & RBAC**: Granular Role-Based Access Control (`student`, `admin`, `reviewer`).
- **DevOps**: RBAC preflight validation scripts and comprehensive testing with Jest/Vitest.

## Core Features

### Authentication and Identity
- **Local Auth**: Email/password registration and login with bcrypt hashing.
- **Google OAuth2**: Social login integrated via Passport.js.
- **Asgardeo OIDC**: Enterprise-grade identity management with OpenID Connect discovery via `openid-client`.
- **Identity Model**: User profiles support multi-identity mapping (e.g., `googleId`, `asgardeoId`).
- **Session Management**: Enterprise-grade session awareness featuring silent token refreshes, proactive 2-minute expiry warnings, and secure lock-out screens using the `@asgardeo/auth-react` SDK.

### Security and Governance
- **API Management**: Managed via WSO2 API Manager with dedicated throttling tiers.
- **Rate-Limiting & Feedback**: Multi-layered backend protection mapped to a smart front-end interceptor that handles APIM 429 errors using exponential backoff, accompanied by visual countdown banners and context-aware APIM quota indicators.
- **Hardening**: Helmet security headers and comprehensive request validation.

### Internship Management
- Full CRUD for internship applications seamlessly integrated with optimistic UI updates for instant feedback and fail-safe API rollbacks.
- **Kanban Board**: Interactive drag-and-drop board (via `@hello-pangea/dnd`) for tracking application pipelines visually, available alongside the classic data table.
- Tracking of portfolio views and interview stages.
- Profile management with resume upload support via Multer.
- Analytics dashboard and automated reminder summaries.

## Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Routing**: React Router
- **State/API**: Axios, Recharts
- **Testing**: Vitest, React Testing Library

### Backend
- **Runtime**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Identity**: Passport.js, **openid-client**, **WSO2 Asgardeo**
- **Security**: JWT, bcryptjs, express-rate-limit, helmet

### Deployment & Governance
- **Containerization**: Docker, Docker Compose
- **Cloud Platform**: WSO2 Choreo
- **API Portal**: WSO2 API Manager (APIM)

## Project Structure

```text
Smart-Internship-Career-Tracker/
├── .choreo/                 Choreo deployment configurations
├── apim/                    WSO2 API Manager artifacts (OpenAPI, Policies)
├── client/                  React frontend
│   ├── Dockerfile           Frontend container definition
│   └── ...
├── server/                  Express backend
│   ├── Dockerfile           Backend container definition
│   └── ...
├── docs/                    Architecture and validation notes
├── docker-compose.yml       Local orchestration
├── rbac-check.sh            RBAC preflight runner
└── README.md
```

## Important API Routes

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET  /api/auth/google` & `/google/callback`
- `GET  /api/auth/asgardeo` & `/asgardeo/callback` (OIDC)
- `GET  /api/auth/me`

### Application & RBAC
- `GET  /api/admin/dashboard` (Admin Only)
- `GET  /api/review` (Reviewer Only)
- `GET  /api/applications` (Student Only)
- `GET  /api/profile` & `PUT /api/profile`
- `GET  /api/analytics`

## WSO2 Integration

### API Manager (APIM)
The `apim/` directory contains everything needed for enterprise governance:
- **`openapi.yaml`**: Full OpenAPI 3.0.3 specification.
- **`api-config.yaml`**: Configuration for the WSO2 Publisher portal.
- **`throttling-policy.yaml`**: Mappings for Global, Auth, and Refresh rate limits.

### Asgardeo Setup
1. Configure an OIDC application in your Asgardeo tenant.
2. Set the redirect URI to `http://localhost:5001/api/auth/asgardeo/callback`.
3. Map groups (`admin`, `reviewer`) in Asgardeo to system roles.

### Choreo & Docker
- **Docker Compose**: Run `docker-compose up --build` to start the full stack locally.
- **Choreo**: Connect this GitHub repo to Choreo to automate the build and deployment of the backend service following the `.choreo/` configurations.

## Testing and Development
- **Backend Tests**: `npm run test --prefix server`
- **Frontend Tests**: `npm run test --prefix client`
- **RBAC Preflight**: `./rbac-check.sh`
