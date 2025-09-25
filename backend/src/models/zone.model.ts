import { Schema, model, Document } from "mongoose";

export interface IZone extends Document {
  name: string;
  description?: string;
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  polygon: { type: "Polygon"; coordinates: number[][][] };
  createdAt: Date;
  updatedAt: Date;
}

const ZoneSchema = new Schema<IZone>(
  {
    name: { type: String, required: true },
    description: { type: String },
    riskLevel: { type: String, enum: ["low", "medium", "high"], required: true },
    riskScore: { type: Number, min: 0, max: 100, required: true },
    polygon: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
        default: "Polygon",
      },
      coordinates: { type: [[[Number]]], required: true },
    },
  },
  { timestamps: true }
);

ZoneSchema.index({ polygon: "2dsphere" });

export default model<IZone>("Zone", ZoneSchema);
