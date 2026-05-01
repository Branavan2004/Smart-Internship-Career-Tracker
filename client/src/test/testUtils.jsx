import { AuthContext } from "../context/AuthContext";

export const createAuthValue = (overrides = {}) => {
  const user = overrides.user !== undefined ? overrides.user : {
    _id: "user-1",
    name: "Test User",
    email: "user@test.com",
    role: "student"
  };
  
  return {
    isAuthenticated: !!user,
    token: "token",
    user,
    loading: false,
    register: async () => {},
    login: async () => {},
    completeOAuthLogin: async () => {},
    logout: () => {},
    loadCurrentUser: async () => {},
    updateUser: () => {},
    ...overrides
  };
};

export const AuthProviderMock = ({ value, children }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
);
