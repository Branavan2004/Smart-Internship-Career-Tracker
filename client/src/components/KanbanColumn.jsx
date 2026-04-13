import { Droppable } from "@hello-pangea/dnd";
import KanbanCard from "./KanbanCard";

const KanbanColumn = ({ status, applications, onEdit }) => {
  return (
    <div className="kanban-column">
      <div className={`kanban-column-header kanban-header-${status.toLowerCase()}`}>
        <div className="kanban-column-title">
          <div className="kanban-status-indicator" />
          <h3>{status}</h3>
          <span className="kanban-count">{applications.length}</span>
        </div>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            className="kanban-column-content"
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              backgroundColor: snapshot.isDraggingOver ? "rgba(249, 115, 22, 0.05)" : "transparent",
            }}
          >
            {applications.length === 0 ? (
              <div className="kanban-empty-placeholder">
                No applications here
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
