// backend/src/routes/reviews.routes.ts
import { Router } from "express";
import SafetyScore from "../models/SafetyScore";
import Review from "../models/Review";
import { recomputeAreaFromReviews } from "../services/reviews.service";
import { calculateSafety } from "../utils/safety";

const router = Router();

/* ---------- helpers ---------- */
function clean(s: string) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

async function findOrCreateArea(name: string) {
  const q = clean(name);
  if (!q) return null;

  // exact match
  let doc = await SafetyScore.findOne({ name: { $regex: `^${q}$`, $options: "i" } });
  if (doc) return doc;

  // starts-with
  doc = await SafetyScore.findOne({ name: { $regex: `^${q}[,\\s]?.*`, $options: "i" } });
  if (doc) return doc;

  // contains
  doc = await SafetyScore.findOne({ name: { $regex: q, $options: "i" } });
  if (doc) return doc;

  // auto-create new SafetyScore if not found
  return SafetyScore.create({
    name: q,
    ratingCount: 0,
    ratingSum: 0,
    sentiment: 0,
    infraScore: 50,
    crimeRate: 50,
  });
}

/* ---------- POST /api/reviews ---------- */
router.post("/", async (req, res, next) => {
  try {
    console.log("[POST /api/reviews] body=", req.body);

    const areaIdRaw = (req.body.areaId ?? req.body.areaID) as string | undefined;
    const rawName =
      (req.body.areaName ??
        req.body.place ??
        req.body.name ??
        req.body.location ??
        "") as string;

    const nameRaw = clean(rawName);
    const ratingRaw = req.body.rating ?? req.body.stars ?? req.body.score ?? req.body.value;
    const rating = Number(ratingRaw);
    const text = clean(req.body.text ?? req.body.comment ?? req.body.review ?? "");

    // validation
    if (!nameRaw && !areaIdRaw) {
      return res.status(400).json({
        error: "Please provide an area name (areaName/place/location) or areaId.",
      });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    // resolve or create area
    let areaDoc: any = null;
    if (areaIdRaw) {
      areaDoc = await SafetyScore.findById(areaIdRaw);
      if (!areaDoc) {
        return res.status(404).json({ error: "Area not found for areaId." });
      }
    } else {
      areaDoc = await findOrCreateArea(nameRaw);
    }

    // create review
    const review = await Review.create({
      area: areaDoc?._id,
      areaName: areaDoc?.name ?? nameRaw,
      rating,
      text,
      createdAt: new Date(),
    });

    // recompute area safety
    const recomputeKey = areaDoc?.name ?? nameRaw;
    await recomputeAreaFromReviews(recomputeKey);

    // fetch updated area
    const refreshed = await SafetyScore.findById(areaDoc._id);
    const areaPayload = refreshed
      ? {
          id: String(refreshed._id),
          name: refreshed.name,
          lat: refreshed.loc?.coordinates?.[1] ?? 0,
          lng: refreshed.loc?.coordinates?.[0] ?? 0,
          ratingCount: refreshed.ratingCount ?? 0,
          sentiment: refreshed.sentiment ?? 0,
          safety_score: calculateSafety(
            refreshed.crimeRate ?? 50,
            refreshed.infraScore ?? 50,
            refreshed.sentiment ?? 0
          ),
        }
      : null;

    res.status(201).json({ review, area: areaPayload });
  } catch (err) {
    next(err);
  }
});

/* ---------- GET /api/reviews ---------- */
router.get("/", async (req, res, next) => {
  try {
    const areaId = (req.query.areaId as string | undefined)?.trim();
    const rawName =
      (req.query.areaName as string | undefined) ??
      (req.query.place as string | undefined) ??
      (req.query.location as string | undefined) ??
      "";
    const areaName = clean(rawName);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit ?? 50)));

    const filter: any = {};
    if (areaId) filter.area = areaId;
    if (areaName) filter.areaName = new RegExp(`^${areaName}$`, "i");

    const items = await Review.find(filter).sort({ createdAt: -1 }).limit(limit);

    res.json(items);
  } catch (err) {
    next(err);
  }
});

export default router;
