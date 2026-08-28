import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true, trim: true, index: true },
  phone: { type: String, required: true, index: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String },
  gstNumber: { type: String, uppercase: true, trim: true },
  notes: { type: String },
  isActive: { type: Boolean, required: true, default: true },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

CustomerSchema.index({ isActive: 1, deletedAt: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
