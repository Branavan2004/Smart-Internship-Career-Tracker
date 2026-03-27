import express from "express";
import { getReviewQueue } from "../controllers/reviewController.js";
import { authorizeRoles, verifyJWT } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @openapi
 * /api/review:
 *   get:
 *     summary: Get the reviewer queue.
 *     tags:
 *       - Review
 *     security:
 *       - BearerAuth: []
 *     description: Requires a valid bearer access token and the `reviewer` role.
 *     responses:
 *       200:
 *         description: Reviewer queue returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewQueueResponse'
 *       401:
 *         description: Missing or invalid access token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authenticated user does not have the reviewer role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", verifyJWT, authorizeRoles("reviewer"), getReviewQueue);

export default router;
