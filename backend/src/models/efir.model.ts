import { Schema, model, Document, Types } from 'mongoose';

export interface IEFIR extends Document {
  subject: string;        // a concise subject (renamed from "name")
  description: string;
  location?: string;
  status: 'Pending' | 'Filed' | 'Closed';
  user: Types.ObjectId;   // owner
  createdAt: Date;
  updatedAt: Date;
}

const EFIRSchema = new Schema<IEFIR>(
  {
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    status: { type: String, enum: ['Pending', 'Filed', 'Closed'], default: 'Pending' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'efirs_user_simple' } // separate from older EFIR model
);

export default model<IEFIR>('EFIR_User', EFIRSchema);
