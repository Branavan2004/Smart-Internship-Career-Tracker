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
import { emptyApplication } from "../utils/constants";
import { useToast } from "../context/ToastContext";
import { recalculateAnalytics } from "../utils/analyticsHelper";

import GroupBasedView from "../components/GroupBasedView";
import AdminDashboardPage from "./AdminDashboardPage";
import ReviewQueuePage from "./ReviewQueuePage";

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

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.roleType, committedSearch]);

  const handleSaveApplication = async (payload) => {
    const isEditing = !!editingApplication?._id;
    setSaving(true);

    let previousApplications = null;
    let previousAnalytics = null;

    if (isEditing) {
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
    <div className="flex flex-col">
      {/* Dashboard Header */}
      <div className="flex flex-col mb-10">
        <span className="font-mono-sm text-primary uppercase tracking-[0.2em] mb-2">Workspace / Analytics</span>
        <h1 className="font-h1 text-on-background">Performance Overview</h1>
      </div>

      {/* Key Metrics Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="glass-card p-6 rounded-xl flex flex-col gap-2 group hover:border-violet-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Total Applications</span>
            <span className="material-symbols-outlined text-primary text-lg">trending_up</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl">{analytics.stats.total}</span>
            <span className="text-xs text-tertiary font-bold">+12%</span>
          </div>
        </div>
        
        <div className="glass-card p-6 rounded-xl flex flex-col gap-2 group hover:border-violet-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Pending Response</span>
            <span className="material-symbols-outlined text-secondary text-lg">bolt</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl">{analytics.stats.pending}</span>
            <span className="text-xs text-tertiary font-bold">+5%</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl flex flex-col gap-2 group hover:border-violet-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Interview Invites</span>
            <span className="material-symbols-outlined text-fuchsia-400 text-lg">mail</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl">{analytics.stats.interviewed}</span>
            <span className="text-xs text-neutral-400 font-bold">Stable</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl flex flex-col gap-2 group hover:border-violet-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Success Rate</span>
            <span className="material-symbols-outlined text-tertiary text-lg">star</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl">{analytics.stats.successRate}%</span>
            <span className="text-xs text-error font-bold">-1.2%</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        <div className="lg:col-span-8 glass-card rounded-2xl p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-h3 text-on-background">Role breakdown</h3>
              <p className="text-neutral-500 text-xs">Submission trends by category</p>
            </div>
            <div className="flex gap-2">
               <button 
                onClick={() => setViewMode(viewMode === 'table' ? 'board' : 'table')}
                className="bg-white/5 border border-white/10 rounded-lg text-xs font-mono-sm py-1 px-3 hover:bg-white/10 transition-colors"
               >
                 Switch to {viewMode === 'table' ? 'Board' : 'Table'}
               </button>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.roleBreakdown}>
                   <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#888', fontSize: 10, fontWeight: 'bold'}}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#888', fontSize: 10}}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(19, 19, 19, 0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(210, 187, 255, 0.3)', borderRadius: '12px' }}
                    itemStyle={{ color: '#cfbcff' }}
                  />
                  <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 glass-card rounded-2xl p-8 flex flex-col">
          <h3 className="font-h3 text-on-background mb-1">Application Funnel</h3>
          <p className="text-neutral-500 text-xs mb-10">Current pipeline status breakdown</p>
          
          <div className="relative w-48 h-48 mx-auto mb-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Pending", value: analytics.stats.pending }, 
                    { name: "Interview", value: analytics.stats.interviewed }, 
                    { name: "Offer", value: analytics.stats.offer }
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#7c3aed" />
                  <Cell fill="#adc6ff" />
                  <Cell fill="#dfed1a" />
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(19, 19, 19, 0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(210, 187, 255, 0.3)', borderRadius: '12px' }}
                  itemStyle={{ color: '#cfbcff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display text-3xl text-on-background">{analytics.stats.total}</span>
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">Total</span>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(124,58,237,0.4)]"></div>
                <span className="text-sm font-medium">Pending</span>
              </div>
              <span className="font-mono-sm text-neutral-300">{analytics.stats.pending}</span>
            </div>
            <div className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(173,198,255,0.4)]"></div>
                <span className="text-sm font-medium">Interview</span>
              </div>
              <span className="font-mono-sm text-neutral-300">{analytics.stats.interviewed}</span>
            </div>
            <div className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(223,237,26,0.4)]"></div>
                <span className="text-sm font-medium">Offer</span>
              </div>
              <span className="font-mono-sm text-neutral-300">{analytics.stats.offer}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-1 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Application Mix</h4>
            <span className="material-symbols-outlined text-neutral-500">lightbulb</span>
          </div>
          <div className="space-y-6">
            {analytics.roleBreakdown.map((item) => (
              <div className="space-y-2" key={item.name}>
                <div className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="text-neutral-400 text-xs">
                    {Math.round((item.value / (analytics.stats.total || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-full transition-all duration-500" 
                    style={{ width: `${(item.value / (analytics.stats.total || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Upcoming Timeline</h4>
            <button className="text-[10px] text-primary hover:underline uppercase font-bold tracking-widest" onClick={handleSendReminder}>
              Trigger Digest
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reminders.summary.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-all">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                  <span className="material-symbols-outlined text-secondary">
                    {item.status.includes("Interview") ? "corporate_fare" : "event"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-1 truncate max-w-[150px]">{item.companyName}</p>
                  <p className="text-[10px] text-neutral-500 font-mono-sm flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.status.includes("Interview") ? "bg-tertiary/50" : "bg-neutral-600"}`}></span> 
                    {item.role} • {item.status}
                  </p>
                </div>
              </div>
            ))}
            {reminders.summary.length === 0 && (
              <div className="col-span-2 py-8 text-center text-neutral-500 text-sm italic">
                No scheduled activities for the coming week.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main View Area (Table or Board) */}
      <div className="relative">
         {applications.length === 0 && !loading ? (
            <EmptyState onAddFirst={() => setEditingApplication({ ...emptyApplication })} />
          ) : viewMode === 'table' ? (
            <div className="glass-card rounded-2xl overflow-hidden">
              <ApplicationsTable 
                applications={applications} 
                onEdit={setEditingApplication} 
                onDelete={handleDelete} 
                onStatusChange={handleStatusChange}
              />
            </div>
          ) : (
            <KanbanBoard
              applications={applications} 
              onEdit={setEditingApplication} 
              onStatusChange={handleStatusChange}
            />
          )}
          
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-950/40 backdrop-blur-sm rounded-2xl">
              <span className="font-mono-sm text-sm text-primary">Synchronizing...</span>
            </div>
          )}
      </div>

      {/* Drawer implementation for Adding/Editing */}
      {editingApplication && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setEditingApplication(null)}></div>
           <aside className="relative z-50 flex flex-col p-8 h-full w-[500px] border-l border-white/10 bg-neutral-900/95 backdrop-blur-3xl shadow-[-20px_0_60px_rgba(0,0,0,0.8)] overflow-y-auto">
              <ApplicationForm
                initialValues={editingApplication._id ? editingApplication : null}
                onSubmit={handleSaveApplication}
                onCancel={() => setEditingApplication(null)}
                saving={saving}
              />
           </aside>
        </div>
      )}
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
