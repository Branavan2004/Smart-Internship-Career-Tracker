import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check gateway health.
 *     responses:
 *       200:
 *         description: Gateway is healthy.
 */
router.get("/", (_req, res) => {
  res.json({
    service: "gateway-service",
    status: "ok"
  });
});

export default router;
