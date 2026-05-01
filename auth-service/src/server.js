import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

connectDatabase()
  .then(() => {
    app.listen(env.port, () => {
      logger.info(`auth-service listening on ${env.port}`);
    });
  })
  .catch((error) => {
    logger.error({ message: "Failed to connect auth-service database.", stack: error.stack });
    process.exit(1);
  });
