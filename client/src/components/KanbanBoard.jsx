import { DragDropContext } from "@hello-pangea/dnd";
import KanbanColumn from "./KanbanColumn";
import { statusOptions } from "../utils/constants";

const KanbanBoard = ({ applications, onEdit, onStatusChange }) => {
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    
    // Trigger optimistic status update
    onStatusChange(draggableId, newStatus);
  };

  return (
    <section className="panel kanban-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Application tracker</p>
          <h2>Everything in your pipeline</h2>
        </div>
      </div>
      
      <div className="kanban-board-container">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {statusOptions.map((status) => {
              // We only want the 4 main statuses, not 'Offer' if there are 4 columns.
              // Wait, the prompt said "Four columns, one per status: Pending, Interviewed, Accepted, Rejected"
              if (status === "Offer") return null;

              const columnApps = applications.filter(
                (app) => app.status === status
              );

              return (
                <KanbanColumn
                  key={status}
                  status={status}
                  applications={columnApps}
                  onEdit={onEdit}
                />
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </section>
  );
};

export default KanbanBoard;
