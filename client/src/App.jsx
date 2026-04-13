import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./context/ToastContext";
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
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="page-loader">Loading your workspace...</div>;
  }

  return (
    <ToastProvider>
      <SessionManager />
      <RateLimitBanner />
      <Routes>
        <Route path="/auth" element={token ? <Navigate to="/" replace /> : <AuthPage />} />
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
        <Route path="*" element={<Navigate to={token ? "/" : "/auth"} replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;
