import Application from "../models/Application.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const normalizeDate = (value) => {
  if (!value) {
    return undefined;
  }

  return new Date(value);
};

const normalizeStages = (stages = []) =>
  stages.map((stage) => ({
    round: stage.round,
    date: stage.date ? new Date(stage.date) : undefined,
    result: stage.result || "Pending",
    notes: stage.notes || ""
  }));

export const getApplications = asyncHandler(async (req, res) => {
  const { status, roleType, search } = req.query;
  const query = { user: req.user._id };

  if (status) {
    query.status = status;
  }

  if (roleType) {
    query.roleType = roleType;
  }

  if (search) {
    query.$or = [
      { companyName: { $regex: search, $options: "i" } },
      { role: { $regex: search, $options: "i" } }
    ];
  }

  const applications = await Application.find(query).sort({ appliedDate: -1, createdAt: -1 });
  res.json({ applications });
});

export const createApplication = asyncHandler(async (req, res) => {
  const application = await Application.create({
    ...req.body,
    appliedDate: normalizeDate(req.body.appliedDate),
    followUpDate: normalizeDate(req.body.followUpDate),
    interviewStages: normalizeStages(req.body.interviewStages),
    user: req.user._id
  });

  res.status(201).json({
    message: "Application created successfully.",
    application
  });
});

export const updateApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!application) {
    const error = new Error("Application not found.");
    error.statusCode = 404;
    throw error;
  }

  const hasFollowUpDate = Object.prototype.hasOwnProperty.call(req.body, "followUpDate");

  Object.assign(application, {
    companyName: req.body.companyName ?? application.companyName,
    role: req.body.role ?? application.role,
    roleType: req.body.roleType ?? application.roleType,
    appliedDate: req.body.appliedDate ? normalizeDate(req.body.appliedDate) : application.appliedDate,
    status: req.body.status ?? application.status,
    notes: req.body.notes ?? application.notes,
    feedback: req.body.feedback ?? application.feedback,
    portfolioLink: req.body.portfolioLink ?? application.portfolioLink,
    portfolioViewed:
      req.body.portfolioViewed !== undefined
        ? req.body.portfolioViewed
        : application.portfolioViewed,
    rejectionReason: req.body.rejectionReason ?? application.rejectionReason,
    followUpDate: hasFollowUpDate
      ? normalizeDate(req.body.followUpDate)
      : application.followUpDate,
    interviewStages: req.body.interviewStages
      ? normalizeStages(req.body.interviewStages)
      : application.interviewStages
  });

  await application.save();

  res.json({
    message: "Application updated successfully.",
    application
  });
});

export const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!application) {
    const error = new Error("Application not found.");
    error.statusCode = 404;
    throw error;
  }

  res.json({ message: "Application deleted successfully." });
});
