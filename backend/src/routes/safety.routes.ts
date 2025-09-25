import { Router } from "express";
import SafetyScore from "../models/SafetyScore";
import { calculateSafety } from "../utils/safety";

const router = Router();

/** Helper: shape a SafetyScore doc into the API point (with guards). */
function toPoint(r: any) {
  const lat = r?.loc?.coordinates?.[1];
  const lng = r?.loc?.coordinates?.[0];
  return {
    name: r?.name ?? "Unknown",
    lat: typeof lat === "number" ? lat : 0,
    lng: typeof lng === "number" ? lng : 0,
    safety_score: calculateSafety(r?.crimeRate ?? 50, r?.infraScore ?? 50, r?.sentiment ?? 0),
    _debug: {
      crimeRate: r?.crimeRate ?? 50,
      infraScore: r?.infraScore ?? 50,
      sentiment: r?.sentiment ?? 0,
      ratingCount: r?.ratingCount ?? 0,
    },
  };
}

/** GET /api/safety-scores */
router.get("/", async (_req, res, next) => {
  try {
    const rows = await SafetyScore.find().limit(3000);
    res.set("Cache-Control", "no-store");
    res.json(rows.map(toPoint));
  } catch (e) {
    next(e);
  }
});

/** GET /api/safety-scores/nearby?lat=&lng=&radius=km */
router.get("/nearby", async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radius ?? 25);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    const rows = await SafetyScore.find({
      loc: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    }).limit(2000);

    res.set("Cache-Control", "no-store");
    res.json(rows.map(toPoint));
  } catch (e) {
    next(e);
  }
});

/** GET /api/safety-scores/search?q=Shillong */
router.get("/search", async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    if (!q) return res.status(400).json({ error: "q is required" });

    // exact → starts-with → contains
    const exact = await SafetyScore.find({ name: { $regex: `^${q}$`, $options: "i" } }).limit(10);
    const starts = await SafetyScore.find({ name: { $regex: `^${q}[,\\s]?.*`, $options: "i" } }).limit(20);
    const contains = await SafetyScore.find({ name: { $regex: q, $options: "i" } }).limit(20);

    // merge unique by _id
    const seen = new Set<string>();
    const rows: any[] = [];
    for (const r of [...exact, ...starts, ...contains]) {
      const id = String(r._id);
      if (!seen.has(id)) {
        seen.add(id);
        rows.push(r);
      }
    }

    if (!rows.length) {
      res.set("Cache-Control", "no-store");
      return res.json({ message: "No matches" });
    }

    res.set("Cache-Control", "no-store");
    // For search results we don’t need the _debug payload—return leaner objects
    res.json(
      rows.slice(0, 20).map((r) => ({
        name: r.name,
        lat: r?.loc?.coordinates?.[1] ?? 0,
        lng: r?.loc?.coordinates?.[0] ?? 0,
        safety_score: calculateSafety(r?.crimeRate ?? 50, r?.infraScore ?? 50, r?.sentiment ?? 0),
      }))
    );
  } catch (e) {
    next(e);
  }
});

export default router;
