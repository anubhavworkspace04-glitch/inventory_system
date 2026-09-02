import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Boxes, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  Truck,
  FileText, 
  History, 
  BarChart3, 
  Settings as SettingsIcon, 
  Menu, 
  X, 
  User,
  AlertTriangle,
  DollarSign,
  Receipt,
  LogOut
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
import { getImageUrl, getUserInitials } from '../utils';
import { Toast } from '../components/Toast';
import { CompanyLogo } from '../components/CompanyLogo';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const { 
    products,
    fetchProducts, 
    fetchCustomers, 
    fetchSuppliers,
    fetchPurchases, 
    fetchSales, 
    fetchQuotations, 
    fetchStockHistory,
    fetchPayments,
    fetchInvoices,
    settings,
    fetchSettings,
    serverError,
    toast,
    hideToast
  } = useInventoryStore();

  const { user, logout } = useAuthStore();

  const handleRetry = () => {
    fetchProducts();
    fetchCustomers();
    fetchSuppliers();
    fetchPurchases();
    fetchSales();
    fetchQuotations();
    fetchStockHistory();
    fetchPayments();
    fetchInvoices();
    fetchSettings();
  };

  useEffect(() => {
    handleRetry();
  }, []);

  const navItems = [
    { name: 'Dashboard',     path: '/dashboard',     icon: LayoutDashboard },
    { name: 'Inventory',     path: '/inventory',     icon: Boxes },
    { name: 'Purchases',     path: '/purchases',     icon: ShoppingBag },
    { name: 'Sales',         path: '/sales',         icon: TrendingUp },
    { name: 'Invoices',      path: '/invoices',      icon: Receipt },
    { name: 'Payments',      path: '/payments',      icon: DollarSign },
    { name: 'Customers',     path: '/customers',     icon: Users },
    { name: 'Suppliers',     path: '/suppliers',     icon: Truck },
    { name: 'Quotations',    path: '/quotations',    icon: FileText },
    { name: 'Stock History', path: '/stock-history', icon: History },
    { name: 'Reports',       path: '/reports',       icon: BarChart3 },
    { name: 'Settings',      path: '/settings',      icon: SettingsIcon },
  ];

  const getPageTitle = () => {
    const current = navItems.find(item => location.pathname.startsWith(item.path));
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname.includes('/inventory/products/')) return 'Product Details';
    if (location.pathname.includes('/purchases/new')) return 'New Purchase';
    if (location.pathname.includes('/purchases/')) return 'Purchase Details';
    if (location.pathname.includes('/payments/')) return 'Payment Voucher Details';
    if (location.pathname.includes('/sales/new')) return 'New Sale';
    if (location.pathname.includes('/sales/')) return 'Sale Details';
    if (location.pathname.includes('/customers/')) return 'Customer Profile';
    if (location.pathname.includes('/suppliers/')) return 'Supplier Profile';
    if (location.pathname.includes('/invoices/')) return 'Invoice Details';
    if (location.pathname.includes('/quotations/new')) return 'New Quotation';
    if (location.pathname.includes('/quotations/')) return 'Quotation Details';
    return current ? current.name : 'System';
  };

  const businessName = settings?.businessName || 'GG Glassware Co.';
  const userInitials = getUserInitials(user?.name || 'Admin');

  // ── Server error screen ─────────────────────────────────────────────────────
  if (serverError && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-500 border border-red-200 rounded-full">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Unable to Connect to Server</h2>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
          Unable to establish communication with the database backend. Please check whether the backend service is running.
        </p>
        <button
          onClick={handleRetry}
          className="btn-primary"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans print:h-auto print:bg-white print:overflow-visible">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-gray-200 transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 print:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and Brand */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center space-x-2.5 min-w-0">
            <CompanyLogo className="h-8 w-8 rounded-lg" textClassName="font-bold text-sm text-white" />
            <span className="text-base font-bold text-gray-900 tracking-tight truncate">
              {businessName}
            </span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-gray-700 lg:hidden rounded-lg p-1 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path) || (item.path === '/dashboard' && location.pathname === '/');
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                  isActive 
                    ? 'bg-brand-100 text-brand-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 mr-3 flex-shrink-0 ${
                  isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Profile & Logout */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            {user?.avatarUrl ? (
              <img
                src={getImageUrl(user.avatarUrl)}
                alt="Profile Avatar"
                className="h-8 w-8 rounded-full object-cover border border-brand-200 shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-brand-100 border border-brand-200 shrink-0 font-bold text-xs text-brand-700">
                {userInitials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || 'admin@ggglassware.com'}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            title="Sign Out"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 print:overflow-visible print:block">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 flex-shrink-0 print:hidden">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-gray-700 lg:hidden focus:outline-none p-1.5 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
          </div>

          {/* Right Header Area: Authenticated User Info & Actions */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5">
              {user?.avatarUrl ? (
                <img
                  src={getImageUrl(user.avatarUrl)}
                  alt={user.name || 'User'}
                  className="h-8 w-8 rounded-full object-cover border border-brand-200 shrink-0"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-brand-100 border border-brand-200 shrink-0 font-bold text-xs text-brand-700 shadow-sm">
                  {userInitials}
                </div>
              )}
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-bold text-gray-900">{user?.name || 'Admin User'}</p>
                <p className="text-[10px] text-gray-500 font-medium capitalize mt-0.5">{user?.role || 'Administrator'}</p>
              </div>
            </div>

            <div className="h-5 w-px bg-gray-200 mx-1" />

            <span className="hidden md:inline-flex px-2 py-0.5 text-xs rounded-md bg-gray-100 text-gray-600 border border-gray-200 font-medium">
              INR (₹)
            </span>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 print:bg-white print:p-0 print:overflow-visible print:block">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </div>
  );
};
