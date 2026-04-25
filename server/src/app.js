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
import session from "express-session";
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
import { requestMetrics } from "./middleware/requestMetrics.js";
import { tenantContext } from "./middleware/tenantMiddleware.js";
import { enforceQuota } from "./middleware/quotaMiddleware.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import { registerNotificationHandlers } from "./events/handlers/notificationHandler.js";
import { registerAnalyticsHandlers } from "./events/handlers/analyticsHandler.js";

// Register event bus handlers at startup (before any request arrives)
registerNotificationHandlers();
registerAnalyticsHandlers();

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.indexOf(origin) !== -1 || 
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".choreoapps.dev") // Allow all Choreo frontend apps
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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

app.use(
  session({
    secret: process.env.JWT_SECRET || "fallback_session_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(globalApiLimiter);
app.use(requestMetrics);

app.get("/api/health", (_req, res) => {
  res.json({
    message: "Career tracker API is running."
  });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
// Tenant context + quota enforcement on all data routes
app.use("/api/applications", tenantContext, enforceQuota, applicationRoutes);
app.use("/api/analytics", tenantContext, analyticsRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/metrics", metricsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
