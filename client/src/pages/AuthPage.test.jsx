import { render, screen, fireEvent } from "@testing-library/react";
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

import { MemoryRouter } from "react-router-dom";
import AuthPage from "./AuthPage";
import * as AuthHook from "../hooks/useAuth";

// Mock the useAuth hook
vi.mock("../hooks/useAuth");

describe("AuthPage Component", () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    AuthHook.useAuth.mockReturnValue({
      login: mockLogin,
      register: mockRegister,
    });
  });

  it("renders login form by default", () => {
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Login", { selector: "button.primary-button" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.queryByLabelText("Full name")).not.toBeInTheDocument();
  });

  it("switches to signup form and renders full name field", () => {
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>
    );

    const signupTab = screen.getByText("Sign up", { selector: "button" });
    fireEvent.click(signupTab);

    expect(screen.getByText("Create account", { selector: "button.primary-button" })).toBeInTheDocument();
    expect(screen.getByLabelText("Full name")).toBeInTheDocument();
  });

  it("calls login with correct credentials when submitted", async () => {
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    
    fireEvent.click(screen.getByText("Login", { selector: "button.primary-button" }));

    expect(mockLogin).toHaveBeenCalledWith({ email: "test@example.com", password: "password123" });
  });
});
