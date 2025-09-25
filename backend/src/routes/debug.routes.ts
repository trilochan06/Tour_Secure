import { Router } from "express";

const router = Router();

// Simple health ping for debugging
router.get("/ping", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// (Optional) show safe server info (do NOT include secrets here)
router.get("/info", (_req, res) => {
  res.json({
    node: process.version,
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 4000,
  });
});

export default router;
