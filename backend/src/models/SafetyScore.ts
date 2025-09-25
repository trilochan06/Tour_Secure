import { Schema, model, models, type Document, type Model } from "mongoose";

export interface SafetyScoreDoc extends Document {
  name: string;
  loc: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  crimeRate?: number;      // 0..100
  infraScore?: number;     // 0..100
  sentiment?: number;      // -1..+1 (from reviews)
  ratingCount?: number;
  ratingSum?: number;
  reviewUpdatedAt?: Date;
}

const SafetyScoreSchema = new Schema<SafetyScoreDoc>({
  name: { type: String, required: true, index: true, unique: true },
  loc: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  crimeRate: { type: Number, default: 50 },
  infraScore: { type: Number, default: 50 },
  sentiment: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  ratingSum: { type: Number, default: 0 },
  reviewUpdatedAt: { type: Date },
});
SafetyScoreSchema.index({ loc: "2dsphere" });

const SafetyScore: Model<SafetyScoreDoc> =
  (models.SafetyScore as Model<SafetyScoreDoc>) || model<SafetyScoreDoc>("SafetyScore", SafetyScoreSchema);

export default SafetyScore;
