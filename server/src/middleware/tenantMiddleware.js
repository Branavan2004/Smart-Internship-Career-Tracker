/**
 * Tenant Middleware
 *
 * Extracts tenant context from the authenticated user and attaches it to the
 * request. Also adds quota response headers so every API response carries
 * the caller's current usage — exactly as WSO2 API Manager adds x-throttle headers.
 *
 * DB isolation: Every controller that writes or reads data should include
 * `tenantId: req.tenantContext.tenantId` in its Mongoose query. This is the
 * simplest form of logical multi-tenancy (shared DB, isolated rows).
 * Physical isolation (separate DB per tenant) is a later upgrade.
 */

const TIER_QUOTAS = {
  free: 100,       // requests per day
  premium: 10_000,
  enterprise: Infinity,
};

export const tenantContext = (req, res, next) => {
  if (!req.user) {
    return next(); // unauthenticated routes — skip
  }

  const tenantId = req.user.tenantId || "default";
  const tier = req.user.tier || "free";
  const quotaUsed = req.user.quotaUsed || 0;
  const quotaLimit = TIER_QUOTAS[tier];

  req.tenantContext = { tenantId, tier, quotaUsed, quotaLimit };

  // Attach quota headers (WSO2 API Manager style)
  res.setHeader("X-Quota-Tier", tier);
  res.setHeader("X-Quota-Used", quotaUsed);
  res.setHeader("X-Quota-Limit", quotaLimit === Infinity ? "unlimited" : quotaLimit);
  res.setHeader(
    "X-Quota-Remaining",
    quotaLimit === Infinity ? "unlimited" : Math.max(0, quotaLimit - quotaUsed)
  );

  next();
};

export { TIER_QUOTAS };
