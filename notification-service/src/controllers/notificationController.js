import Notification from "../models/Notification.js";
import { sendEmailAsync } from "../utils/emailService.js";

export const createEventNotification = async (req, res) => {
  const notification = await Notification.create({
    userId: req.body.userId,
    message: req.body.message
  });

  if (req.body.email) {
    sendEmailAsync({
      to: req.body.email,
      subject: "Career Tracker Alert",
      text: req.body.message
    });
  }

  res.status(201).json({
    message: "Notification queued.",
    notification
  });
};

export const listNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.sub }).sort({ createdAt: -1 });
  res.json({ notifications });
};
