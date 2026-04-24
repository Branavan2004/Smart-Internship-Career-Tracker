# Smart Internship & Career Ecosystem

A **production-grade, multi-tenant SaaS platform** for internship and career tracking, built on the full WSO2 technology stack. Demonstrates enterprise engineering patterns including event-driven architecture, API monetisation, multi-tenancy, and real-time observability.

[![Architecture](https://img.shields.io/badge/docs-architecture-blue)](./docs/architecture.md)
[![OpenAPI](https://img.shields.io/badge/API-OpenAPI%203.0-green)](./apim/openapi.yaml)
[![Choreo](https://img.shields.io/badge/deploy-WSO2%20Choreo-orange)](./choreo/component.yaml)
[![Ballerina](https://img.shields.io/badge/service-Ballerina%202201.8-blueviolet)](./analytics-service/analytics_service.bal)

---

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

### 🔐 Security That Goes Beyond OAuth2
Beyond OIDC: JWT validation middleware with access logging, brute-force protection (separate rate-limit bucket for failed logins), `logUnauthorizedAttempt()` that feeds the security event store, Helmet headers, and scope-based RBAC across all routes.

### ☁️ Ballerina Microservice
The `analytics-service` is written in idiomatic Ballerina — not Node.js with a `.bal` extension. It demonstrates:
- JWT validation against Asgardeo's JWKS endpoint
- Typed MongoDB stream queries
- Ballerina `match` expressions for exhaustive status aggregation
- Choreo-native observability (`observabilityIncluded = true`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Identity | WSO2 Asgardeo (OIDC), Google OAuth2, Local JWT |
| API Gateway | WSO2 API Manager (throttling, monetisation, OpenAPI) |
| Deployment | WSO2 Choreo (multi-component, CI/CD, observability) |
| Analytics Service | **Ballerina** 2201.8 |
| Backend | Node.js / Express (monolith + microservice stubs) |
| Frontend | React 18 + Vite (role-based dashboards, Kanban, Recharts) |
| Database | MongoDB with Mongoose (tenantId-indexed collections) |
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
