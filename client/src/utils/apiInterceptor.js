/**
 * Global Axios interceptor logic for the Smart Internship Tracker.
 * Handles authentication refreshes (401) and APIM rate-limiting (429) with exponential backoff.
 */
export const setupInterceptors = (apiClient) => {
  let refreshPromise = null;

  // Request Interceptor
  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("careerTrackerToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response Interceptor
  apiClient.interceptors.response.use(
    (response) => {
      // Extract APIM Headers if present
      const limit = response.headers["x-ratelimit-limit"];
      const remaining = response.headers["x-ratelimit-remaining"];
      const reset = response.headers["x-ratelimit-reset"];

      if (limit !== undefined) {
        window.dispatchEvent(
          new CustomEvent("throttlingUpdate", {
            detail: {
              limit: parseInt(limit, 10),
              remaining: parseInt(remaining, 10),
              resetAt: reset ? parseInt(reset, 10) * 1000 : null
            }
          })
        );
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      if (!originalRequest) return Promise.reject(error);

      const statusCode = error.response?.status;

      // --- Handle 429 Too Many Requests (Rate Limiting) ---
      if (statusCode === 429) {
        // Initialize retry count
        originalRequest._retryCount = originalRequest._retryCount || 0;

        if (originalRequest._retryCount < 3) {
          originalRequest._retryCount++;

          // Extract Retry-After (seconds) or default to 30
          let retryAfter = parseInt(error.response.headers["retry-after"], 10) || 30;
          
          // Exponential backoff: double the wait time for subsequent retries
          const waitSeconds = Math.min(
            retryAfter * Math.pow(2, originalRequest._retryCount - 1),
            120 // Max wait 120s
          );

          // Broadcast rateLimit event for UI feedback
          window.dispatchEvent(
            new CustomEvent("rateLimit", { detail: waitSeconds })
          );

          // Wait then retry
          await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
          return apiClient(originalRequest);
        }

        // After 3 failed retries, give up
        window.dispatchEvent(
          new CustomEvent("rateLimitFinalFailure", {
            detail: "Service is temporarily unavailable. Please try again later."
          })
        );
        return Promise.reject(error);
      }

      // --- Handle 401 Unauthorized (Token Refresh) ---
      const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
      const isLoginRequest = originalRequest.url?.includes("/auth/login");
      const isRegisterRequest = originalRequest.url?.includes("/auth/register");

      if (
        statusCode === 401 &&
        !originalRequest._retry &&
        !isRefreshRequest &&
        !isLoginRequest &&
        !isRegisterRequest
      ) {
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

      return Promise.reject(error);
    }
  );
};
