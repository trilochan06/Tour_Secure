// backend/src/routes/itinerary.routes.ts
import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import Itinerary from "../models/itinerary.model";

const router = Router();

/**
 * POST /api/itinerary
 * Create a new itinerary item belonging to the logged-in user
 */
router.post("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { title, date, location, notes } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const item = await Itinerary.create({
      title: String(title).trim(),
      date: date ? String(date).trim() : undefined,
      location: location ? String(location).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
      user: req.user!.id, // <-- associate with logged-in user
    });

    return res.status(201).json({ ok: true, item });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/itinerary
 * Fetch ONLY the logged-in user's itinerary items
 */
router.get("/", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const items = await Itinerary.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ ok: true, count: items.length, items });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/itinerary/:id
 * Update an itinerary item (only if it belongs to the logged-in user)
 */
router.patch("/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { id } = req.params;
    const allowed = ["title", "date", "location", "notes"];
    const update: any = {};

    for (const field of allowed) {
      if (field in req.body) {
        update[field] = req.body[field];
      }
    }

    const updated = await Itinerary.findOneAndUpdate(
      { _id: id, user: req.user!.id }, // ownership filter
      { $set: update },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    return res.json({ ok: true, item: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/itinerary/:id
 * Delete an itinerary item (only if it belongs to the logged-in user)
 */
router.delete("/:id", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Itinerary.findOneAndDelete({
      _id: id,
      user: req.user!.id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    next(err);
  }
});

export default router;
