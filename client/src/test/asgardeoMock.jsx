export const AuthProvider = ({ children }) => children;
export const useAuthContext = () => ({
  state: { isAuthenticated: false, isLoading: false },
  signIn: () => {},
  signOut: () => {},
  getBasicUserInfo: async () => ({}),
  getDecodedIDToken: async () => ({}),
  on: () => {}
});
