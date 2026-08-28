import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
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

const SupplierSchema = new Schema<ISupplier>({
  name: { type: String, required: true, trim: true, index: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  gstNumber: { type: String, trim: true },
  notes: { type: String, trim: true },
  isActive: { type: Boolean, required: true, default: true },
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// Compound index for active suppliers search
SupplierSchema.index({ isActive: 1, deletedAt: 1 });

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
