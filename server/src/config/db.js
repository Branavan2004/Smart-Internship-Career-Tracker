import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

export const connectDatabase = async (retries = MAX_RETRIES) => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to your server .env file.");
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      tls: mongoUri.startsWith("mongodb+srv") || mongoUri.includes("tls=true"),
    });
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    if (retries > 0) {
      console.log(`Retrying connection in ${RETRY_DELAY_MS / 1000}s... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDatabase(retries - 1);
    }
    throw error;
  }
};
