import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import KanbanBoard from "./KanbanBoard";

vi.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  Droppable: ({ children }) => children({
    innerRef: vi.fn(),
    droppableProps: {},
    placeholder: null
  }, {}),
  Draggable: ({ children }) => children({
    innerRef: vi.fn(),
    draggableProps: {},
    dragHandleProps: {}
  }, { isDragging: false })
}));

vi.mock("../utils/constants", () => ({
  statusOptions: ["Pending", "Interviewed", "Accepted", "Rejected"]
}));

describe("KanbanBoard Component", () => {
  const mockApplications = [
    { _id: "1", companyName: "Google", role: "SWE", status: "Pending", appliedDate: "2024-01-01" },
    { _id: "2", companyName: "Meta", role: "Frontend", status: "Interviewed", appliedDate: "2024-01-02" },
  ];

  it("renders all columns correctly", () => {
    render(<KanbanBoard applications={mockApplications} onEdit={vi.fn()} onStatusChange={vi.fn()} />);
    
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Interviewed")).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("renders applications in their respective columns", () => {
    render(<KanbanBoard applications={mockApplications} onEdit={vi.fn()} onStatusChange={vi.fn()} />);

    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("Meta")).toBeInTheDocument();
  });
});
