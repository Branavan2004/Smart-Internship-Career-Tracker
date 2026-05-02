const LOCAL_API_URL = "http://localhost:5001/api";
const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

const normalizeUrl = (value = "") => value.trim().replace(/\/+$/, "");

const explicitApiUrl = normalizeUrl(import.meta.env.VITE_API_URL || "");
const isLocalBrowser =
  typeof window !== "undefined" && LOCALHOST_NAMES.has(window.location.hostname);

export const apiBaseUrl =
  explicitApiUrl || (import.meta.env.DEV || isLocalBrowser ? LOCAL_API_URL : "");

export const deploymentApiErrorMessage =
  "Deployment issue: set VITE_API_URL in Choreo to your deployed backend URL ending with /api.";

export const getApiConnectionErrorMessage = () => {
  if (!explicitApiUrl && !isLocalBrowser && !import.meta.env.DEV) {
    return deploymentApiErrorMessage;
  }

  const frontendOrigin = typeof window !== "undefined" ? window.location.origin : "this frontend";
  return `Could not reach the API at ${apiBaseUrl}. Make sure the backend is live and CLIENT_URL allows ${frontendOrigin}.`;
};

export const getGoogleLoginUrl = () => (apiBaseUrl ? `${apiBaseUrl}/auth/google` : "");
