import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, index: true },
    name: String,
    // NEW: only public address
    blockchainAddress: { type: String, index: true },
  },
  { timestamps: true }
);

// Avoid OverwriteModelError during dev
export default mongoose.models.User || mongoose.model("User", UserSchema);
