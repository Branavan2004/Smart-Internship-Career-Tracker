import { logger } from "../config/logger.js";

export const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, req, res, _next) => {
  const statusCode = error.statusCode || 500;

  logger.error({
    message: error.message,
    statusCode,
    path: req.originalUrl,
    stack: error.stack
  });

  res.status(statusCode).json({
    message: error.message || "Internal server error.",
    statusCode
  });
};
