import express from "express";
import { getReviewQueue } from "../controllers/reviewController.js";
import { authorizeRoles, verifyJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyJWT, authorizeRoles("reviewer"), getReviewQueue);

export default router;
