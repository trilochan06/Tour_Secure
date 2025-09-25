import mongoose from "mongoose";

export type Role = "user" | "admin";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user","admin"], default: "user" },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
