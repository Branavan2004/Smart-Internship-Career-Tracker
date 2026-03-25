import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadResume } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", protect, getProfile);
router.put("/", protect, uploadResume.single("resume"), updateProfile);

export default router;
