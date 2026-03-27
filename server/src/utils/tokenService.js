import crypto from "crypto";
import jwt from "jsonwebtoken";
import RefreshToken from "../models/RefreshToken.js";

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
const REFRESH_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || "careerTrackerRefreshToken";

const durationToMs = (duration) => {
  const value = Number.parseInt(duration, 10);

  if (duration.endsWith("m")) {
    return value * 60 * 1000;
  }

  if (duration.endsWith("h")) {
    return value * 60 * 60 * 1000;
  }

  return value * 24 * 60 * 60 * 1000;
};

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const createAccessToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

export const createRefreshToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      role: user.role,
      type: "refresh"
    },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

export const saveRefreshToken = async (refreshToken, userId) => {
  return RefreshToken.create({
    token: hashToken(refreshToken),
    userId,
    expiresAt: new Date(Date.now() + durationToMs(REFRESH_TOKEN_EXPIRES_IN)),
    revoked: false
  });
};

export const revokeRefreshTokenRecord = async (record) => {
  if (!record || record.revoked) {
    return;
  }

  record.revoked = true;
  await record.save();
};

export const revokeAllUserRefreshTokens = async (userId) => {
  await RefreshToken.updateMany(
    { userId, revoked: false },
    { $set: { revoked: true } }
  );
};

export const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: durationToMs(REFRESH_TOKEN_EXPIRES_IN)
  });
};

export const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
};

export const getRefreshTokenFromRequest = (req) => req.cookies?.[REFRESH_COOKIE_NAME];

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);

export const issueAuthTokens = async (user) => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  await saveRefreshToken(refreshToken, user._id);

  return { accessToken, refreshToken };
};

export const rotateRefreshToken = async (currentRecord, user) => {
  await revokeRefreshTokenRecord(currentRecord);
  return issueAuthTokens(user);
};
