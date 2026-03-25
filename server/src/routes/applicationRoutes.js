import express from "express";
import {
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication
} from "../controllers/applicationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").get(getApplications).post(createApplication);
router.route("/:id").put(updateApplication).delete(deleteApplication);

export default router;
