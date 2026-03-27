import User from "../models/User.js";
import Application from "../models/Application.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAdminDashboard = asyncHandler(async (_req, res) => {
  const [totalUsers, totalApplications, reviewerCount, adminCount] = await Promise.all([
    User.countDocuments(),
    Application.countDocuments(),
    User.countDocuments({ role: "reviewer" }),
    User.countDocuments({ role: "admin" })
  ]);

  res.json({
    message: "Admin dashboard data loaded successfully.",
    stats: {
      totalUsers,
      totalApplications,
      reviewerCount,
      adminCount
    }
  });
});
