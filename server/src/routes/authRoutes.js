import express from "express";
import passport from "passport";
import {
  getCurrentUser,
  handleGoogleAuthSuccess,
  handleAsgardeoAuthSuccess,
  exchangeAsgardeoToken,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  getMyGroups
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isGoogleOAuthConfigured } from "../config/passport.js";
import { isAsgardeoConfigured } from "../config/asgardeo.js";
import {
  authLimiter,
  loginBruteForceLimiter,
  refreshTokenLimiter
} from "../middleware/rateLimiter.js";
import { handleValidationErrors } from "../middleware/validationMiddleware.js";
import { loginValidationRules, registerValidationRules } from "../validators/authValidators.js";

const router = express.Router();

const handleGoogleOAuthUnavailable = (req, res, next) => {
  if (isGoogleOAuthConfigured) {
    return next();
  }

  return res.status(503).json({
    message: "Google OAuth is not configured on this server."
  });
};

const handleAsgardeoOAuthUnavailable = (req, res, next) => {
  if (isAsgardeoConfigured) {
    return next();
  }

  return res.status(503).json({
    message: "Asgardeo OIDC is not configured on this server."
  });
};

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

// Asgardeo Token Exchange: convert Asgardeo OIDC token to backend JWT
router.post("/asgardeo-exchange", authLimiter, exchangeAsgardeoToken);

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
router.get(
  "/google",
  handleGoogleOAuthUnavailable,
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  handleGoogleOAuthUnavailable,
  passport.authenticate("google", { session: false, failureRedirect: "/api/auth/google/failure" }),
  handleGoogleAuthSuccess
);
router.get("/google/failure", (_req, res) => {
  res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/auth?error=google-login-failed`);
});

/**
 * @openapi
 * /api/auth/asgardeo:
 *   get:
 *     summary: Start Asgardeo OIDC login.
 *     tags:
 *       - Authentication
 *     responses:
 *       302:
 *         description: Redirects the browser to Asgardeo consent.
 */
router.get(
  "/asgardeo",
  handleAsgardeoOAuthUnavailable,
  passport.authenticate("asgardeo", { scope: ["openid", "profile", "email", "groups"] })
);
router.get(
  "/asgardeo/callback",
  handleAsgardeoOAuthUnavailable,
  passport.authenticate("asgardeo", { failureRedirect: "/api/auth/asgardeo/failure" }),
  handleAsgardeoAuthSuccess
);
router.get("/asgardeo/failure", (_req, res) => {
  res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/auth?error=asgardeo-login-failed`);
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

/**
 * @openapi
 * /api/auth/my-groups:
 *   get:
 *     summary: Get the current user's role and Asgardeo groups.
 *     tags:
 *       - Authentication
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user groups and role.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                 groups:
 *                   type: array
 *                   items:
 *                     type: string
 *                 source:
 *                   type: string
 *       401:
 *         description: Missing or invalid access token.
 */
router.get("/my-groups", protect, getMyGroups);

export default router;
