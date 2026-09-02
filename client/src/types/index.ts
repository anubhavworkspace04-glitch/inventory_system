export interface Variant {
  id: string;
  _id?: string;
  sku: string;
  name: string;
  image?: string;
  openingStock: number;
  cachedStock: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  category: string;
  description: string;
  unit: string; // e.g., "sqft", "pcs", "kg"
  minStockLevel: number;
  isActive: boolean;
  variants: Variant[];
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseCost {
  name: string;
  amount: number;
}

export interface PurchaseItem {
  productId: string;
  variantId: string;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPurchasePrice: number;
  baseAmount: number;
}

export interface Supplier {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Purchase {
  id: string;
  _id?: string;
  purchaseNumber: string;
  supplierId: string;
  supplierNameSnapshot: string;
  purchaseDate: string;
  items: PurchaseItem[];
  additionalCosts: PurchaseCost[];
  baseAmount: number;
  totalAdditionalCosts: number;
  totalPurchaseCost: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
  paymentStatus: 'Paid' | 'Partially Paid' | 'Pending';
  amountPaid: number;
  pendingAmount: number;
  status: 'Active' | 'Cancelled';
  notes?: string;
  createdAt?: string;
}

export interface SaleItem {
  productId: string;
  variantId: string;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  sellingPrice: number;
  discount: number;
  tax: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  _id?: string;
  saleNumber: string;
  saleDate: string;
  customerId?: string | null;
  customerNameSnapshot: string;
  customerPhoneSnapshot?: string;
  items: SaleItem[];
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
  sourceQuotationId?: string | null;
  sourceQuotationNumber?: string | null;
  createdAt?: string;
}

export interface Customer {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  notes?: string;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  _id?: string;
  paymentNumber: string;
  paymentDate: string;
  customerId?: string | null;
  saleId?: string | null;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';
  paymentType: 'SALE_RECEIPT' | 'REFUND' | 'REVERSAL' | 'SUPPLIER_PAYMENT';
  referenceNumber?: string;
  status: 'Active' | 'Reversed';
  notes?: string;
  createdAt?: string;
}

export interface LedgerRow {
  date: string;
  referenceId: string;
  referenceNumber: string;
  type: 'debit' | 'credit';
  description: string;
  debit: number;
  credit: number;
  balanceAfter: number;
}

export interface InvoiceItem {
  productId: string;
  variantId: string;
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

export interface Invoice {
  id: string;
  _id?: string;
  invoiceNumber: string;
  invoiceDate: string;
  saleId: string;
  saleNumber: string;
  quotationId?: string | null;
  quotationNumber?: string | null;
  customerId?: string | null;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string;
  customerAddressSnapshot: string;
  customerGSTINSnapshot: string;
  businessNameSnapshot: string;
  businessGSTINSnapshot: string;
  businessAddressSnapshot: string;
  businessLogoSnapshot: string | null;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  amountPaid: number;
  amountPending: number;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Pending';
  notes?: string;
  terms?: string;
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  productId: string;
  variantId: string;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  sellingPrice: number;
  discount: number;
  tax: number;
  lineTotal: number;
}

export interface Quotation {
  id: string;
  _id?: string;
  quotationNumber: string;
  quotationDate: string;
  expiryDate: string;
  customerId?: string | null;
  customerNameSnapshot: string;
  customerPhoneSnapshot?: string;
  items: QuotationItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED' | 'CANCELLED';
  notes?: string;
  terms?: string;
  convertedSaleId?: string | null;
  convertedAt?: string | null;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  _id?: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  quantityChange: number; // positive or negative
  transactionType: 'OPENING_STOCK' | 'PURCHASE' | 'SALE' | 'STOCK_ADJUSTMENT' | 'PURCHASE_RETURN' | 'SALES_RETURN' | 'CANCELLATION_REVERSAL';
  referenceId: string; // links to Purchase id or Sale id or self
  referenceNumber: string; // e.g. PUR-2026-0001, SAL-2026-0001, ADJ-0001
  balanceAfter: number;
  createdAt: string;
}

export interface BusinessSettings {
  id?: string;
  _id?: string;
  businessName: string;
  gstin: string;
  address?: string;
  logo?: string | null;
  invoicePrefix: string;
  quotationPrefix: string;
  defaultGstRate: number;
  allowNegativeStock: boolean;
  enableLowStockAlerts: boolean;
}
