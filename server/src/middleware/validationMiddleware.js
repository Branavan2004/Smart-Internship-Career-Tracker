import { validationResult } from "express-validator";

export const handleValidationErrors = (req, _res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const error = new Error("Validation failed.");
  error.statusCode = 400;
  error.details = errors.array().map((validationError) => ({
    field: validationError.path,
    message: validationError.msg
  }));

  return next(error);
};
