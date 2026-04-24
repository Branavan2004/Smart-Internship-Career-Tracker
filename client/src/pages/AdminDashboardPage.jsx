/**
 * AdminDashboardPage — Enterprise system observability console.
 *
 * Panels:
 *  1. System Health  — uptime, avg latency, total requests, error rate
 *  2. API Usage      — requests per route (bar chart)
 *  3. Tier Usage     — request volume split by free/premium/enterprise (pie)
 *  4. Tenant Stats   — applications per tenant (bar chart)
 *  5. Event Feed     — live domain events from the EventBus
 *  6. Security Log   — recent auth failures and quota breaches
 */

import { useCallback, useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import apiClient from "../api/apiClient";
import EventFeed from "../components/EventFeed";

// ── Colour palette ─────────────────────────────────────────────────────────
const PALETTE = ["#5ec4ff", "#f97316", "#24b47e", "#f15bb5", "#ffd166", "#6a4c93"];

const TIER_COLOURS = { free: "#94a3b8", premium: "#818cf8", enterprise: "#fbbf24" };

const SECURITY_ICONS = {
  unauthorized_access: "🔒",
  quota_exceeded: "⚡",
  invalid_token: "🚫",
};

// ── Subcomponents ──────────────────────────────────────────────────────────

function HealthCard({ label, value, sub, accent }) {
  return (
    <article className="stat-card" id={`health-${label.replace(/\s/g, "-").toLowerCase()}`}>
      <div className="stat-accent" style={{ background: accent }} />
      <p>{label}</p>
      <h3 style={{ fontSize: "1.6rem" }}>{value}</h3>
      {sub && <small style={{ color: "#55637e", fontSize: "0.72rem" }}>{sub}</small>}
    </article>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div className="panel-header">
      <div>
        <p className="eyebrow" style={{ margin: 0 }}>{eyebrow}</p>
        <h2 style={{ margin: 0 }}>{title}</h2>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

const AdminDashboardPage = () => {
  const [metrics, setMetrics]   = useState(null);
  const [security, setSecurity] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const loadMetrics = useCallback(async () => {
    try {
      const [metricsRes, secRes] = await Promise.all([
        apiClient.get("/metrics"),
        apiClient.get("/metrics/security?limit=30"),
      ]);
      setMetrics(metricsRes.data);
      setSecurity(secRes.data.events ?? []);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Could not load admin metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    const id = setInterval(loadMetrics, 15_000);
    return () => clearInterval(id);
  }, [loadMetrics]);

  // ── Derived data ─────────────────────────────────────────────────────────

  const uptimeStr = metrics
    ? (() => {
        const s = metrics.uptimeSeconds;
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
      })()
    : "—";

  const totalErrors = metrics
    ? metrics.routeStats.reduce((sum, r) => sum + r.errors, 0)
    : 0;

  const errorRate = metrics && metrics.totalRequests
    ? ((totalErrors / metrics.totalRequests) * 100).toFixed(1) + "%"
    : "0%";

  const tierPieData = metrics
    ? Object.entries(metrics.tierUsage).map(([name, value]) => ({ name, value }))
    : [];

  const routeBarData = metrics
    ? [...metrics.routeStats]
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 8)
        .map((r) => ({ name: r.route.split(" ")[1] ?? r.route, requests: r.requests, avgMs: r.avgLatencyMs }))
    : [];

  const tenantBarData = metrics
    ? metrics.tenantStats.map((t) => ({
        name: t.tenantId,
        created: t.applicationsCreated,
        placed: t.successfulPlacements,
      }))
    : [];

  return (
    <div className="page-stack">
      {/* ── Hero ── */}
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>System Observability Console</h2>
          <p>Real-time platform health, event bus telemetry, and per-tenant analytics.</p>
        </div>
        <div className="hero-actions">
          <button
            id="refresh-metrics-btn"
            type="button"
            className="ghost-button"
            onClick={loadMetrics}
          >
            Refresh now
          </button>
        </div>
      </section>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p style={{ color: "#55637e", padding: "24px 0" }}>Loading metrics…</p>
      ) : (
        <>
          {/* ── 1. System Health ── */}
          <section className="stats-grid">
            <HealthCard
              label="Uptime"
              value={uptimeStr}
              sub="since last restart"
              accent="linear-gradient(135deg, #24b47e, #a7f3d0)"
            />
            <HealthCard
              label="Total Requests"
              value={metrics.totalRequests.toLocaleString()}
              sub="this session"
              accent="linear-gradient(135deg, #5ec4ff, #2a9d8f)"
            />
            <HealthCard
              label="Avg Latency"
              value={`${metrics.avgLatencyMs} ms`}
              sub="across all routes"
              accent="linear-gradient(135deg, #ffd166, #f4a261)"
            />
            <HealthCard
              label="Error Rate"
              value={errorRate}
              sub={`${totalErrors} errors total`}
              accent="linear-gradient(135deg, #f97316, #ff7a59)"
            />
          </section>

          {/* ── 2. Route Stats + Tier Usage ── */}
          <section className="chart-grid">
            <article className="panel chart-panel" id="route-usage-chart">
              <SectionTitle eyebrow="API Gateway" title="Requests per Route" />
              {routeBarData.length === 0 ? (
                <p style={{ color: "#55637e", fontSize: "0.85rem" }}>No route data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={routeBarData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#55637e" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#55637e" }} />
                    <Tooltip
                      contentStyle={{ background: "#1a2035", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
                      formatter={(v, n) => [v, n === "requests" ? "Requests" : "Avg ms"]}
                    />
                    <Bar dataKey="requests" radius={[8, 8, 0, 0]}>
                      {routeBarData.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </article>

            <article className="panel chart-panel" id="tier-usage-chart">
              <SectionTitle eyebrow="API Monetisation" title="Requests by Tier" />
              {tierPieData.every((d) => d.value === 0) ? (
                <p style={{ color: "#55637e", fontSize: "0.85rem" }}>No tier data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={tierPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {tierPieData.map((entry) => (
                        <Cell key={entry.name} fill={TIER_COLOURS[entry.name] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1a2035", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Legend */}
              <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
                {Object.entries(TIER_COLOURS).map(([tier, color]) => (
                  <span key={tier} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "#94a3b8" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }} />
                    {tier}
                  </span>
                ))}
              </div>
            </article>
          </section>

          {/* ── 3. Tenant Overview ── */}
          {tenantBarData.length > 0 && (
            <section className="panel" id="tenant-overview-panel">
              <SectionTitle eyebrow="Multi-Tenancy" title="Applications per Tenant" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tenantBarData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#55637e" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#55637e" }} />
                  <Tooltip
                    contentStyle={{ background: "#1a2035", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}
                  />
                  <Bar dataKey="created" name="Created" fill="#5ec4ff" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="placed"  name="Placed"  fill="#24b47e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}

          {/* ── 4. Event Feed ── */}
          <section className="panel" id="event-feed-panel">
            <EventFeed limit={25} />
          </section>

          {/* ── 5. Security Log ── */}
          <section className="panel" id="security-log-panel">
            <SectionTitle eyebrow="Security" title="Recent Security Events" />
            {security.length === 0 ? (
              <p style={{ color: "#55637e", fontSize: "0.85rem" }}>No security events recorded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
                {security.map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "28px 1fr auto",
                      gap: 10, alignItems: "center",
                      padding: "9px 12px", borderRadius: 10,
                      background: "rgba(239,68,68,0.05)",
                      border: "1px solid rgba(239,68,68,0.12)",
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>{SECURITY_ICONS[ev.type] ?? "⚠"}</span>
                    <div>
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#f97316" }}>
                        {ev.type?.replace(/_/g, " ")}
                      </span>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#94a3b8" }}>
                        {ev.ip && `IP: ${ev.ip}`} {ev.path && `· ${ev.path}`}
                        {ev.userId && ` · user: ${ev.userId}`}
                      </p>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#55637e", whiteSpace: "nowrap" }}>
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
