import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const publicPaths = new Set([
  "/api/health",
  "/api/docs",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/auth/google/failure"
]);

export const authenticateGatewayRequest = (req, _res, next) => {
  if (publicPaths.has(req.path) || req.path.startsWith("/api/docs")) {
    next();
    return;
  }

  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    const error = new Error("Authentication token is required.");
    error.statusCode = 401;
    next(error);
    return;
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, env.accessTokenSecret);
    req.auth = decoded;
    req.headers["x-user-context"] = JSON.stringify(decoded);
    req.headers["x-user-id"] = decoded.sub;
    req.headers["x-user-role"] = decoded.role;
    req.headers["x-user-email"] = decoded.email;
    next();
  } catch (_error) {
    const error = new Error("Access token is invalid or expired.");
    error.statusCode = 401;
    next(error);
  }
};
