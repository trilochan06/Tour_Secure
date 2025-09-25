// backend/src/routes/efir.routes.ts
import { Router } from "express";
import EFIR from "../models/EFIR";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";

const r = Router();

/** GET /api/efir  -> { items: EFIR[] }  (only current user's) */
r.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const items = await EFIR.find({ reporter: req.user!.id }).sort({ createdAt: -1 }).lean();
    return res.json({ items });
  } catch (e: any) {
    console.error("EFIR GET / error:", e);
    return res.status(500).json({ error: "Failed to list e-FIRs" });
  }
});

/** POST /api/efir/report  -> { ok, caseId, item } */
r.post("/report", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { subject, description, location } = req.body || {};
    if (!subject || !description) return res.status(400).json({ error: "Missing fields" });

    const item = await EFIR.create({
      subject: String(subject).trim(),
      description: String(description).trim(),
      location: location ? String(location).trim() : undefined,
      status: "Pending",
      reporter: req.user!.id,
    });

    return res.status(201).json({ ok: true, caseId: item._id.toString(), item });
  } catch (e: any) {
    console.error("EFIR POST /report error:", e);
    return res.status(500).json({ error: "Failed to file e-FIR" });
  }
});

export default r;
