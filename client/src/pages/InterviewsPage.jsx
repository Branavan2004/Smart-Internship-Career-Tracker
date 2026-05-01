import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import ApplicationForm from "../components/ApplicationForm";
import KanbanBoard from "../components/KanbanBoard";
import { emptyApplication } from "../utils/constants";
import { useToast } from "../context/ToastContext";

const InterviewsPage = () => {
  const [applications, setApplications] = useState([]);
  const [editingApplication, setEditingApplication] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadApplications = async () => {
    setLoading(true);
    try {
      const applicationResponse = await apiClient.get("/applications");
      setApplications(applicationResponse.data.applications);
    } catch (error) {
      showToast(error.response?.data?.message || "Could not fetch applications.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
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
      await loadApplications();
    } catch (error) {
      showToast(error.response?.data?.message || "Could not save application.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    const previousApplications = [...applications];
    const updatedApps = applications.map((app) => 
      app._id === applicationId ? { ...app, status: newStatus } : app
    );
    setApplications(updatedApps);

    try {
      await apiClient.patch(`/applications/${applicationId}`, { status: newStatus });
      showToast(`Status updated to ${newStatus}`);
    } catch (error) {
      setApplications(previousApplications);
      showToast("Failed to update status. Changes reverted.", "error");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-8 h-full flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-h1 text-[40px] text-white mb-2">Interviews</h1>
          <p className="font-body-md text-[16px] text-on-surface-variant">Visualize your application pipeline</p>
        </div>
        <button 
          onClick={() => setEditingApplication({ ...emptyApplication })}
          className="bg-primary-container text-white font-label-caps text-[12px] uppercase tracking-widest py-[16px] px-[24px] rounded-lg hover:-translate-y-[1px] transition-all flex items-center gap-[8px]"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>add</span>
          New Application
        </button>
      </div>

      {/* Main View Area (Kanban) */}
      <div className="relative flex-1 bg-surface-container-low/50 border border-white/[0.06] rounded-xl p-6 overflow-x-auto min-h-[500px]">
         {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-sm rounded-xl">
              <span className="font-mono-data text-sm text-primary-container uppercase tracking-widest animate-pulse">Synchronizing...</span>
            </div>
         )}
         
         <KanbanBoard
            applications={applications} 
            onEdit={setEditingApplication} 
            onStatusChange={handleStatusChange}
         />
      </div>

      {/* Drawer */}
      {editingApplication && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setEditingApplication(null)}></div>
           <aside className="relative z-50 flex flex-col p-8 h-full w-[500px] border-l border-white/[0.06] bg-[#111111] shadow-[-20px_0_60px_rgba(0,0,0,0.8)] overflow-y-auto">
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

export default InterviewsPage;
