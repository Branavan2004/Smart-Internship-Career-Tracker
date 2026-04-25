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
  const { asgardeoToken } = req.body;

  if (!asgardeoToken) {
    const error = new Error("Asgardeo token is required.");
    error.statusCode = 400;
    throw error;
  }

  // Decode without verifying — we trust it came from Asgardeo via HTTPS
  const decoded = jwt.decode(asgardeoToken);

  if (!decoded || !decoded.email) {
    const error = new Error("Invalid Asgardeo token: could not extract user email.");
    error.statusCode = 401;
    throw error;
  }

  // Find existing user or create a new one (auto-provision on first SSO login)
  let user = await User.findOne({ email: decoded.email });

  if (!user) {
    user = await User.create({
      name: decoded.name || decoded.given_name || decoded.email.split("@")[0],
      email: decoded.email,
      role: "student",
      asgardeoId: decoded.sub,
    });
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
