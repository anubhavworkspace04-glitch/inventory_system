import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Calendar, DollarSign, X } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate } from '../utils';

export const Payments: React.FC = () => {
  const { payments, fetchPayments, customers, fetchCustomers, isLoading } = useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');

  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const params: any = {
      page,
      limit,
      search: searchTerm.trim() || undefined,
      paymentMethod: methodFilter !== 'All' ? methodFilter : undefined,
      paymentType: typeFilter !== 'All' ? typeFilter : undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      customerId: customerFilter !== 'All' ? customerFilter : undefined,
      from: fromFilter || undefined,
      to: toFilter || undefined
    };
    fetchPayments(params);
  }, [searchTerm, methodFilter, typeFilter, statusFilter, customerFilter, fromFilter, toFilter, page]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setMethodFilter('All');
    setTypeFilter('All');
    setStatusFilter('All');
    setCustomerFilter('All');
    setFromFilter('');
    setToFilter('');
    setPage(1);
  };

  const getCustomerName = (customerId?: string | null) => {
    if (!customerId) return 'Walk-in Customer';
    const c = customers.find(cust => cust.id === customerId);
    return c ? c.name : 'Unknown Customer';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
          <p className="text-xs text-gray-500">View received customer receipts, payments settlement logs, and transaction audits.</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments by voucher no, reference transaction ID, notes..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 lg:w-auto text-xs">
            <select
              value={customerFilter}
              onChange={(e) => { setCustomerFilter(e.target.value); setPage(1); }}
              className="bg-white border border-gray-300 rounded-lg px-2 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Customers</option>
              <option value="Walk-in">Walk-in Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              className="bg-white border border-gray-300 rounded-lg px-2 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card swipe</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="bg-white border border-gray-300 rounded-lg px-2 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Types</option>
              <option value="SALE_RECEIPT">Invoice Payment</option>
              <option value="REVERSAL">Reversal</option>
              <option value="REFUND">Refund</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-white border border-gray-300 rounded-lg px-2 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Reversed">Reversed</option>
            </select>

            <button
              onClick={handleClearFilters}
              className="flex items-center justify-center space-x-1 px-2.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Date picking row */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-3 border-t border-gray-100">
          <span className="text-gray-500 font-semibold">Payment Date:</span>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={fromFilter}
              onChange={(e) => { setFromFilter(e.target.value); setPage(1); }}
              className="bg-white border border-gray-300 text-gray-700 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={toFilter}
              onChange={(e) => { setToFilter(e.target.value); setPage(1); }}
              className="bg-white border border-gray-300 text-gray-700 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Payments list table */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-xs text-gray-500 shadow-sm">
          Loading payment receipts ledger...
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
          <div className="p-3 bg-gray-50 text-gray-400 rounded-full">
            <DollarSign className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">No payments found</h3>
            <p className="text-xs text-gray-500 max-w-sm">No payment receipt vouchers matched the filter parameters. Reset parameters to view all.</p>
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Voucher No</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Transaction Ref</th>
                    <th className="px-6 py-4 text-right">Received Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map(p => (
                    <tr key={p.id} className={`hover:bg-gray-50 text-gray-700 bg-white transition-colors ${p.status === 'Reversed' ? 'opacity-60 line-through' : ''}`}>
                      <td className="px-6 py-4 font-mono font-bold text-brand-600">
                        <Link to={`/payments/${p.id}`} className="hover:underline">{p.paymentNumber}</Link>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{formatDate(p.paymentDate)}</td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {p.customerId ? (
                          <Link to={`/customers/${p.customerId}`} className="hover:underline">
                            {getCustomerName(p.customerId)}
                          </Link>
                        ) : (
                          <span className="text-gray-400 italic">Walk-in Customer</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[10px] text-gray-600 font-medium">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-gray-500">
                        {p.paymentType === 'SALE_RECEIPT' ? 'Invoice Payment' : p.paymentType}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {p.referenceNumber || '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-700 font-mono">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          p.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/payments/${p.id}`}
                          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded inline-block transition-colors"
                          title="View Voucher"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination bar */}
          <div className="flex items-center justify-between text-xs text-gray-500 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
            <span>Showing page {page}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg disabled:opacity-40 text-gray-700 font-medium transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={payments.length < limit}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg disabled:opacity-40 text-gray-700 font-medium transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
