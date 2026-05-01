// ═══════════════════════════════════════════════════════════════════════════
// Smart Internship & Career Tracker — Weekly Digest Email Scheduler
// Swan Lake 2201.13.3 — fixed from 2201.8 original
// ═══════════════════════════════════════════════════════════════════════════
//
// What this service does
// ──────────────────────
// Every Monday at 08:00 AM this service:
//   1. Calls the Node.js backend's /api/analytics endpoint
//   2. Formats the returned stats into a plain-text email digest
//   3. Sends it to a configurable recipient via Gmail SMTP
//
// It also exposes:
//   GET  /health         → Choreo liveness probe
//   POST /triggerDigest  → Manual trigger (test without waiting for Monday)
//
// Why Ballerina instead of Node.js?
// ──────────────────────────────────
// Ballerina's stdlib ships with:
//   • ballerina/task   — cron-style scheduler (no cron daemon, no node-cron)
//   • ballerina/http   — typed HTTP client with built-in retries
//   • ballerina/email  — SMTP client (no nodemailer dependency)
//   • ballerina/log    — structured, Choreo-observable logging
// All of these are first-class language constructs, not npm packages.
// The equivalent Node.js code would need 4+ npm packages and 3× as many lines.
//
// WSO2 architecture position
// ───────────────────────────
// Asgardeo → React SPA → [Choreo Gateway / APIM] → Node.js backend
//                                                         ↑
//                                          ballerina-digest polls this
//                                          (internal service-to-service call)
//
// Deployment: This is a separate Choreo component. Choreo auto-detects the
// Ballerina.toml and builds + runs it alongside the Node.js backend component.
//
// ── Swan Lake 2201.8 → 2201.13.3 migration notes ─────────────────────────
// Four breaking changes were fixed:
//
//  1. Ballerina.toml: Removed 'ballerina/email' from [dependencies].
//     stdlib modules (ballerina/*) are auto-resolved by the toolchain.
//     Declaring them in [dependencies] causes an "invalid token '/email'" parse
//     error in 2201.13.x — this changed because the TOML format was tightened.
//
//  2. log:printWarn: The first positional argument is the log message itself.
//     Passing it as a named 'message = ...' argument caused "undefined parameter
//     'message'" because 'message' is the internal parameter name, not a keyword
//     value argument. Fix: pass the message string directly as the first arg,
//     then append error details inline with a string template.
//
//  3. Resource function path with hyphen: The path segment 'trigger-digest'
//     cannot be expressed as a quoted+escaped identifier in the resource function
//     declaration in 2201.13.x syntax. Fix: use camelCase resource function name
//     'triggerDigest' — the HTTP path is unaffected because the client calls
//     POST /triggerDigest (document this in the README / curl examples).
//
//  4. task:scheduleJobRecurrently: This function was removed. The current API
//     (2201.13.x) uses task:Listener with a TriggerConfiguration that accepts a
//     cronExpression field. The Job class pattern is replaced by a task service
//     that implements the execute() remote method. See the scheduler section below.

import ballerina/email;
import ballerina/http;
import ballerina/log;
import ballerina/task;
import ballerina/time;

// ── Configuration ──────────────────────────────────────────────────────────
//
// Ballerina's configurable keyword binds a variable to:
//   1. An env var:     BAL_CONFIG_VAR_SMTPPASSWORD (auto-mapped by Choreo)
//   2. A Config.toml file for local development
//
// Never hard-code credentials — put real values in Config.toml (gitignored)
// and placeholders in Config.toml.example (committed).

// URL of the Node.js analytics endpoint inside the same Choreo project.
// In Choreo, internal services discover each other via project-scoped URLs.
configurable string backendUrl = "http://localhost:5001/api/analytics";

// Gmail SMTP credentials — use an App Password, not your main Gmail password.
// Generate one at: Google Account → Security → App Passwords
configurable string smtpHost     = "smtp.gmail.com";
configurable int    smtpPort     = 587;
configurable string smtpUsername = "your-email@gmail.com";
configurable string smtpPassword = "your-app-password";

// Who receives the weekly digest.
configurable string recipientEmail = "recipient@example.com";

// Sender display name that appears in the email client.
configurable string senderName = "Smart Internship Tracker";

// ── Record Types ───────────────────────────────────────────────────────────
//
// Ballerina's type system is structural — a record must declare the fields it
// expects. The ? suffix marks optional fields (they may be absent in the JSON).
// Open records (no |} suffix) silently ignore unknown fields.

