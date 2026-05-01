export const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    const error = new Error(parsed.error.issues.map((issue) => issue.message).join(", "));
    error.statusCode = 400;
    next(error);
    return;
  }

  req.body = parsed.data;
  next();
};
