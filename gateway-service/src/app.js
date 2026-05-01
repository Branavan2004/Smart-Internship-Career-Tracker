import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { authenticateGatewayRequest } from "./middleware/authenticate.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { gatewayRateLimit } from "./middleware/rateLimit.js";
import { requestLogger } from "./middleware/requestContext.js";
import healthRoutes from "./routes/healthRoutes.js";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(gatewayRateLimit);

app.use("/api/health", healthRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(authenticateGatewayRequest);

const createServiceProxy = (target, pathRewrite = {}) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    proxyTimeout: 5000
  });

app.use("/api/auth", createServiceProxy(env.authServiceUrl, { "^/api/auth": "/api/auth" }));
app.use("/api/applications", createServiceProxy(env.applicationServiceUrl, { "^/api/applications": "/api/applications" }));
app.use("/api/notifications", createServiceProxy(env.notificationServiceUrl, { "^/api/notifications": "/api/notifications" }));
app.use("/api/analytics", createServiceProxy(env.analyticsServiceUrl, { "^/api/analytics": "/api/analytics" }));

app.use(notFound);
app.use(errorHandler);

export default app;
