import fs from "fs";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

fs.mkdirSync("logs", { recursive: true });

app.listen(env.port, () => {
  logger.info(`gateway-service listening on ${env.port}`);
});
