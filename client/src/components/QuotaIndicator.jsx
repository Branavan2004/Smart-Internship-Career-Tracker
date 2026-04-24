/**
 * QuotaIndicator — Persistent header widget showing the current user's
 * API quota (used / limit) with a live animated progress bar.
 *
 * Reads the X-Quota-* response headers that the tenantMiddleware injects.
 * Turns amber at 70%, red at 90%, pulsing at 95%+.
 */

import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

const POLL_MS = 30_000;

const tierBadgeStyle = {
  free:       { background: "rgba(255,255,255,0.08)", color: "#94a3b8" },
  premium:    { background: "rgba(99,102,241,0.18)",  color: "#818cf8" },
  enterprise: { background: "rgba(245,158,11,0.18)",  color: "#fbbf24" },
};

export default function QuotaIndicator() {
  const [quota, setQuota] = useState(null);

  const fetchQuota = async () => {
    try {
      const resp = await apiClient.get("/analytics", { params: { _quota: 1 } });
      const used     = parseInt(resp.headers["x-quota-used"]  ?? "0",   10);
      const limitRaw = resp.headers["x-quota-limit"];
      const tier     = resp.headers["x-quota-tier"] ?? "free";
      const limitVal = limitRaw === "unlimited" ? Infinity : parseInt(limitRaw ?? "100", 10);

      setQuota({
        used, limit: limitVal, tier,
        pct: limitVal === Infinity ? 0 : Math.min((used / limitVal) * 100, 100),
      });
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchQuota();
    const id = setInterval(fetchQuota, POLL_MS);
    return () => clearInterval(id);
  }, []);

  if (!quota) return null;

  const { used, limit, tier, pct } = quota;
  const isUnlimited = limit === Infinity;
  const barColor =
    pct >= 95 ? "#ef4444" :
    pct >= 90 ? "#f97316" :
    pct >= 70 ? "#f59e0b" :
    "#24b47e";

  return (
    <div
      id="quota-indicator"
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "6px 14px", borderRadius: 10,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        fontSize: "0.78rem", userSelect: "none",
      }}
      title={isUnlimited ? "Enterprise: unlimited" : `${used} of ${limit} daily writes used`}
    >
      <span style={{
        ...tierBadgeStyle[tier],
        padding: "2px 8px", borderRadius: 6, fontWeight: 600,
        textTransform: "uppercase", fontSize: "0.68rem", letterSpacing: "0.05em",
      }}>
        {tier}
      </span>

      {isUnlimited ? (
        <span style={{ color: "#fbbf24", fontWeight: 500 }}>∞ unlimited</span>
      ) : (
        <>
          <div style={{
            width: 80, height: 5, borderRadius: 4,
            background: "rgba(255,255,255,0.1)", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: `${pct}%`, background: barColor,
              borderRadius: 4, transition: "width 0.6s ease, background 0.3s ease",
              animation: pct >= 95 ? "quota-pulse 1.2s ease-in-out infinite" : "none",
            }} />
          </div>
          <span style={{ color: "#94a3b8", whiteSpace: "nowrap" }}>
            {used}<span style={{ opacity: 0.5 }}> / {limit}</span>
          </span>
        </>
      )}
      <style>{`@keyframes quota-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
