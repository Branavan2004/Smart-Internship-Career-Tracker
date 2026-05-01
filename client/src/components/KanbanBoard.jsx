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
    onStatusChange(draggableId, newStatus);
  };

  return (
    <div className="kanban-board-container pb-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-[1000px]">
          {statusOptions.map((status) => {
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
  );
};

export default KanbanBoard;
