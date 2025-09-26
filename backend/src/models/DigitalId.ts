import mongoose, { Schema, Document } from "mongoose";

export interface IDigitalId extends Document {
  user: mongoose.Types.ObjectId;
  walletAddress: string;
  entrypoint?: string | null;
  docType?: string | null;
  startAt: Date;
  endAt: Date;
  status: "active" | "expired" | "revoked";
  qrToken?: string | null;
  docFilePath?: string | null; // uploaded doc path (optional)
  createdAt: Date;
  updatedAt: Date;
}

const DigitalIdSchema = new Schema<IDigitalId>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    walletAddress: { type: String, required: true },
    entrypoint: { type: String, default: null },
    docType: { type: String, default: null },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    status: { type: String, enum: ["active", "expired", "revoked"], default: "active", index: true },
    qrToken: { type: String, default: null },
    docFilePath: { type: String, default: null },
  },
  { timestamps: true }
);

export default (mongoose.models.DigitalId as mongoose.Model<IDigitalId>) ||
  mongoose.model<IDigitalId>("DigitalId", DigitalIdSchema);