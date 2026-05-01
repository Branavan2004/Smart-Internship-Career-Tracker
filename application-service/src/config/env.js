import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5003),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/smart-career-tracker",
  notificationServiceUrl:
    process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5004",
  maxFileSize: Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024),
  uploadDir: process.env.UPLOAD_DIR || "uploads"
};
