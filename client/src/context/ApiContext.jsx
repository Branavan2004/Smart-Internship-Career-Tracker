import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "./ToastContext";

const ApiContext = createContext(null);

export const ApiProvider = ({ children }) => {
  const { showToast } = useToast();
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryIn, setRetryIn] = useState(0);
  const [throttlingData, setThrottlingData] = useState({
    limit: 0,
    remaining: 0,
    resetAt: null
  });

  useEffect(() => {
    const handleRateLimit = (event) => {
      const waitSeconds = event.detail || 30;
      setIsRateLimited(true);
      setRetryIn(waitSeconds);
    };

    const handleThrottlingUpdate = (event) => {
      setThrottlingData(event.detail);
    };

    const handleFinalFailure = (event) => {
      showToast(event.detail, "error");
    };

    window.addEventListener("rateLimit", handleRateLimit);
    window.addEventListener("throttlingUpdate", handleThrottlingUpdate);
    window.addEventListener("rateLimitFinalFailure", handleFinalFailure);

    return () => {
      window.removeEventListener("rateLimit", handleRateLimit);
      window.removeEventListener("throttlingUpdate", handleThrottlingUpdate);
      window.removeEventListener("rateLimitFinalFailure", handleFinalFailure);
    };
  }, [showToast]);

  useEffect(() => {
    if (retryIn > 0) {
      const timer = setInterval(() => {
        setRetryIn((prev) => {
          if (prev <= 1) {
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryIn]);

  return (
    <ApiContext.Provider value={{ isRateLimited, retryIn, throttlingData }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};

export default ApiContext;
