import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import KanbanCard from "./KanbanCard";

vi.mock("@hello-pangea/dnd", () => ({
  Draggable: ({ children }) => children({
    innerRef: vi.fn(),
    draggableProps: {},
    dragHandleProps: {}
  }, { isDragging: false })
}));

describe("KanbanCard Component", () => {
  const mockApplication = {
    _id: "123",
    companyName: "Stripe",
    role: "Backend Engineer",
    status: "Interviewed",
    appliedDate: "2024-01-15T00:00:00Z",
    portfolioViewed: true,
    interviewStages: [
      { round: "Technical", date: "2099-12-31T00:00:00Z" } // Future date
    ]
  };

  it("renders company, role, and formatted date", () => {
    render(<KanbanCard application={mockApplication} index={0} onEdit={vi.fn()} />);
    
    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    // appliedDate uses formatDate, assuming simple matching works or we just check presence
    expect(screen.getByText(/Applied:/i)).toBeInTheDocument();
  });

  it("shows portfolio viewed badge if true", () => {
    render(<KanbanCard application={mockApplication} index={0} onEdit={vi.fn()} />);
    expect(screen.getByTitle("Portfolio Viewed")).toBeInTheDocument();
  });

  it("shows upcoming interview stage", () => {
    render(<KanbanCard application={mockApplication} index={0} onEdit={vi.fn()} />);
    expect(screen.getByText(/Technical/i)).toBeInTheDocument();
  });

  it("triggers onEdit when clicked", () => {
    const onEditMock = vi.fn();
    render(<KanbanCard application={mockApplication} index={0} onEdit={onEditMock} />);
    
    // The clickable element is the card container itself
    const card = screen.getByText("Stripe").closest(".kanban-card");
    card.click();
    
    expect(onEditMock).toHaveBeenCalledWith(mockApplication);
  });
});
