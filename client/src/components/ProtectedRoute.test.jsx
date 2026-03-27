import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProviderMock, createAuthValue } from "../test/testUtils";

describe("ProtectedRoute role handling", () => {
  it("redirects guests to the auth page", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AuthProviderMock value={createAuthValue({ token: null, user: null })}>
          <Routes>
            <Route path="/auth" element={<div>Auth Page</div>} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <div>Admin Page</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProviderMock>
      </MemoryRouter>
    );

    expect(screen.getByText("Auth Page")).toBeInTheDocument();
  });

  it("blocks users whose role is not allowed", () => {
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AuthProviderMock value={createAuthValue({ user: { role: "student" } })}>
          <Routes>
            <Route path="/" element={<div>Dashboard</div>} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <div>Admin Page</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProviderMock>
      </MemoryRouter>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("allows users whose role is allowed", () => {
    render(
      <MemoryRouter initialEntries={["/review"]}>
        <AuthProviderMock value={createAuthValue({ user: { role: "reviewer" } })}>
          <Routes>
            <Route
              path="/review"
              element={
                <ProtectedRoute allowedRoles={["reviewer"]}>
                  <div>Review Queue</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProviderMock>
      </MemoryRouter>
    );

    expect(screen.getByText("Review Queue")).toBeInTheDocument();
  });
});
