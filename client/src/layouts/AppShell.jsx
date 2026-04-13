import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApiStatus } from "../hooks/useApiStatus";

const AppShell = () => {
  const { user, logout } = useAuth();
  const { throttlingData } = useApiStatus();

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
          {user?.role === "admin" ? <NavLink to="/admin">Admin</NavLink> : null}
          {user?.role === "reviewer" ? <NavLink to="/review">Reviewer</NavLink> : null}
        </nav>

        <div className="sidebar-footer">
          <p>Signed in as</p>
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
          <span>Role: {user?.role || "student"}</span>
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
