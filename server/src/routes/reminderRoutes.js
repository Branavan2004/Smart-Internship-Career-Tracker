import express from "express";
import {
  getReminderSummary,
  sendSimulatedReminderEmail
} from "../controllers/reminderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /api/reminders:
 *   get:
 *     summary: Get reminder and follow-up summary for the authenticated user.
 *     tags:
 *       - Reminders
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Reminder summary returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReminderSummaryResponse'
 *       401:
 *         description: Missing or invalid access token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", protect, getReminderSummary);

/**
 * @openapi
 * /api/reminders/send:
 *   post:
 *     summary: Generate a simulated reminder email preview for the authenticated user.
 *     tags:
 *       - Reminders
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Reminder preview generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReminderSendResponse'
 *       401:
 *         description: Missing or invalid access token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/send", protect, sendSimulatedReminderEmail);

export default router;
