import { Draggable } from "@hello-pangea/dnd";
import { formatDate } from "../utils/formatters";

const KanbanCard = ({ application, index, onEdit }) => {
  // Find the next upcoming stage to display
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
          className={`kanban-card kanban-card-${application.status.toLowerCase()}`}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.7 : 1,
          }}
          onClick={() => onEdit(application)}
        >
          <div className="kanban-card-header">
            <strong>{application.companyName}</strong>
            {application.portfolioViewed && (
              <span className="kanban-badge-viewed" title="Portfolio Viewed">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </span>
            )}
          </div>
          
          <div className="kanban-card-role">{application.role}</div>
          
          <div className="kanban-card-meta">
            <span>Applied: {formatDate(application.appliedDate)}</span>
            {nextStage && (
              <span className="kanban-next-step">
                {nextStage.round} ({formatDate(nextStage.date)})
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
