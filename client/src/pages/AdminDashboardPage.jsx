import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadAdminDashboard = async () => {
      try {
        const response = await apiClient.get("/admin/dashboard");
        setStats(response.data.stats);
      } catch (error) {
        setMessage(error.response?.data?.message || "Could not load admin dashboard.");
      }
    };

    loadAdminDashboard();
  }, []);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>System overview</h2>
          <p>Only admin users can view platform-level user and application metrics.</p>
        </div>
      </section>

      {message ? <p className="error-text">{message}</p> : null}

      {stats ? (
        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-accent" style={{ background: "linear-gradient(135deg, #ff7a59, #ffb347)" }} />
            <p>Total users</p>
            <h3>{stats.totalUsers}</h3>
          </article>
          <article className="stat-card">
            <div className="stat-accent" style={{ background: "linear-gradient(135deg, #5ec4ff, #2a9d8f)" }} />
            <p>Total applications</p>
            <h3>{stats.totalApplications}</h3>
          </article>
          <article className="stat-card">
            <div className="stat-accent" style={{ background: "linear-gradient(135deg, #24b47e, #a7f3d0)" }} />
            <p>Admins</p>
            <h3>{stats.adminCount}</h3>
          </article>
          <article className="stat-card">
            <div className="stat-accent" style={{ background: "linear-gradient(135deg, #f15bb5, #ff99c8)" }} />
            <p>Reviewers</p>
            <h3>{stats.reviewerCount}</h3>
          </article>
        </section>
      ) : null}
    </div>
  );
};

export default AdminDashboardPage;
