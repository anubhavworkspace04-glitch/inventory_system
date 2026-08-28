import mongoose, { Schema, Document } from 'mongoose';

export type PaymentMethodType = 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
export type PaymentTypeVal = 'SALE_RECEIPT' | 'REFUND' | 'REVERSAL' | 'SUPPLIER_PAYMENT';
export type PaymentStatusType = 'Active' | 'Reversed';

export interface IPayment extends Document {
  paymentNumber: string;
  paymentDate: Date;
  customerId?: mongoose.Types.ObjectId | null;
  saleId?: mongoose.Types.ObjectId | null;
  purchaseId?: mongoose.Types.ObjectId | null;
  amount: number;
  paymentMethod: PaymentMethodType;
  paymentType: PaymentTypeVal;
  referenceNumber?: string;
  status: PaymentStatusType;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  paymentNumber: { type: String, required: true, unique: true, index: true },
  paymentDate: { type: Date, required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
  saleId: { type: Schema.Types.ObjectId, ref: 'Sale', default: null, index: true },
  purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase', default: null, index: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'],
    required: true
  },
  paymentType: {
    type: String,
    enum: ['SALE_RECEIPT', 'REFUND', 'REVERSAL', 'SUPPLIER_PAYMENT'],
    required: true,
    default: 'SALE_RECEIPT'
  },
  referenceNumber: { type: String, trim: true },
  status: {
    type: String,
    enum: ['Active', 'Reversed'],
    required: true,
    default: 'Active',
    index: true
  },
  notes: { type: String, trim: true }
}, {
  timestamps: true
});

PaymentSchema.index({ paymentType: 1, status: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
