import User from "../models/User.js";
import { logUnauthorizedAttempt } from "../utils/accessLogger.js";
import { verifyAccessToken } from "../utils/tokenService.js";

export const verifyJWT = async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    const error = new Error("Not authorized. Missing bearer token.");
    error.statusCode = 401;
    logUnauthorizedAttempt(req, error.statusCode, error.message);
    return next(error);
  }

  try {
    const token = header.split(" ")[1];
    const decoded = verifyAccessToken(token);
    req.auth = decoded;
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      const error = new Error("User not found for this token.");
      error.statusCode = 401;
      logUnauthorizedAttempt(req, error.statusCode, error.message);
      return next(error);
    }

    next();
  } catch (_error) {
    const error = new Error("Token is invalid or expired.");
    error.statusCode = 401;
    logUnauthorizedAttempt(req, error.statusCode, error.message);
    next(error);
  }
};

export const authorizeRoles = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) {
    const error = new Error("Not authorized. User context is missing.");
    error.statusCode = 401;
    logUnauthorizedAttempt(req, error.statusCode, error.message);
    return next(error);
  }

  if (!allowedRoles.includes(req.user.role)) {
    const error = new Error("Forbidden. You do not have permission to access this resource.");
    error.statusCode = 403;
    logUnauthorizedAttempt(req, error.statusCode, error.message);
    return next(error);
  }

  next();
};

export const protect = verifyJWT;
