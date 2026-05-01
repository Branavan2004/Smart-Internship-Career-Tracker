import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

vi.mock("@asgardeo/auth-react", () => ({
  AuthProvider: ({ children }) => children,
  useAuthContext: () => ({
    state: { isAuthenticated: false, isLoading: false },
    signIn: vi.fn(),
    signOut: vi.fn(),
    getBasicUserInfo: vi.fn().mockResolvedValue({}),
    getDecodedIDToken: vi.fn().mockResolvedValue({}),
    on: vi.fn()
  })
}));

import GroupBasedView from "./GroupBasedView";
import { useAsgardeoGroups } from "../hooks/useAsgardeoGroups";

vi.mock("../hooks/useAsgardeoGroups");

describe("GroupBasedView Component", () => {
  const adminView = <div data-testid="admin-view">Admin</div>;
  const reviewerView = <div data-testid="reviewer-view">Reviewer</div>;
  const studentView = <div data-testid="student-view">Student</div>;

  it("should show loader when loading", () => {
    useAsgardeoGroups.mockReturnValue({ loading: true });

    render(
      <GroupBasedView
        adminView={adminView}
        reviewerView={reviewerView}
        studentView={studentView}
      />
    );

    expect(screen.getByTestId("group-view-loader")).toBeInTheDocument();
  });

  it("should render adminView when user is admin", () => {
    useAsgardeoGroups.mockReturnValue({ loading: false, isAdmin: true, isReviewer: false });

    render(
      <GroupBasedView
        adminView={adminView}
        reviewerView={reviewerView}
        studentView={studentView}
      />
    );

    expect(screen.getByTestId("admin-view")).toBeInTheDocument();
    expect(screen.queryByTestId("student-view")).not.toBeInTheDocument();
  });

  it("should render reviewerView when user is reviewer", () => {
    useAsgardeoGroups.mockReturnValue({ loading: false, isAdmin: false, isReviewer: true });

    render(
      <GroupBasedView
        adminView={adminView}
        reviewerView={reviewerView}
        studentView={studentView}
      />
    );

    expect(screen.getByTestId("reviewer-view")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-view")).not.toBeInTheDocument();
  });

  it("should render studentView by default", () => {
    useAsgardeoGroups.mockReturnValue({ loading: false, isAdmin: false, isReviewer: false });

    render(
      <GroupBasedView
        adminView={adminView}
        reviewerView={reviewerView}
        studentView={studentView}
      />
    );

    expect(screen.getByTestId("student-view")).toBeInTheDocument();
  });
});
