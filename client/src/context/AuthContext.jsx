import { createContext, useEffect, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import apiClient from "../api/apiClient";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { 
    state, 
    signIn, 
    signOut, 
    getAccessToken, 
    getBasicUserInfo,
    on 
  } = useAuthContext();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync user profile from backend when authenticated
  const loadCurrentUser = async () => {
    if (!state.isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get("/auth/me");
      setUser(response.data.user);
    } catch (_error) {
      // If backend fails but SDK is authenticated, we might have a sync issue
      // but we shouldn't force sign out here unless necessary
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (state.isAuthenticated) {
      loadCurrentUser();
    } else {
      setUser(null);
      setLoading(state.isLoading);
    }
  }, [state.isAuthenticated, state.isLoading]);

  const login = async () => {
    await signIn();
  };

  const logout = async () => {
    await signOut();
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{
        token: state.accessToken, // Provided by SDK
        user,
        loading,
        isAuthenticated: state.isAuthenticated,
        login,
        logout,
        updateUser,
        getAccessToken // Exporting for SessionManager
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
