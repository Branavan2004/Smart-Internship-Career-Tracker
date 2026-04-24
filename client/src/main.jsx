import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider as AsgardeoProvider } from "@asgardeo/auth-react";
import App from "./App";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { ApiProvider } from "./context/ApiContext";
import { setupInterceptors } from "./utils/apiInterceptor";
import apiClient from "./api/apiClient";
import "./styles/index.css";

// Initialize Global Interceptors
setupInterceptors(apiClient);

const asgardeoConfig = {
    signInRedirectURL: import.meta.env.VITE_ASGARDEO_REDIRECT_URL || "http://localhost:5173",
    signOutRedirectURL: import.meta.env.VITE_ASGARDEO_REDIRECT_URL || "http://localhost:5173",
    clientID: import.meta.env.VITE_ASGARDEO_CLIENT_ID || "your_client_id",
    baseUrl: import.meta.env.VITE_ASGARDEO_BASE_URL || "https://api.asgardeo.io/t/your_tenant",
    scope: [ "openid", "profile" ]
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AsgardeoProvider config={asgardeoConfig}>
      <BrowserRouter>
        <ToastProvider>
          <ApiProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ApiProvider>
        </ToastProvider>
      </BrowserRouter>
    </AsgardeoProvider>
  </React.StrictMode>
);
