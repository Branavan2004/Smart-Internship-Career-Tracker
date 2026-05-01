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
import ApplicationsPage from "./pages/ApplicationsPage";
import InterviewsPage from "./pages/InterviewsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <span className="text-primary-container text-xs uppercase tracking-[0.2em] animate-pulse font-mono-data">Loading workspace...</span>
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
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="interviews" element={<InterviewsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
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
