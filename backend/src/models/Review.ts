import { Schema, model, models, type Document, type Model, Types } from "mongoose";

export interface ReviewDoc extends Document {
  area?: Types.ObjectId;      // ref SafetyScore
  areaName: string;           // canonical or raw
  rating: number;             // 1..5
  text?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<ReviewDoc>(
  {
    area: { type: Schema.Types.ObjectId, ref: "SafetyScore", index: true },
    areaName: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    text: { type: String },
  },
  { timestamps: true }
);

const Review: Model<ReviewDoc> =
  (models.Review as Model<ReviewDoc>) || model<ReviewDoc>("Review", ReviewSchema);

export default Review;
