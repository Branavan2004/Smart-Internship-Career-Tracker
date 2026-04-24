import { logger } from "../config/logger.js";

export const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, req, res, _next) => {
  logger.error({
    message: error.message,
    path: req.originalUrl,
    statusCode: error.statusCode || 500,
    stack: error.stack
  });

  res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error."
  });
};
