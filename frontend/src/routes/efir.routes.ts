import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
const r = Router();

r.post("/report", requireAuth, async (req: AuthedRequest, res) => {
  const { subject, description, location } = req.body || {};
  if (!subject || !description) return res.status(400).json({ error: "Missing fields" });
  const caseId = `EFIR-${Date.now()}`;
  return res.status(201).json({ ok: true, caseId, reporter: req.user!.id, location });
});

export default r;
