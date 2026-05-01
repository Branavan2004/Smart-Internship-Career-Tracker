import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5001),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || "change-me",
  authServiceUrl: process.env.AUTH_SERVICE_URL || "http://localhost:5002",
  applicationServiceUrl: process.env.APPLICATION_SERVICE_URL || "http://localhost:5003",
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5004",
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || "http://localhost:5005",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 150)
};
