/**
 * Analytics Handler
 *
 * Subscribes to all application.* domain events and maintains
 * an in-memory analytics store with real-time counters.
 *
 * This mirrors what a stream processor (WSO2 Streaming Integrator / Kafka Streams)
 * would do in production — consuming events and updating aggregate state.
 */

import { eventBus } from "../EventBus.js";
import { metricsStore } from "../../utils/metricsStore.js";
import { logger } from "../../config/logger.js";

async function onApplicationCreated({ payload, timestamp }) {
  metricsStore.incrementDomainEvent("application.created");
  metricsStore.incrementTenantStat(payload.tenantId, "applicationsCreated");
  logger.info(
    { tenantId: payload.tenantId, company: payload.companyName, timestamp },
    "[ANALYTICS] application.created recorded"
  );
}

async function onApplicationStatusChanged({ payload, timestamp }) {
  const { tenantId, newStatus, previousStatus } = payload;
  metricsStore.incrementDomainEvent("application.status_changed");
  metricsStore.recordStatusTransition(tenantId, previousStatus, newStatus);

  if (newStatus === "Accepted" || newStatus === "Offer") {
    metricsStore.incrementTenantStat(tenantId, "successfulPlacements");
  }

  logger.info(
    { tenantId, previousStatus, newStatus, timestamp },
    "[ANALYTICS] status transition recorded"
  );
}

async function onApplicationDeleted({ payload, timestamp }) {
  metricsStore.incrementDomainEvent("application.deleted");
  metricsStore.incrementTenantStat(payload.tenantId, "applicationsDeleted");
  logger.info(
    { tenantId: payload.tenantId, timestamp },
    "[ANALYTICS] application.deleted recorded"
  );
}

export function registerAnalyticsHandlers() {
  eventBus.subscribe("application.created", onApplicationCreated);
  eventBus.subscribe("application.status_changed", onApplicationStatusChanged);
  eventBus.subscribe("application.deleted", onApplicationDeleted);
  logger.info("AnalyticsHandler: subscriptions registered");
}
