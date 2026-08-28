import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  tax: number;
  lineTotal: number;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  invoiceDate: Date;
  saleId: mongoose.Types.ObjectId;
  saleNumber: string;
  quotationId?: mongoose.Types.ObjectId | null;
  quotationNumber?: string | null;
  customerId?: mongoose.Types.ObjectId | null;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string;
  customerAddressSnapshot: string;
  customerGSTINSnapshot: string;
  businessNameSnapshot: string;
  businessGSTINSnapshot: string;
  businessAddressSnapshot: string;
  businessLogoSnapshot: string | null;
  items: IInvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  notes?: string;
  terms?: string;
  pdfPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: Schema.Types.ObjectId, required: true },
  productNameSnapshot: { type: String, required: true, trim: true },
  variantNameSnapshot: { type: String, required: true, trim: true },
  skuSnapshot: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, required: true, default: 'PCS' },
  rate: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, default: 0, min: 0 },
  tax: { type: Number, required: true, default: 0, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  invoiceDate: { type: Date, required: true, index: true },
  saleId: { type: Schema.Types.ObjectId, ref: 'Sale', required: true, unique: true, index: true },
  saleNumber: { type: String, required: true, index: true },
  quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation', default: null, index: true },
  quotationNumber: { type: String, default: null, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
  customerNameSnapshot: { type: String, required: true, trim: true },
  customerPhoneSnapshot: { type: String, default: '', trim: true },
  customerAddressSnapshot: { type: String, default: '', trim: true },
  customerGSTINSnapshot: { type: String, default: '', trim: true },
  businessNameSnapshot: { type: String, required: true, trim: true },
  businessGSTINSnapshot: { type: String, required: true, trim: true },
  businessAddressSnapshot: { type: String, required: true, trim: true },
  businessLogoSnapshot: { type: String, default: null },
  items: { type: [InvoiceItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  totalDiscount: { type: Number, required: true, default: 0, min: 0 },
  totalTax: { type: Number, required: true, default: 0, min: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  notes: { type: String, trim: true },
  terms: { type: String, trim: true },
  pdfPath: { type: String }
}, {
  timestamps: true
});

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