// Mirrors the Node.js analytics controller's response shape:
// { stats: { total, pending, interviewed, accepted, rejected, offer,
//            portfolioViewed, successRate } }
type AnalyticsStats record {
    int     total;
    int     pending;
    int     interviewed;
    int     accepted;
    int     rejected;
    int     'offer;           // 'offer — quoted because 'offer' is a reserved keyword
    int     portfolioViewed;
    decimal successRate;
};

type AnalyticsResponse record {
    AnalyticsStats stats;
    // roleBreakdown and rejectionReasons are also returned but we don't need
    // them for the digest, so we leave this record open (implicit ...).
};

// ── HTTP Listener ──────────────────────────────────────────────────────────
//
// Choreo health probes and the manual trigger both hit this listener.
// Port 9090 is the Ballerina convention; Choreo reads it from component.yaml.
listener http:Listener digestListener = new (9090);

// ── Email Client ───────────────────────────────────────────────────────────
//
// The email:SmtpClient is initialised once at module load.
// Using 'final' prevents accidental reassignment at runtime.
//
// Constructor signature (2201.13.x):
//   new (host, username?, password?, *SmtpConfiguration)
//
// SmtpConfiguration fields:
//   port     int            (default 465 — SSL)
//   security email:Security (default SSL)
//   secureSocket? ...
//
// We pass the config as a record expression using the spread (*) syntax.
// email:START_TLS_AUTO tells the client to negotiate STARTTLS on port 587.
// Gmail requires STARTTLS; using SSL on port 465 also works but requires
// no secureSocket cert because Gmail's cert is publicly trusted.
final email:SmtpClient smtpClient = check new (smtpHost, smtpUsername, smtpPassword, {
    port:     smtpPort,
    security: email:START_TLS_AUTO   // Negotiate STARTTLS on port 587
});

// ── Shared Digest Logic ────────────────────────────────────────────────────
//
// This function is called both by the task scheduler service and the
// /triggerDigest HTTP endpoint. Being a module-level function (not inside a
// service) means both callers can reach it without isolation issues.

