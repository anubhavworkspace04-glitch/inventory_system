import mongoose, { Schema, Document } from 'mongoose';

export interface IVariant {
  _id?: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  image?: string;
  openingStock: number;
  cachedStock: number;
  isActive: boolean;
}

export interface IProduct extends Document {
  name: string;
  category: string;
  description?: string;
  unit: string;
  minStockLevel: number;
  isActive: boolean;
  deletedAt?: Date | null;
  variants: IVariant[];
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>({
  sku: { 
    type: String, 
    required: true,
    trim: true
  },
  name: { type: String, required: true, trim: true },
  image: { type: String },
  openingStock: { type: Number, required: true, default: 0, min: 0 },
  cachedStock: { type: Number, required: true, default: 0 },
  isActive: { type: Boolean, required: true, default: true }
});

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true, index: true },
  category: { type: String, required: true, trim: true, index: true },
  description: { type: String },
  unit: { type: String, required: true, default: 'PCS' },
  minStockLevel: { type: Number, required: true, default: 0, min: 0 },
  isActive: { type: Boolean, required: true, default: true },
  deletedAt: { type: Date, default: null },
  variants: [VariantSchema]
}, {
  timestamps: true
});

// Single-field and compound indexes
ProductSchema.index({ name: 'text', category: 'text' });
ProductSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
