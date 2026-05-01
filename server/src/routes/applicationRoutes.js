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

/**
 * @openapi
 * /api/applications:
 *   get:
 *     summary: Get internship applications for the authenticated student.
 *     tags:
 *       - Applications
 *     security:
 *       - BearerAuth: []
 *     description: Requires a valid bearer access token and the `student` role.
 *     responses:
 *       200:
 *         description: Student applications returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApplicationsResponse'
 *       401:
 *         description: Missing or invalid access token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Authenticated user does not have the student role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/").get(getApplications).post(createApplication);
router.route("/:id").put(updateApplication).patch(updateApplication).delete(deleteApplication);

export default router;
