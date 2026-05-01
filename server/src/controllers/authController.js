import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  hashToken,
  issueAuthTokens,
  revokeAllUserRefreshTokens,
  revokeRefreshTokenRecord,
  rotateRefreshToken,
  setRefreshTokenCookie,
  verifyRefreshToken
} from "../utils/tokenService.js";

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  googleId: user.googleId,
  profilePicture: user.profilePicture,
  phone: user.phone,
  skills: user.skills,
  resumeUrl: user.resumeUrl,
  resumeFilename: user.resumeFilename,
  weeklyDigestEnabled: user.weeklyDigestEnabled,
  createdAt: user.createdAt
});

const sendAuthResponse = async (res, user, statusCode = 200) => {
  const { accessToken, refreshToken } = await issueAuthTokens(user);
  setRefreshTokenCookie(res, refreshToken);

  res.status(statusCode).json({
    user: sanitizeUser(user),
    accessToken,
    token: accessToken
  });
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

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

  // Role is always "student" for self-registration — admins and reviewers
  // must be promoted via an admin script or the database directly.
  const user = await User.create({ name, email, password, role: "student" });

  await sendAuthResponse(res, user, 201);
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.password || !(await user.matchPassword(password))) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  await sendAuthResponse(res, user);
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

export const getMyGroups = asyncHandler(async (req, res) => {
  if (!req.user) {
    const error = new Error("Not authorized.");
    error.statusCode = 401;
    throw error;
  }

  res.json({
    role: req.user.role,
    groups: req.user.groups || [],
    source: req.user.asgardeoId ? "asgardeo" : "local"
  });
});

export const handleGoogleAuthSuccess = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await issueAuthTokens(req.user);
  setRefreshTokenCookie(res, refreshToken);
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  res.redirect(`${clientUrl}/auth/callback?token=${accessToken}`);
});

export const handleAsgardeoAuthSuccess = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = await issueAuthTokens(req.user);
  setRefreshTokenCookie(res, refreshToken);
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
  res.redirect(`${clientUrl}/auth/callback?token=${accessToken}`);
});

/**
 * POST /api/auth/asgardeo-exchange
 * Federated Identity Bridge: exchanges an Asgardeo OIDC token for a backend JWT.
 * The Asgardeo token is decoded (trusted via HTTPS) to extract user identity.
 * A matching MongoDB user is found or created, then the backend issues its own JWT.
 */
export const exchangeAsgardeoToken = asyncHandler(async (req, res) => {
  const { asgardeoToken, userInfo } = req.body;

  if (!asgardeoToken || !userInfo || !userInfo.email) {
    const error = new Error("Asgardeo token and user info (with email) are required.");
    error.statusCode = 400;
    throw error;
  }

  const groups = userInfo.groups || [];
  let role = "student";
  
  if (groups.includes("admin") || groups.includes("Admin")) {
    role = "admin";
  } else if (groups.includes("reviewer") || groups.includes("Reviewer")) {
    role = "reviewer";
  }

  // Find existing user or create a new one (auto-provision on first SSO login)
  let user = await User.findOne({ email: userInfo.email });

  if (!user) {
    user = await User.create({
      name: userInfo.name || userInfo.given_name || userInfo.email.split("@")[0],
      email: userInfo.email,
      role,
      groups,
      asgardeoId: userInfo.sub,
    });
  } else {
    // Update role and groups if the user already exists
    user.role = role;
    user.groups = groups;
    user.asgardeoId = user.asgardeoId || userInfo.sub;
    await user.save();
  }

  await sendAuthResponse(res, user);
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (!refreshToken) {
    const error = new Error("Refresh token is missing.");
    error.statusCode = 401;
    throw error;
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (_error) {
    const error = new Error("Refresh token is invalid or expired.");
    error.statusCode = 401;
    throw error;
  }

  const tokenHash = hashToken(refreshToken);
  const existingToken = await RefreshToken.findOne({
    token: tokenHash,
    userId: decoded.userId
  });

  if (!existingToken) {
    await revokeAllUserRefreshTokens(decoded.userId);
    clearRefreshTokenCookie(res);

    const error = new Error("Refresh token reuse detected. All sessions have been revoked.");
    error.statusCode = 401;
    throw error;
  }

  if (existingToken.revoked) {
    await revokeAllUserRefreshTokens(decoded.userId);
    clearRefreshTokenCookie(res);

    const error = new Error("Refresh token has already been revoked.");
    error.statusCode = 401;
    throw error;
  }

  if (existingToken.expiresAt <= new Date()) {
    await revokeRefreshTokenRecord(existingToken);
    clearRefreshTokenCookie(res);

    const error = new Error("Refresh token has expired.");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    await revokeAllUserRefreshTokens(decoded.userId);
    clearRefreshTokenCookie(res);

    const error = new Error("User not found for this refresh token.");
    error.statusCode = 401;
    throw error;
  }

  const { accessToken, refreshToken: nextRefreshToken } = await rotateRefreshToken(existingToken, user);
  setRefreshTokenCookie(res, nextRefreshToken);

  res.json({
    user: sanitizeUser(user),
    accessToken,
    token: accessToken
  });
});

export const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (refreshToken) {
    const existingToken = await RefreshToken.findOne({
      token: hashToken(refreshToken)
    });

    await revokeRefreshTokenRecord(existingToken);
  }

  clearRefreshTokenCookie(res);
  res.json({ message: "Logged out successfully." });
});
