import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

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

import { useAsgardeoGroups } from "./useAsgardeoGroups";
import apiClient from "../api/apiClient";
import { useAuth } from "./useAuth";

vi.mock("../api/apiClient");
vi.mock("./useAuth");

describe("useAsgardeoGroups hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return default student state when not authenticated", async () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    const { result } = renderHook(() => useAsgardeoGroups());

    expect(result.current.loading).toBe(false);
    expect(result.current.role).toBe("student");
    expect(result.current.isStudent).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it("should fetch groups and set admin state correctly", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    apiClient.get.mockResolvedValueOnce({
      data: { role: "admin", groups: ["Admin"], source: "asgardeo" }
    });

    const { result } = renderHook(() => useAsgardeoGroups());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.role).toBe("admin");
    expect(result.current.groups).toEqual(["Admin"]);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isReviewer).toBe(false);
    expect(result.current.isStudent).toBe(false);
  });

  it("should fetch groups and set reviewer state correctly", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    apiClient.get.mockResolvedValueOnce({
      data: { role: "reviewer", groups: ["reviewer"], source: "asgardeo" }
    });

    const { result } = renderHook(() => useAsgardeoGroups());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.role).toBe("reviewer");
    expect(result.current.isReviewer).toBe(true);
    expect(result.current.isAdmin).toBe(false);
  });

  it("should handle API errors and fallback to student", async () => {
    useAuth.mockReturnValue({ isAuthenticated: true });
    apiClient.get.mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useAsgardeoGroups());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.role).toBe("student");
    expect(result.current.isStudent).toBe(true);
  });
});
