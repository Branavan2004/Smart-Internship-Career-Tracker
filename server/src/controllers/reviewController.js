import Application from "../models/Application.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getReviewQueue = asyncHandler(async (_req, res) => {
  const applications = await Application.find({
    status: { $in: ["Pending", "Interviewed"] }
  })
    .populate("user", "name email role")
    .sort({ updatedAt: -1 });

  res.json({
    message: "Reviewer queue loaded successfully.",
    applications
  });
});
