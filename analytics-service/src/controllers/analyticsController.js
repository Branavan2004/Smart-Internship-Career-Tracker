import Application from "../models/Application.js";

export const getDashboardAnalytics = async (req, res) => {
  const matchStage = req.user.role === "student" ? { userId: req.user.sub } : {};

  const [companyBreakdown, statusBreakdown, interviewPerformance, totals] = await Promise.all([
    Application.aggregate([
      { $match: matchStage },
      { $group: { _id: "$companyName", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Application.aggregate([
      { $match: matchStage },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Application.aggregate([
      { $match: matchStage },
      { $unwind: { path: "$interviewStages", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$interviewStages.result",
          count: { $sum: 1 }
        }
      }
    ]),
    Application.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalApplications: { $sum: 1 },
          acceptedCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "accepted"] }, 1, 0]
            }
          },
          rejectedCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "rejected"] }, 1, 0]
            }
          }
        }
      }
    ])
  ]);

  res.json({
    analytics: totals[0] || {
      totalApplications: 0,
      acceptedCount: 0,
      rejectedCount: 0
    },
    applicationsPerCompany: companyBreakdown.map((item) => ({
      companyName: item._id,
      count: item.count
    })),
    rejectionDistribution: statusBreakdown.map((item) => ({
      status: item._id,
      count: item.count
    })),
    interviewPerformance: interviewPerformance.map((item) => ({
      result: item._id || "unknown",
      count: item.count
    }))
  });
};
