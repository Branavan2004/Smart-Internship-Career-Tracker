import { AppError } from "../utils/AppError.js";

export const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    next(new AppError("You do not have permission to access this resource.", 403));
    return;
  }

  next();
};
