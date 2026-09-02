import { create } from 'zustand';
import { 
  Product, Customer, Supplier, Purchase, Sale, Quotation, StockMovement, Payment, Variant, BusinessSettings, Invoice 
} from '../types';
import { 
  productApi, customerApi, supplierApi, purchaseApi, saleApi, paymentApi, quotationApi, stockApi, dashboardApi, settingsApi, invoiceApi, reportApi 
} from '../api/services';

const mapEntity = (item: any) => {
  if (!item) return item;
  const idStr = (item.id || item._id) ? String(item.id || item._id) : '';
  return {
    ...item,
    id: idStr,
    _id: idStr
  };
};

const mapEntityArray = (arr: any[]) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(mapEntity);
};

interface InventoryStore {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: Purchase[];
  sales: Sale[];
  quotations: Quotation[];
  stockMovements: StockMovement[];
  payments: Payment[];
  invoices: Invoice[];
  settings: BusinessSettings | null;
  toast: { message: string; type: 'success' | 'error' | 'warning' | 'info' } | null;

  // Server state tracking
  isLoading: boolean;
  serverError: string | null;
  dashboardStats: {
    totalSales: number;
    totalPurchases: number;
    amountReceived: number;
    amountPending: number;
    currentStockValue: number;
    activeProductsCount: number;
    customersCount: number;
    suppliersCount: number;
    invoicesCount: number;
    lowStockItems: any[];
    lowStockCount: number;
  } | null;

