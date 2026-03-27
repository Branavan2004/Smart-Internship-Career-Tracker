import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { jest } from "@jest/globals";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "test-secret";

const userStore = new Map([
  [
    "admin-1",
    {
      _id: "admin-1",
      email: "admin@test.com",
      role: "admin"
    }
  ]
]);

const UserModelMock = {
  findById: jest.fn(async (id) => userStore.get(String(id)) || null)
};

await jest.unstable_mockModule("../src/models/User.js", () => ({
  default: UserModelMock
}));

const { createAccessToken } = await import("../src/utils/tokenService.js");
const { verifyJWT, authorizeRoles } = await import("../src/middleware/authMiddleware.js");
const { errorHandler } = await import("../src/middleware/errorMiddleware.js");

describe("JWT role validation", () => {
  it("includes the role in the JWT payload", () => {
    const token = createAccessToken({ _id: "admin-1", role: "admin" });
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    expect(decoded.userId).toBe("admin-1");
    expect(decoded.role).toBe("admin");
  });

  it("lets middleware load the user and preserve auth data", async () => {
    const app = express();
    const token = createAccessToken({ _id: "admin-1", role: "admin" });

    app.get("/secure", verifyJWT, (req, res) => {
      res.json({
        userRole: req.user.role,
        tokenRole: req.auth.role
      });
    });
    app.use(errorHandler);

    const response = await request(app)
      .get("/secure")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      userRole: "admin",
      tokenRole: "admin"
    });
  });

  it("blocks access when the database role no longer matches the allowed role", async () => {
    const app = express();
    const token = createAccessToken({ _id: "admin-1", role: "admin" });
    userStore.set("admin-1", {
      _id: "admin-1",
      email: "admin@test.com",
      role: "student"
    });

    app.get("/secure", verifyJWT, authorizeRoles("admin"), (_req, res) => {
      res.json({ ok: true });
    });
    app.use(errorHandler);

    const response = await request(app)
      .get("/secure")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });
});
