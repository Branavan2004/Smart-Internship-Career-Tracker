import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const gatewayRateLimit = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later."
  }
});