  // Fetch Actions (Phase 2 core integration)
  fetchProducts: (params?: any) => Promise<void>;
  fetchCustomers: (params?: any) => Promise<void>;
  fetchSuppliers: (params?: any) => Promise<void>;
  fetchPurchases: (params?: any) => Promise<void>;
  fetchSales: (params?: any) => Promise<void>;
  fetchQuotations: (params?: any) => Promise<void>;
  fetchStockHistory: (params?: any) => Promise<void>;
  fetchPayments: (params?: any) => Promise<void>;
  fetchInvoices: (params?: any) => Promise<void>;
  fetchDashboardStats: (params?: any) => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: BusinessSettings) => Promise<void>;
  
  // Invoice actions
  addInvoice: (saleId: string) => Promise<Invoice>;
  getInvoiceBySaleIdStore: (saleId: string) => Promise<Invoice>;
  getInvoiceByIdStore: (id: string) => Promise<Invoice>;
  updateInvoiceStore: (id: string, data: { notes?: string; terms?: string }) => Promise<Invoice>;

  // Customer actions (using backend)
  addCustomer: (customer: Omit<Customer, 'id' | 'isActive' | 'createdAt'>) => Promise<Customer | null>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  restoreCustomer: (id: string) => Promise<void>;

  // Supplier actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'isActive' | 'createdAt'>) => Promise<Supplier | null>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  restoreSupplier: (id: string) => Promise<void>;

  // Mutation Placeholders (Phases 3-8)
  addProduct: (product: any) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  softDeleteProduct: (id: string) => Promise<any>;
  addVariant: (productId: string, variant: any) => Promise<void>;
  updateVariant: (productId: string, variantId: string, variant: Partial<Variant>) => Promise<void>;
  addPurchase: (purchase: any) => Promise<void>;
  cancelPurchase: (id: string) => Promise<void>;
  addSale: (sale: any) => Promise<{ success: boolean; error?: string }>;
  cancelSale: (id: string) => Promise<void>;
  addPayment: (payment: { saleId: string; amount: number; paymentMethod: string; paymentDate: string; referenceNumber?: string; notes?: string }) => Promise<void>;
  reversePayment: (id: string) => Promise<void>;
  addQuotation: (quotation: any) => Promise<void>;
  updateQuotation: (id: string, quotation: any) => Promise<void>;
  acceptQuotation: (id: string) => Promise<void>;
  rejectQuotation: (id: string) => Promise<void>;
  cancelQuotation: (id: string) => Promise<void>;
  duplicateQuotation: (id: string) => Promise<void>;
  convertQuotationToSale: (id: string, payload: { saleChannel: string; paymentMethod: string; notes?: string }) => Promise<void>;
  addStockAdjustment: (productId: string, variantId: string, quantity: number, notes: string) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  hideToast: () => void;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  products: [],
  customers: [],
  suppliers: [],
  purchases: [],
  sales: [],
  quotations: [],
  stockMovements: [],
  payments: [],
  invoices: [],
  settings: null,
  toast: null,
  isLoading: false,
  serverError: null,
  dashboardStats: null,

  // FETCH ACTIONS
  fetchProducts: async (params) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await productApi.getAll(params);
      set({ products: mapEntityArray(res.data), isLoading: false });
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to fetch products', isLoading: false });
    }
  },

  fetchCustomers: async (params) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await customerApi.getAll(params);
      set({ customers: mapEntityArray(res.data), isLoading: false });
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to fetch customers', isLoading: false });
    }
  },

  fetchSuppliers: async (params) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await supplierApi.getAll(params);
      set({ suppliers: mapEntityArray(res.data), isLoading: false });
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to fetch suppliers', isLoading: false });
    }
  },

  fetchPurchases: async (params) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await purchaseApi.getAll(params);
      set({ purchases: mapEntityArray(res.data), isLoading: false });
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to fetch purchases', isLoading: false });
    }
  },

  fetchSales: async (params) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await saleApi.getAll(params);
      set({ sales: mapEntityArray(res.data), isLoading: false });
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to fetch sales', isLoading: false });
    }
  },

  fetchQuotations: async (params) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await quotationApi.getAll(params);
      set({ quotations: mapEntityArray(res.data), isLoading: false });
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to fetch quotations', isLoading: false });
    }
  },

  fetchStockHistory: async (params) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await stockApi.getHistory(params);
      set({ stockMovements: mapEntityArray(res.data), isLoading: false });
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to fetch stock movements', isLoading: false });
    }
  },

  fetchPayments: async (params) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await paymentApi.getAll(params);
      set({ payments: mapEntityArray(res.data), isLoading: false });
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to fetch payments', isLoading: false });
    }
  },

  fetchInvoices: async (params) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await invoiceApi.getAll(params);
      set({ invoices: mapEntityArray(res.data), isLoading: false });
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to fetch invoices', isLoading: false });
    }
  },

  fetchDashboardStats: async (params) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await reportApi.getDashboardReport(params);
      const dataPayload = (res as any).data?.data || res.data;
      set({ dashboardStats: dataPayload, isLoading: false });
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to load dashboard stats', isLoading: false });
    }
  },

  fetchSettings: async () => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await settingsApi.get();
      const dataPayload = (res as any).data?.data || res.data;
      set({ settings: dataPayload, isLoading: false });
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to fetch settings', isLoading: false });
    }
  },

  updateSettings: async (settingsData) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await settingsApi.update(settingsData);
      const dataPayload = (res as any).data?.data || res.data;
      set({ settings: dataPayload, isLoading: false });
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to update settings', isLoading: false });
      throw err;
    }
  },

  // CUSTOMER ACTIONS
  addCustomer: async (customerData) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await customerApi.create(customerData);
      await get().fetchCustomers();
      return mapEntity((res as any).data?.data || res.data);
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to add customer', isLoading: false });
      throw err;
    }
  },

  updateCustomer: async (id, customerData) => {
    set({ isLoading: true, serverError: null });
    try {
      await customerApi.update(id, customerData);
      await get().fetchCustomers();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to update customer', isLoading: false });
      throw err;
    }
  },

  deleteCustomer: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      await customerApi.deactivate(id);
      await get().fetchCustomers();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to deactivate customer', isLoading: false });
      throw err;
    }
  },

  restoreCustomer: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      await customerApi.restore(id);
      await get().fetchCustomers();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to restore customer', isLoading: false });
      throw err;
    }
  },

  // MUTATION ACTIONS
  addProduct: async (productData) => {
    set({ isLoading: true, serverError: null });
    try {
      await productApi.create(productData);
      await get().fetchProducts();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to add product', isLoading: false });
      throw err;
    }
  },

  updateProduct: async (id, productData) => {
    set({ isLoading: true, serverError: null });
    try {
      await productApi.update(id, productData);
      await get().fetchProducts();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to update product', isLoading: false });
      throw err;
    }
  },

  softDeleteProduct: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await productApi.deactivate(id);
      await get().fetchProducts();
      return res;
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to deactivate product', isLoading: false });
      throw err;
    }
  },

  addVariant: async (productId, variant) => {
    set({ isLoading: true, serverError: null });
    try {
      const product = get().products.find(p => p.id === productId || p._id === productId);
      if (!product) throw new Error('Product not found');
      
      const updatedVariants = [...product.variants, variant];
      await productApi.update(productId, { variants: updatedVariants });
      await get().fetchProducts();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to add variant', isLoading: false });
      throw err;
    }
  },

  updateVariant: async (productId, variantId, variantData) => {
    set({ isLoading: true, serverError: null });
    try {
      const product = get().products.find(p => p.id === productId || p._id === productId);
      if (!product) throw new Error('Product not found');

      const updatedVariants = product.variants.map(v => 
        (v.id === variantId || (v as any)._id === variantId) ? { ...v, ...variantData } : v
      );
      await productApi.update(productId, { variants: updatedVariants });
      await get().fetchProducts();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to update variant', isLoading: false });
      throw err;
    }
  },

  addSupplier: async (supplier) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await supplierApi.create(supplier);
      await get().fetchSuppliers();
      return mapEntity((res as any).data?.data || res.data);
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to add supplier', isLoading: false });
      throw err;
    }
  },

  updateSupplier: async (id, supplier) => {
    set({ isLoading: true, serverError: null });
    try {
      await supplierApi.update(id, supplier);
      await get().fetchSuppliers();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to update supplier', isLoading: false });
      throw err;
    }
  },

  deleteSupplier: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      await supplierApi.deactivate(id);
      await get().fetchSuppliers();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to deactivate supplier', isLoading: false });
      throw err;
    }
  },

  restoreSupplier: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      await supplierApi.restore(id);
      await get().fetchSuppliers();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to restore supplier', isLoading: false });
      throw err;
    }
  },

  addPurchase: async (purchase) => {
    set({ isLoading: true, serverError: null });
    try {
      await purchaseApi.create(purchase);
      await get().fetchPurchases();
      await get().fetchProducts();
      await get().fetchDashboardStats();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to create purchase', isLoading: false });
      throw err;
    }
  },

  cancelPurchase: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      await purchaseApi.cancel(id);
      await get().fetchPurchases();
      await get().fetchProducts();
      await get().fetchStockHistory();
      await get().fetchDashboardStats();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to cancel purchase', isLoading: false });
      throw err;
    }
  },

  addSale: async (sale) => {
    set({ isLoading: true, serverError: null });
    try {
      await saleApi.create(sale);
      await get().fetchSales();
      await get().fetchProducts();
      await get().fetchDashboardStats();
      return { success: true };
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to create sale', isLoading: false });
      throw err;
    }
  },

  cancelSale: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      await saleApi.cancel(id);
      await get().fetchSales();
      await get().fetchProducts();
      await get().fetchStockHistory();
      await get().fetchDashboardStats();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to cancel sale', isLoading: false });
      throw err;
    }
  },

  addPayment: async (paymentData) => {
    set({ isLoading: true, serverError: null });
    try {
      await paymentApi.create(paymentData);
      await get().fetchPayments();
      await get().fetchSales();
      await get().fetchCustomers();
      await get().fetchDashboardStats();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to add payment', isLoading: false });
      throw err;
    }
  },

  reversePayment: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      await paymentApi.reverse(id);
      await get().fetchPayments();
      await get().fetchSales();
      await get().fetchCustomers();
      await get().fetchDashboardStats();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to reverse payment', isLoading: false });
      throw err;
    }
  },

  addQuotation: async (quotation) => {
    set({ isLoading: true, serverError: null });
    try {
      await quotationApi.create(quotation);
      await get().fetchQuotations();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to create quotation', isLoading: false });
      throw err;
    }
  },

  updateQuotation: async (id, quotation) => {
    set({ isLoading: true, serverError: null });
    try {
      await quotationApi.update(id, quotation);
      await get().fetchQuotations();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to update quotation', isLoading: false });
      throw err;
    }
  },

  acceptQuotation: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      await quotationApi.accept(id);
      await get().fetchQuotations();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to accept quotation', isLoading: false });
      throw err;
    }
  },

  rejectQuotation: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      await quotationApi.reject(id);
      await get().fetchQuotations();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to reject quotation', isLoading: false });
      throw err;
    }
  },

  cancelQuotation: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      await quotationApi.cancel(id);
      await get().fetchQuotations();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to cancel quotation', isLoading: false });
      throw err;
    }
  },

  duplicateQuotation: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      await quotationApi.duplicate(id);
      await get().fetchQuotations();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to duplicate quotation', isLoading: false });
      throw err;
    }
  },

  convertQuotationToSale: async (id, payload) => {
    set({ isLoading: true, serverError: null });
    try {
      await quotationApi.convertToSale(id, payload);
      await get().fetchQuotations();
      await get().fetchSales();
      await get().fetchProducts();
      await get().fetchStockHistory();
      await get().fetchDashboardStats();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to convert quotation to sale', isLoading: false });
      throw err;
    }
  },

  addStockAdjustment: async (productId, variantId, quantity, notes) => {
    set({ isLoading: true, serverError: null });
    try {
      await stockApi.adjust({
        productId,
        variantId,
        quantityChange: quantity,
        reason: notes, // map notes to reason field
        notes
      });
      // Synchronize with database
      await get().fetchProducts();
      await get().fetchStockHistory();
      await get().fetchDashboardStats();
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to adjust stock', isLoading: false });
      get().showToast(err.message || 'Failed to apply stock adjustment.', 'error');
    }
  },

  addInvoice: async (saleId) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await invoiceApi.create(saleId);
      await get().fetchInvoices();
      set({ isLoading: false });
      return mapEntity((res as any).data?.data || res.data);
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to create invoice', isLoading: false });
      throw err;
    }
  },

  getInvoiceBySaleIdStore: async (saleId) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await invoiceApi.getBySaleId(saleId);
      set({ isLoading: false });
      return mapEntity((res as any).data?.data || res.data);
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to get invoice by sale id', isLoading: false });
      throw err;
    }
  },

  getInvoiceByIdStore: async (id) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await invoiceApi.getById(id);
      set({ isLoading: false });
      return mapEntity((res as any).data?.data || res.data);
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to get invoice', isLoading: false });
      throw err;
    }
  },

  updateInvoiceStore: async (id, data) => {
    set({ isLoading: true, serverError: null });
    try {
      const res = await invoiceApi.update(id, data);
      set({ isLoading: false });
      return mapEntity((res as any).data?.data || res.data);
    } catch (err: any) {
      set({ serverError: err.message || 'Failed to update invoice', isLoading: false });
      throw err;
    }
  },

  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    const existingTimeout = (window as any).toastTimeout;
    if (existingTimeout) clearTimeout(existingTimeout);
    (window as any).toastTimeout = setTimeout(() => {
      get().hideToast();
    }, 4000);
  },

  hideToast: () => {
    set({ toast: null });
  }
}));
