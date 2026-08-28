import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Layouts
import { DashboardLayout } from './layouts/DashboardLayout';

// Components & Auth
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { ProductDetail } from './pages/ProductDetail';
import { ProductForm } from './pages/ProductForm';
import { Purchases } from './pages/Purchases';
import { NewPurchase } from './pages/NewPurchase';
import { PurchaseDetail } from './pages/PurchaseDetail';
import { Sales } from './pages/Sales';
import { NewSale } from './pages/NewSale';
import { SaleDetail } from './pages/SaleDetail';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Suppliers } from './pages/Suppliers';
import { SupplierDetail } from './pages/SupplierDetail';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { Invoices } from './pages/Invoices';
import { Quotations } from './pages/Quotations';
import { NewQuotation } from './pages/NewQuotation';
import { QuotationDetail } from './pages/QuotationDetail';
import { StockHistory } from './pages/StockHistory';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Payments } from './pages/Payments';
import { PaymentDetail } from './pages/PaymentDetail';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory/new" element={<ProductForm />} />
            <Route path="inventory/products/:id" element={<ProductDetail />} />
            <Route path="inventory/products/:id/edit" element={<ProductForm />} />
            
            <Route path="purchases" element={<Purchases />} />
            <Route path="purchases/new" element={<NewPurchase />} />
            <Route path="purchases/:id" element={<PurchaseDetail />} />
            
            <Route path="sales" element={<Sales />} />
            <Route path="sales/new" element={<NewSale />} />
            <Route path="sales/:id" element={<SaleDetail />} />
            
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="suppliers/:id" element={<SupplierDetail />} />
            
            <Route path="payments" element={<Payments />} />
            <Route path="payments/:id" element={<PaymentDetail />} />
            
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            
            <Route path="quotations" element={<Quotations />} />
            <Route path="quotations/new" element={<NewQuotation />} />
            <Route path="quotations/:id" element={<QuotationDetail />} />
            <Route path="quotations/:id/edit" element={<NewQuotation />} />
            
            <Route path="stock-history" element={<StockHistory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
