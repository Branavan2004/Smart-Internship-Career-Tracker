/**
 * Notification Handler
 *
 * Subscribes to domain events and dispatches notifications.
 * Currently logs structured payloads (simulating an email/SMS provider call).
 * Replace the `sendEmail()` stub with Nodemailer / Twilio / WSO2 Email Connector
 * to make this fully operational.
 *
 * Production mapping: this handler would be a separate Ballerina service
 * consuming from a Kafka topic — see analytics-service/analytics_service.bal
 * for the Ballerina equivalent.
 */

import { eventBus } from "../EventBus.js";
import { logger } from "../../config/logger.js";

// --- Simulated email sender ---
const sendEmail = async ({ to, subject, body }) => {
  // In production: await transporter.sendMail({ to, subject, html: body })
  logger.info(
    { channel: "email", to, subject },
    `[NOTIFICATION] Email dispatched`
  );
};

const sendPlatformAlert = async ({ userId, message, type }) => {
  // In production: push to WebSocket / Firebase / WSO2 Stream Processor
  logger.info(
    { channel: "platform", userId, type },
    `[NOTIFICATION] In-app alert: ${message}`
  );
};

// ── Handlers ──────────────────────────────────────────────────────────────

async function onApplicationCreated({ payload }) {
  const { user, companyName, role } = payload;

  await sendEmail({
    to: user.email,
    subject: `Application submitted — ${companyName}`,
    body: `
      <h2>Application Confirmed</h2>
      <p>You've applied for <strong>${role}</strong> at <strong>${companyName}</strong>.</p>
      <p>We'll update you when the status changes.</p>
    `,
  });

  await sendPlatformAlert({
    userId: user._id,
    message: `New application to ${companyName} recorded.`,
    type: "success",
  });
}

async function onApplicationStatusChanged({ payload }) {
  const { user, companyName, role, previousStatus, newStatus } = payload;

  const statusEmoji = {
    Accepted: "🎉",
    Offer: "🏆",
    Rejected: "😔",
    Interviewed: "📅",
  }[newStatus] ?? "📋";

  await sendEmail({
    to: user.email,
    subject: `${statusEmoji} Status update — ${companyName}`,
    body: `
      <h2>Application Status Changed</h2>
      <p>Your application for <strong>${role}</strong> at <strong>${companyName}</strong>
      moved from <em>${previousStatus}</em> → <strong>${newStatus}</strong>.</p>
    `,
  });

  await sendPlatformAlert({
    userId: user._id,
    message: `${companyName}: status is now ${newStatus}`,
    type: newStatus === "Rejected" ? "warning" : "info",
  });
}

async function onApplicationDeleted({ payload }) {
  const { user, companyName } = payload;
  logger.info(
    { userId: user._id, companyName },
    "[NOTIFICATION] Application deleted — no email sent (user-initiated)"
  );
}

// ── Register subscriptions ────────────────────────────────────────────────

export function registerNotificationHandlers() {
  eventBus.subscribe("application.created", onApplicationCreated);
  eventBus.subscribe("application.status_changed", onApplicationStatusChanged);
  eventBus.subscribe("application.deleted", onApplicationDeleted);
  logger.info("NotificationHandler: subscriptions registered");
}
