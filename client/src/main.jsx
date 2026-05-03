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

const defaultRedirectUrl =
  import.meta.env.VITE_ASGARDEO_REDIRECT_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");

const signInUrl = import.meta.env.VITE_ASGARDEO_SIGN_IN_URL || defaultRedirectUrl;
const signOutUrl = import.meta.env.VITE_ASGARDEO_SIGN_OUT_URL || defaultRedirectUrl;

const asgardeoConfig = {
    signInRedirectURL: signInUrl,
    signOutRedirectURL: signOutUrl,
    clientID: import.meta.env.VITE_ASGARDEO_CLIENT_ID || "your_client_id",
    baseUrl: import.meta.env.VITE_ASGARDEO_BASE_URL || "https://api.asgardeo.io/t/org900gq",
    scope: [ "openid", "profile", "email" ],
    storage: "sessionStorage",
    disableTrySignInSilently: true
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