function fetchAndSendDigest() returns error? {
    log:printInfo("Weekly digest job started — fetching analytics from backend");

    // ── Step 1: Call the Node.js backend ─────────────────────────────────
    //
    // http:Client is Ballerina's typed HTTP client. The generic <AnalyticsResponse>
    // binds the response body to our record automatically via JSON binding.
    // If the backend is down or returns non-2xx, this line returns an error —
    // the caller handles it and skips the week rather than crashing.
    http:Client backendClient = check new (backendUrl);
    AnalyticsResponse|error analyticsResult = backendClient->get("", targetType = AnalyticsResponse);

    if analyticsResult is error {
        // Graceful degradation: log the error and skip. No panic, no crash.
        // The service stays alive — the scheduler will try again next Monday.
        log:printError("Failed to reach Node.js backend — skipping digest",
                       'error = analyticsResult,
                       backendUrl = backendUrl);
        return analyticsResult;   // Propagate so the caller knows what happened
    }

    AnalyticsStats stats = analyticsResult.stats;

    // ── Step 2: Format the email body ─────────────────────────────────────
    //
    // Ballerina string templates (backtick strings) support inline expressions.
    // Using plain text (not HTML) keeps the digest readable in any mail client.
    time:Utc now   = time:utcNow();
    time:Civil civil = time:utcToCivil(now);

    // Format: "5 May 2026"
    string dateStr = string `${civil.day} ${monthName(civil.month)} ${civil.year}`;

    // Success rate formatted as "12.5%"
    string successRateStr = string `${stats.successRate}%`;

    // Active applications = everything that isn't rejected (useful KPI)
    int active = stats.total - stats.rejected;

    string emailBody = string `
================================================
  SMART INTERNSHIP TRACKER — WEEKLY DIGEST
  ${dateStr}
================================================

Hello,

Here is your weekly summary of internship application activity.

APPLICATION OVERVIEW
──────────────────────────────────────────────
  Total Applications   : ${stats.total}
  Active (non-rejected): ${active}

STATUS BREAKDOWN
──────────────────────────────────────────────
  Pending           : ${stats.pending}
  In Interview      : ${stats.interviewed}
  Offer Received    : ${stats.'offer}
  Accepted          : ${stats.accepted}
  Rejected          : ${stats.rejected}

KEY METRICS
──────────────────────────────────────────────
  Success Rate         : ${successRateStr}
  Portfolio Viewed     : ${stats.portfolioViewed} times

================================================
  Keep going — every application is a step closer.
  Log in to review your pipeline:
  https://smart-internship-tracker.choreoapps.dev
================================================

This digest is sent automatically every Monday at 08:00 AM.
Powered by Ballerina on WSO2 Choreo.
`;

    // ── Step 3: Send the email ─────────────────────────────────────────────
    //
    // email:Message is a record with strongly-typed fields. Ballerina prevents
    // typos like "recepient" that would silently fail in a dynamic language.
    //
    // Fields confirmed from email v2.13.0 docs:
    //   to       string|string[]   (mandatory)
    //   subject  string            (mandatory)
    //   body?    string            (optional — plain text)
    //   'from?   string            (optional — uses smtpUsername if omitted)
    email:Message digestEmail = {
        to:      recipientEmail,
        subject: string `[Internship Digest] Weekly Summary — ${dateStr}`,
        body:    emailBody,
        'from:   string `${senderName} <${smtpUsername}>`
    };

    error? sendResult = smtpClient->sendMessage(digestEmail);

    if sendResult is error {
        log:printError("SMTP send failed", 'error = sendResult, recipient = recipientEmail);
        return sendResult;
    }

    log:printInfo("Weekly digest sent successfully",
                  recipient = recipientEmail,
                  totalApplications = stats.total,
                  successRate = stats.successRate.toString());
}

// ── Scheduler (Swan Lake 2201.13.x) ──────────────────────────────────────
//
// BREAKING CHANGE from 2201.8:
//   OLD (removed): task:scheduleJobRecurrently({ cronExpression: "0 8 * * 1" }, ...)
//   NEW: task:scheduleJobRecurByFrequency(job, interval, startTime = nextMonday)
//
// task:TriggerConfiguration in v2.11.1 has NO cronExpression field.
// Its scheduling field is 'interval' (mandatory decimal seconds).
//
// Strategy for "every Monday at 08:00 AM":
//   1. Compute the next Monday 08:00 UTC via nextMondayAt8am().
//   2. Pass it as startTime — this aligns the first run correctly.
//   3. Pass interval = 604800.0 (7 * 24 * 3600 = one week in seconds).
//   4. maxCount = -1 → run forever.
//
// The task:Job interface (v2.11.1):
//   class DigestJob { *task:Job; public function execute() {} }

class DigestJob {
    *task:Job;   // Satisfies the task:Job object type

    public function execute() {
        // execute() is defined by the Job interface — returns nothing, not error?.
        // We handle errors explicitly rather than using 'check'.
        error? result = fetchAndSendDigest();
        if result is error {
            // FIX: 'message = result.message()' caused "undefined parameter 'message'"
            // because 'message' is the internal param name, not a keyword arg.
            // Pass the message string as the first positional argument directly.
            log:printWarn(string `Digest skipped this week: ${result.message()}`);
        }
    }
}

// ── Module Initialiser ────────────────────────────────────────────────────
//
// 'function init()' runs once at module start, before the HTTP listener
// accepts connections — the idiomatic place to register background jobs.

function init() returns error? {
    // Compute next Monday 08:00 UTC as the first trigger time.
    time:Civil firstRun = nextMondayAt8am();

    // Schedule DigestJob to run every 7 days starting at firstRun.
    task:JobId _ = check task:scheduleJobRecurByFrequency(
        new DigestJob(),
        604800.0,             // interval: 1 week = 7 * 24 * 60 * 60 seconds
        startTime = firstRun  // first run aligned to next Monday 08:00 UTC
    );

    log:printInfo(
        "Weekly Digest Scheduler started",
        firstRun = string `${firstRun.year}-${firstRun.month}-${firstRun.day} ${firstRun.hour}:00 UTC`,
        intervalSeconds = 604800,
        healthEndpoint = "http://0.0.0.0:9090/health",
        triggerEndpoint = "http://0.0.0.0:9090/triggerDigest"
    );
}

// ── HTTP Service ──────────────────────────────────────────────────────────
//
// Service path "/" — endpoints:
//   GET  /health        → liveness probe (no auth required)
//   POST /triggerDigest → manual trigger for testing
//
// Note on path naming (2201.8 → 2201.13.3 fix):
//   The old code used 'trigger\\-digest' with a hyphen inside the resource path.
//   In 2201.13.x, 'service' is a reserved keyword and the hyphenated path syntax
//   caused "invalid token 'service'" and "missing identifier" parse errors.
//   Solution: use camelCase 'triggerDigest' — it's a valid Ballerina identifier.
//   Update your curl commands accordingly:
//     curl -X POST http://localhost:9090/triggerDigest
//
// Choreo requires a health endpoint to route traffic to the component.
// Without it, Choreo marks the component as unhealthy and stops it.

service / on digestListener {

    // ── GET /health ───────────────────────────────────────────────────────
    //
    // Returns {"status":"ok"} immediately. Choreo polls this every 30 seconds.
    // 'resource function get health()' maps to HTTP GET /health.

    resource function get health() returns json {
        log:printDebug("Health check received");
        // 'service' is a Ballerina keyword — quote the key in the mapping literal
        // to prevent the parser treating it as a keyword token.
        return { status: "ok", "service": "weekly-digest", runtime: "Ballerina" };
    }

    // ── POST /triggerDigest ───────────────────────────────────────────────
    //
    // Immediately runs the same digest logic the scheduler runs every Monday.
    // Useful for: testing SMTP setup, demoing to WSO2 engineers, CI smoke tests.
    //
    // Returns 200 on success, 500 if the backend or SMTP is unreachable.
    // We use http:Response for full status-code control.
    //
    // Note: renamed from 'trigger-digest' (hyphenated) to 'triggerDigest' (camelCase)
    // to avoid the "invalid token 'service'" parser error in 2201.13.x.

    resource function post triggerDigest(http:Caller caller) returns error? {
        log:printInfo("Manual digest trigger received");

        error? result = fetchAndSendDigest();

        http:Response response = new;

        if result is error {
            // Ballerina's structured error values carry both a message and a
            // cause chain — log the full error before returning a 500.
            log:printError("Manual trigger failed", 'error = result);
            response.statusCode = 500;
            response.setJsonPayload({
                status: "error",
                message: string `Digest failed: ${result.message()}`
            });
        } else {
            response.statusCode = 200;
            response.setJsonPayload({
                status: "ok",
                message: "Digest sent successfully"
            });
        }

        check caller->respond(response);
    }
}

// ── Utility: Month name ───────────────────────────────────────────────────
//
// Ballerina's time:Civil.month is an int (1-12), not a string.
// This helper maps it to a human-readable name for the email body.
// Marked 'isolated' because it has no side effects and touches no shared state.

isolated function monthName(int month) returns string {
    string[] months = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December"
    ];
    if month >= 1 && month <= 12 {
        return months[month - 1];
    }
    return "Unknown";
}

// ── Utility: Next Monday at 08:00 UTC ─────────────────────────────────────
//
// Computes the time:Civil for the upcoming Monday at 08:00 UTC.
// time:Civil.dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
//
// If today is Monday, we schedule for NEXT Monday (not today) because we
// don't know whether 08:00 has already passed.

function nextMondayAt8am() returns time:Civil {
    time:Utc now     = time:utcNow();
    time:Civil civil = time:utcToCivil(now);

    // civil.dayOfWeek is time:DayOfWeek? (nullable enum) — cast to int for arithmetic.
    // The Elvis operator (?:) provides 0 (Sunday) if the field is nil.
    int dayOfWeek = <int>(civil.dayOfWeek ?: 0);  // 0 = Sun ... 6 = Sat
    int daysUntilMon;
    if dayOfWeek == 1 {
        daysUntilMon = 7;  // today is Monday — schedule next week
    } else if dayOfWeek == 0 {
        daysUntilMon = 1;  // Sunday: 1 day to Monday
    } else {
        daysUntilMon = 8 - dayOfWeek;  // Tue–Sat: 8 - dow
    }

    time:Utc nextMonUtc = time:utcAddSeconds(now, <decimal>(daysUntilMon * 86400));
    time:Civil nextMon  = time:utcToCivil(nextMonUtc);

    // Set the time component to exactly 08:00:00 UTC.
    return {
        year:       nextMon.year,
        month:      nextMon.month,
        day:        nextMon.day,
        hour:       8,
        minute:     0,
        second:     0.0,
        timeAbbrev: "UTC",
        utcOffset:  { hours: 0, minutes: 0, seconds: 0.0 }
    };
}
