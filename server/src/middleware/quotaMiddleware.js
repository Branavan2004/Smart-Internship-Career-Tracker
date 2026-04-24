/**
 * Quota Middleware
 *
 * Enforces daily write-operation quotas per API tier.
 * Increments the user's quotaUsed counter in MongoDB atomically.
 *
 * Read operations (GET) do not count against quota — only state-mutating
 * requests (POST, PUT, PATCH, DELETE) do.
 *
 * On quota breach: returns HTTP 429 with Retry-After header,
 * matching WSO2 API Manager's throttling response format exactly.
 */

import User from "../models/User.js";
import { TIER_QUOTAS } from "./tenantMiddleware.js";
import { metricsStore } from "../utils/metricsStore.js";

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const enforceQuota = async (req, res, next) => {
  // Skip for non-mutating requests or unauthenticated routes
  if (READ_METHODS.has(req.method) || !req.user) {
    return next();
  }

  const tier = req.user.tier || "free";
  const limit = TIER_QUOTAS[tier];

  if (limit === Infinity) {
    return next(); // enterprise — unlimited
  }

  // Check if quota window has reset (daily reset)
  const now = new Date();
  const resetAt = req.user.quotaResetAt ? new Date(req.user.quotaResetAt) : null;
  const needsReset = !resetAt || now > resetAt;

  if (needsReset) {
    // Reset counter — set next reset to tomorrow 00:00 UTC
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    await User.findByIdAndUpdate(req.user._id, {
      quotaUsed: 0,
      quotaResetAt: tomorrow,
    });
    req.user.quotaUsed = 0;
    req.user.quotaResetAt = tomorrow;
  }

  const currentUsage = req.user.quotaUsed || 0;

  if (currentUsage >= limit) {
    // Record as security/throttle event
    metricsStore.recordSecurityEvent({
      type: "quota_exceeded",
      ip: req.ip,
      path: req.path,
      userId: req.user._id?.toString(),
    });

    const retryAfter = req.user.quotaResetAt
      ? Math.ceil((new Date(req.user.quotaResetAt) - now) / 1000)
      : 86400;

    res.setHeader("Retry-After", retryAfter);
    res.setHeader("X-Throttle-Reason", `Quota exceeded for tier: ${tier}`);

    return res.status(429).json({
      code: "QUOTA_EXCEEDED",
      message: `Daily quota of ${limit} write operations exceeded for the '${tier}' tier.`,
      tier,
      limit,
      quotaUsed: currentUsage,
      upgradeUrl: "https://intern-tracker.io/pricing",
      retryAfterSeconds: retryAfter,
    });
  }

  // Atomically increment quota counter
  await User.findByIdAndUpdate(req.user._id, { $inc: { quotaUsed: 1 } });
  req.user.quotaUsed = currentUsage + 1;

  // Update header with latest value
  res.setHeader("X-Quota-Used", req.user.quotaUsed);
  res.setHeader("X-Quota-Remaining", limit - req.user.quotaUsed);

  next();
};
