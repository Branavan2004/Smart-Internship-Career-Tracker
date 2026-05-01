import { Draggable } from "@hello-pangea/dnd";
import { formatDate } from "../utils/formatters";

const cardStatusStyles = {
  Pending: "hover:border-amber-500/30",
  Interviewed: "hover:border-blue-500/30",
  Accepted: "hover:border-emerald-500/30",
  Rejected: "hover:border-rose-500/30"
};

const KanbanCard = ({ application, index, onEdit }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingStages = (application.interviewStages || [])
    .filter((stage) => stage.date && new Date(stage.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const nextStage = upcomingStages[0] || null;

  return (
    <Draggable draggableId={application._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(application)}
          className={`glass-card p-4 rounded-xl cursor-pointer transition-all duration-300 border-transparent hover:scale-[1.02] active:scale-95 active:rotate-1 ${
            cardStatusStyles[application.status]
          } ${snapshot.isDragging ? "shadow-2xl ring-2 ring-violet-500/50" : ""}`}
          style={{ ...provided.draggableProps.style }}
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-bold text-on-background">{application.companyName}</span>
            {application.portfolioViewed && (
              <span className="material-symbols-outlined text-emerald-400 text-[16px] fill-1" title="Portfolio Viewed">
                visibility
              </span>
            )}
          </div>
          
          <div className="text-xs text-neutral-400 font-medium mb-4 truncate">
            {application.role}
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
              {formatDate(application.appliedDate)}
            </div>
            
            {nextStage && (
              <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-lg border border-white/5">
                <span className="material-symbols-outlined text-secondary text-[12px]">event</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-secondary truncate">
                  {nextStage.round} ({formatDate(nextStage.date)})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
