import cors from "cors";
import express from "express";
import fs from "fs";
import helmet from "helmet";
import morgan from "morgan";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { requireServiceAuth } from "./middleware/requireServiceAuth.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

fs.mkdirSync("logs", { recursive: true });

const app = express();
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: { title: "Analytics Service API", version: "1.0.0" },
    servers: [{ url: "http://localhost:5005/api/analytics" }]
  },
  apis: ["./src/routes/*.js"]
});

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ service: "analytics-service", status: "ok" });
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/analytics", requireServiceAuth, analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
