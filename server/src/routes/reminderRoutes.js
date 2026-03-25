import express from "express";
import {
  getReminderSummary,
  sendSimulatedReminderEmail
} from "../controllers/reminderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getReminderSummary);
router.post("/send", protect, sendSimulatedReminderEmail);

export default router;
