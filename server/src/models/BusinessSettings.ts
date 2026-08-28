import mongoose, { Schema, Document } from 'mongoose';

export interface IBusinessSettings extends Document {
  businessName: string;
  gstin: string;
  address: string;
  logo: string | null;
  invoicePrefix: string;
  quotationPrefix: string;
  defaultGstRate: number;
  allowNegativeStock: boolean;
  enableLowStockAlerts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSettingsSchema = new Schema<IBusinessSettings>({
  businessName: { type: String, required: true, default: 'GG Glassware Co.', trim: true },
  gstin: { type: String, required: true, default: '09CBNPG5284Q1ZP', trim: true },
  address: { type: String, default: 'Infront of Balveer Cold Araon Road Sirsaganj, Firozabad, UP, 283151', trim: true },
  logo: { type: String, default: null },
  invoicePrefix: { type: String, default: 'INV-YYYY-', trim: true },
  quotationPrefix: { type: String, default: 'QTN-YYYY-', trim: true },
  defaultGstRate: { type: Number, default: 18 },
  allowNegativeStock: { type: Boolean, default: false },
  enableLowStockAlerts: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const BusinessSettings = mongoose.model<IBusinessSettings>('BusinessSettings', BusinessSettingsSchema);
