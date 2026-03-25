import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    const error = new Error("Not authorized. Missing bearer token.");
    error.statusCode = 401;
    return next(error);
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      const error = new Error("User not found for this token.");
      error.statusCode = 401;
      return next(error);
    }

    next();
  } catch (_error) {
    const error = new Error("Token is invalid or expired.");
    error.statusCode = 401;
    next(error);
  }
};
