// Smart Internship Analytics Service — Ballerina Implementation
//
// This service is the Ballerina equivalent of server/src/routes/analyticsRoutes.js.
// It is designed for deployment as a Choreo component alongside the Node.js backend.
//
// Key WSO2 patterns demonstrated:
//  - Choreo-native http:Listener with built-in observability
//  - JWT validation against Asgardeo's JWKS endpoint (no manual key management)
//  - MongoDB connector with typed query results
//  - Structured error handling with Ballerina's error union types
//  - Tenant-scoped queries (multi-tenancy at DB level)
//  - OpenAPI annotation for auto-generation of API Manager specs

import ballerina/http;
import ballerina/jwt;
import ballerina/log;
import ballerina/time;
import ballerinax/mongodb;

// ── Configuration ──────────────────────────────────────────────────────────
// Values are injected by Choreo at runtime via environment variables.
// Locally, set them in a Config.toml file (gitignored).

configurable string mongoUri       = "mongodb://localhost:27017";
configurable string dbName         = "smart-tracker";
configurable string asgardeoJwksUrl = "https://api.asgardeo.io/t/YOUR_ORG/oauth2/jwks";
configurable string asgardeoIssuer  = "https://api.asgardeo.io/t/YOUR_ORG/oauth2/token";

// ── Types ──────────────────────────────────────────────────────────────────

type ApplicationRecord record {|
    string status;
    string roleType;
    string tenantId;
    string? rejectionReason;
    boolean portfolioViewed;
|};

type AnalyticsSummary record {|
    int total;
    int pending;
    int interviewed;
    int accepted;
    int rejected;
    int 'offer;
    int portfolioViewed;
    decimal successRate;
    map<int> roleBreakdown;
    map<int> rejectionReasons;
|};

type TrendPoint record {|
    string date;
    int count;
|};

type ErrorResponse record {|
    string code;
    string message;
|};

// ── JWT Validation Config ─────────────────────────────────────────────────

final jwt:ValidatorConfig jwtConfig = {
    issuer: asgardeoIssuer,
    jwksConfig: {
        url: asgardeoJwksUrl,
        // Cache the JWKS for 1 hour to avoid hitting the endpoint on every request
        cacheConfig: {
            capacity: 5,
            evictionFactor: 0.2,
            defaultMaxAge: 3600
        }
    }
};

// ── MongoDB Client ────────────────────────────────────────────────────────

final mongodb:Client mongoClient = check new ({
    connection: {
        serverAddress: { host: "localhost", port: 27017 },
        auth: <mongodb:ScramSha256AuthCredential>{
            username: "",
            password: "",
            database: dbName
        }
    }
});

// ── Helper: Validate Bearer Token ─────────────────────────────────────────

isolated function validateToken(http:Request req) returns jwt:Payload|http:Response {
    string|error authHeader = req.getHeader("Authorization");
    if authHeader is error || !authHeader.startsWith("Bearer ") {
        http:Response res = new;
        res.statusCode = 401;
        res.setJsonPayload(<ErrorResponse>{ code: "MISSING_TOKEN", message: "Bearer token required." });
        return res;
    }

    string token = authHeader.substring(7);
    jwt:Payload|jwt:Error payload = jwt:validate(token, jwtConfig);

    if payload is jwt:Error {
        http:Response res = new;
        res.statusCode = 401;
        res.setJsonPayload(<ErrorResponse>{ code: "INVALID_TOKEN", message: "Token is invalid or expired." });
        return res;
    }

    return payload;
}

// ── Service Definition ─────────────────────────────────────────────────────

