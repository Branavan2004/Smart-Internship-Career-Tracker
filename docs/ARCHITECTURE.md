# Architecture: Smart Internship & Career Ecosystem

## System Overview

A production-grade multi-tenant SaaS platform for internship and career tracking, built on the WSO2 technology stack.

```mermaid
graph TD
    subgraph "User Layer"
        S([Student])
        R([Recruiter / Reviewer])
        A([Admin])
    end

    subgraph "Identity — WSO2 Asgardeo"
        OIDC{Asgardeo OIDC\nJWKS Endpoint}
    end

    subgraph "Frontend — React + Vite"
        UI[React SPA\nclient/]
        QI[QuotaIndicator\nX-Quota-* headers]
        EF[EventFeed\npoll /api/metrics/events]
    end

    subgraph "API Layer — Choreo Gateway + WSO2 APIM"
        GW[Gateway / APIM\nThrottling · Monetisation · Tracing]
    end

    subgraph "Backend — Node.js Microservices"
        BE[Internship Backend\nserver/]
        RM[requestMetrics\nX-Request-ID · latency]
        TM[tenantMiddleware\ntenantId · X-Quota-* headers]
        QM[quotaMiddleware\ndaily write quota]
    end

    subgraph "Event Bus"
        EB{EventBus\nNode EventEmitter\nRetry + DLQ}
        NH[NotificationHandler\nEmail · In-app alerts]
        AH[AnalyticsHandler\nmetricsStore counters]
    end

    subgraph "Ballerina Analytics Service"
        BAL[analytics_service.bal\nPort 8080]
        BJWT[JWT Validation\nAsgardeo JWKS]
        BAG[MongoDB Aggregation\n30-day trends]
    end

    subgraph "Data — MongoDB"
        DB[(MongoDB\nApplications · Users\ntenantId indexed)]
    end

    subgraph "Observability"
        MS[metricsStore\nIn-memory]
        MR[/api/metrics\nRoutes · Events · Security]
    end

    S & R & A -->|OIDC Login| OIDC
    OIDC -->|JWT| UI
    S & R & A --> UI

    UI -->|X-Quota-* response headers| QI
    UI -->|poll| EF
    UI -->|Bearer JWT| GW

    GW -->|JWT + throttle| BE
    GW -->|JWT + throttle| BAL

    BE --> RM --> TM --> QM
    BE -->|after mutations| EB
    EB --> NH
    EB --> AH --> MS

    BE --> DB
    BAL --> BJWT --> BAG --> DB

    A -->|admin token| MR
    MS --> MR
```

---

## Event-Driven Architecture

When a student submits or updates an application, the backend emits a domain event **asynchronously** — the HTTP response is returned immediately, and the event handlers run in the background.

```
POST /api/applications
        │
        ▼
 Application.create()    ← synchronous DB write
        │
        ▼
 eventBus.publish("application.created", payload)
        │
        ├──► NotificationHandler  →  sendEmail() + sendPlatformAlert()
        │
        └──► AnalyticsHandler    →  metricsStore.incrementTenantStat()
```

**Retry Logic**: Each handler runs with exponential backoff (200ms, 400ms, 800ms). If all retries fail, the event is moved to the dead-letter queue, visible in `/api/metrics/events`.

**Production Upgrade Path**: Replace `EventEmitter` with a Kafka/RabbitMQ producer — the event schema and handler interface stay identical.

---

## Multi-Tenancy Model

Logical multi-tenancy: shared database, isolated rows.

| Layer | Isolation Mechanism |
|---|---|
| Auth | `tenantId` claim in Asgardeo JWT |
| Middleware | `tenantContext` extracts `tenantId` from `req.user` |
| Database | Every `Application` and `User` document has `tenantId` index |
| API Response | `X-Quota-Tier`, `X-Quota-Used`, `X-Quota-Remaining` headers |

**Upgrade Path to Physical Isolation**: Add a MongoDB connection pool keyed by `tenantId` — route each request to a tenant-specific DB URI.

---

## API Monetisation Tiers

| Tier | Daily Write Ops | Req/Min | Price |
|---|---|---|---|
| Free | 100 | 5 | $0 |
| Premium | 10,000 | 100 | $9.99/month |
| Enterprise | Unlimited | 1,000 | Custom |

When a write quota is exceeded, the API returns:

```json
HTTP 429 Too Many Requests
Retry-After: 43200
X-Throttle-Reason: Quota exceeded for tier: free

{
  "code": "QUOTA_EXCEEDED",
  "tier": "free",
  "limit": 100,
  "quotaUsed": 100,
  "upgradeUrl": "https://intern-tracker.io/pricing",
  "retryAfterSeconds": 43200
}
```

This response format matches the WSO2 API Manager throttle response schema exactly, so existing APIM clients handle it natively.

---

## Observability

### Correlation IDs

Every request gets an `X-Request-ID` header (UUID). Upstream gateways (APIM, Choreo) can inject their own; the middleware reuses it if present. This enables end-to-end request tracing across the gateway → backend → Ballerina service chain.

### Metrics Endpoints (Admin Only)

| Endpoint | Data |
|---|---|
| `GET /api/metrics` | Full snapshot: uptime, avg latency, route stats, tier usage |
| `GET /api/metrics/events` | Domain event audit log + dead-letter queue |
| `GET /api/metrics/security` | Failed auth attempts, quota breaches |
| `GET /api/metrics/tenants` | Per-tenant application counts and placement rates |

---

## Security Model

| Layer | Mechanism |
|---|---|
| Authentication | JWT (local) + Asgardeo OIDC |
| Authorisation | `verifyJWT` + `authorizeRoles(role)` middleware |
| Rate Limiting | express-rate-limit: global (100/15min), auth (10/15min), brute-force |
| Quota Limiting | Per-user daily write quota with atomic MongoDB increment |
| Headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| Access Logging | `logUnauthorizedAttempt()` feeds `metricsStore.recordSecurityEvent()` |

---

## Ballerina Analytics Service

The `analytics-service/analytics_service.bal` demonstrates WSO2-idiomatic service development:

- **JWT validation** via `jwt:validate()` against Asgardeo's JWKS endpoint (no manual key distribution)
- **Typed MongoDB queries** with Ballerina's `stream<Record, error?>` pattern
- **Match expressions** for exhaustive status aggregation
- **Choreo observability** enabled via `Ballerina.toml`: `observabilityIncluded = true`
- **Parallel to Node.js** — same business logic, demonstrates polyglot microservices

---

## Deployment: WSO2 Choreo

The `.choreo/component.yaml` defines three components deployed to the same Choreo project:

1. **internship-backend** (Node.js) — Public API, exposed through APIM
2. **analytics-service** (Ballerina) — Organisation-internal, consumed by the backend
3. **internship-frontend** (React SPA) — Public web app

Choreo handles:
- Docker build and push
- Kubernetes deployment with health probes
- API gateway configuration (from `apim/openapi.yaml`)
- Secret injection (MongoDB URI, Asgardeo credentials)
- Built-in observability dashboard (latency, error rate, throughput)
