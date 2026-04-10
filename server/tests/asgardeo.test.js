import { jest } from "@jest/globals";
import request from "supertest";
import passport from "passport";

// Set mock env vars BEFORE importing app or routes
process.env.ASGARDEO_CLIENT_ID = "mock-client-id";
process.env.ASGARDEO_CLIENT_SECRET = "mock-client-secret";
process.env.ASGARDEO_BASE_URL = "https://api.asgardeo.io/t/mocktenant";
process.env.ASGARDEO_CALLBACK_URL = "http://localhost:5001/api/auth/asgardeo/callback";
process.env.JWT_SECRET = "test-secret";
process.env.REFRESH_TOKEN_SECRET = "test-secret";
process.env.ACCESS_TOKEN_SECRET = "test-secret";

// Mock the models BEFORE importing app or routes
const userStore = new Map();
const refreshTokenStore = new Map();

const UserModelMock = {
  findOne: jest.fn(async (query) => {
    if (query.email === "test-asgardeo@example.com") {
      return userStore.get("asg-12345") || null;
    }
    return null;
  }),
  create: jest.fn(async (data) => {
    const user = { ...data, _id: "mock-id-1" };
    userStore.set(data.asgardeoId || "mock-id-1", user);
    return user;
  }),
  findById: jest.fn(async (id) => userStore.get(id) || null)
};

const RefreshTokenModelMock = {
  create: jest.fn(async (data) => {
    const token = { ...data, _id: "mock-token-id" };
    refreshTokenStore.set("mock-token-id", token);
    return token;
  })
};

await jest.unstable_mockModule("../src/models/User.js", () => ({
  default: UserModelMock
}));

await jest.unstable_mockModule("../src/models/RefreshToken.js", () => ({
  default: RefreshTokenModelMock
}));

// Now import app and models
const app = (await import("../src/app.js")).default;
const User = (await import("../src/models/User.js")).default;
const RefreshToken = (await import("../src/models/RefreshToken.js")).default;

class MockAsgardeoStrategy {
  constructor() {
    this.name = "asgardeo";
  }
  authenticate(req) {
    if (req.url.includes("/asgardeo/callback")) {
      // Success case for callback
      const user = { 
        _id: "mock-id-1", 
        email: "test-asgardeo@example.com", 
        role: "admin", 
        asgardeoId: "asg-12345" 
      };
      this.success(user);
    } else {
      this.redirect("https://api.asgardeo.io/t/mocktenant/oauth2/authorize");
    }
  }
}

describe("Asgardeo OIDC Integration", () => {
  beforeAll(async () => {
    passport.use("asgardeo", new MockAsgardeoStrategy());
  });

  afterAll(async () => {
    jest.restoreAllMocks();
  });

  it("should start Asgardeo OIDC login and redirect", async () => {
    const res = await request(app).get("/api/auth/asgardeo");
    expect(res.status).toBe(302);
    expect(res.header.location).toBe("https://api.asgardeo.io/t/mocktenant/oauth2/authorize");
  });

  it("should handle Asgardeo callback and issue tokens", async () => {
    const res = await request(app).get("/api/auth/asgardeo/callback");
    
    expect(res.status).toBe(302);
    expect(res.header.location).toContain("token=");
    expect(res.header["set-cookie"]).toBeDefined();
  });
});

