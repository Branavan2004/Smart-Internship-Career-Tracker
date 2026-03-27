import { createContext, useEffect, useState } from "react";
import apiClient from "../api/apiClient";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("careerTrackerToken"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistSession = (authToken, currentUser) => {
    localStorage.setItem("careerTrackerToken", authToken);
    setToken(authToken);
    setUser(currentUser);
  };

  const clearSession = () => {
    localStorage.removeItem("careerTrackerToken");
    setToken(null);
    setUser(null);
  };

  const loadCurrentUser = async () => {
    if (!localStorage.getItem("careerTrackerToken")) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get("/auth/me");
      setUser(response.data.user);
    } catch (_error) {
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const register = async (payload) => {
    const response = await apiClient.post("/auth/register", payload);
    persistSession(response.data.token, response.data.user);
    return response.data.user;
  };

  const login = async (payload) => {
    const response = await apiClient.post("/auth/login", payload);
    persistSession(response.data.token, response.data.user);
    return response.data.user;
  };

  const completeOAuthLogin = async (authToken) => {
    localStorage.setItem("careerTrackerToken", authToken);
    setToken(authToken);

    try {
      const response = await apiClient.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      clearSession();
      throw error;
    }
  };

  const logout = () => {
    clearSession();
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
        register,
        login,
        completeOAuthLogin,
        logout,
        loadCurrentUser,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
