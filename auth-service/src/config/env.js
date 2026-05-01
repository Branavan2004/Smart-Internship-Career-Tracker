import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5002),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/smart-career-tracker",
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || "change-me",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || "change-refresh-me",
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL || "http://localhost:5002/api/auth/google/callback",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 50)
};
