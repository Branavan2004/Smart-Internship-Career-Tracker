/**
 * EventFeed — Live domain event stream for the Admin dashboard.
 * Auto-polls /api/metrics/events every 8 seconds.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import apiClient from "../api/apiClient";

const POLL_MS = 8_000;

const EVENT_META = {
  "application.created":        { label: "Created",        color: "#24b47e", icon: "✦" },
  "application.status_changed": { label: "Status Changed", color: "#5ec4ff", icon: "⇄" },
  "application.deleted":        { label: "Deleted",        color: "#f97316", icon: "✕" },
};
const unknownMeta = { label: "Event", color: "#94a3b8", icon: "•" };

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function EventFeed({ limit = 20 }) {
  const [events, setEvents]         = useState([]);
  const [deadLetters, setDeadLetters] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [flash, setFlash]           = useState(false);
  const prevLen = useRef(0);

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/metrics/events?limit=${limit}`);
      const incoming = data.events ?? [];
      if (incoming.length > prevLen.current && prevLen.current > 0) {
        setFlash(true);
        setTimeout(() => setFlash(false), 1200);
      }
      prevLen.current = incoming.length;
      setEvents(incoming);
      setDeadLetters(data.deadLetters ?? []);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load event feed.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, POLL_MS);
    return () => clearInterval(id);
  }, [fetchEvents]);

  return (
    <div id="event-feed">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div>
          <p className="eyebrow" style={{ margin:0 }}>Event Bus</p>
          <h3 style={{ margin:0 }}>
            Live Domain Events
            {flash && <span style={{ marginLeft:10, fontSize:"0.65rem", background:"#24b47e22", color:"#24b47e", padding:"2px 8px", borderRadius:6, fontWeight:600 }}>NEW</span>}
          </h3>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {deadLetters.length > 0 && (
            <span style={{ background:"rgba(239,68,68,0.15)", color:"#ef4444", padding:"3px 10px", borderRadius:6, fontSize:"0.72rem", fontWeight:600 }}
              title="Events that exhausted all retry attempts">
              ⚠ {deadLetters.length} dead-letter{deadLetters.length !== 1 ? "s" : ""}
            </span>
          )}
          <span style={{ fontSize:"0.72rem", color:"#55637e" }}>polls every 8s</span>
        </div>
      </div>

      {loading && <p style={{ color:"#55637e", fontSize:"0.85rem" }}>Loading event stream…</p>}
      {error   && <p style={{ color:"#ef4444", fontSize:"0.85rem" }}>{error}</p>}
      {!loading && !error && events.length === 0 && (
        <p style={{ color:"#55637e", fontSize:"0.85rem" }}>
          No events yet — create or update an application to see the event bus fire.
        </p>
      )}

      {events.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:340, overflowY:"auto", paddingRight:4 }}>
          {events.map((evt) => {
            const meta = EVENT_META[evt.event] ?? unknownMeta;
            return (
              <div key={evt.id}
                style={{
                  display:"grid", gridTemplateColumns:"24px 1fr auto", gap:10,
                  alignItems:"start", padding:"10px 12px", borderRadius:10,
                  background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)",
                }}
                title={JSON.stringify(evt.payload, null, 2)}
              >
                <span style={{
                  display:"grid", placeItems:"center", width:24, height:24, borderRadius:6,
                  background:`${meta.color}22`, color:meta.color, fontWeight:700, fontSize:"0.85rem",
                }}>
                  {meta.icon}
                </span>
                <div style={{ minWidth:0 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"0.72rem", fontWeight:600, color:meta.color, background:`${meta.color}18`, padding:"1px 7px", borderRadius:5 }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize:"0.73rem", color:"#94a3b8", fontFamily:"monospace" }}>{evt.id}</span>
                  </div>
                  <p style={{ margin:"3px 0 0", fontSize:"0.82rem", color:"#cbd5e1", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {evt.payload?.companyName ? `${evt.payload.companyName} — ${evt.payload.role ?? ""}` : evt.event}
                  </p>
                </div>
                <span style={{ fontSize:"0.72rem", color:"#55637e", whiteSpace:"nowrap" }}>{timeAgo(evt.timestamp)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
