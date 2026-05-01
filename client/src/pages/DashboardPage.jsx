import { useEffect, useRef, useState } from "react";
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
import KanbanBoard from "../components/KanbanBoard";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import { emptyApplication, roleTypeOptions, statusOptions } from "../utils/constants";
import { useToast } from "../context/ToastContext";
import { recalculateAnalytics } from "../utils/analyticsHelper";

import GroupBasedView from "../components/GroupBasedView";
import AdminDashboardPage from "./AdminDashboardPage";
import ReviewQueuePage from "./ReviewQueuePage";

const chartColors = ["#ff7a59", "#ffb347", "#5ec4ff", "#24b47e", "#f15bb5", "#6a4c93"];

const StudentDashboard = () => {
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

  // Bug #6: We keep a separate "committed" search that only updates after debounce
  const [committedSearch, setCommittedSearch] = useState("");
  const searchDebounceRef = useRef(null);

  const [reminders, setReminders] = useState({ count: 0, summary: [] });
  const [editingApplication, setEditingApplication] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("careerTrackerViewMode") || "table");
  const { showToast } = useToast();

  useEffect(() => {
    localStorage.setItem("careerTrackerViewMode", viewMode);
  }, [viewMode]);

  const loadDashboard = async (searchOverride) => {
    setLoading(true);

    const activeSearch = searchOverride !== undefined ? searchOverride : committedSearch;

    try {
      const activeFilters = {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.roleType ? { roleType: filters.roleType } : {}),
        ...(activeSearch ? { search: activeSearch } : {})
      };

      const applicationResponse = await apiClient.get("/applications", { params: activeFilters });
      const [analyticsResponse, reminderResponse] = await Promise.all([
        apiClient.get("/analytics"),
        apiClient.get("/reminders")
      ]);

      setApplications(applicationResponse.data.applications);
      setAnalytics(analyticsResponse.data);
      setReminders(reminderResponse.data);
    } catch (error) {
      showToast(error.response?.data?.message || "Could not refresh dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Bug #6: Only fire on committed search + select filters, not on every keystroke
  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.roleType, committedSearch]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    if (name === "search") {
      // Update local display immediately, but debounce the API call
      setFilters((current) => ({ ...current, search: value }));
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        setCommittedSearch(value);
      }, 400);
    } else {
      // Status / roleType selects fire immediately
      setFilters((current) => ({ ...current, [name]: value }));
    }
  };

  const handleSaveApplication = async (payload) => {
    const isEditing = !!editingApplication?._id;
    setSaving(true);

    let previousApplications = null;
    let previousAnalytics = null;

    if (isEditing) {
      // Optimistic update for edits
      previousApplications = [...applications];
      previousAnalytics = { ...analytics };

      const updatedApps = applications.map((app) => 
        app._id === editingApplication._id ? { ...app, ...payload } : app
      );
      setApplications(updatedApps);
      setAnalytics(recalculateAnalytics(updatedApps));
    }

    try {
      if (isEditing) {
        await apiClient.put(`/applications/${editingApplication._id}`, payload);
        showToast("Application updated.");
      } else {
        await apiClient.post("/applications", payload);
        showToast("Application added.");
      }

      setEditingApplication(null);
      await loadDashboard();
    } catch (error) {
      if (isEditing) {
        setApplications(previousApplications);
        setAnalytics(previousAnalytics);
      }
      showToast(error.response?.data?.message || "Could not save application.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    const previousApplications = [...applications];
    const previousAnalytics = { ...analytics };

    // Optimistically update
    const updatedApps = applications.map((app) => 
      app._id === applicationId ? { ...app, status: newStatus } : app
    );
    setApplications(updatedApps);
    setAnalytics(recalculateAnalytics(updatedApps));

    try {
      await apiClient.patch(`/applications/${applicationId}`, { status: newStatus });
      showToast(`Status updated to ${newStatus}`);
    } catch (error) {
      setApplications(previousApplications);
      setAnalytics(previousAnalytics);
      showToast("Failed to update status. Changes reverted.", "error");
    }
  };

  const handleDelete = async (applicationId) => {
    if (!window.confirm("Delete this application?")) {
      return;
    }

    const previousApplications = [...applications];
    const previousAnalytics = { ...analytics };

    // Optimistically update
    const updatedApps = applications.filter((app) => app._id !== applicationId);
    setApplications(updatedApps);
    setAnalytics(recalculateAnalytics(updatedApps));

    try {
      await apiClient.delete(`/applications/${applicationId}`);
      showToast("Application deleted.");
    } catch (error) {
      setApplications(previousApplications);
      setAnalytics(previousAnalytics);
      showToast("Could not delete application. Changes reverted.", "error");
    }
  };

  // Bug #9: Safely read the nested count and display it correctly
  const handleSendReminder = async () => {
    try {
      const response = await apiClient.post("/reminders/send");
      const count = response.data?.digest?.count ?? 0;
      showToast(`Reminder generated. ${count} item(s) included.`);
    } catch (error) {
      showToast(error.response?.data?.message || "Could not generate reminders.", "error");
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

      <section className="stats-grid">
        <StatCard label="Total applications" value={analytics.stats.total} accent="linear-gradient(135deg, #ff7a59, #ffd166)" isEmpty={applications.length === 0} />
        <StatCard label="Pending" value={analytics.stats.pending} accent="linear-gradient(135deg, #ffd166, #f4a261)" isEmpty={applications.length === 0} />
        <StatCard label="Interviewed" value={analytics.stats.interviewed} accent="linear-gradient(135deg, #5ec4ff, #2a9d8f)" isEmpty={applications.length === 0} />
        <StatCard label="Success rate" value={`${analytics.stats.successRate}%`} accent="linear-gradient(135deg, #24b47e, #a7f3d0)" isEmpty={applications.length === 0} />
      </section>

      <section className="panel filter-panel">
        <div className="section-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Filters</h3>
          <div className="view-toggle" style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button"
              className="view-toggle-btn"
              style={{
                background: viewMode === 'table' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                color: viewMode === 'table' ? '#f97316' : '#55637e',
                border: `1px solid ${viewMode === 'table' ? '#f97316' : 'rgba(255,255,255,0.1)'}`,
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
            <button 
              type="button"
              className="view-toggle-btn"
              style={{
                background: viewMode === 'board' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                color: viewMode === 'board' ? '#f97316' : '#55637e',
                border: `1px solid ${viewMode === 'board' ? '#f97316' : 'rgba(255,255,255,0.1)'}`,
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setViewMode('board')}
              title="Board View"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            </button>
          </div>
        </div>
        <div className="field-grid">
          <label>
            Search
            {/* Bug #6: value comes from display state (filters.search), not committed state */}
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

      {/* Bug #11: Loading indicator sits inside the table section, not after it */}
      <div style={{ position: "relative" }}>
        {applications.length === 0 && !loading ? (
          <EmptyState onAddFirst={() => setEditingApplication({ ...emptyApplication })} />
        ) : viewMode === 'table' ? (
          <ApplicationsTable 
            applications={applications} 
            onEdit={setEditingApplication} 
            onDelete={handleDelete} 
            onStatusChange={handleStatusChange}
          />
        ) : (
          <KanbanBoard
            applications={applications} 
            onEdit={setEditingApplication} 
            onStatusChange={handleStatusChange}
          />
        )}
        {loading ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: "28px",
              background: "rgba(248, 251, 255, 0.72)",
              backdropFilter: "blur(4px)",
              fontSize: "0.95rem",
              color: "#55637e"
            }}
          >
            Refreshing…
          </div>
        ) : null}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  return (
    <GroupBasedView
      adminView={<AdminDashboardPage />}
      reviewerView={<ReviewQueuePage />}
      studentView={<StudentDashboard />}
    />
  );
};

export default DashboardPage;
