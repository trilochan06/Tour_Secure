import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import EFIR from "../models/efir.model"; // Your e-FIR model file
import Alert from "../models/Alert";   // the Alert model from step 3

const r = Router();
r.use(requireAuth, requireAdmin);

r.get("/efir", async (_req, res) => {
  const items = await EFIR.find().sort({ createdAt: -1 }).limit(200);
  res.json(items);
});

r.get("/alerts", async (_req, res) => {
  const items = await Alert.find().sort({ createdAt: -1 }).limit(100);
  res.json(items);
});

export default r;
