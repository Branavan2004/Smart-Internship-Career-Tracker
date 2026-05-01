import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApiStatus } from "../hooks/useApiStatus";
import { useAsgardeoGroups } from "../hooks/useAsgardeoGroups";

const AppShell = () => {
  const { user, logout } = useAuth();
  const { throttlingData } = useApiStatus();
  const { role: asgardeoRole, isAdmin, isReviewer, loading: groupsLoading } = useAsgardeoGroups();

  const getRoleBadgeColor = () => {
    if (isAdmin) return "#ef4444"; // red
    if (isReviewer) return "#3b82f6"; // blue
    return "#10b981"; // green
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="brand-kicker">Career command center</p>
          <h1>Smart Internship Tracker</h1>
          <p className="sidebar-copy">
            Keep every application, interview stage, portfolio link, and follow-up in one place.
          </p>
        </div>

        <nav className="nav-links">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/profile">Profile</NavLink>
          {isAdmin ? <NavLink to="/admin">Admin</NavLink> : null}
          {isReviewer ? <NavLink to="/review">Reviewer</NavLink> : null}
        </nav>

        <div className="sidebar-footer">
          <p>Signed in as</p>
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
          <div style={{ marginTop: "12px", marginBottom: "12px" }}>
            {groupsLoading ? (
              <span style={{ fontSize: "12px", opacity: 0.7 }}>Loading permissions...</span>
            ) : (
              <span 
                style={{
                  backgroundColor: getRoleBadgeColor(),
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textTransform: "uppercase"
                }}
              >
                {asgardeoRole}
              </span>
            )}
          </div>
          <button type="button" className="ghost-button" onClick={logout}>
            Log out
          </button>
        </div>

        {throttlingData?.limit > 0 && user?.role === "admin" && (
          <div className="sidebar-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
            <p style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>API CAPACITY</p>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ 
                height: '100%', 
                background: '#f97316', 
                width: `${Math.min((throttlingData.remaining / throttlingData.limit) * 100, 100)}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <span style={{ fontSize: '12px' }}>{throttlingData.remaining} / {throttlingData.limit} calls left</span>
          </div>
        )}
      </aside>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
