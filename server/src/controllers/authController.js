import User from "../models/User.js";
import { createToken } from "../utils/createToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  googleId: user.googleId,
  profilePicture: user.profilePicture,
  phone: user.phone,
  skills: user.skills,
  resumeUrl: user.resumeUrl,
  resumeFilename: user.resumeFilename,
  weeklyDigestEnabled: user.weeklyDigestEnabled,
  createdAt: user.createdAt
});

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    const error = new Error("Name, email, and password are required.");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const error = new Error("An account already exists with that email.");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ name, email, password });

  res.status(201).json({
    user: sanitizeUser(user),
    token: createToken(user._id)
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.password || !(await user.matchPassword(password))) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  res.json({
    user: sanitizeUser(user),
    token: createToken(user._id)
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

export const handleGoogleAuthSuccess = asyncHandler(async (req, res) => {
  const token = createToken(req.user._id);
  const redirectUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/auth/callback?token=${token}`;

  res.redirect(redirectUrl);
});
