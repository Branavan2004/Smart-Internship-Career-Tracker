import { vi } from "vitest";
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

vi.mock("../hooks/useApiStatus", () => ({
  useApiStatus: () => ({ isOnline: true })
}));

import * as asgardeoHook from "../hooks/useAsgardeoGroups";
vi.mock("../hooks/useAsgardeoGroups");

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AppShell from "./AppShell";
import { AuthProviderMock, createAuthValue } from "../test/testUtils";

const renderShell = (role) =>
  render(
    <MemoryRouter>
      <AuthProviderMock
        value={createAuthValue({
          user: {
            _id: "user-1",
            name: "Role Tester",
            email: "role@test.com",
            role
          }
        })}
      >
        <AppShell />
      </AuthProviderMock>
    </MemoryRouter>
  );

describe("AppShell RBAC navigation", () => {
  it("hides admin and reviewer menu items for students", () => {
    asgardeoHook.useAsgardeoGroups.mockReturnValue({
      role: "student", isAdmin: false, isReviewer: false, isStudent: true, loading: false
    });
    renderShell("student");

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Reviewer")).not.toBeInTheDocument();
  });

  it("shows the admin menu item for admins", () => {
    asgardeoHook.useAsgardeoGroups.mockReturnValue({
      role: "admin", isAdmin: true, isReviewer: false, isStudent: false, loading: false
    });
    renderShell("admin");

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("shows the reviewer menu item for reviewers", () => {
    asgardeoHook.useAsgardeoGroups.mockReturnValue({
      role: "reviewer", isAdmin: false, isReviewer: true, isStudent: false, loading: false
    });
    renderShell("reviewer");

    expect(screen.getByText("Reviewer")).toBeInTheDocument();
  });
});
