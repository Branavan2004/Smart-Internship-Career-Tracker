import axios from "axios";
import { env } from "../config/env.js";

export const notificationClient = axios.create({
  baseURL: `${env.notificationServiceUrl}/api/notifications`,
  timeout: 5000
});
