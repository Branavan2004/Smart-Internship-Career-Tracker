import { Droppable } from "@hello-pangea/dnd";
import KanbanCard from "./KanbanCard";

const columnStyles = {
  Pending: { accent: "bg-amber-500", shadow: "shadow-amber-500/20" },
  Interviewed: { accent: "bg-blue-500", shadow: "shadow-blue-500/20" },
  Accepted: { accent: "bg-emerald-500", shadow: "shadow-emerald-500/20" },
  Rejected: { accent: "bg-rose-500", shadow: "shadow-rose-500/20" }
};

const KanbanColumn = ({ status, applications, onEdit }) => {
  const style = columnStyles[status] || { accent: "bg-neutral-500", shadow: "" };

  return (
    <div className="flex flex-col h-full bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${style.accent} ${style.shadow} animate-pulse`} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">{status}</h3>
          </div>
          <span className="text-[10px] font-mono font-bold bg-white/5 px-2 py-0.5 rounded-full text-neutral-500">
            {applications.length}
          </span>
        </div>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            className={`flex-1 p-3 flex flex-col gap-3 min-h-[500px] transition-colors duration-200 ${snapshot.isDraggingOver ? "bg-white/[0.04]" : ""}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {applications.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/5 rounded-xl opacity-50 grayscale">
                <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest">Empty</p>
              </div>
            ) : (
              applications.map((app, index) => (
                <KanbanCard
                  key={app._id}
                  application={app}
                  index={index}
                  onEdit={onEdit}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
