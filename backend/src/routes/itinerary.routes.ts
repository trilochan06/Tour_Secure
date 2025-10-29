// backend/src/routes/itinerary.routes.ts
import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import Itinerary from "../models/itinerary.model";

const r = Router();

/** Create an itinerary item for the current user */
r.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { title, date, location, notes } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const item = await Itinerary.create({
      title: String(title).trim(),
      date: date ? String(date) : undefined,
      location: location ? String(location).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
      user: req.user!.id, // <-- owner is the current user
    });

    res.status(201).json({ item });
  } catch (e) {
    next(e);
  }
});

/** List ONLY the current user's itinerary items */
r.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const items = await Itinerary.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

/** (Optional) delete/update with ownership check */
r.delete("/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Itinerary.findOneAndDelete({ _id: id, user: req.user!.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

r.patch("/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { id } = req.params;
    const update: any = {};
    ["title", "date", "location", "notes"].forEach((k) => {
      if (k in req.body) update[k] = req.body[k];
    });
    const doc = await Itinerary.findOneAndUpdate(
      { _id: id, user: req.user!.id },
      { $set: update },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json({ item: doc });
  } catch (e) {
    next(e);
  }
});

export default r;
