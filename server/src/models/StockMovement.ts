import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType = 
  | 'OPENING_STOCK' 
  | 'PURCHASE' 
  | 'SALE' 
  | 'STOCK_ADJUSTMENT' 
  | 'PURCHASE_RETURN' 
  | 'SALES_RETURN' 
  | 'CANCELLATION_REVERSAL';

export interface IStockMovement extends Document {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  quantityChange: number;
  transactionType: TransactionType;
  referenceId: mongoose.Types.ObjectId | string;
  referenceNumber: string;
  balanceAfter: number;
  reason?: string;
  notes?: string;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  variantId: { type: Schema.Types.ObjectId, required: true, index: true },
  quantityChange: { type: Number, required: true },
  transactionType: {
    type: String,
    enum: [
      'OPENING_STOCK',
      'PURCHASE',
      'SALE',
      'STOCK_ADJUSTMENT',
      'PURCHASE_RETURN',
      'SALES_RETURN',
      'CANCELLATION_REVERSAL'
    ],
    required: true
  },
  referenceId: { type: Schema.Types.Mixed, required: true },
  referenceNumber: { type: String, required: true },
  balanceAfter: { type: Number, required: true },
  reason: { type: String },
  notes: { type: String }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

StockMovementSchema.index({ productId: 1, variantId: 1, createdAt: -1 });

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
