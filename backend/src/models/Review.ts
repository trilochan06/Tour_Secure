import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
  rating: number;         // 1..5
  text?: string;
  areaId?: mongoose.Types.ObjectId | null; // ref -> SafetyScore
  areaName?: string | null;                // denormalized name
  userId?: mongoose.Types.ObjectId | null; // optional
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, default: "" },
  areaId: { type: Schema.Types.ObjectId, ref: "SafetyScore", default: null },
  areaName: { type: String, default: null }, // <- important for display
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

// Virtual for consistent UI field
ReviewSchema.virtual("placeName").get(function (this: IReview) {
  // prefer denormalized areaName
  // if you populate areaId later, you can fallback to (this as any).areaId?.name
  return this.areaName || null;
});

ReviewSchema.set("toJSON", { virtuals: true });
ReviewSchema.set("toObject", { virtuals: true });

export default (mongoose.models.Review as mongoose.Model<IReview>) ||
  mongoose.model<IReview>("Review", ReviewSchema);
