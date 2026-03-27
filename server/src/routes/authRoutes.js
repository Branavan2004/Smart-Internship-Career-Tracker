import express from "express";
import passport from "passport";
import {
  getCurrentUser,
  handleGoogleAuthSuccess,
  loginUser,
  registerUser
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/auth/google/failure" }),
  handleGoogleAuthSuccess
);
router.get("/google/failure", (_req, res) => {
  res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/auth?error=google-login-failed`);
});
router.get("/me", protect, getCurrentUser);

export default router;
