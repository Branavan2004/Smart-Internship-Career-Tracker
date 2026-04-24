/**
 * Request Metrics Middleware
 *
 * Attaches a correlation ID (X-Request-ID) to every request and
 * records HTTP latency into the metricsStore when the response finishes.
 *
 * X-Request-ID enables distributed tracing — each microservice propagates
 * this header so a full request chain can be reconstructed in Choreo's
 * observability dashboard or any tracing backend (Jaeger, Zipkin).
 */

import { randomUUID } from "crypto";
import { metricsStore } from "../utils/metricsStore.js";

export const requestMetrics = (req, res, next) => {
  // Correlation ID: reuse upstream if present (e.g., from API Manager)
  const requestId = req.headers["x-request-id"] || randomUUID();
  req.requestId = requestId;

  // Expose correlation ID in response so clients can include it in bug reports
  res.setHeader("X-Request-ID", requestId);

  const startAt = process.hrtime.bigint();

  res.on("finish", () => {
    const latencyMs = Number(process.hrtime.bigint() - startAt) / 1_000_000;

    // Normalise route — strip IDs to avoid high-cardinality keys
    // e.g. /api/applications/507f... → /api/applications/:id
    const route = (req.route?.path
      ? `${req.method} ${req.baseUrl}${req.route.path}`
      : `${req.method} ${req.path}`
    ).replace(/\/[a-f0-9]{24}/g, "/:id").replace(/\/\d+/g, "/:id");

    metricsStore.recordRequest({
      route,
      latencyMs,
      isError: res.statusCode >= 400,
    });

    // Track tier usage if auth context available
    if (req.user?.tier) {
      metricsStore.recordTierRequest(req.user.tier);
    }
  });

  next();
};
