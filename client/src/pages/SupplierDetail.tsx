import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Phone, MapPin, FileText, ShoppingBag, DollarSign, Clock, CreditCard, CheckCircle 
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate } from '../utils';

export const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { suppliers, purchases, fetchSuppliers, fetchPurchases } = useInventoryStore();
  const [activeTab, setActiveTab] = useState<'purchases' | 'payments'>('purchases');

  useEffect(() => {
    fetchSuppliers();
    fetchPurchases();
  }, []);

  const supplier = suppliers.find(s => s.id === id);

  if (!supplier) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-900">Supplier not found</h3>
        <p className="text-sm text-gray-500 max-w-sm">The supplier card you are looking for does not exist or has been deleted.</p>
        <Link to="/suppliers" className="inline-flex items-center text-sm text-brand-600 hover:underline font-medium">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Suppliers
        </Link>
      </div>
    );
  }

  // Filter purchases for this supplier
  const supplierPurchases = purchases.filter(
    p => p.supplierId === supplier.id && p.status === 'Active'
  );

  const totalValue = supplierPurchases.reduce((sum, p) => sum + p.totalPurchaseCost, 0);
  const totalPaid = supplierPurchases.reduce((sum, p) => sum + p.amountPaid, 0);
  const pendingAmount = supplierPurchases.reduce((sum, p) => sum + p.pendingAmount, 0);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/suppliers" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Suppliers
        </Link>
      </div>

      {/* Header Info Profile */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900">{supplier.name}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
              supplier.isActive 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {supplier.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
            <div className="flex items-center space-x-1.5">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="font-mono">{supplier.phone}</span>
            </div>
            {supplier.email && (
              <div className="flex items-center space-x-1.5">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{supplier.email}</span>
              </div>
            )}
            {supplier.gstNumber && (
              <div className="flex items-center space-x-1.5">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="font-mono">GSTIN: {supplier.gstNumber}</span>
              </div>
            )}
          </div>

          {supplier.address && (
            <div className="flex items-start space-x-1.5 text-sm text-gray-500 max-w-xl">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <span>{supplier.address}</span>
            </div>
          )}

          {supplier.notes && (
            <div className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg border border-gray-200">
              Notes: {supplier.notes}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{supplierPurchases.length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Purchased Value</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalValue)}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Amount Paid</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium">Pending Payments</span>
            <Clock className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-lg font-bold text-red-600">{formatCurrency(pendingAmount)}</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'purchases' 
                ? 'border-brand-500 text-brand-700 bg-brand-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Purchase Orders ({supplierPurchases.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'payments' 
                ? 'border-brand-500 text-brand-700 bg-brand-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Payments History
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-0">
          {activeTab === 'purchases' ? (
            supplierPurchases.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No purchase records found for this supplier.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3.5">Purchase No</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Items</th>
                      <th className="px-4 py-3.5 text-right">Total Cost</th>
                      <th className="px-4 py-3.5 text-right">Amount Paid</th>
                      <th className="px-4 py-3.5 text-right">Pending</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {supplierPurchases.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-sm text-brand-600 hover:underline">
                          <Link to={`/purchases/${p.id}`}>{p.purchaseNumber}</Link>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-sm text-gray-700">{formatDate(p.purchaseDate)}</td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-gray-800">{p.items.length} item(s)</td>
                        <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">{formatCurrency(p.totalPurchaseCost)}</td>
                        <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">{formatCurrency(p.amountPaid)}</td>
                        <td className={`px-4 py-3.5 text-right font-mono text-sm font-semibold ${p.pendingAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {p.pendingAmount > 0 ? formatCurrency(p.pendingAmount) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-center text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            p.paymentStatus === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : p.paymentStatus === 'Partially Paid'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            // Payments Tab
            supplierPurchases.filter(p => p.amountPaid > 0).length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No payment transaction history records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3.5">Payment Date</th>
                      <th className="px-4 py-3.5">Voucher Reference</th>
                      <th className="px-4 py-3.5">Payment Mode</th>
                      <th className="px-4 py-3.5 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {supplierPurchases.filter(p => p.amountPaid > 0).map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 text-sm font-mono text-gray-700">{formatDate(p.purchaseDate)}</td>
                        <td className="px-4 py-3.5 text-sm font-mono text-brand-600 hover:underline">
                          <Link to={`/purchases/${p.id}`}>{p.purchaseNumber}</Link>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <span className="inline-flex items-center space-x-1 text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md text-xs font-medium">
                            <CreditCard className="h-3.5 w-3.5 text-gray-500" />
                            <span>{p.paymentMode}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-sm font-bold text-emerald-600">
                          {formatCurrency(p.amountPaid)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="m-4 text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-200">
                  Note: Split-payment logs, debit vouchers and payment receipts editing are managed in Phase 7.
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
