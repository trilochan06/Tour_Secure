import { Schema, model, Document } from 'mongoose';

export interface IItinerary extends Document {
  title: string;
  date?: string;    // keep simple for now
  location?: string;
  createdAt: Date; updatedAt: Date;
}

const ItinerarySchema = new Schema<IItinerary>({
  title: { type: String, required: true },
  date: { type: String },
  location: { type: String }
}, { timestamps: true });

export default model<IItinerary>('Itinerary', ItinerarySchema);
