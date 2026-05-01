import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createAccessToken,
  issueRefreshToken,
  revokeRefreshToken,
  verifyRefreshToken
} from "../utils/tokenService.js";

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  oauthId: user.oauthId,
  createdAt: user.createdAt
});

const buildAuthResponse = async (user) => ({
  user: serializeUser(user),
  accessToken: createAccessToken(user),
  refreshToken: await issueRefreshToken(user)
});

export const register = asyncHandler(async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });

  if (existingUser) {
    throw new AppError("A user already exists with this email.", 409);
  }

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role || "student",
    authProvider: "local"
  });

  res.status(201).json(await buildAuthResponse(user));
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError("Invalid email or password.", 401);
  }

  res.json(await buildAuthResponse(user));
});

export const refresh = asyncHandler(async (req, res) => {
  const { payload, tokenRecord } = await verifyRefreshToken(req.body.refreshToken);

  if (!tokenRecord) {
    throw new AppError("Refresh token is invalid or has been revoked.", 401);
  }

  const user = await User.findById(payload.sub);

  if (!user || user.tokenVersion !== payload.tokenVersion) {
    await revokeRefreshToken(tokenRecord);
    throw new AppError("Session is no longer valid.", 401);
  }

  await revokeRefreshToken(tokenRecord);
  res.json(await buildAuthResponse(user));
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (refreshToken) {
    try {
      const { tokenRecord } = await verifyRefreshToken(refreshToken);
      await revokeRefreshToken(tokenRecord);
    } catch (_error) {
      // Logout should be idempotent and not leak token state.
    }
  }

  res.json({ message: "Logged out successfully." });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.headers["x-user-id"]);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  res.json({ user: serializeUser(user) });
});

export const handleGoogleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  const accessToken = createAccessToken(user);
  const refreshToken = await issueRefreshToken(user);
  const redirectUrl = `${req.app.locals.clientUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
  res.redirect(redirectUrl);
});
