import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, ShoppingBag } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate } from '../utils';

export const Purchases: React.FC = () => {
  const { purchases, fetchPurchases } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Filter logic
  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch = 
      p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierNameSnapshot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.items.some(item => 
        item.productNameSnapshot.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.variantNameSnapshot.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.skuSnapshot.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesPayment = paymentFilter === 'All' || p.paymentStatus === paymentFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Supplier Purchases</h2>
          <p className="text-xs text-gray-500">Track raw materials incoming shipments, base costs, shipping fees, and taxes.</p>
        </div>
        <Link
          to="/purchases/new"
          className="flex items-center justify-center space-x-1.5 px-4 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Purchase</span>
        </Link>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by purchase code, supplier, or items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:w-auto">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="All">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Pending">Pending</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Purchases Table */}
      {filteredPurchases.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
          <div className="p-3 bg-gray-50 text-gray-400 rounded-full">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">No purchases recorded</h3>
            <p className="text-xs text-gray-500 max-w-sm">Start recording purchases to add items to your stock inventory and keep pricing histories.</p>
          </div>
          <Link
            to="/purchases/new"
            className="flex items-center space-x-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create First Purchase Order</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold text-xs tracking-wider uppercase">
                  <th className="px-4 py-3.5">Purchase No</th>
                  <th className="px-4 py-3.5">Supplier</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Items Summary</th>
                  <th className="px-4 py-3.5 text-right">Total Qty</th>
                  <th className="px-4 py-3.5 text-right">Base Amt</th>
                  <th className="px-4 py-3.5 text-right">Costs</th>
                  <th className="px-4 py-3.5 text-right">Total Cost</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.map((p) => {
                  const isCancelled = p.status === 'Cancelled';
                  const totalQty = p.items.reduce((sum, item) => sum + item.quantity, 0);

                  // Formatting Items description column
                  let itemsSummary = '';
                  if (p.items.length === 1) {
                    itemsSummary = `${p.items[0].productNameSnapshot} (${p.items[0].variantNameSnapshot})`;
                  } else {
                    itemsSummary = `Multiple Items (${p.items.length} specifications)`;
                  }

                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 text-gray-700 transition-colors ${
                      isCancelled ? 'opacity-55' : ''
                    }`}>
                      <td className="px-4 py-3.5 font-mono font-bold text-brand-600 hover:underline">
                        <Link to={`/purchases/${p.id}`}>{p.purchaseNumber}</Link>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800 max-w-[140px] truncate">
                        <Link to={`/suppliers/${p.supplierId}`} className="hover:underline text-gray-800">
                          {p.supplierNameSnapshot}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono">
                        {formatDate(p.purchaseDate)}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <span className="font-semibold text-gray-700">{itemsSummary}</span>
                        {p.items.length > 1 && (
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            SKUs: {p.items.map(i => i.skuSnapshot).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold font-mono text-xs">
                        {totalQty}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-gray-500">
                        {formatCurrency(p.baseAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-gray-500">
                        {formatCurrency(p.totalAdditionalCosts)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-900">
                        {formatCurrency(p.totalPurchaseCost)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          isCancelled
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : p.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.paymentStatus === 'Partially Paid'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {isCancelled ? 'Cancelled' : p.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          to={`/purchases/${p.id}`}
                          className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded transition-colors inline-block"
                          title="View detail details"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
