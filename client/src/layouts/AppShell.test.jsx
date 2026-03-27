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
    renderShell("student");

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Reviewer")).not.toBeInTheDocument();
  });

  it("shows the admin menu item for admins", () => {
    renderShell("admin");

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("shows the reviewer menu item for reviewers", () => {
    renderShell("reviewer");

    expect(screen.getByText("Reviewer")).toBeInTheDocument();
  });
});
