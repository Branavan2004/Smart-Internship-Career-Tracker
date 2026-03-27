import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { jest } from "@jest/globals";

const userStore = new Map();
let app;
let createAccessToken;
let verifyJWT;
let authorizeRoles;
let errorHandler;
let getAdminDashboard;
let getApplications;
let getReviewQueue;

const createFindByIdQuery = (id) => ({
  select: jest.fn(async () => userStore.get(String(id)) || null)
});

const UserModelMock = {
  findById: jest.fn((id) => createFindByIdQuery(id)),
  countDocuments: jest.fn(async (query = {}) => {
    const users = Array.from(userStore.values());

    if (!query.role) {
      return users.length;
    }

    return users.filter((user) => user.role === query.role).length;
  })
};

const applicationList = [
  {
    _id: "app-1",
    companyName: "Acme",
    role: "Intern Engineer",
    status: "Pending",
    updatedAt: new Date("2026-03-01").toISOString(),
    user: {
      _id: "student-1",
      name: "Student Tester",
      email: "student@test.com",
      role: "student"
    }
  }
];

const ApplicationModelMock = {
  countDocuments: jest.fn(async () => applicationList.length),
  find: jest.fn((query = {}) => {
    let results = [...applicationList];

    if (query.user) {
      results = results.filter((item) => item.user._id === String(query.user));
    }

    if (query.status?.$in) {
      results = results.filter((item) => query.status.$in.includes(item.status));
    }

    const chain = {
      populate: jest.fn(() => chain),
      sort: jest.fn(async () => results)
    };

    return chain;
  })
};

await jest.unstable_mockModule("../src/models/User.js", () => ({
  default: UserModelMock
}));

await jest.unstable_mockModule("../src/models/Application.js", () => ({
  default: ApplicationModelMock
}));

describe("RBAC API tests", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.ACCESS_TOKEN_SECRET = "test-secret";
    process.env.REFRESH_TOKEN_SECRET = "test-secret";

    ({ createAccessToken } = await import("../src/utils/tokenService.js"));
    ({ verifyJWT, authorizeRoles } = await import("../src/middleware/authMiddleware.js"));
    ({ errorHandler } = await import("../src/middleware/errorMiddleware.js"));
    ({ getAdminDashboard } = await import("../src/controllers/adminController.js"));
    ({ getApplications } = await import("../src/controllers/applicationController.js"));
    ({ getReviewQueue } = await import("../src/controllers/reviewController.js"));

    app = express();
    app.use(express.json());
    app.get("/api/admin/dashboard", verifyJWT, authorizeRoles("admin"), getAdminDashboard);
    app.get("/api/applications", verifyJWT, authorizeRoles("student"), getApplications);
    app.get("/api/review", verifyJWT, authorizeRoles("reviewer"), getReviewQueue);
    app.use(errorHandler);
  });

  beforeEach(() => {
    userStore.clear();
    userStore.set("student-1", {
      _id: "student-1",
      name: "Student Tester",
      email: "student@test.com",
      role: "student"
    });
    userStore.set("admin-1", {
      _id: "admin-1",
      name: "Admin Tester",
      email: "admin@test.com",
      role: "admin"
    });
    userStore.set("reviewer-1", {
      _id: "reviewer-1",
      name: "Reviewer Tester",
      email: "reviewer@test.com",
      role: "reviewer"
    });
  });

  it("returns 403 when a student accesses the admin route", async () => {
    const token = createAccessToken({ _id: "student-1", role: "student" });

    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it("returns 200 when an admin accesses the admin route", async () => {
    const token = createAccessToken({ _id: "admin-1", role: "admin" });

    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.stats.totalUsers).toBe(3);
  });

  it("returns 200 when a reviewer accesses the review route", async () => {
    const token = createAccessToken({ _id: "reviewer-1", role: "reviewer" });

    const response = await request(app)
      .get("/api/review")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.applications)).toBe(true);
  });

  it("returns 403 when a student accesses the reviewer route", async () => {
    const token = createAccessToken({ _id: "student-1", role: "student" });

    const response = await request(app)
      .get("/api/review")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it("returns 401 when the JWT is invalid", async () => {
    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", "Bearer invalid-token");

    expect(response.statusCode).toBe(401);
  });

  it("returns 401 when the JWT is missing", async () => {
    const response = await request(app).get("/api/admin/dashboard");

    expect(response.statusCode).toBe(401);
  });

  it("returns 401 for an expired JWT", async () => {
    const token = jwt.sign({ userId: "admin-1", role: "admin" }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: -1
    });

    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(401);
  });

  it("returns 401 for a tampered JWT", async () => {
    const token = `${createAccessToken({ _id: "admin-1", role: "admin" })}tampered`;

    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(401);
  });

  it("returns 403 for an unknown role stored on the user", async () => {
    userStore.set("unknown-1", {
      _id: "unknown-1",
      name: "Unknown Role User",
      email: "unknown@test.com",
      role: "supervisor"
    });

    const token = createAccessToken({ _id: "unknown-1", role: "supervisor" });

    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it("returns 401 when the user has been deleted from the database", async () => {
    const token = createAccessToken({ _id: "deleted-user", role: "admin" });

    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(401);
  });

  it("blocks access after a role change even if the old token says admin", async () => {
    const token = createAccessToken({ _id: "admin-1", role: "admin" });
    userStore.set("admin-1", {
      _id: "admin-1",
      name: "Admin Tester",
      email: "admin@test.com",
      role: "student"
    });

    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });
});
