const buildAccessLog = (req, statusCode, message) => ({
  timestamp: new Date().toISOString(),
  statusCode,
  message,
  userId: req.user?._id?.toString?.() || req.auth?.userId || "anonymous",
  route: req.originalUrl
});

export const logUnauthorizedAttempt = (req, statusCode, message) => {
  console.warn(JSON.stringify(buildAccessLog(req, statusCode, message)));
};
