// backend/src/routes/_debug.routes.ts

import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";

const router = Router();

/**
 * GET /api/debug/ping
 * Simple quick health check for debugging (no auth required)
 */
router.get("/ping", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/**
 * GET /api/debug/info
 * Shows basic safe environment info (no secrets!)
 */
router.get("/info", (_req, res) => {
  res.json({
    node: process.version,
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 4000,
  });
});

/**
 * GET /api/debug/me
 * Protected route: returns the currently authenticated user
 * Uses requireAuth middleware to decode JWT and attach req.user
 */
router.get("/me", requireAuth, (req: AuthedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  res.json({
    ok: true,
    user: req.user,
  });
});

export default router;
