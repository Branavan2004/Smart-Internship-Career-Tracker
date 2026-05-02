# Smart Internship & Career Tracker

> A production full-stack internship management platform built on the **WSO2 enterprise stack**.

🚀 **Live Deployment:** [Smart Internship Tracker on WSO2 Choreo](https://33cc0d8e-a16a-40d7-a552-06910eed4a61.e1-us-east-azure.choreoapps.dev/)

[![Architecture](https://img.shields.io/badge/docs-architecture-blue)](./docs/architecture.md)
[![OpenAPI](https://img.shields.io/badge/API-OpenAPI%203.0-green)](./apim/openapi.yaml)
[![Choreo](https://img.shields.io/badge/deploy-WSO2%20Choreo-orange)](./choreo/component.yaml)
[![Ballerina](https://img.shields.io/badge/service-Ballerina%202201.13.3-blueviolet)](./ballerina-workflow/main.bal)

---

## WSO2 Integration

| WSO2 Product | How it's used |
|---|---|
| **Asgardeo** | OIDC-based identity management with **Group-Based RBAC**, silent token refresh, 2-minute expiry warnings, and secure lock-out screens |
| **API Manager** | Full API governance with OpenAPI 3.0 specs, role-based throttling tiers, and smart 429 error handling with exponential backoff |
| **Choreo** | Cloud-native deployment with Docker containerisation and automated GitHub Actions CI/CD |
| **Ballerina** | Automation & Integration layer — including **Weekly Digest** (`ballerina-digest/`) and **Interview Workflow** (`ballerina-workflow/`) services |

## Ballerina Microservices
The project leverages **Ballerina Swan Lake 2201.13.3** for specialized integration tasks:

- **[`ballerina-digest/`](./ballerina-digest/)**: Scheduled Weekly Digest
  - Polled from Node.js analytics every Monday at 08:00
  - Formats application stats into a plain-text email summary
  - Delivered via Gmail SMTP with `START_TLS_AUTO` security

- **[`ballerina-workflow/`](./ballerina-workflow/)**: Event-Driven Interview Checklist
  - Triggered by a Node.js webhook when an application status changes to **"Interviewed"**
  - Sends a personalized 8-step interview preparation guide to the student
  - Demonstrates high-performance JSON processing and resilient "fire-and-forget" integration patterns




## Engineering Highlights

This is not a CRUD app with a WSO2 logo on it. Here is what makes it architecturally significant:

### ⚡ Event-Driven Architecture
Every application mutation (create, update, delete) publishes a **domain event** to an in-process `EventBus` with exponential-backoff retry logic and a dead-letter queue. Handlers (`notificationHandler`, `analyticsHandler`) run asynchronously — HTTP response is returned before handlers complete. Maps directly onto Kafka/RabbitMQ in production with zero interface changes.

### 🏢 Multi-Tenancy
Logical tenant isolation at the database level. Every `User` and `Application` document carries a `tenantId` index. The `tenantContext` middleware extracts and propagates tenant identity throughout the request lifecycle. WSO2-style quota headers (`X-Quota-Tier`, `X-Quota-Used`, `X-Quota-Remaining`) are injected into every API response.

### 💰 API Monetisation Simulation
Three tiers — **Free** (100 writes/day), **Premium** (10,000/day), **Enterprise** (unlimited). Write operations atomically increment a per-user daily counter. Quota breaches return HTTP 429 responses that match WSO2 API Manager's throttle response schema exactly, including `Retry-After` headers and upgrade prompts.

### 🔭 Real Observability
- **Correlation IDs**: Every request gets an `X-Request-ID` (UUID) propagated through the full call chain
- **Per-route metrics**: Request count, average latency, error rate — all queryable via `/api/metrics`
- **Domain event log**: The last 200 events with payload, accessible via `/api/metrics/events`
- **Security log**: Failed auth attempts and quota breaches, visible in the Admin console

### 🔐 Enterprise Grade Security & Identity (Asgardeo)
- **Federated Identity**: Authentication is fully offloaded to **WSO2 Asgardeo**.
- **Group-Based RBAC**: User roles (`admin`, `reviewer`, `student`) are mapped dynamically from **Asgardeo OIDC Groups**. 
- **Dynamic UI Customisation**: The frontend uses a custom `useAsgardeoGroups` hook to render specialized views (`AdminDashboardPage`, `ReviewQueuePage`) based on group memberships retrieved via `/api/auth/my-groups`.
- **JWKS Verification**: The Node.js backend cryptographically verifies Asgardeo tokens using WSO2's public keys via the `jwks-rsa` caching client.
- **Auto-Provisioning**: Users who log in via SSO are automatically provisioned in the MongoDB `User` collection.
- Beyond OIDC: Includes brute-force protection (rate-limit buckets for failed logins), `logUnauthorizedAttempt()` for security audits, and Helmet headers.

### ☁️ Ballerina Microservices
Two Ballerina services run alongside the Node.js backend:

**`analytics-service`** — JWT-secured analytics query layer:
- JWT validation against Asgardeo's JWKS endpoint
- Typed MongoDB stream queries
- Ballerina `match` expressions for exhaustive status aggregation
- Choreo-native observability (`observabilityIncluded = true`)

**`ballerina-digest`** — Scheduled email integration service:
- Interval-scheduled job via `ballerina/task`
- HTTP client call to the Node.js analytics endpoint
- SMTP email delivery via `ballerina/email` with `START_TLS_AUTO`
- Manual trigger endpoint (`POST /triggerDigest`) for testing

**`ballerina-workflow`** — Event-driven preparation checklist:
- Webhook-triggered instantly upon status change to "Interviewed"
- Personalized interview checklists (8 steps to success)
- Demonstrates resilient fire-and-forget integration with Node.js
- Zero third-party library requirements (enterprise-ready standard library)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Identity | **WSO2 Asgardeo** (OIDC + JWKS) |
| API Gateway | WSO2 API Manager (throttling, monetisation, OpenAPI) |
| Deployment | **WSO2 Choreo** (Cloud deployment on Azure, Auto-builds) |
| Analytics Service | **Ballerina** 2201.13.3 (`analytics-service`) |
| Workflow & Digest | **Ballerina** 2201.13.3 (`ballerina-workflow`, `ballerina-digest`) |
| Backend | Node.js / Express (monolith + microservice stubs) |
| Frontend | React 18 + Vite (role-based dashboards, Kanban, Recharts) |
| Database | MongoDB Atlas |
| Containerisation | Docker + Docker Compose |

---

## Architecture

See [docs/architecture.md](./docs/architecture.md) for the full system diagram, event flow, multi-tenancy model, and security architecture.

**High-level flow:**

```
User → Asgardeo (OIDC) → React SPA
                            ↓
                     Choreo Gateway (APIM throttling)
                            ↓
               ┌────────────────────────────┐
               │   Node.js Backend           │
               │   tenantContext             │
               │   quotaMiddleware           │
               │   requestMetrics (X-Req-ID) │
               └──────────┬─────────────────┘
                           │
                     EventBus.publish()
                    /                \
         NotificationHandler    AnalyticsHandler
         (email simulation)     (metricsStore)
```

---

## Project Structure

```
Smart-Internship-Career-Tracker/
├── .choreo/
│   └── component.yaml          Multi-component Choreo deployment (Node + Ballerina + SPA)
├── analytics-service/
│   ├── analytics_service.bal   Ballerina analytics service (Asgardeo JWT + MongoDB)
│   └── Ballerina.toml          Package definition for Choreo
├── ballerina-digest/
│   ├── main.bal                Weekly digest scheduler (cron + HTTP client + SMTP)
│   ├── Ballerina.toml          Package definition for Choreo
│   ├── Config.toml.example     Placeholder config (safe to commit)
│   └── README.md               Service-specific documentation
├── apim/
│   ├── openapi.yaml            OpenAPI 3.0.3 with x-wso2-throttling-tier extensions
│   └── policies/
│       └── monetization-tiers.yaml  Free / Premium / Enterprise tier definitions
├── client/                     React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── EventFeed.jsx       Live domain event stream (Admin)
│       │   ├── QuotaIndicator.jsx  Animated tier + quota widget
│       │   ├── KanbanBoard.jsx     Drag-and-drop application pipeline
│       │   ├── RateLimitBanner.jsx APIM 429 countdown + retry
│       │   └── SessionManager.jsx  Silent token refresh + expiry warnings
│       └── pages/
│           ├── AdminDashboardPage.jsx   Observability console (metrics, events, security)
│           ├── DashboardPage.jsx        Student application tracker + analytics
│           └── ReviewQueuePage.jsx      Reviewer pipeline
├── server/                     Node.js backend
│   └── src/
│       ├── events/
│       │   ├── EventBus.js             Domain event bus (retry + dead-letter)
│       │   └── handlers/
│       │       ├── notificationHandler.js
│       │       └── analyticsHandler.js
│       ├── middleware/
│       │   ├── authMiddleware.js        JWT verification + RBAC
│       │   ├── tenantMiddleware.js      Tenant isolation + quota headers
│       │   ├── quotaMiddleware.js       Daily write quota enforcement
│       │   ├── requestMetrics.js        X-Request-ID + latency tracking
│       │   └── rateLimiter.js          express-rate-limit (global, auth, brute-force)
│       ├── routes/
│       │   └── metricsRoutes.js         /api/metrics (admin-only observability)
│       └── utils/
│           └── metricsStore.js          In-memory metrics aggregation
├── docs/
│   └── architecture.md         Full system architecture documentation
└── docker-compose.yml
```

---

## API Monetisation Tiers

| Tier | Daily Writes | Req/Min | Monthly Cost |
|---|---|---|---|
| **Free** | 100 | 5 | $0 |
| **Premium** | 10,000 | 100 | $9.99 |
| **Enterprise** | Unlimited | 1,000 | Custom |

Quota breaches return HTTP 429 with `Retry-After` and tier upgrade info — matching WSO2 API Manager's throttle response format.

---

## Admin Observability Console

Accessible at `/admin` (admin role required). Panels:

| Panel | Data Source |
|---|---|
| System Health | `GET /api/metrics` — uptime, avg latency, error rate |
| API Route Usage | Route-level request counts and latency (bar chart) |
| Tier Distribution | Requests per tier: free/premium/enterprise (pie chart) |
| Tenant Overview | Applications created and placed per tenant (bar chart) |
| Event Feed | Live domain events with dead-letter alerts (auto-refresh 8s) |
| Security Log | Auth failures, quota breaches with IP and path |

---

## Running Locally

### Prerequisites
- Node.js 20+
- MongoDB running locally on `mongodb://localhost:27017`
- (Optional) Ballerina 2201.8+ for the analytics service

### Backend + Frontend

```bash
# Install dependencies
npm ci --prefix server
npm ci --prefix client

# Start backend
npm run dev --prefix server

# Start frontend (separate terminal)
npm run dev --prefix client
```

### Full Stack with Docker

```bash
docker-compose up --build
```

Frontend: http://localhost:3000  
Backend API: http://localhost:5001  
API Docs: http://localhost:5001/api/docs  
Metrics: http://localhost:5001/api/metrics (admin token required)

### Ballerina Analytics Service

```bash
# Requires Ballerina 2201.8+
cd analytics-service
bal run
# Service starts on :8080
```

### Ballerina Weekly Digest Scheduler

```bash
cd ballerina-digest
cp Config.toml.example Config.toml   # then fill in real credentials
bal run
# Service starts on :9090

# Health check
curl http://localhost:9090/health

# Manual trigger (sends digest immediately without waiting for Monday)
curl -X POST http://localhost:9090/trigger-digest
```

See [`ballerina-digest/README.md`](./ballerina-digest/README.md) for full configuration instructions.

---

## WSO2 Integration

### Asgardeo Setup
1. Create an OIDC application in your Asgardeo tenant
2. Set redirect URI to `http://localhost:5173`
3. Set `VITE_ASGARDEO_CLIENT_ID` and `VITE_ASGARDEO_BASE_URL` in `client/.env`
4. Map Asgardeo user groups (`admin`, `reviewer`) to system roles
5. Add `tenantId` and `tier` as custom OIDC claims

### API Manager Setup
1. Import `apim/openapi.yaml` into the WSO2 Publisher portal
2. Import `apim/policies/monetization-tiers.yaml` into Advanced Throttling Policies
3. Map throttling tiers to the `x-wso2-throttling-tier` values in the OpenAPI spec
4. Subscribe applications using the Free / Premium / Enterprise tiers

### Choreo Deployment
1. Push this repository to GitHub
2. Connect to WSO2 Choreo → Create Project → Import from GitHub
3. Choreo auto-detects the three components from `.choreo/component.yaml`
4. Inject secrets (MongoDB URI, Asgardeo credentials) via Choreo's secret management
5. Deploy — Choreo handles Docker build, Kubernetes orchestration, and gateway config

---

## Testing

```bash
# Backend unit tests
npm test --prefix server

# Frontend component tests
npm test --prefix client

# RBAC preflight validation
./rbac-check.sh

# Ballerina tests
cd analytics-service && bal test
```

---

## Security Notes

- **Never commit** `.env` files — all secrets are in `.env.example` templates
- JWT secrets must be ≥ 64 characters in production
- The `quotaResetAt` field uses UTC midnight — ensure server timezone is UTC in production
- The in-memory `metricsStore` resets on restart — wire to Prometheus/InfluxDB for persistence

## Deployment Notes

### Frontend

- build command: `npm run build`
- output directory: `dist`
- set the build-time `VITE_API_URL` to the deployed backend API ending with `/api`
- example: `https://your-server.choreoapps.dev/api`

### Backend

- build command: `npm install`
- start command: `npm run start`
- set `CLIENT_URL` to the deployed frontend origin
- if you use Google login, set `GOOGLE_CALLBACK_URL` to `https://your-server.choreoapps.dev/api/auth/google/callback`
- configure all backend auth environment variables
- enable secure cookies in production using HTTPS
