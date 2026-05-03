import { createContext, useEffect, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";
import apiClient from "../api/apiClient";
import {
  clearAccessTokenGetter,
  registerAccessTokenGetter,
  storeAccessToken
} from "../utils/authBridge";

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
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error("Asgardeo access token is not available yet.");
      }

      storeAccessToken(accessToken);

      const response = await apiClient.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to load user:", error?.response?.data || error.message);
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

  useEffect(() => {
    registerAccessTokenGetter(getAccessToken);

    return () => {
      clearAccessTokenGetter();
    };
  }, [getAccessToken]);

  useEffect(() => {
    const handleSessionExpired = () => {
      storeAccessToken(null);
      setUser(null);
      signOut().catch(() => null);
    };

    window.addEventListener("careerTracker:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("careerTracker:session-expired", handleSessionExpired);
    };
  }, [signOut]);

  const login = async () => {
    await signIn();
  };

  const logout = async () => {
    storeAccessToken(null);
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
