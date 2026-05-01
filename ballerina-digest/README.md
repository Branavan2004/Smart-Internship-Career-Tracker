# Weekly Digest Email Scheduler

> A **Ballerina microservice** that sends a formatted weekly summary of internship application statistics to a configurable email address every Monday at 08:00 AM.

[![Ballerina](https://img.shields.io/badge/Ballerina-Swan%20Lake%202201.13.3-blueviolet)](https://ballerina.io)
[![Choreo](https://img.shields.io/badge/Deploy-WSO2%20Choreo-orange)](https://wso2.com/choreo)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)

---

## What This Service Does

On a configurable schedule (default: **every Monday at 08:00 AM**), this service:

1. **Fetches analytics** from the Smart Internship Tracker's Node.js backend (`GET /api/analytics`)
2. **Formats** the returned statistics into a clean, plain-text email digest
3. **Delivers** the email to a configurable recipient via Gmail SMTP

The service also exposes:

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | `GET` | Choreo liveness probe — returns `{"status":"ok"}` |
| `/triggerDigest` | `POST` | Immediate manual trigger for testing |

**Example digest (plain-text):**
```
================================================
  SMART INTERNSHIP TRACKER — WEEKLY DIGEST
  Monday, 5 May 2026
================================================

APPLICATION OVERVIEW
  Total Applications   : 24
  Active (non-rejected): 19

STATUS BREAKDOWN
  ⏳  Pending           : 8
  🎤  In Interview      : 6
  🎉  Offer Received    : 2
  ✅  Accepted          : 3
  ❌  Rejected          : 5

KEY METRICS
  Success Rate         : 20.8%
  Portfolio Viewed     : 14 times
================================================
```

---

## Why Ballerina Instead of Node.js?

This is not a stylistic preference — Ballerina has concrete technical advantages for this exact task:

| Capability | Ballerina | Node.js equivalent |
|---|---|---|
| Cron scheduler | `ballerina/task` stdlib — 3 lines | `node-cron` + `node-schedule` npm packages |
| HTTP client | `ballerina/http` stdlib — typed, retryable | `axios` or `node-fetch` npm packages |
| SMTP client | `ballerina/email` stdlib — no config | `nodemailer` npm package + config |
| Structured logging | `ballerina/log` stdlib — Choreo-native | `winston` or `pino` npm packages |
| Config injection | `configurable` keyword — env/file/Choreo | `dotenv` + manual `process.env` wrangling |

For **integration tasks** (fetch → transform → deliver), Ballerina eliminates the entire dependency management layer. The equivalent Node.js service would need 4+ npm packages, handle async errors manually, and require ~3× more code.

Ballerina was specifically designed for **network integration programs** — this is exactly the problem space it was built for.

---

## Installation

### 1. Install Ballerina Swan Lake

```bash
# macOS (via installer)
# 1. Go to https://ballerina.io/downloads/
# 2. Download the Swan Lake 2201.8.x .pkg file for macOS
# 3. Open the installer and follow the prompts

# Verify installation
bal version
# Expected output: Ballerina 2201.8.x (Swan Lake Update 8)
```

### 2. Clone and navigate to this directory

```bash
git clone https://github.com/your-username/Smart-Internship-Career-Tracker.git
cd Smart-Internship-Career-Tracker/ballerina-digest
```

---

## Configuration

### Step 1: Create your local Config.toml

```bash
cp Config.toml.example Config.toml
```

### Step 2: Fill in real values

Edit `Config.toml`:

```toml
backendUrl     = "http://localhost:5001/api/analytics"
smtpHost       = "smtp.gmail.com"
smtpPort       = 587
smtpUsername   = "your-sender@gmail.com"
smtpPassword   = "xxxx xxxx xxxx xxxx"   # Gmail App Password
recipientEmail = "you@example.com"
senderName     = "Smart Internship Tracker"
```

### Step 3: Generate a Gmail App Password

1. Go to [Google Account → Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (required)
3. Click **App Passwords** → Select app: "Mail" → Select device: "Other"
4. Name it "Smart Internship Digest" → click **Generate**
5. Copy the 16-character password into `Config.toml`

> **Important**: `Config.toml` is listed in the root `.gitignore`. Never commit real credentials.

---

## Running Locally

### Prerequisites

- Ballerina Swan Lake 2201.8+
- Node.js backend running on `http://localhost:5001` (see `../server/README.md`)
- A Gmail account with App Password configured

### Start the service

```bash
cd ballerina-digest
bal run
```

Expected output:
```
Compiling source
        smart_internship/weekly_digest:1.0.0

Running executable

time=2026-05-05T08:00:00.000+05:30 level=INFO module=smart_internship/weekly_digest
  message="Weekly Digest Scheduler started"
  schedule="Every Monday at 08:00 AM"
  healthEndpoint="http://0.0.0.0:9090/health"
  triggerEndpoint="http://0.0.0.0:9090/trigger-digest"
```

### Verify the health endpoint

```bash
curl http://localhost:9090/health
# {"status":"ok","service":"weekly-digest","runtime":"Ballerina"}
```

### Test the digest immediately (without waiting for Monday)

```bash
curl -X POST http://localhost:9090/triggerDigest
# {"status":"ok","message":"Digest sent successfully"}
```

Check your inbox — the email arrives within 5–10 seconds.

> This is because `service` is a reserved keyword in Swan Lake 2201.13.x and a hyphenated resource
> function path caused parse errors. The logic is identical.

---

## Error Handling

The service is designed to **never crash**. If anything goes wrong:

| Failure scenario | Behaviour |
|---|---|
| Node.js backend is down | Logs `ERROR` and skips that week's digest |
| SMTP server is unreachable | Logs `ERROR`, returns 500 on manual trigger, skips on schedule |
| Invalid analytics response shape | Logs `ERROR` with the parse error, skips digest |
| Scheduler continues regardless | The job runs again next Monday — no restart needed |

This follows the principle of **graceful degradation** — a temporary outage in one dependency doesn't take down the scheduler for future weeks.

---

## WSO2 Architecture Integration

This service is one of four WSO2 components in the Smart Internship Tracker:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WSO2 Choreo Project                          │
│                                                                     │
│  ┌─────────────┐    OIDC     ┌────────────────────────────────────┐ │
│  │  Asgardeo   │◄───────────►│  React SPA (Vite)                  │ │
│  │  (Identity) │             │  @asgardeo/auth-react SDK           │ │
│  └─────────────┘             └────────────────┬───────────────────┘ │
│                                               │ JWT                 │
│  ┌─────────────┐  Throttling ┌────────────────▼───────────────────┐ │
│  │ WSO2 APIM   │◄───────────►│  Node.js Backend (Express)          │ │
│  │ (Gateway)   │             │  /api/analytics ← polled by digest  │ │
│  └─────────────┘             └────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Ballerina: ballerina-digest (this service)                  │   │
│  │  • Polls /api/analytics every Monday 08:00 AM                │   │
│  │  • Sends formatted email digest via Gmail SMTP               │   │
│  │  • Exposes /health for Choreo liveness probes                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Ballerina: analytics-service                                │   │
│  │  • JWT validation against Asgardeo JWKS                      │   │
│  │  • Typed MongoDB queries                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

| WSO2 Product | Role in this project |
|---|---|
| **Asgardeo** | Federated identity — OIDC SSO + JWKS token verification |
| **WSO2 API Manager** | API gateway — throttling tiers, OpenAPI governance, monetisation |
| **WSO2 Choreo** | Cloud deployment — auto-builds Ballerina + Node.js + React components |
| **Ballerina (this)** | Integration logic — scheduled HTTP fetch → email delivery |
| **Ballerina (analytics-service)** | Data layer — JWT-secured MongoDB analytics queries |

### Choreo Deployment

Choreo auto-detects this as a Ballerina service via `Ballerina.toml`. To deploy:

1. Ensure `.choreo/component.yaml` lists `ballerina-digest` as a component
2. Push to GitHub — Choreo triggers a build automatically
3. Inject secrets via **Choreo → Component → Configs & Secrets**:
   - `smtpPassword` → Choreo Secret (encrypted at rest)
   - `recipientEmail` → Choreo Config (plaintext)
   - `backendUrl` → Internal service URL from the Node.js component

The `observabilityIncluded = true` flag in `Ballerina.toml` enables Prometheus metrics and Jaeger tracing **with zero code changes** — Choreo's built-in observability stack picks them up automatically.

---

## Project Structure

```
ballerina-digest/
├── Ballerina.toml          Package descriptor (org, name, version, distribution)
├── main.bal                Service implementation (scheduler + HTTP endpoints)
├── Config.toml.example     Safe placeholder config — commit this
└── README.md               This file
```

> `Config.toml` (your real credentials) is listed in `.gitignore` and must never be committed.

---

## Key Ballerina Concepts Demonstrated

| Concept | Where used | What it shows |
|---|---|---|
| `configurable` variables | Top of `main.bal` | Choreo-native config injection |
| `task:scheduleJobRecurrently` | `init()` function | Cron scheduler (no external daemon) |
| `task:Job` interface | `DigestJob` class | Type-safe job implementation |
| `http:Client` with generics | `fetchAndSendDigest()` | Typed HTTP client, auto-deserialisation |
| `email:SmtpClient` | Module level | SMTP without npm dependencies |
| `record` types | `AnalyticsStats`, `AnalyticsResponse` | Structural typing |
| Error union types (`error?`) | All functions | Explicit, exhaustive error handling |
| `check` expression | Throughout | Propagates errors without try/catch |
| `log:printError/Info/Warn` | Throughout | Structured, Choreo-observable logs |
| `function init()` | Module entry point | Service bootstrap (idiomatic Ballerina) |
| `resource function` | HTTP service | Declarative HTTP routing |

---

## Useful Commands

```bash
# Run the service
bal run

# Build (without running) — check for compile errors
bal build

# Run tests (if any are added to tests/ directory)
bal test

# Format source code
bal format main.bal

# Check library versions
bal search email
```

---

*Part of the Smart Internship & Career Tracker — a production-grade SaaS platform built on the full WSO2 technology stack.*
