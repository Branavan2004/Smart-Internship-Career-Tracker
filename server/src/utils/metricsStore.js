/**
 * MetricsStore — In-memory observability store.
 *
 * Tracks:
 *  - HTTP request counts + average latency per route
 *  - Domain event counts (application.created, etc.)
 *  - Security events (failed auth attempts)
 *  - Per-tenant aggregate stats
 *  - API tier usage (free / premium / enterprise)
 *
 * In production this would be backed by Prometheus / InfluxDB / Choreo Observability.
 * The interface is identical — swap the in-memory maps for a metrics client.
 */

class MetricsStore {
  constructor() {
    this._startTime = Date.now();
    this._requests = {}; // route → { count, totalLatencyMs, errors }
    this._domainEvents = {}; // eventName → count
    this._securityEvents = []; // array of { type, ip, path, timestamp }
    this._tenantStats = {}; // tenantId → { applicationsCreated, successfulPlacements, applicationsDeleted }
    this._tierUsage = { free: 0, premium: 0, enterprise: 0 };
    this._statusTransitions = {}; // "Pending→Accepted" → count
  }

  // ── HTTP Metrics ──────────────────────────────────────────────────────

  recordRequest({ route, latencyMs, isError }) {
    if (!this._requests[route]) {
      this._requests[route] = { count: 0, totalLatencyMs: 0, errors: 0 };
    }
    const r = this._requests[route];
    r.count += 1;
    r.totalLatencyMs += latencyMs;
    if (isError) r.errors += 1;
  }

  getRouteStats() {
    return Object.entries(this._requests).map(([route, data]) => ({
      route,
      requests: data.count,
      avgLatencyMs: data.count ? Math.round(data.totalLatencyMs / data.count) : 0,
      errors: data.errors,
      errorRate: data.count ? ((data.errors / data.count) * 100).toFixed(1) + "%" : "0%",
    }));
  }

  getTotalRequests() {
    return Object.values(this._requests).reduce((sum, r) => sum + r.count, 0);
  }

  getOverallAvgLatency() {
    const routes = Object.values(this._requests);
    const totalCount = routes.reduce((s, r) => s + r.count, 0);
    const totalLatency = routes.reduce((s, r) => s + r.totalLatencyMs, 0);
    return totalCount ? Math.round(totalLatency / totalCount) : 0;
  }

  getUptimeSeconds() {
    return Math.floor((Date.now() - this._startTime) / 1000);
  }

  // ── Domain Event Metrics ──────────────────────────────────────────────

  incrementDomainEvent(eventName) {
    this._domainEvents[eventName] = (this._domainEvents[eventName] || 0) + 1;
  }

  getDomainEventCounts() {
    return this._domainEvents;
  }

  // ── Security Event Log ────────────────────────────────────────────────

  recordSecurityEvent({ type, ip, path, userId = null }) {
    this._securityEvents.unshift({
      type,
      ip,
      path,
      userId,
      timestamp: new Date().toISOString(),
    });
    if (this._securityEvents.length > 200) this._securityEvents.pop();
  }

  getSecurityEvents(limit = 50) {
    return this._securityEvents.slice(0, limit);
  }

  // ── Tenant Stats ──────────────────────────────────────────────────────

  incrementTenantStat(tenantId, statKey) {
    if (!tenantId) return;
    if (!this._tenantStats[tenantId]) {
      this._tenantStats[tenantId] = {
        applicationsCreated: 0,
        successfulPlacements: 0,
        applicationsDeleted: 0,
      };
    }
    if (this._tenantStats[tenantId][statKey] !== undefined) {
      this._tenantStats[tenantId][statKey] += 1;
    }
  }

  getTenantStats() {
    return Object.entries(this._tenantStats).map(([tenantId, stats]) => ({
      tenantId,
      ...stats,
    }));
  }

  // ── Status Transition Tracking ────────────────────────────────────────

  recordStatusTransition(tenantId, from, to) {
    const key = `${from}→${to}`;
    this._statusTransitions[key] = (this._statusTransitions[key] || 0) + 1;
  }

  getStatusTransitions() {
    return Object.entries(this._statusTransitions).map(([transition, count]) => ({
      transition,
      count,
    }));
  }

  // ── Tier Usage ────────────────────────────────────────────────────────

  recordTierRequest(tier) {
    if (this._tierUsage[tier] !== undefined) {
      this._tierUsage[tier] += 1;
    }
  }

  getTierUsage() {
    return this._tierUsage;
  }

  // ── Full Snapshot ─────────────────────────────────────────────────────

  getSnapshot() {
    return {
      uptimeSeconds: this.getUptimeSeconds(),
      totalRequests: this.getTotalRequests(),
      avgLatencyMs: this.getOverallAvgLatency(),
      routeStats: this.getRouteStats(),
      domainEvents: this.getDomainEventCounts(),
      tierUsage: this.getTierUsage(),
      tenantStats: this.getTenantStats(),
      statusTransitions: this.getStatusTransitions(),
    };
  }
}

// Singleton
export const metricsStore = new MetricsStore();
