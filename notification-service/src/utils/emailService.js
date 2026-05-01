import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const canSendRealEmail = env.smtpHost && env.smtpUser && env.smtpPass;

const transporter = canSendRealEmail
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: false,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    })
  : null;

export const sendEmailAsync = ({ to, subject, text }) => {
  setImmediate(async () => {
    if (!transporter) {
      logger.info({
        message: "Email transport not configured. Skipping real email send.",
        to,
        subject,
        text
      });
      return;
    }

    try {
      await transporter.sendMail({
        from: env.smtpFrom,
        to,
        subject,
        text
      });
    } catch (error) {
      logger.error({ message: "Failed to send email.", stack: error.stack });
    }
  });
};
