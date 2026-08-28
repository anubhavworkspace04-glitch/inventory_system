import mongoose, { Schema, Document } from 'mongoose';

export type QuotationStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'ACCEPTED' 
  | 'REJECTED' 
  | 'EXPIRED' 
  | 'CONVERTED' 
  | 'CANCELLED';

export interface IQuotationItem {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  sellingPrice: number;
  discount: number;
  tax: number;
  lineTotal: number;
}

export interface IQuotation extends Document {
  quotationNumber: string;
  quotationDate: Date;
  expiryDate: Date;
  customerId?: mongoose.Types.ObjectId | null;
  customerNameSnapshot: string;
  customerPhoneSnapshot?: string;
  items: IQuotationItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  total: number;
  status: QuotationStatus;
  notes?: string;
  terms?: string;
  convertedSaleId?: mongoose.Types.ObjectId | null;
  convertedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationItemSchema = new Schema<IQuotationItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId, required: true },
  productNameSnapshot: { type: String, required: true, trim: true },
  variantNameSnapshot: { type: String, required: true, trim: true },
  skuSnapshot: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0.01 },
  sellingPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, default: 0, min: 0 },
  tax: { type: Number, required: true, default: 0, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const QuotationSchema = new Schema<IQuotation>({
  quotationNumber: { type: String, required: true, unique: true, index: true },
  quotationDate: { type: Date, required: true, index: true },
  expiryDate: { type: Date, required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
  customerNameSnapshot: { type: String, required: true, trim: true },
  customerPhoneSnapshot: { type: String, trim: true },
  items: { type: [QuotationItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  totalDiscount: { type: Number, required: true, default: 0, min: 0 },
  totalTax: { type: Number, required: true, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED', 'CANCELLED'], 
    required: true,
    default: 'DRAFT',
    index: true
  },
  notes: { type: String, trim: true },
  terms: { type: String, trim: true },
  convertedSaleId: { type: Schema.Types.ObjectId, ref: 'Sale', default: null, index: true },
  convertedAt: { type: Date, default: null }
}, {
  timestamps: true
});

QuotationSchema.index({ status: 1 });

export const Quotation = mongoose.model<IQuotation>('Quotation', QuotationSchema);
