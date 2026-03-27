import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const buildRateLimitResponse = (message) => ({
  message
});

const createLimiter = ({
  windowMs = FIFTEEN_MINUTES,
  max,
  message,
  standardHeaders = true,
  legacyHeaders = false,
  skipSuccessfulRequests = false
}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders,
    legacyHeaders,
    skipSuccessfulRequests,
    handler: (_req, res) => {
      res.status(429).json(buildRateLimitResponse(message));
    }
  });

export const globalApiLimiter = createLimiter({
  max: 100,
  message: "Too many requests from this IP. Please try again in 15 minutes."
});

export const authLimiter = createLimiter({
  max: 10,
  message: "Too many authentication requests from this IP. Please try again in 15 minutes."
});

export const refreshTokenLimiter = createLimiter({
  max: 20,
  message: "Too many refresh requests from this IP. Please try again in 15 minutes."
});

export const loginBruteForceLimiter = createLimiter({
  max: 10,
  skipSuccessfulRequests: true,
  message: "Too many failed login attempts from this IP. Please try again in 15 minutes."
});
