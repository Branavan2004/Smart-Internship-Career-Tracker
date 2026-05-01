import { useState, useEffect } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "./useAuth";

export const useAsgardeoGroups = () => {
  const { isAuthenticated } = useAuth();
  const [role, setRole] = useState("student");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchGroups = async () => {
      if (!isAuthenticated) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await apiClient.get("/auth/my-groups");
        if (isMounted) {
          setRole(response.data.role || "student");
          setGroups(response.data.groups || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch Asgardeo groups:", err);
          setError(err);
          // Fallback to student role if API fails
          setRole("student");
          setGroups([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGroups();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  return {
    role,
    groups,
    isAdmin: role === "admin" || groups.includes("admin") || groups.includes("Admin"),
    isReviewer: role === "reviewer" || groups.includes("reviewer") || groups.includes("Reviewer"),
    isStudent: role === "student" && !groups.includes("admin") && !groups.includes("reviewer") && !groups.includes("Admin") && !groups.includes("Reviewer"),
    loading,
    error,
  };
};
