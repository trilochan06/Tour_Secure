// backend/src/models/EFIR.ts
import mongoose, { Schema, Model, Document } from "mongoose";

export interface EFIRDoc extends Document {
  subject: string;
  description: string;
  location?: string;
  status: "Pending" | "Filed" | "Closed";
  reporter?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EFIRSchema = new Schema<EFIRDoc>(
  {
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    status: { type: String, enum: ["Pending", "Filed", "Closed"], default: "Pending" },
    reporter: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    collection: "efirs",
  }
);

// Reuse model if hot-reloaded
const EFIR: Model<EFIRDoc> = mongoose.models.EFIR || mongoose.model<EFIRDoc>("EFIR", EFIRSchema);
export default EFIR;
