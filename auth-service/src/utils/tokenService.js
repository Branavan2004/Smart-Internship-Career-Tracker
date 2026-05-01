import crypto from "crypto";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.js";
import RefreshToken from "../models/RefreshToken.js";

const parseDurationToMs = (duration) => {
  const value = Number.parseInt(duration, 10);

  if (duration.endsWith("m")) {
    return value * 60 * 1000;
  }

  if (duration.endsWith("h")) {
    return value * 60 * 60 * 1000;
  }

  return value * 24 * 60 * 60 * 1000;
};

const hashToken = (value) => crypto.createHash("sha256").update(value).digest("hex");

export const createAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    },
    env.accessTokenSecret,
    { expiresIn: env.accessTokenExpiresIn }
  );

export const issueRefreshToken = async (user) => {
  const jti = uuidv4();
  const token = jwt.sign(
    {
      sub: user._id.toString(),
      jti,
      tokenVersion: user.tokenVersion
    },
    env.refreshTokenSecret,
    { expiresIn: env.refreshTokenExpiresIn }
  );

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(token),
    jti,
    expiresAt: new Date(Date.now() + parseDurationToMs(env.refreshTokenExpiresIn))
  });

  return token;
};

export const verifyRefreshToken = async (token) => {
  const payload = jwt.verify(token, env.refreshTokenSecret);
  const tokenRecord = await RefreshToken.findOne({
    jti: payload.jti,
    tokenHash: hashToken(token),
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  });

  return { payload, tokenRecord };
};

export const revokeRefreshToken = async (tokenRecord) => {
  if (!tokenRecord) {
    return;
  }

  tokenRecord.isRevoked = true;
  tokenRecord.revokedAt = new Date();
  await tokenRecord.save();
};
