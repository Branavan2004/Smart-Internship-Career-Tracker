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
import applicationRoutes from "./routes/applicationRoutes.js";

fs.mkdirSync("logs", { recursive: true });
fs.mkdirSync(env.uploadDir, { recursive: true });

const app = express();
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: { title: "Application Service API", version: "1.0.0" },
    servers: [{ url: "http://localhost:5003/api/applications" }]
  },
  apis: ["./src/routes/*.js"]
});

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

app.get("/api/health", (_req, res) => {
  res.json({ service: "application-service", status: "ok" });
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/applications", requireServiceAuth, applicationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
