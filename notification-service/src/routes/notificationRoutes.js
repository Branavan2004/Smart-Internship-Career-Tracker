import { Router } from "express";
import {
  createEventNotification,
  listNotifications
} from "../controllers/notificationController.js";
import { requireServiceAuth } from "../middleware/requireServiceAuth.js";

const router = Router();

router.post("/events/application-created", createEventNotification);
router.get("/", requireServiceAuth, listNotifications);

export default router;
