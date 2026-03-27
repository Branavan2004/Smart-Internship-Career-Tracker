import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  withCredentials: true
});

let refreshPromise = null;

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("careerTrackerToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const statusCode = error.response?.status;
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");
    const isLoginRequest = originalRequest?.url?.includes("/auth/login");
    const isRegisterRequest = originalRequest?.url?.includes("/auth/register");

    if (
      statusCode !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest ||
      isLoginRequest ||
      isRegisterRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = apiClient.post("/auth/refresh");
      }

      const refreshResponse = await refreshPromise;
      const nextAccessToken = refreshResponse.data.accessToken || refreshResponse.data.token;

      localStorage.setItem("careerTrackerToken", nextAccessToken);
      window.dispatchEvent(new CustomEvent("careerTracker:token-refreshed", { detail: nextAccessToken }));

      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("careerTrackerToken");
      window.dispatchEvent(new Event("careerTracker:session-expired"));
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);

export default apiClient;
