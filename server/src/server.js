import dotenv from "dotenv";
import app from "./app.js";
import passport from "passport";
import { connectDatabase } from "./config/db.js";
import { setupAsgardeoStrategy } from "./config/asgardeo.js";

// Use the port provided by the environment (Choreo expects 8080) or default to 5001 for local dev.
const port = process.env.PORT || 5001;

// Debug: log which env vars are present (not values, just keys)
console.log("=== SERVER STARTUP ===");
console.log("PORT:", port);
console.log("MONGODB_URI set:", Boolean(process.env.MONGODB_URI));
console.log("JWT_SECRET set:", Boolean(process.env.JWT_SECRET));
console.log("NODE_ENV:", process.env.NODE_ENV);

const startServer = async () => {
  // Always start listening first so the container stays alive
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });

  // Then try to connect to DB (non-fatal)
  try {
    await connectDatabase();
  } catch (error) {
    console.error("MongoDB connection failed (server still running):", error.message);
  }

  // Then try Asgardeo (non-fatal)
  try {
    await setupAsgardeoStrategy(passport);
  } catch (error) {
    console.error("Asgardeo setup failed (server still running):", error.message);
  }
};

startServer();

