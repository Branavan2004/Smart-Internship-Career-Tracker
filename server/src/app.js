import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";
import "./config/passport.js";
import { swaggerSpec } from "./config/swagger.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import { globalApiLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(passport.initialize());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(globalApiLimiter);

app.get("/api/health", (_req, res) => {
  res.json({
    message: "Career tracker API is running."
  });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/reminders", reminderRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
