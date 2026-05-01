const StatCard = ({ label, value, icon, color = "primary", isEmpty }) => {
  const iconColorMap = {
    primary: "text-primary",
    secondary: "text-secondary",
    tertiary: "text-tertiary",
    error: "text-error",
    fuchsia: "text-fuchsia-400"
  };

  return (
    <div className={`glass-card p-6 rounded-xl flex flex-col gap-2 group hover:border-violet-500/30 transition-all duration-300 ${isEmpty ? "opacity-50 grayscale" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest">{label}</span>
        {icon && <span className={`material-symbols-outlined ${iconColorMap[color] || "text-primary"} text-lg`}>{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold text-on-background">{isEmpty ? "--" : value}</span>
      </div>
    </div>
  );
};

export default StatCard;
