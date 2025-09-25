// backend/src/utils/safety.ts

import { ReviewDoc } from "../models/Review";

// Compute safety score (0–100)
export function calculateSafety(reviews: ReviewDoc[]): {
  score: number;
  confidence: number;  // 0–1
  trend: "improving" | "declining" | "stable";
} {
  if (!reviews.length) {
    return { score: 50, confidence: 0, trend: "stable" }; // neutral if no data
  }

  const now = Date.now();
  let weightedSum = 0;
  let weightTotal = 0;

  for (const r of reviews) {
    const ageDays = (now - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.max(0.3, 1 - ageDays / 180); // recent reviews weigh more

    // Sentiment boost for negative comments
    const text = (r.text ?? "").toLowerCase();
    let sentimentBoost = 0;
    if (text.includes("bad") || text.includes("unsafe") || text.includes("danger")) {
      sentimentBoost = -0.5;
    }
    if (text.includes("good") || text.includes("safe") || text.includes("secure")) {
      sentimentBoost = +0.2;
    }

    const rating = r.rating + sentimentBoost;
    weightedSum += rating * recencyWeight;
    weightTotal += recencyWeight;
  }

  const avgRating = weightedSum / weightTotal; // 1..5
  let score = Math.max(0, Math.min(100, (avgRating - 1) / 4 * 100));

  // Confidence grows with number of reviews
  const confidence = Math.min(1, Math.log10(reviews.length + 1) / 2);

  // Determine trend
  const recent = reviews.filter(r => (now - new Date(r.createdAt).getTime()) < 30 * 86400000); // 30d
  const old = reviews.filter(r => (now - new Date(r.createdAt).getTime()) >= 30 * 86400000);
  const recentAvg = recent.reduce((a, r) => a + r.rating, 0) / (recent.length || 1);
  const oldAvg = old.reduce((a, r) => a + r.rating, 0) / (old.length || 1);
  let trend: "improving" | "declining" | "stable" = "stable";
  if (recentAvg > oldAvg + 0.5) trend = "improving";
  else if (recentAvg < oldAvg - 0.5) trend = "declining";

  return { score, confidence, trend };
}
