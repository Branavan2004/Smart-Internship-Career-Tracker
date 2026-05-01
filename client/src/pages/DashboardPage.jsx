import { useEffect, useRef, useState } from "react";
import apiClient from "../api/apiClient";
import ApplicationForm from "../components/ApplicationForm";
import ApplicationsTable from "../components/ApplicationsTable";
import KanbanBoard from "../components/KanbanBoard";
import EmptyState from "../components/EmptyState";
import { emptyApplication } from "../utils/constants";
import { useToast } from "../context/ToastContext";
import { recalculateAnalytics } from "../utils/analyticsHelper";
import { useAuth } from "../hooks/useAuth";
import GroupBasedView from "../components/GroupBasedView";
import AdminDashboardPage from "./AdminDashboardPage";
import ReviewQueuePage from "./ReviewQueuePage";

const StudentDashboard = () => {
  const { user } = useAuth();
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
  
  const [reminders, setReminders] = useState({ count: 0, summary: [] });
  const [editingApplication, setEditingApplication] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const applicationResponse = await apiClient.get("/applications");
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
  }, []);

  const handleSaveApplication = async (payload) => {
    const isEditing = !!editingApplication?._id;
    setSaving(true);
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
      showToast(error.response?.data?.message || "Could not save application.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono-data text-[13px] text-primary-container uppercase tracking-wider">Dashboard</span>
          </div>
          <h1 className="font-h1 text-[40px] text-white mb-2">Good morning, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
          <p className="font-body-md text-[16px] text-on-surface-variant">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • <span className="text-white">{reminders.summary.length} pending actions today</span>
          </p>
        </div>
        <button 
          onClick={() => setEditingApplication({ ...emptyApplication })}
          className="bg-primary-container hover:bg-primary-container/90 text-white font-body-sm text-[14px] font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>add</span>
          New Application
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stat 1 */}
        <div className="bg-[#1A1A1A] border border-white/[0.06] rounded-xl p-6 hover:-translate-y-0.5 hover:border-white/[0.12] transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
            </div>
          </div>
          <div className="font-body-sm text-[14px] text-on-surface-variant mb-1">Total Applications</div>
          <div className="font-h2 text-[32px] text-white">{analytics.stats.total}</div>
        </div>

        {/* Stat 2 */}
        <div className="bg-[#1A1A1A] border border-white/[0.06] rounded-xl p-6 hover:-translate-y-0.5 hover:border-white/[0.12] transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#EAB308]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#EAB308]" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
            </div>
          </div>
          <div className="font-body-sm text-[14px] text-on-surface-variant mb-1">Pending Review</div>
          <div className="font-h2 text-[32px] text-white">{analytics.stats.pending}</div>
        </div>

        {/* Stat 3 */}
        <div className="bg-[#1A1A1A] border border-white/[0.06] rounded-xl p-6 hover:-translate-y-0.5 hover:border-white/[0.12] transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#22C55E]" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
            </div>
          </div>
          <div className="font-body-sm text-[14px] text-on-surface-variant mb-1">Interviews</div>
          <div className="font-h2 text-[32px] text-white">{analytics.stats.interviewed}</div>
        </div>

        {/* Stat 4 */}
        <div className="bg-[#1A1A1A] border border-white/[0.06] rounded-xl p-6 hover:-translate-y-0.5 hover:border-white/[0.12] transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#A855F7]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#A855F7]" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            </div>
          </div>
          <div className="font-body-sm text-[14px] text-on-surface-variant mb-1">Response Rate</div>
          <div className="font-h2 text-[32px] text-white">{analytics.stats.successRate}%</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Applications */}
        <div className="lg:col-span-2">
          <div className="bg-[#1A1A1A] border border-white/[0.06] rounded-xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="font-h3 text-[24px] text-white">Recent Applications</h3>
            </div>
            <div className="overflow-x-auto">
              {applications.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="px-6 py-4 font-label-caps text-[12px] text-on-surface-variant font-medium">Company & Role</th>
                      <th className="px-6 py-4 font-label-caps text-[12px] text-on-surface-variant font-medium">Status</th>
                      <th className="px-6 py-4 font-label-caps text-[12px] text-on-surface-variant font-medium">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {applications.slice(0, 5).map((app) => (
                      <tr key={app._id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-body-md text-[16px] font-medium text-white">{app.companyName}</div>
                          <div className="font-body-sm text-[14px] text-on-surface-variant">{app.role}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-code-sm text-[12px] 
                            ${app.status === 'Applied' ? 'bg-primary-container/12 text-primary-container' : ''}
                            ${app.status === 'Interview' ? 'bg-[#22C55E]/12 text-[#4ADE80]' : ''}
                            ${app.status === 'Offer' ? 'bg-[#A855F7]/12 text-[#C084FC]' : ''}
                            ${app.status === 'Rejected' ? 'bg-[#EF4444]/12 text-[#F87171]' : ''}
                            ${!['Applied', 'Interview', 'Offer', 'Rejected'].includes(app.status) ? 'bg-white/10 text-white' : ''}
                          `}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono-data text-[13px] text-on-surface-variant">
                          {new Date(app.dateApplied).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-on-surface-variant">No applications yet. Start tracking your journey!</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Charts & Activity */}
        <div className="lg:col-span-1 space-y-6">
          {/* Pipeline Status */}
          <div className="bg-[#1A1A1A] border border-white/[0.06] rounded-xl p-6">
            <h3 className="font-h3 text-[24px] text-white mb-6">Pipeline Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-on-surface-variant font-body-sm">Pending</span>
                  <span className="text-white font-mono-data">{analytics.stats.pending}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-primary-container h-1.5 rounded-full" style={{ width: `${(analytics.stats.pending / (analytics.stats.total || 1)) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-on-surface-variant font-body-sm">Interviewing</span>
                  <span className="text-white font-mono-data">{analytics.stats.interviewed}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-[#22C55E] h-1.5 rounded-full" style={{ width: `${(analytics.stats.interviewed / (analytics.stats.total || 1)) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-on-surface-variant font-body-sm">Offers</span>
                  <span className="text-white font-mono-data">{analytics.stats.offer}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-[#A855F7] h-1.5 rounded-full" style={{ width: `${(analytics.stats.offer / (analytics.stats.total || 1)) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-on-surface-variant font-body-sm">Rejected</span>
                  <span className="text-white font-mono-data">{analytics.stats.rejected}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="bg-[#EF4444] h-1.5 rounded-full" style={{ width: `${(analytics.stats.rejected / (analytics.stats.total || 1)) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Activity (Reminders) */}
          <div className="bg-[#1A1A1A] border border-white/[0.06] rounded-xl p-6">
            <h3 className="font-h3 text-[24px] text-white mb-6">Recent Activity</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[9px] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
              {reminders.summary.slice(0,3).map((item, i) => (
                <div key={i} className="relative flex items-center justify-normal group">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[#111111] border-2 border-primary-container z-10 shrink-0"></div>
                  <div className="w-[calc(100%-2.5rem)] p-3 rounded border border-white/5 bg-white/[0.02] ml-4 text-left">
                    <p className="font-body-sm text-white font-medium">{item.companyName}</p>
                    <p className="font-body-sm text-on-surface-variant text-xs mt-1">{item.role} - {item.status}</p>
                  </div>
                </div>
              ))}
              {reminders.summary.length === 0 && (
                <p className="text-on-surface-variant text-sm ml-8">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>

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
