import express from "express";
import { getAdminDashboard } from "../controllers/adminController.js";
import { authorizeRoles, verifyJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", verifyJWT, authorizeRoles("admin"), getAdminDashboard);

export default router;
