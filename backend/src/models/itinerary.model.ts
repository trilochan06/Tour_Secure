import { Schema, model, Document, Types } from "mongoose";

export interface IItinerary extends Document {
  title: string;
  date?: string;          // e.g. "2025-10-29"
  location?: string;
  notes?: string;
  user: Types.ObjectId;   // <- owner
  createdAt: Date;
  updatedAt: Date;
}

const ItinerarySchema = new Schema<IItinerary>(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String },
    location: { type: String, trim: true },
    notes: { type: String, trim: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, collection: "itineraries" }
);

ItinerarySchema.index({ user: 1, createdAt: -1 });

export default model<IItinerary>("Itinerary", ItinerarySchema);
