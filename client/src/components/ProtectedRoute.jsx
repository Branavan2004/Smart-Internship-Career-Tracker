import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15121b] flex items-center justify-center">
        <span className="text-[#cfbcff] text-xs uppercase tracking-[0.2em] animate-pulse font-mono">Checking access...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
