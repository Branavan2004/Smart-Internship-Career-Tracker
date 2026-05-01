import request from "supertest";
import express from "express";
import { requireRole } from "../src/middleware/requireRole.js";

describe("application RBAC", () => {
  it("blocks unauthorized roles", async () => {
    const app = express();
    app.get(
      "/review",
      (req, _res, next) => {
        req.user = { role: "student" };
        next();
      },
      requireRole("reviewer", "admin"),
      (_req, res) => res.json({ ok: true })
    );
    app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ message: error.message }));

    const response = await request(app).get("/review");

    expect(response.statusCode).toBe(403);
  });
});
