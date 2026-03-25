import nodemailer from "nodemailer";
import Application from "../models/Application.js";

const transporter = nodemailer.createTransport({
  jsonTransport: true
});

const nextSevenDays = () => {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  return { today, nextWeek };
};

export const buildReminderDigest = async (user) => {
  const { today, nextWeek } = nextSevenDays();

  const applications = await Application.find({
    user: user._id,
    $or: [
      { followUpDate: { $gte: today, $lte: nextWeek } },
      { "interviewStages.date": { $gte: today, $lte: nextWeek } }
    ]
  }).sort({ followUpDate: 1, appliedDate: -1 });

  const summary = applications.map((application) => ({
    companyName: application.companyName,
    role: application.role,
    status: application.status,
    followUpDate: application.followUpDate,
    interviewStages: application.interviewStages.filter((stage) => {
      if (!stage.date) {
        return false;
      }

      return stage.date >= today && stage.date <= nextWeek;
    })
  }));

  return {
    count: summary.length,
    summary
  };
};

export const sendReminderDigest = async (user) => {
  const digest = await buildReminderDigest(user);

  const message = await transporter.sendMail({
    from: process.env.EMAIL_FROM || "no-reply@careertracker.dev",
    to: user.email,
    subject: "Your interview and follow-up reminders",
    text: JSON.stringify(digest, null, 2)
  });

  return {
    digest,
    message
  };
};