// @http:ServiceConfig annotation registers this with the Choreo API Manager.
// The OpenAPI spec is auto-generated from the resource signatures.
@http:ServiceConfig {
    cors: {
        allowOrigins: ["*"],
        allowHeaders: ["Authorization", "Content-Type"],
        allowMethods: ["GET", "OPTIONS"]
    }
}
service /analytics on new http:Listener(8080) {

    // ── GET /analytics/summary ─────────────────────────────────────────────
    // Returns aggregated stats scoped to the caller's tenantId.
    // x-throttling-tier: Gold (WSO2 API Manager tier annotation)

    resource function get summary(http:Request req) returns AnalyticsSummary|http:Response|error {
        jwt:Payload|http:Response authResult = validateToken(req);
        if authResult is http:Response {
            return authResult;
        }

        jwt:Payload payload = authResult;
        string tenantId = (payload["tenantId"] ?: "default").toString();
        string userId   = (payload["sub"] ?: "").toString();

        log:printInfo(string `Analytics summary requested`, tenantId = tenantId, userId = userId);

        // Query applications for this tenant
        stream<ApplicationRecord, error?> resultStream = check mongoClient->find(
            dbName, "applications",
            { tenantId: tenantId },
            (),
            ApplicationRecord
        );

        ApplicationRecord[] apps = check from ApplicationRecord app in resultStream
            select app;

        // Aggregate
        int total       = apps.length();
        int pending     = 0;
        int interviewed = 0;
        int accepted    = 0;
        int rejected    = 0;
        int offer_count = 0;
        int viewed      = 0;
        map<int> roleBreak  = {};
        map<int> rejReasons = {};

        foreach ApplicationRecord app in apps {
            match app.status.toLowerAscii() {
                "pending"    => { pending     += 1; }
                "interviewed"=> { interviewed += 1; }
                "accepted"   => { accepted    += 1; }
                "rejected"   => { rejected    += 1; }
                "offer"      => { offer_count += 1; }
            }

            roleBreak[app.roleType] = (roleBreak[app.roleType] ?: 0) + 1;

            if app.portfolioViewed {
                viewed += 1;
            }

            string? reason = app.rejectionReason;
            if reason is string && reason.length() > 0 {
                rejReasons[reason] = (rejReasons[reason] ?: 0) + 1;
            }
        }

        decimal successRate = total > 0
            ? (<decimal>(accepted + offer_count) / <decimal>total * 100d).round(1)
            : 0d;

        return {
            total, pending, interviewed, accepted,
            rejected, 'offer: offer_count,
            portfolioViewed: viewed,
            successRate,
            roleBreakdown: roleBreak,
            rejectionReasons: rejReasons
        };
    }

    // ── GET /analytics/trends ──────────────────────────────────────────────
    // Returns daily application counts for the last 30 days.

    resource function get trends(http:Request req) returns TrendPoint[]|http:Response|error {
        jwt:Payload|http:Response authResult = validateToken(req);
        if authResult is http:Response {
            return authResult;
        }

        jwt:Payload jwtPayload = authResult;
        string tenantId = (jwtPayload["tenantId"] ?: "default").toString();

        // Calculate 30-day window
        time:Utc now    = time:utcNow();
        time:Utc cutoff = time:utcAddSeconds(now, -30 * 86400);

        // MongoDB aggregation pipeline
        map<json> pipeline = {
            "$match": {
                "tenantId": tenantId,
                "appliedDate": { "$gte": { "$date": cutoff[0] * 1000 } }
            },
            "$group": {
                "_id": {
                    "$dateToString": { "format": "%Y-%m-%d", "date": "$appliedDate" }
                },
                "count": { "$sum": 1 }
            },
            "$sort": { "_id": 1 }
        };

        stream<record { string _id; int count; }, error?> aggStream =
            check mongoClient->aggregate(dbName, "applications", [pipeline], ());

        TrendPoint[] trends = check from var point in aggStream
            select { date: point._id, count: point.count };

        return trends;
    }

    // ── GET /analytics/health ─────────────────────────────────────────────
    // Public health endpoint — no auth required. Used by Choreo readiness probe.

    resource function get health() returns json {
        return {
            service: "analytics-service",
            runtime: "Ballerina",
            status: "healthy",
            timestamp: time:utcNow()[0]
        };
    }
}
