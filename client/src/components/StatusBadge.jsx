import { statusOptions } from "../utils/constants";

const statusConfig = {
  Pending: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  Interviewed: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  Accepted: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  Rejected: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  Offer: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" }
};

const StatusBadge = ({ status, onChange }) => {
  const config = statusConfig[status] || { bg: "bg-neutral-500/10", text: "text-neutral-400", border: "border-neutral-500/20" };
  const baseClasses = `px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border} transition-all duration-300`;

  if (!onChange) {
    return <span className={baseClasses}>{status}</span>;
  }

  return (
    <div className="relative inline-block">
      <select 
        className={`${baseClasses} cursor-pointer appearance-none outline-none hover:brightness-110 pr-6`}
        value={status} 
        onChange={(e) => onChange(e.target.value)}
      >
        {statusOptions.map(option => (
          <option key={option} value={option} className="bg-neutral-900 text-white font-sans">{option}</option>
        ))}
      </select>
      <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[12px] opacity-70">
        expand_more
      </span>
    </div>
  );
};

export default StatusBadge;
