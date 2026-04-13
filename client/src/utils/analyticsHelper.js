const STATUS_KEY_MAP = {
  pending: "pending",
  interviewed: "interviewed",
  accepted: "accepted",
  rejected: "rejected",
  offer: "offer"
};

/**
 * Replicates the backend analytics calculation logic on the frontend.
 * This allows for instant dashboard updates during optimistic operations.
 */
export const recalculateAnalytics = (applications) => {
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
    const statusKey = STATUS_KEY_MAP[application.status?.toLowerCase()];
    if (statusKey !== undefined) {
      totals[statusKey] += 1;
    }

    if (application.roleType) {
      roleBreakdown[application.roleType] = (roleBreakdown[application.roleType] || 0) + 1;
    }

    if (application.portfolioViewed) {
      totals.portfolioViewed += 1;
    }

    if (application.rejectionReason) {
      rejectionReasons[application.rejectionReason] =
        (rejectionReasons[application.rejectionReason] || 0) + 1;
    }
  });

  const successRate = totals.total
    ? Number((((totals.accepted + totals.offer) / totals.total) * 100).toFixed(1))
    : 0;

  return {
    stats: {
      ...totals,
      successRate
    },
    roleBreakdown: Object.entries(roleBreakdown).map(([name, value]) => ({ name, value })),
    rejectionReasons: Object.entries(rejectionReasons).map(([name, value]) => ({
      name,
      value
    }))
  };
};
