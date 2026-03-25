import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import apiClient from "../api/apiClient";
import ApplicationForm from "../components/ApplicationForm";
import ApplicationsTable from "../components/ApplicationsTable";
import StatCard from "../components/StatCard";
import { emptyApplication, roleTypeOptions, statusOptions } from "../utils/constants";

const chartColors = ["#ff7a59", "#ffb347", "#5ec4ff", "#24b47e", "#f15bb5", "#6a4c93"];

const DashboardPage = () => {
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState({
    stats: {
      total: 0,
      pending: 0,
      interviewed: 0,
      accepted: 0,
      rejected: 0,
      offer: 0,
      portfolioViewed: 0,
      successRate: 0
    },
    roleBreakdown: [],
    rejectionReasons: []
  });
  const [filters, setFilters] = useState({
    status: "",
    roleType: "",
    search: ""
  });
  const [reminders, setReminders] = useState({ count: 0, summary: [] });
  const [editingApplication, setEditingApplication] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const applicationResponse = await apiClient.get("/applications", {
        params: Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value)
        )
      });
      const [analyticsResponse, reminderResponse] = await Promise.all([
        apiClient.get("/analytics"),
        apiClient.get("/reminders")
      ]);

      setApplications(applicationResponse.data.applications);
      setAnalytics(analyticsResponse.data);
      setReminders(reminderResponse.data);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not refresh dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [filters.status, filters.roleType, filters.search]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSaveApplication = async (payload) => {
    setSaving(true);
    setMessage("");

    try {
      if (editingApplication?._id) {
        await apiClient.put(`/applications/${editingApplication._id}`, payload);
        setMessage("Application updated.");
      } else {
        await apiClient.post("/applications", payload);
        setMessage("Application added.");
      }

      setEditingApplication(null);
      await loadDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not save application.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (applicationId) => {
    if (!window.confirm("Delete this application?")) {
      return;
    }

    try {
      await apiClient.delete(`/applications/${applicationId}`);
      setMessage("Application deleted.");
      if (editingApplication?._id === applicationId) {
        setEditingApplication(null);
      }
      await loadDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not delete application.");
    }
  };

  const handleSendReminder = async () => {
    try {
      const response = await apiClient.post("/reminders/send");
      setMessage(`${response.data.message} ${response.data.digest.count} item(s) included.`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not generate reminders.");
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Your internship search at a glance</h2>
          <p>
            Track outcomes, monitor interviews, and keep notes close to the application that generated them.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" className="secondary-button" onClick={() => setEditingApplication({ ...emptyApplication })}>
            New application
          </button>
          <button type="button" className="ghost-button" onClick={handleSendReminder}>
            Simulate reminder email
          </button>
        </div>
      </section>

      {message ? <p className="success-text">{message}</p> : null}

      <section className="stats-grid">
        <StatCard label="Total applications" value={analytics.stats.total} accent="linear-gradient(135deg, #ff7a59, #ffd166)" />
        <StatCard label="Pending" value={analytics.stats.pending} accent="linear-gradient(135deg, #ffd166, #f4a261)" />
        <StatCard label="Interviewed" value={analytics.stats.interviewed} accent="linear-gradient(135deg, #5ec4ff, #2a9d8f)" />
        <StatCard label="Success rate" value={`${analytics.stats.successRate}%`} accent="linear-gradient(135deg, #24b47e, #a7f3d0)" />
      </section>

      <section className="panel filter-panel">
        <div className="section-title-row">
          <h3>Filters</h3>
        </div>
        <div className="field-grid">
          <label>
            Search
            <input name="search" value={filters.search} onChange={handleFilterChange} placeholder="Company or role" />
          </label>
          <label>
            Status
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Role type
            <select name="roleType" value={filters.roleType} onChange={handleFilterChange}>
              <option value="">All</option>
              {roleTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {editingApplication ? (
        <ApplicationForm
          initialValues={editingApplication._id ? editingApplication : null}
          onSubmit={handleSaveApplication}
          onCancel={() => setEditingApplication(null)}
          saving={saving}
        />
      ) : null}

      <section className="chart-grid">
        <article className="panel chart-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Role breakdown</p>
              <h2>Where you are applying</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics.roleBreakdown}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {analytics.roleBreakdown.map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="panel chart-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Rejection signals</p>
              <h2>Why applications stall</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={analytics.rejectionReasons.length ? analytics.rejectionReasons : [{ name: "No data yet", value: 1 }]}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {(analytics.rejectionReasons.length ? analytics.rejectionReasons : [{ name: "No data yet", value: 1 }]).map((entry, index) => (
                  <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Upcoming reminders</p>
            <h2>{reminders.count} item(s) need attention this week</h2>
          </div>
        </div>

        {reminders.summary.length === 0 ? (
          <p className="muted-text">No interviews or follow-ups scheduled in the next 7 days.</p>
        ) : (
          <div className="reminder-list">
            {reminders.summary.map((item) => (
              <article className="reminder-card" key={`${item.companyName}-${item.role}`}>
                <strong>{item.companyName}</strong>
                <span>{item.role}</span>
                <small>{item.status}</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <ApplicationsTable applications={applications} onEdit={setEditingApplication} onDelete={handleDelete} />

      {loading ? <p className="muted-text">Refreshing dashboard data...</p> : null}
    </div>
  );
};

export default DashboardPage;
