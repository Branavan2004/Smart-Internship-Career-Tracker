import Application from "../models/Application.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { eventBus } from "../events/EventBus.js";
import axios from "axios";

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
    user: req.user._id,
    tenantId: req.user.tenantId || "default",
  });

  // Publish domain event — handlers run asynchronously
  eventBus.publish("application.created", {
    user: { _id: req.user._id, email: req.user.email, name: req.user.name },
    tenantId: req.user.tenantId || "default",
    companyName: application.companyName,
    role: application.role,
    applicationId: application._id,
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

  // Publish status change event if status was mutated
  if (req.body.status && req.body.status !== application.status) {
    eventBus.publish("application.status_changed", {
      user: { _id: req.user._id, email: req.user.email, name: req.user.name },
      tenantId: req.user.tenantId || "default",
      companyName: application.companyName,
      role: application.role,
      applicationId: application._id,
      previousStatus: application.status,
      newStatus: req.body.status,
    });

    // ------------------------------------------------------------------------
    // WEBHOOK: Trigger Ballerina Interview Workflow Microservice
    // We use a fire-and-forget pattern here. If the Ballerina service is down,
    // we log a warning but DO NOT fail the request. The user's application 
    // status was successfully saved to MongoDB, which is the core requirement.
    // ------------------------------------------------------------------------
    if (req.body.status.toLowerCase() === "interviewed") {
      axios.post("http://localhost:9091/api/interview-trigger", {
        applicantEmail: req.user.email,
        companyName: application.companyName,
        role: application.role,
        interviewDate: application.interviewDate || null
      }).catch(err => {
        console.warn("⚠️ Webhook to Ballerina interview service failed:", err.message);
      });
    }
  }

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

  // Publish delete event
  eventBus.publish("application.deleted", {
    user: { _id: req.user._id, email: req.user.email },
    tenantId: req.user.tenantId || "default",
    companyName: application.companyName,
    applicationId: application._id,
  });

  res.json({ message: "Application deleted successfully." });
});
