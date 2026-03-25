import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AppShell = () => {
  const { user, logout } = useAuth();

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
        </nav>

        <div className="sidebar-footer">
          <p>Signed in as</p>
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
          <button type="button" className="ghost-button" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
