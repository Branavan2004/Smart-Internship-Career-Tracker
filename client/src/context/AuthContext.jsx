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

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAccessTokenWithRetry = async (attempts = 8, delayMs = 400) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const nextToken = await getAccessToken();
      if (nextToken) {
        return nextToken;
      }

      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }

    return null;
  };

  // Sync user profile from backend when authenticated
  const loadCurrentUser = async () => {
    if (!state.isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const accessToken = await getAccessTokenWithRetry();
      if (!accessToken) {
        throw new Error("Asgardeo access token is not available yet.");
      }

      setToken(accessToken);
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
    const isAuthCallback = new URLSearchParams(window.location.search).has("code");

    if (state.isAuthenticated) {
      loadCurrentUser();
    } else {
      setToken(null);
      setUser(null);
      storeAccessToken(null);
      // Keep loading true if it's a callback URL so Asgardeo can process it
      setLoading(state.isLoading || isAuthCallback);
    }
  }, [state.isAuthenticated, state.isLoading]);

  useEffect(() => {
    registerAccessTokenGetter(() => getAccessTokenWithRetry());

    return () => {
      clearAccessTokenGetter();
    };
  }, [getAccessToken]);

  useEffect(() => {
    const handleSessionExpired = () => {
      setToken(null);
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
    setToken(null);
    storeAccessToken(null);
    await signOut();
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(state.isAuthenticated && token),
        login,
        logout,
        updateUser,
        getAccessToken: getAccessTokenWithRetry
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
