// backend/src/routes/reviews.routes.ts
import { Router } from "express";
import SafetyScore from "../models/SafetyScore";
import Review from "../models/Review";
import { recomputeAreaFromReviews } from "../services/reviews.service";
import { calculateSafety } from "../utils/safety";

const router = Router();

/** Collapse whitespace and trim */
function clean(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

/** Fuzzy area resolver: exact → starts-with → contains */
async function findAreaByNameFuzzy(input: string) {
  const q = clean(String(input || ""));
  if (!q) return null;

  // 1) exact (case-insensitive)
  let doc = await SafetyScore.findOne({ name: { $regex: `^${q}$`, $options: "i" } });
  if (doc) return doc;

  // 2) starts-with (e.g., "Shillong" → "Shillong, Meghalaya")
  doc = await SafetyScore.findOne({ name: { $regex: `^${q}[,\\s]?.*`, $options: "i" } });
  if (doc) return doc;

  // 3) contains
  doc = await SafetyScore.findOne({ name: { $regex: q, $options: "i" } });
  return doc;
}

/**
 * POST /api/reviews
 * Accepts common variants:
 * - areaId | areaID
 * - areaName | place | name | location
 * - rating | stars | score | value   (1..5; string or number)
 * - text | comment | review
 * Returns: { review, area?: { id, name, lat, lng, safety_score } }
 */
router.post("/", async (req, res, next) => {
  try {
    // 🔎 minimal debug (comment out later if noisy)
    console.log("[POST /api/reviews] body=", req.body);

    // Accept aliases
    const areaIdRaw = (req.body.areaId ?? req.body.areaID) as string | undefined;
    const rawName =
      (req.body.areaName ??
        req.body.place ??
        req.body.name ??
        req.body.location ??
        "") as string;

    const nameRaw = clean(String(rawName || ""));
    const ratingRaw = req.body.rating ?? req.body.stars ?? req.body.score ?? req.body.value;
    const rating = Number(ratingRaw);
    const text = clean(String(req.body.text ?? req.body.comment ?? req.body.review ?? ""));

    // Validation
    if (!nameRaw && !areaIdRaw) {
      res.set("Cache-Control", "no-store");
      return res.status(400).json({
        error: "Please provide an area name (areaName/place/location) or areaId.",
        received: { areaId: areaIdRaw ?? null, areaName: rawName ?? null },
      });
    }
    if (!Number.isFinite(rating)) {
      res.set("Cache-Control", "no-store");
      return res.status(400).json({
        error: "Rating must be a number between 1 and 5.",
        received: { rating: ratingRaw },
      });
    }
    if (rating < 1 || rating > 5) {
      res.set("Cache-Control", "no-store");
      return res.status(400).json({
        error: "Rating must be between 1 and 5.",
        received: { rating },
      });
    }

    // Resolve area (ok if null; we still record the review with raw name)
    let areaDoc: any = null;
    if (areaIdRaw) {
      areaDoc = await SafetyScore.findById(areaIdRaw);
      if (!areaDoc) {
        res.set("Cache-Control", "no-store");
        return res.status(404).json({
          error: "Area not found for areaId.",
          received: { areaId: areaIdRaw },
        });
      }
    } else {
      areaDoc = await findAreaByNameFuzzy(nameRaw);
      // Note: if still null, we keep the review with areaName = nameRaw (no FK)
    }

    // Create review (prefer canonical area name if available)
    const review = await Review.create({
      area: areaDoc?._id,
      areaName: areaDoc?.name ?? nameRaw,
      rating,
      text,
    });

    // Recompute using the strongest key available (canonical name if we have it)
    const recomputeKey = areaDoc?.name ?? nameRaw;
    await recomputeAreaFromReviews(recomputeKey);

    // Fetch updated area doc to return fresh safety_score
    const refreshedArea = await SafetyScore.findOne({
      name: { $regex: `^${recomputeKey}$`, $options: "i" },
    });

    const areaPayload = refreshedArea
      ? {
          id: String(refreshedArea._id),
          name: refreshedArea.name,
          lat: refreshedArea.loc?.coordinates?.[1] ?? 0,
          lng: refreshedArea.loc?.coordinates?.[0] ?? 0,
          safety_score: calculateSafety(
            refreshedArea.crimeRate ?? 50,
            refreshedArea.infraScore ?? 50,
            refreshedArea.sentiment ?? 0
          ),
        }
      : null;

    res.set("Cache-Control", "no-store");
    res.status(201).json({ review, area: areaPayload });
  } catch (e) {
    next(e);
  }
});

/** GET /api/reviews?areaId=&areaName=&place=&location=&limit= */
router.get("/", async (req, res, next) => {
  try {
    const areaId = (req.query.areaId as string | undefined)?.trim();
    const rawName =
      (req.query.areaName as string | undefined) ??
      (req.query.place as string | undefined) ??
      (req.query.location as string | undefined) ??
      "";
    const areaName = clean(String(rawName ?? ""));
    const limit = Math.min(500, Math.max(1, Number(req.query.limit ?? 100)));

    const filter: any = {};
    if (areaId) filter.area = areaId;
    if (areaName) filter.areaName = new RegExp(`^${areaName}$`, "i");

    const items = await Review.find(filter).sort({ createdAt: -1 }).limit(limit);

    res.set("Cache-Control", "no-store");
    res.json(items);
  } catch (e) {
    next(e);
  }
});

export default router;
