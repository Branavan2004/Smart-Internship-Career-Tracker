export const requireServiceAuth = (req, _res, next) => {
  const rawUserContext = req.headers["x-user-context"];

  if (!rawUserContext) {
    const error = new Error("Missing user context from gateway.");
    error.statusCode = 401;
    next(error);
    return;
  }

  try {
    req.user = JSON.parse(rawUserContext);
    next();
  } catch (_error) {
    const error = new Error("Gateway user context is invalid.");
    error.statusCode = 401;
    next(error);
  }
};
