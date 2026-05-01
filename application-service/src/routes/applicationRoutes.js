import { Router } from "express";
import {
  createApplication,
  listApplications,
  reviewApplications,
  updateApplication,
  uploadDocument
} from "../controllers/applicationController.js";
import { requireRole } from "../middleware/requireRole.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { applicationSchema } from "../utils/validation.js";

const router = Router();

router.get("/", listApplications);
router.post("/", requireRole("student", "admin"), validate(applicationSchema), createApplication);
router.put("/:id", requireRole("student", "reviewer", "admin"), validate(applicationSchema), updateApplication);
router.get("/review-queue", requireRole("reviewer", "admin"), reviewApplications);
router.post("/uploads", requireRole("student", "admin"), upload.single("document"), uploadDocument);

export default router;
