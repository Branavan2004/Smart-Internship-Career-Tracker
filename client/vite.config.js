import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    globals: true
  },
  resolve: {
    alias: {
      "@asgardeo/auth-react": path.resolve(__dirname, "./src/test/asgardeoMock.jsx")
    }
  }
});
