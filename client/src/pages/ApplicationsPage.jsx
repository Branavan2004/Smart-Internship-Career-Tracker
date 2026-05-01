import { useEffect, useState, useRef } from "react";
import apiClient from "../api/apiClient";
import ApplicationForm from "../components/ApplicationForm";
import ApplicationsTable from "../components/ApplicationsTable";
import EmptyState from "../components/EmptyState";
import { emptyApplication } from "../utils/constants";
import { useToast } from "../context/ToastContext";

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    roleType: "",
    search: ""
  });
  const [committedSearch, setCommittedSearch] = useState("");
  const searchDebounceRef = useRef(null);

  const [editingApplication, setEditingApplication] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadApplications = async (searchOverride) => {
    setLoading(true);
    const activeSearch = searchOverride !== undefined ? searchOverride : committedSearch;
    try {
      const activeFilters = {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.roleType ? { roleType: filters.roleType } : {}),
        ...(activeSearch ? { search: activeSearch } : {})
      };

      const applicationResponse = await apiClient.get("/applications", { params: activeFilters });
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
  }, [filters.status, filters.roleType, committedSearch]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setFilters(prev => ({ ...prev, search: val }));
    
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setCommittedSearch(val);
    }, 500);
  };

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

  const handleDelete = async (applicationId) => {
    if (!window.confirm("Delete this application?")) {
      return;
    }
    const previousApplications = [...applications];
    const updatedApps = applications.filter((app) => app._id !== applicationId);
    setApplications(updatedApps);

    try {
      await apiClient.delete(`/applications/${applicationId}`);
      showToast("Application deleted.");
    } catch (error) {
      setApplications(previousApplications);
      showToast("Could not delete application. Changes reverted.", "error");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-h1 text-[40px] text-white mb-2">Applications</h1>
          <p className="font-body-md text-[16px] text-on-surface-variant">Manage and track your job applications</p>
        </div>
        <button 
          onClick={() => setEditingApplication({ ...emptyApplication })}
          className="bg-primary-container text-white font-label-caps text-[12px] uppercase tracking-widest py-[16px] px-[24px] rounded-lg hover:-translate-y-[1px] transition-all flex items-center gap-[8px]"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>add</span>
          New Application
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">search</span>
          <input 
            className="w-full bg-[#1A1A1A] border border-white/[0.06] rounded-lg py-[8px] pl-10 pr-[16px] font-body-md text-white placeholder:text-on-surface-variant focus:border-primary-container outline-none transition-colors" 
            placeholder="Search companies, roles..." 
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
             <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="bg-[#1A1A1A] border border-white/[0.06] rounded-lg py-[8px] pl-[16px] pr-[32px] font-body-md text-white focus:border-primary-container outline-none min-w-[160px] appearance-none cursor-pointer"
             >
               <option value="">All Statuses</option>
               <option value="Applied">Applied</option>
               <option value="Interview">Interview</option>
               <option value="Offer">Offer</option>
               <option value="Rejected">Rejected</option>
             </select>
             <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
          </div>
          <div className="relative">
             <select 
              value={filters.roleType}
              onChange={(e) => setFilters({...filters, roleType: e.target.value})}
              className="bg-[#1A1A1A] border border-white/[0.06] rounded-lg py-[8px] pl-[16px] pr-[32px] font-body-md text-white focus:border-primary-container outline-none min-w-[160px] appearance-none cursor-pointer"
             >
               <option value="">All Roles</option>
               <option value="Software Engineering">Software Engineering</option>
               <option value="Data Science">Data Science</option>
               <option value="Product Management">Product Management</option>
             </select>
             <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative">
         {applications.length === 0 && !loading ? (
            <EmptyState onAddFirst={() => setEditingApplication({ ...emptyApplication })} />
          ) : (
            <div className="bg-[#1A1A1A] border border-white/[0.06] rounded-xl overflow-hidden">
              <ApplicationsTable 
                applications={applications} 
                onEdit={setEditingApplication} 
                onDelete={handleDelete} 
                onStatusChange={handleStatusChange}
              />
            </div>
          )}
          
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-sm rounded-xl">
              <span className="font-mono-data text-sm text-primary-container uppercase tracking-widest animate-pulse">Synchronizing...</span>
            </div>
          )}
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

export default ApplicationsPage;
