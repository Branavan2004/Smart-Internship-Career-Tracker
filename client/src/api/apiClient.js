import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  // withCredentials removed: Asgardeo uses Bearer tokens in headers, not cookies.
  // Keeping withCredentials:true causes CORS preflight failures on cloud deployments.
});

export default apiClient;
