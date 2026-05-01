import request from "supertest";
import express from "express";
import { validate } from "../src/middleware/validate.js";
import { loginSchema } from "../src/utils/validation.js";

describe("auth validation", () => {
  it("rejects invalid login payloads", async () => {
    const app = express();
    app.use(express.json());
    app.post("/login", validate(loginSchema), (_req, res) => res.json({ ok: true }));

    const response = await request(app).post("/login").send({ email: "bad", password: "123" });

    expect(response.statusCode).toBe(400);
  });
});
