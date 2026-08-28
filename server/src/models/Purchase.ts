import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseCost {
  name: string;
  amount: number;
}

export interface IPurchaseItem {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPurchasePrice: number;
  baseAmount: number;
}

export interface IPurchase extends Document {
  purchaseNumber: string;
  supplierId: mongoose.Types.ObjectId;
  supplierNameSnapshot: string;
  purchaseDate: Date;
  items: IPurchaseItem[];
  additionalCosts: IPurchaseCost[];
  baseAmount: number;
  totalAdditionalCosts: number;
  totalPurchaseCost: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
  paymentStatus: 'Paid' | 'Partially Paid' | 'Pending';
  amountPaid: number;
  pendingAmount: number;
  status: 'Active' | 'Cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseCostSchema = new Schema<IPurchaseCost>({
  name: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 }
}, { _id: false });

const PurchaseItemSchema = new Schema<IPurchaseItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId, required: true },
  productNameSnapshot: { type: String, required: true, trim: true },
  variantNameSnapshot: { type: String, required: true, trim: true },
  skuSnapshot: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unitPurchasePrice: { type: Number, required: true, min: 0 },
  baseAmount: { type: Number, required: true, min: 0 }
}, { _id: false });

const PurchaseSchema = new Schema<IPurchase>({
  purchaseNumber: { type: String, required: true, unique: true, index: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
  supplierNameSnapshot: { type: String, required: true, trim: true },
  purchaseDate: { type: Date, required: true, index: true },
  items: { type: [PurchaseItemSchema], required: true },
  additionalCosts: { type: [PurchaseCostSchema], default: [] },
  baseAmount: { type: Number, required: true, min: 0 },
  totalAdditionalCosts: { type: Number, required: true, min: 0, default: 0 },
  totalPurchaseCost: { type: Number, required: true, min: 0 },
  paymentMode: { 
    type: String, 
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['Paid', 'Partially Paid', 'Pending'], 
    required: true 
  },
  amountPaid: { type: Number, required: true, min: 0, default: 0 },
  pendingAmount: { type: Number, required: true, min: 0, default: 0 },
  status: { 
    type: String, 
    enum: ['Active', 'Cancelled'], 
    required: true, 
    default: 'Active' 
  },
  notes: { type: String, trim: true }
}, {
  timestamps: true
});

PurchaseSchema.index({ status: 1, paymentStatus: 1 });

export const Purchase = mongoose.model<IPurchase>('Purchase', PurchaseSchema);
