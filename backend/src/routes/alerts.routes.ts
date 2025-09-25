import { Router } from "express";
import Alert from "../models/Alert";
import { requireAuth } from "../middleware/auth";

const r = Router();

// user sends SOS (requires login)
r.post("/panic", requireAuth, async (req: any, res) => {
  const { lat, lon, meta } = req.body || {};
  const a = await Alert.create({ userId: req.user.id, lat, lon, meta: meta || {} });
  res.json({ ok: true, id: a._id });
});

export default r;
