import mongoose, { Schema, Document } from 'mongoose';

export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unit?: string;
  sellingPrice: number;
  discount: number;
  tax: number;
  lineTotal: number;
}

export interface ISale extends Document {
  saleNumber: string;
  saleDate: Date;
  customerId?: mongoose.Types.ObjectId | null;
  customerNameSnapshot: string;
  customerPhoneSnapshot?: string;
  items: ISaleItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  total: number;
  saleChannel: 'Online' | 'Offline';
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
  paymentStatus: 'Paid' | 'Partially Paid' | 'Pending';
  amountReceived: number;
  pendingAmount: number;
  status: 'Active' | 'Cancelled';
  notes?: string;
  sourceQuotationId?: mongoose.Types.ObjectId | null;
  sourceQuotationNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId, required: true },
  productNameSnapshot: { type: String, required: true, trim: true },
  variantNameSnapshot: { type: String, required: true, trim: true },
  skuSnapshot: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, default: 'PCS' },
  sellingPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, default: 0, min: 0 },
  tax: { type: Number, required: true, default: 0, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const SaleSchema = new Schema<ISale>({
  saleNumber: { type: String, required: true, unique: true, index: true },
  saleDate: { type: Date, required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
  customerNameSnapshot: { type: String, required: true, trim: true },
  customerPhoneSnapshot: { type: String, trim: true },
  items: { type: [SaleItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  totalDiscount: { type: Number, required: true, default: 0, min: 0 },
  totalTax: { type: Number, required: true, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  saleChannel: { 
    type: String, 
    enum: ['Online', 'Offline'], 
    required: true,
    default: 'Offline'
  },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'], 
    required: true,
    default: 'UPI'
  },
  paymentStatus: { 
    type: String, 
    enum: ['Paid', 'Partially Paid', 'Pending'], 
    required: true, 
    default: 'Paid' 
  },
  amountReceived: { type: Number, required: true, default: 0, min: 0 },
  pendingAmount: { type: Number, required: true, default: 0, min: 0 },
  status: { 
    type: String, 
    enum: ['Active', 'Cancelled'], 
    required: true, 
    default: 'Active' 
  },
  notes: { type: String, trim: true },
  sourceQuotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', default: null, index: true },
  sourceQuotationNumber: { type: String, default: null, index: true }
}, {
  timestamps: true
});

SaleSchema.index({ status: 1, saleChannel: 1 });

export const Sale = mongoose.model<ISale>('Sale', SaleSchema);
