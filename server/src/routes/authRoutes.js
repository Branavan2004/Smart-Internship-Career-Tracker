import express from "express";
import passport from "passport";
import {
  getCurrentUser,
  handleGoogleAuthSuccess,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  authLimiter,
  loginBruteForceLimiter,
  refreshTokenLimiter
} from "../middleware/rateLimiter.js";
import { handleValidationErrors } from "../middleware/validationMiddleware.js";
import { loginValidationRules, registerValidationRules } from "../validators/authValidators.js";

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a local user and issue an access token plus refresh-token cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccess'
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many registration attempts from this IP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 */
router.post("/register", authLimiter, registerValidationRules, handleValidationErrors, registerUser);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate with email and password and issue an access token plus refresh-token cookie.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccess'
 *       401:
 *         description: Invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many login or failed-login attempts from this IP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 */
router.post("/login", authLimiter, loginBruteForceLimiter, loginValidationRules, handleValidationErrors, loginUser);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Rotate the refresh token and issue a new access token.
 *     tags:
 *       - Authentication
 *     description: Uses the HTTP-only refresh-token cookie. Bearer authentication is not required for this endpoint.
 *     responses:
 *       200:
 *         description: Refresh successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccess'
 *       401:
 *         description: Missing, expired, revoked, or reused refresh token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many refresh requests from this IP.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RateLimitResponse'
 */
router.post("/refresh", refreshTokenLimiter, refreshAccessToken);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Revoke the current refresh token and clear the cookie.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logout successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 */
router.post("/logout", logoutUser);

/**
 * @openapi
 * /api/auth/google:
 *   get:
 *     summary: Start Google OAuth2 login.
 *     tags:
 *       - Authentication
 *     responses:
 *       302:
 *         description: Redirects the browser to Google OAuth consent.
 */
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/auth/google/failure" }),
  handleGoogleAuthSuccess
);
router.get("/google/failure", (_req, res) => {
  res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/auth?error=google-login-failed`);
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user.
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Missing or invalid access token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me", protect, getCurrentUser);

export default router;
