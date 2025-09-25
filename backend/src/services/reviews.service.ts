import mongoose from "mongoose";
import Review from "../models/Review";
import SafetyScore from "../models/SafetyScore";

const avgToSentiment = (avg: number) => Math.max(-1, Math.min(1, (avg - 3) / 2));

export async function recomputeAreaFromReviews(areaKey: string) {
  const key = String(areaKey || "").trim();
  if (!key) return;

  const area = mongoose.isValidObjectId(key)
    ? await SafetyScore.findById(key)
    : await SafetyScore.findOne({ name: { $regex: `^${key}$`, $options: "i" } });

  if (!area) return;

  const byId = await Review.aggregate([
    { $match: { area: area._id } },
    { $group: { _id: null, count: { $sum: 1 }, sum: { $sum: "$rating" } } },
  ]);
  const byName = await Review.aggregate([
    { $match: { areaName: { $regex: `^${area.name}$`, $options: "i" } } },
    { $group: { _id: null, count: { $sum: 1 }, sum: { $sum: "$rating" } } },
  ]);

  const count = (byId[0]?.count || 0) + (byName[0]?.count || 0);
  const sum   = (byId[0]?.sum   || 0) + (byName[0]?.sum   || 0);
  const avg   = count ? sum / count : 3;
  const sentiment = avgToSentiment(avg);

  await SafetyScore.updateOne(
    { _id: area._id },
    { $set: { ratingCount: count, ratingSum: sum, sentiment, reviewUpdatedAt: new Date() } }
  );
}
