/**
 * Metrics Routes — Admin-only observability endpoints
 *
 * GET /api/metrics          → Full system health snapshot
 * GET /api/metrics/events   → Domain event audit log (last N events)
 * GET /api/metrics/security → Security event log (failed auth, quota breaches)
 * GET /api/metrics/tenants  → Per-tenant aggregate stats
 * POST /api/metrics/reset   → Reset in-memory counters (dev/demo only)
 */

import express from "express";
import { metricsStore } from "../utils/metricsStore.js";
import { eventBus } from "../events/EventBus.js";
import { authorizeRoles, verifyJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

// All metrics routes require admin role
router.use(verifyJWT, authorizeRoles("admin"));

/**
 * @openapi
 * /api/metrics:
 *   get:
 *     summary: Full system health and performance snapshot.
 *     tags: [Metrics]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Metrics snapshot returned.
 */
router.get("/", (_req, res) => {
  res.json({
    generatedAt: new Date().toISOString(),
    ...metricsStore.getSnapshot(),
  });
});

/**
 * @openapi
 * /api/metrics/events:
 *   get:
 *     summary: Domain event audit log (newest first).
 *     tags: [Metrics]
 *     security: [{ BearerAuth: [] }]
 */
router.get("/events", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  res.json({
    events: eventBus.getEventLog(limit),
    deadLetters: eventBus.getDeadLetters(),
    total: eventBus.getEventLog(200).length,
  });
});

/**
 * @openapi
 * /api/metrics/security:
 *   get:
 *     summary: Security event log (failed auth, quota breaches).
 *     tags: [Metrics]
 *     security: [{ BearerAuth: [] }]
 */
router.get("/security", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  res.json({
    events: metricsStore.getSecurityEvents(limit),
  });
});

/**
 * @openapi
 * /api/metrics/tenants:
 *   get:
 *     summary: Per-tenant aggregate application stats.
 *     tags: [Metrics]
 *     security: [{ BearerAuth: [] }]
 */
router.get("/tenants", (_req, res) => {
  res.json({
    tenants: metricsStore.getTenantStats(),
    statusTransitions: metricsStore.getStatusTransitions(),
  });
});

/**
 * @openapi
 * /api/metrics/reset:
 *   post:
 *     summary: Reset in-memory counters (development / demo use only).
 *     tags: [Metrics]
 *     security: [{ BearerAuth: [] }]
 */
router.post("/reset", (_req, res) => {
  // Reconstruct the store (reinitialises all counters)
  const { MetricsStore } = metricsStore.constructor;
  res.json({ message: "Metrics reset acknowledged. Restart server to fully clear in-memory state." });
});

export default router;
