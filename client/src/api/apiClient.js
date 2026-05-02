import axios from "axios";
import { apiBaseUrl, deploymentApiErrorMessage, getApiConnectionErrorMessage } from "../utils/runtimeConfig";

const createApiConfigurationError = () => {
  const error = new Error(deploymentApiErrorMessage);
  error.code = "CLIENT_API_URL_MISSING";
  error.response = {
    status: 503,
    data: {
      message: deploymentApiErrorMessage
    }
  };
  return error;
};

const attachApiErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error;
  }

  error.response = {
    ...error.response,
    status: error.response?.status || 503,
    data: {
      ...(error.response?.data || {}),
      message: getApiConnectionErrorMessage()
    }
  };

  return error;
};

const apiClient = axios.create({
  ...(apiBaseUrl ? { baseURL: apiBaseUrl } : {}),
});

apiClient.interceptors.request.use((config) => {
  if (!apiBaseUrl) {
    return Promise.reject(createApiConfigurationError());
  }

  const token = localStorage.getItem("careerTrackerToken");
  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`
    };
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(attachApiErrorMessage(error))
);

export default apiClient;
