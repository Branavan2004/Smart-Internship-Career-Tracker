import Application from "../models/Application.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAnalytics = asyncHandler(async (req, res) => {
  const applications = await Application.find({ user: req.user._id });
  const totals = {
    total: applications.length,
    pending: 0,
    interviewed: 0,
    accepted: 0,
    rejected: 0,
    offer: 0,
    portfolioViewed: 0
  };

  const roleBreakdown = {};
  const rejectionReasons = {};

  applications.forEach((application) => {
    const normalizedStatus = application.status.toLowerCase();
    if (totals[normalizedStatus] !== undefined) {
      totals[normalizedStatus] += 1;
    }

    roleBreakdown[application.roleType] = (roleBreakdown[application.roleType] || 0) + 1;

    if (application.portfolioViewed) {
      totals.portfolioViewed += 1;
    }

    if (application.rejectionReason) {
      rejectionReasons[application.rejectionReason] =
        (rejectionReasons[application.rejectionReason] || 0) + 1;
    }
  });

  const successRate = totals.total ? Number((((totals.accepted + totals.offer) / totals.total) * 100).toFixed(1)) : 0;

  res.json({
    stats: {
      ...totals,
      successRate
    },
    roleBreakdown: Object.entries(roleBreakdown).map(([name, value]) => ({ name, value })),
    rejectionReasons: Object.entries(rejectionReasons).map(([name, value]) => ({
      name,
      value
    }))
  });
});
