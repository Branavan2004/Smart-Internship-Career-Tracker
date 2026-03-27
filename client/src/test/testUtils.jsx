import { AuthContext } from "../context/AuthContext";

export const createAuthValue = (overrides = {}) => ({
  token: "token",
  user: {
    _id: "user-1",
    name: "Test User",
    email: "user@test.com",
    role: "student"
  },
  loading: false,
  register: async () => {},
  login: async () => {},
  completeOAuthLogin: async () => {},
  logout: () => {},
  loadCurrentUser: async () => {},
  updateUser: () => {},
  ...overrides
});

export const AuthProviderMock = ({ value, children }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
);
