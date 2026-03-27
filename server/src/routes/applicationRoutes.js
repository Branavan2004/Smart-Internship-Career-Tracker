import express from "express";
import {
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication
} from "../controllers/applicationController.js";
import { authorizeRoles, verifyJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyJWT, authorizeRoles("student"));
router.route("/").get(getApplications).post(createApplication);
router.route("/:id").put(updateApplication).delete(deleteApplication);

export default router;
