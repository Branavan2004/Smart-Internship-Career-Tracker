import cors from "cors";
import express from "express";
import fs from "fs";
import helmet from "helmet";
import morgan from "morgan";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import passport from "./config/passport.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { authRateLimit } from "./middleware/rateLimit.js";
import authRoutes from "./routes/authRoutes.js";

fs.mkdirSync("logs", { recursive: true });

const app = express();
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Auth Service API",
      version: "1.0.0"
    },
    servers: [{ url: "http://localhost:5002/api/auth" }]
  },
  apis: ["./src/routes/*.js"]
});

app.locals.clientUrl = env.clientUrl;
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);
app.use(passport.initialize());
app.use(authRateLimit);

app.get("/api/health", (_req, res) => {
  res.json({ service: "auth-service", status: "ok" });
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/auth", authRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
