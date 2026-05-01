import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApiStatus } from "../hooks/useApiStatus";
import { useAsgardeoGroups } from "../hooks/useAsgardeoGroups";

const AppShell = () => {
  const { user, logout } = useAuth();
  const { throttlingData } = useApiStatus();
  const { role: asgardeoRole, loading: groupsLoading } = useAsgardeoGroups();

  return (
    <div className="bg-[#0A0A0A] text-on-background min-h-screen font-body-md antialiased selection:bg-primary-container selection:text-white">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full h-14 border-b border-white/5 bg-[#111111] flex items-center justify-between px-6 z-50 shadow-none">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold text-white font-h1">Stitch Smart Tracker</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-body-md text-sm tracking-tight text-gray-400">Choreo · Connected</span>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white transition-colors cursor-pointer active:opacity-80">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 relative bg-primary-container flex items-center justify-center text-white font-bold">
              {user?.picture ? (
                 <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-sm font-bold">{user?.name?.charAt(0) || "U"}</span>
               )}
            </div>
          </div>
        </div>
      </nav>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full w-[260px] border-r border-white/5 bg-[#111111] shadow-none flex flex-col py-6 space-y-2 z-40 pt-20 hidden md:flex">
        <div className="px-6 mb-6">
          <h2 className="text-2xl font-black text-white font-h1">stitch.</h2>
          <p className="text-gray-400 font-body-md text-xs tracking-wide">Smart Tracker</p>
        </div>
        
        <nav className="flex-1 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 font-body-md font-medium text-sm transition-all duration-200 ease-in-out cursor-pointer active:opacity-80 border-l-2 ${
                isActive
                  ? "border-primary-container text-primary-container bg-primary-container/10"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
                Dashboard
              </>
            )}
          </NavLink>
          
          <NavLink
            to="/applications"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 font-body-md font-medium text-sm transition-all duration-200 ease-in-out cursor-pointer active:opacity-80 border-l-2 ${
                isActive
                  ? "border-primary-container text-primary-container bg-primary-container/10"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>work</span>
                Applications
              </>
            )}
          </NavLink>
          
          <NavLink
            to="/interviews"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 font-body-md font-medium text-sm transition-all duration-200 ease-in-out cursor-pointer active:opacity-80 border-l-2 ${
                isActive
                  ? "border-primary-container text-primary-container bg-primary-container/10"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>event</span>
                Interviews
              </>
            )}
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 font-body-md font-medium text-sm transition-all duration-200 ease-in-out cursor-pointer active:opacity-80 border-l-2 ${
                isActive
                  ? "border-primary-container text-primary-container bg-primary-container/10"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>analytics</span>
                Analytics
              </>
            )}
          </NavLink>
          
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 font-body-md font-medium text-sm transition-all duration-200 ease-in-out cursor-pointer active:opacity-80 border-l-2 ${
                isActive
                  ? "border-primary-container text-primary-container bg-primary-container/10"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>person</span>
                Profile
              </>
            )}
          </NavLink>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-6 py-3 border-l-2 border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5 font-body-md font-medium text-sm transition-all duration-200 ease-in-out cursor-pointer active:opacity-80"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>logout</span>
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-[260px] pt-14">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
