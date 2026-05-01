import { Router } from "express";
import passport from "passport";
import {
  handleGoogleCallback,
  login,
  logout,
  me,
  refresh,
  register
} from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, refreshSchema, registerSchema } from "../utils/validation.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", logout);
router.get("/me", me);
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/auth/google/failure" }),
  handleGoogleCallback
);
router.get("/google/failure", (_req, res) => {
  res.status(401).json({ message: "Google authentication failed." });
});

export default router;
