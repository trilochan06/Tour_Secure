import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  role: "user" | "admin";
  passwordHash?: string;
  password?: string;
  walletAddress?: string | null; // NEW
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, trim: true, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  passwordHash: { type: String },
  password: { type: String, select: false },
  walletAddress: { type: String, default: null, index: true }, // NEW
  createdAt: { type: Date, default: Date.now },
});

export default (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);