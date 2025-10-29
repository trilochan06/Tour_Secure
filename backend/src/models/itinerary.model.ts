// backend/src/models/itinerary.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IItinerary extends Document {
  title: string;
  date?: string;          // keep simple string like "YYYY-MM-DD"
  location?: string;
  notes?: string;
  user: Types.ObjectId;   // <-- owner
  createdAt: Date;
  updatedAt: Date;
}

const ItinerarySchema = new Schema<IItinerary>(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String },
    location: { type: String, trim: true },
    notes: { type: String, trim: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // <-- required
  },
  { timestamps: true, collection: "itineraries" }
);

// helpful index for fast user-scoped queries
ItinerarySchema.index({ user: 1, createdAt: -1 });

export default model<IItinerary>("Itinerary", ItinerarySchema);
