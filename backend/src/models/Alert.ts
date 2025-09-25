import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User" },
  lat: Number,
  lon: Number,
  meta: Object,
}, { timestamps: true });

export default mongoose.model("Alert", AlertSchema);
