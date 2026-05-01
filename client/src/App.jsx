import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import AuthPage from "./pages/AuthPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import DashboardPage from "./pages/DashboardPage";
import GoogleAuthCallbackPage from "./pages/GoogleAuthCallbackPage";
import ProfilePage from "./pages/ProfilePage";
import ReviewQueuePage from "./pages/ReviewQueuePage";
import SessionManager from "./components/SessionManager";
import RateLimitBanner from "./components/RateLimitBanner";

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15121b] flex items-center justify-center">
        <span className="text-[#cfbcff] text-xs uppercase tracking-[0.2em] animate-pulse font-mono">Loading workspace...</span>
      </div>
    );
  }

  return (
    <>
      <SessionManager />
      <RateLimitBanner />
      <Routes>
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/auth/callback" element={<GoogleAuthCallbackPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="review"
            element={
              <ProtectedRoute allowedRoles={["reviewer"]}>
                <ReviewQueuePage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/auth"} replace />} />
      </Routes>
    </>
  );
};

export default App;
