import { AppError } from "../utils/AppError.js";

export const requireServiceAuth = (req, _res, next) => {
  const rawUserContext = req.headers["x-user-context"];

  if (!rawUserContext) {
    next(new AppError("Missing user context from gateway.", 401));
    return;
  }

  try {
    req.user = JSON.parse(rawUserContext);
    next();
  } catch (_error) {
    next(new AppError("Gateway user context is invalid.", 401));
  }
};
