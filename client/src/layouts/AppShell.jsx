import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApiStatus } from "../hooks/useApiStatus";
import { useAsgardeoGroups } from "../hooks/useAsgardeoGroups";

const AppShell = () => {
  const { user, logout } = useAuth();
  const { throttlingData } = useApiStatus();
  const { role: asgardeoRole, isAdmin, isReviewer, loading: groupsLoading } = useAsgardeoGroups();

  const getRoleBadgeColor = () => {
    if (isAdmin) return "from-red-500/20 to-red-600/10 text-red-400 border-red-500/50";
    if (isReviewer) return "from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/50";
    return "from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/50";
  };

  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden min-h-screen">
      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full z-40 flex flex-col w-64 border-r border-white/5 bg-neutral-950/60 backdrop-blur-lg shadow-2xl shadow-black/50">
        <div className="p-6 flex items-center gap-3">
          <span className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">
            CareerPath
          </span>
        </div>

        <div className="px-4 mb-8">
          <button className="shimmer-btn relative overflow-hidden w-full bg-primary-container text-on-primary-container font-h3 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="text-sm">New Application</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `font-sans text-sm font-medium flex items-center gap-3 px-6 py-3 transition-all duration-300 ease-in-out hover:translate-x-1 ${
                isActive
                  ? "bg-gradient-to-r from-violet-500/10 to-transparent text-violet-400 border-l-2 border-violet-500"
                  : "text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
              }`
            }
          >
            <span className="material-symbols-outlined">dashboard</span>
            Dashboard
          </NavLink>
          
          <NavLink
            to="/applications"
            className={({ isActive }) =>
              `font-sans text-sm font-medium flex items-center gap-3 px-6 py-3 transition-all duration-300 ease-in-out hover:translate-x-1 ${
                isActive
                  ? "bg-gradient-to-r from-violet-500/10 to-transparent text-violet-400 border-l-2 border-violet-500"
                  : "text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
              }`
            }
          >
            <span className="material-symbols-outlined">work</span>
            Applications
          </NavLink>

          {isReviewer && (
             <NavLink
              to="/review"
              className={({ isActive }) =>
                `font-sans text-sm font-medium flex items-center gap-3 px-6 py-3 transition-all duration-300 ease-in-out hover:translate-x-1 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500/10 to-transparent text-blue-400 border-l-2 border-blue-500"
                    : "text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
                }`
              }
            >
              <span className="material-symbols-outlined">event_available</span>
              Review Queue
            </NavLink>
          )}

          {isAdmin && (
             <NavLink
              to="/admin"
              className={({ isActive }) =>
                `font-sans text-sm font-medium flex items-center gap-3 px-6 py-3 transition-all duration-300 ease-in-out hover:translate-x-1 ${
                  isActive
                    ? "bg-gradient-to-r from-red-500/10 to-transparent text-red-400 border-l-2 border-red-500"
                    : "text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
                }`
              }
            >
              <span className="material-symbols-outlined">settings</span>
              Admin Control
            </NavLink>
          )}

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `font-sans text-sm font-medium flex items-center gap-3 px-6 py-3 transition-all duration-300 ease-in-out hover:translate-x-1 ${
                isActive
                  ? "bg-gradient-to-r from-violet-500/10 to-transparent text-violet-400 border-l-2 border-violet-500"
                  : "text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
              }`
            }
          >
            <span className="material-symbols-outlined">menu_book</span>
            Resources
          </NavLink>
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4 pb-8">
          <div className="px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-white/10 bg-surface-variant flex items-center justify-center overflow-hidden">
               {user?.picture ? (
                 <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-sm font-bold">{user?.name?.charAt(0)}</span>
               )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-on-background truncate">{user?.name}</p>
              <div className="flex items-center gap-2">
                 <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded border bg-gradient-to-r ${getRoleBadgeColor()}`}>
                   {groupsLoading ? "..." : asgardeoRole}
                 </span>
                 {throttlingData?.limit > 0 && (
                   <span className="text-[9px] text-neutral-500 font-mono">
                     {throttlingData.remaining} left
                   </span>
                 )}
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full text-neutral-500 flex items-center gap-3 px-6 py-3 transition-colors hover:bg-white/5 hover:text-neutral-200"
          >
            <span className="material-symbols-outlined">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* TopAppBar */}
      <header className="fixed top-0 right-0 left-64 flex justify-between items-center px-8 h-16 z-30 bg-neutral-950/40 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center flex-1 max-w-xl">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">search</span>
            <input 
              className="w-full bg-white/5 border-none rounded-lg pl-10 text-sm focus:ring-1 focus:ring-violet-500/50 placeholder:text-neutral-600 outline-none" 
              placeholder="Search applications..." 
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button className="text-neutral-400 hover:text-violet-300 transition-colors scale-95 active:scale-100">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-neutral-400 hover:text-violet-300 transition-colors scale-95 active:scale-100">
              <span className="material-symbols-outlined">apps</span>
            </button>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <span className="font-mono-sm text-neutral-500 text-[11px] uppercase tracking-tighter">System: Stable</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-64 pt-24 pb-12 px-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
