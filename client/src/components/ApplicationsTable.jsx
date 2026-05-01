import { formatDate } from "../utils/formatters";
import StatusBadge from "./StatusBadge";

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const ApplicationsTable = ({ applications, onEdit, onDelete, onStatusChange }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 bg-white/[0.02]">
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Company</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Role</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Status</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Timeline</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Next Step</th>
            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {applications.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-6 py-12 text-center text-sm text-neutral-500 italic">
                No applications yet. Add your first opportunity above.
              </td>
            </tr>
          ) : null}

          {applications.map((application) => {
            const upcomingStages = (application.interviewStages || [])
              .filter((stage) => stage.date && new Date(stage.date) >= TODAY)
              .sort((a, b) => new Date(a.date) - new Date(b.date));
            const nextStage = upcomingStages[0] || null;

            return (
              <tr key={application._id} className="hover:bg-white/[0.03] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-on-background group-hover:text-primary transition-colors">{application.companyName}</span>
                    <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-tighter">{application.roleType}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-neutral-300">
                  {application.role}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge 
                    status={application.status} 
                    onChange={(newStatus) => onStatusChange(application._id, newStatus)} 
                  />
                </td>
                <td className="px-6 py-4">
                   <div className="flex flex-col">
                    <span className="text-xs text-neutral-300 font-medium">Applied {formatDate(application.appliedDate)}</span>
                    {application.portfolioViewed && (
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span> Viewed
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {nextStage ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-secondary font-bold">{nextStage.round}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">{formatDate(nextStage.date)}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-neutral-600 font-mono">No steps</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onEdit(application)}
                      className="p-2 hover:bg-violet-500/10 hover:text-violet-400 rounded-lg transition-all text-neutral-500"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button 
                      onClick={() => onDelete(application._id)}
                      className="p-2 hover:bg-error/10 hover:text-error rounded-lg transition-all text-neutral-500"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ApplicationsTable;
