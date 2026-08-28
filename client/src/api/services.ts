import { apiClient } from './index';
import { Product, Customer, Supplier, Purchase, Sale, Quotation, StockMovement, Payment, Invoice, LedgerRow, BusinessSettings } from '../types';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const productApi = {
  getAll: (params?: any) => 
    apiClient.get<any, ApiResponse<Product[]>>('/products', { params }),
  getById: (id: string) => 
    apiClient.get<any, ApiResponse<Product>>(`/products/${id}`),
  create: (data: any) => 
    apiClient.post<any, ApiResponse<Product>>('/products', data),
  update: (id: string, data: any) => 
    apiClient.patch<any, ApiResponse<Product>>(`/products/${id}`, data),
  deactivate: (id: string) => 
    apiClient.delete<any, ApiResponse<any>>(`/products/${id}`),
  activate: (id: string) => 
    apiClient.post<any, ApiResponse<any>>(`/products/${id}/restore`),
  validateSku: (sku: string, productId?: string, variantId?: string) => 
    apiClient.get<any, ApiResponse<{ unique: boolean; message: string }>>('/products/validate-sku', { 
      params: { sku, productId, variantId } 
    })
};

export const uploadApi = {
  uploadImage: (file: File, folder: 'products' | 'variants' | 'logo' = 'products') => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post<any, ApiResponse<{ url: string }>>(`/uploads/image?folder=${folder}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export const customerApi = {
  getAll: (params?: any) => 
    apiClient.get<any, ApiResponse<Customer[]>>('/customers', { params }),
  getById: (id: string) => 
    apiClient.get<any, ApiResponse<Customer>>(`/customers/${id}`),
  create: (data: Omit<Customer, 'id' | 'isActive' | 'createdAt'>) => 
    apiClient.post<any, ApiResponse<Customer>>('/customers', data),
  update: (id: string, data: Partial<Customer>) => 
    apiClient.patch<any, ApiResponse<Customer>>(`/customers/${id}`, data),
  deactivate: (id: string) => 
    apiClient.delete<any, ApiResponse<Customer>>(`/customers/${id}`),
  restore: (id: string) => 
    apiClient.post<any, ApiResponse<Customer>>(`/customers/${id}/restore`)
};

export const supplierApi = {
  getAll: (params?: any) => 
    apiClient.get<any, ApiResponse<Supplier[]>>('/suppliers', { params }),
  getById: (id: string) => 
    apiClient.get<any, ApiResponse<Supplier>>(`/suppliers/${id}`),
  create: (data: Omit<Supplier, 'id' | 'isActive' | 'createdAt'>) => 
    apiClient.post<any, ApiResponse<Supplier>>('/suppliers', data),
  update: (id: string, data: Partial<Supplier>) => 
    apiClient.patch<any, ApiResponse<Supplier>>(`/suppliers/${id}`, data),
  deactivate: (id: string) => 
    apiClient.delete<any, ApiResponse<Supplier>>(`/suppliers/${id}`),
  restore: (id: string) => 
    apiClient.post<any, ApiResponse<Supplier>>(`/suppliers/${id}/restore`)
};

export const purchaseApi = {
  getAll: (params?: any) => 
    apiClient.get<any, ApiResponse<Purchase[]>>('/purchases', { params }),
  getById: (id: string) => 
    apiClient.get<any, ApiResponse<Purchase>>(`/purchases/${id}`),
  create: (data: any) => 
    apiClient.post<any, ApiResponse<Purchase>>('/purchases', data),
  cancel: (id: string) => 
    apiClient.post<any, ApiResponse<Purchase>>(`/purchases/${id}/cancel`)
};

export const saleApi = {
  getAll: (params?: any) => 
    apiClient.get<any, ApiResponse<Sale[]>>('/sales', { params }),
  getById: (id: string) => 
    apiClient.get<any, ApiResponse<Sale>>(`/sales/${id}`),
  create: (data: any) => 
    apiClient.post<any, ApiResponse<Sale>>('/sales', data),
  cancel: (id: string) => 
    apiClient.post<any, ApiResponse<Sale>>(`/sales/${id}/cancel`)
};

export const paymentApi = {
  getAll: (params?: any) => 
    apiClient.get<any, ApiResponse<Payment[]>>('/payments', { params }),
  getById: (id: string) => 
    apiClient.get<any, ApiResponse<Payment>>(`/payments/${id}`),
  create: (data: { saleId: string; amount: number; paymentMethod: string; paymentDate: string; referenceNumber?: string; notes?: string }) => 
    apiClient.post<any, ApiResponse<Payment>>('/payments', data),
  reverse: (id: string) => 
    apiClient.post<any, ApiResponse<Payment>>(`/payments/${id}/reverse`)
};

export const customerLedgerApi = {
  getLedger: (customerId: string, params?: any) => 
    apiClient.get<any, ApiResponse<{ openingBalance: number; closingBalance: number; transactions: LedgerRow[]; total: number }>>(`/customers/${customerId}/ledger`, { params })
};

export const invoiceApi = {
  getAll: (params?: any) => 
    apiClient.get<any, ApiResponse<Invoice[]>>('/invoices', { params }),
  getById: (id: string) => 
    apiClient.get<any, ApiResponse<Invoice>>(`/invoices/${id}`),
  getBySaleId: (saleId: string) => 
    apiClient.get<any, ApiResponse<Invoice>>(`/invoices/sale/${saleId}`),
  create: (saleId: string) => 
    apiClient.post<any, ApiResponse<Invoice>>('/invoices', { saleId }),
  update: (id: string, data: { notes?: string; terms?: string }) =>
    apiClient.patch<any, ApiResponse<Invoice>>(`/invoices/${id}`, data),
  downloadPdf: (id: string) => 
    apiClient.get<any, ApiResponse<Invoice>>(`/invoices/${id}/download`)
};

export const quotationApi = {
  getAll: (params?: any) => 
    apiClient.get<any, ApiResponse<Quotation[]>>('/quotations', { params }),
  getById: (id: string) => 
    apiClient.get<any, ApiResponse<Quotation>>(`/quotations/${id}`),
  create: (data: any) => 
    apiClient.post<any, ApiResponse<Quotation>>('/quotations', data),
  update: (id: string, data: any) => 
    apiClient.patch<any, ApiResponse<Quotation>>(`/quotations/${id}`, data),
  accept: (id: string) => 
    apiClient.post<any, ApiResponse<Quotation>>(`/quotations/${id}/accept`),
  reject: (id: string) => 
    apiClient.post<any, ApiResponse<Quotation>>(`/quotations/${id}/reject`),
  cancel: (id: string) => 
    apiClient.post<any, ApiResponse<Quotation>>(`/quotations/${id}/cancel`),
  convertToSale: (id: string, data: { saleChannel: string; paymentMethod: string; notes?: string }) => 
    apiClient.post<any, ApiResponse<Sale>>(`/quotations/${id}/convert-to-sale`, data),
  duplicate: (id: string) => 
    apiClient.post<any, ApiResponse<Quotation>>(`/quotations/${id}/duplicate`)
};

export const stockApi = {
  getHistory: (params?: any) => 
    apiClient.get<any, ApiResponse<StockMovement[]>>('/stock/history', { params }),
  adjust: (data: { productId: string; variantId: string; quantityChange: number; reason: string; notes?: string }) => 
    apiClient.post<any, ApiResponse<any>>('/stock/adjust', data),
  reconcile: (productId: string, variantId: string) => 
    apiClient.get<any, ApiResponse<any>>(`/stock/reconcile/${productId}/${variantId}`)
};

export const dashboardApi = {
  getStats: (params?: any) => 
    apiClient.get<any, ApiResponse<any>>('/dashboard', { params })
};

export const reportApi = {
  getSales: (params?: any) => apiClient.get<any, ApiResponse<any>>('/reports/sales', { params }),
  getPurchases: (params?: any) => apiClient.get<any, ApiResponse<any>>('/reports/purchases', { params }),
  getInventory: (params?: any) => apiClient.get<any, ApiResponse<any>>('/reports/inventory', { params }),
  getPayments: (params?: any) => apiClient.get<any, ApiResponse<any>>('/reports/payments', { params }),
  getCustomers: () => apiClient.get<any, ApiResponse<any>>('/reports/customers'),
  getSuppliers: () => apiClient.get<any, ApiResponse<any>>('/reports/suppliers'),
  getDashboardReport: (params?: any) => apiClient.get<any, ApiResponse<any>>('/reports/dashboard', { params })
};

export const settingsApi = {
  get: () => apiClient.get<any, ApiResponse<BusinessSettings>>('/settings'),
  update: (data: BusinessSettings) => apiClient.put<any, ApiResponse<BusinessSettings>>('/settings', data)
};

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<any, ApiResponse<{ token: string; user: any }>>('/auth/login', credentials),
  getMe: () =>
    apiClient.get<any, ApiResponse<{ user: any }>>('/auth/me'),
  updateProfile: (data: { name?: string; avatarUrl?: string }) =>
    apiClient.patch<any, ApiResponse<{ user: any }>>('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post<any, ApiResponse<{ message: string }>>('/auth/change-password', data),
  logout: () =>
    apiClient.post<any, ApiResponse<{ message: string }>>('/auth/logout')
};

