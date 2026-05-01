import { vi } from "vitest";
import "@testing-library/jest-dom";

// Mock global Worker for Asgardeo SDK
class WorkerMock {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {};
  }
  postMessage(msg) {}
  terminate() {}
}

global.Worker = WorkerMock;
window.Worker = WorkerMock;

// Globally mock @asgardeo/auth-react to prevent initialization errors in jsdom
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

