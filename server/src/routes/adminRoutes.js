import express from "express";
import { getAdminDashboard } from "../controllers/adminController.js";
import { authorizeRoles, verifyJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard metrics.
 *     tags:
 *       - Admin
 *     security:
 *       - BearerAuth: []
 *     description: Requires a valid bearer access token and the `admin` role.
 *     responses:
 *       200:
 *         description: Admin dashboard data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminDashboardResponse'
 *       401:
 *         description: Missing or invalid access token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authenticated user does not have the admin role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/dashboard", verifyJWT, authorizeRoles("admin"), getAdminDashboard);

export default router;
