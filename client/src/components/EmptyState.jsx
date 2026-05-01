import React from "react";

const EmptyState = ({ onAddFirst }) => {
  return (
    <div className="glass-card rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-all duration-700"></div>

      <div className="relative z-10 max-w-sm flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
           <span className="material-symbols-outlined text-5xl text-primary fill-1">rocket</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-on-background">Your hunt starts here</h2>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Every career-defining role begins with a single entry. Start tracking your first application now.
          </p>
        </div>

        <button 
          onClick={onAddFirst}
          className="shimmer-btn relative overflow-hidden bg-primary-container text-on-primary-container font-bold py-4 px-8 rounded-2xl shadow-xl shadow-violet-900/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Create First Entry
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
