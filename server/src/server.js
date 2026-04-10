import dotenv from "dotenv";
import app from "./app.js";
import passport from "passport";
import { connectDatabase } from "./config/db.js";
import { setupAsgardeoStrategy } from "./config/asgardeo.js";

dotenv.config();

const port = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDatabase();
    await setupAsgardeoStrategy(passport);
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
