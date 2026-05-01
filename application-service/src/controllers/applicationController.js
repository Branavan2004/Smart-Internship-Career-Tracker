import Application from "../models/Application.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notificationClient } from "../utils/serviceClient.js";

const normalizeApplication = (payload, userId) => ({
  userId,
  companyName: payload.companyName,
  roleTitle: payload.roleTitle,
  status: payload.status || "applied",
  interviewStages: (payload.interviewStages || []).map((stage) => ({
    stageName: stage.stageName,
    date: stage.date ? new Date(stage.date) : undefined,
    result: stage.result || "pending"
  })),
  followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : undefined,
  notes: payload.notes || "",
  portfolioUrl: payload.portfolioUrl || ""
});

const sendEventNotification = async (application, user) => {
  try {
    await notificationClient.post("/events/application-created", {
      userId: user.sub,
      email: user.email,
      message: `New application created for ${application.companyName} - ${application.roleTitle}.`
    });
  } catch (_error) {
    // Event-driven style behavior should not block the main application write path.
  }
};

export const listApplications = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === "student") {
    query.userId = req.user.sub;
  }

  if (req.query.status) {
    query.status = req.query.status;
  }

  const applications = await Application.find(query).sort({ createdAt: -1 });
  res.json({ applications });
});

export const createApplication = asyncHandler(async (req, res) => {
  const application = await Application.create(normalizeApplication(req.body, req.user.sub));
  await sendEventNotification(application, req.user);

  res.status(201).json({
    message: "Application created successfully.",
    application
  });
});

export const updateApplication = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };

  if (req.user.role === "student") {
    query.userId = req.user.sub;
  }

  const application = await Application.findOne(query);

  if (!application) {
    throw new AppError("Application not found.", 404);
  }

  Object.assign(application, normalizeApplication(req.body, application.userId));
  await application.save();

  res.json({
    message: "Application updated successfully.",
    application
  });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("A file is required.", 400);
  }

  res.status(201).json({
    message: "File uploaded successfully.",
    file: {
      filename: req.file.filename,
      path: req.file.path
    }
  });
});

export const reviewApplications = asyncHandler(async (_req, res) => {
  const applications = await Application.find({ status: { $in: ["review", "interview"] } });
  res.json({ applications });
});
