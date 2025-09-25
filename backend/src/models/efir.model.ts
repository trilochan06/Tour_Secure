import { Schema, model, Document } from 'mongoose';

export interface IEFIR extends Document {
  name: string;
  contact?: string;
  description: string;
  createdAt: Date; updatedAt: Date;
}

const EFIRSchema = new Schema<IEFIR>({
  name: { type: String, required: true },
  contact: { type: String },
  description: { type: String, required: true }
}, { timestamps: true });

export default model<IEFIR>('EFIR', EFIRSchema);
