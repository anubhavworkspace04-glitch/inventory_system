import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, Eye, ShoppingBag, X } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate } from '../utils';

export const Sales: React.FC = () => {
  const { sales, customers, fetchSales, fetchCustomers, isLoading } = useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [customerFilter, setCustomerFilter] = useState('All');
  
  // Date range filters
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');

  // Pagination parameters
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch sales when filters or page changes
  useEffect(() => {
    const params: any = {
      page,
      limit,
      search: searchTerm.trim() || undefined,
      saleChannel: channelFilter !== 'All' ? channelFilter : undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      customerId: customerFilter !== 'All' ? customerFilter : undefined,
      from: fromFilter || undefined,
      to: toFilter || undefined
    };
    fetchSales(params);
  }, [searchTerm, channelFilter, statusFilter, customerFilter, fromFilter, toFilter, page]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setChannelFilter('All');
    setStatusFilter('All');
    setCustomerFilter('All');
    setFromFilter('');
    setToFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customer Sales</h2>
          <p className="text-xs text-gray-500">Record customer orders, process offline counter bills, and generate invoices.</p>
        </div>
        <Link
          to="/sales/new"
          className="flex items-center justify-center space-x-1.5 px-4 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Sale</span>
        </Link>
      </div>

      {/* Toolbar Filters Panel */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by sale number, customer, or product SKU..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Quick Selects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-auto">
            <select
              value={customerFilter}
              onChange={(e) => { setCustomerFilter(e.target.value); setPage(1); }}
              className="bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Customers</option>
              <option value="Walk-in">Walk-in Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={channelFilter}
              onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
              className="bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Channels</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <button
              onClick={handleClearFilters}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded-lg transition-colors font-medium"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Date Ranges Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-3 border-t border-gray-100">
          <span className="text-gray-500 font-semibold">Date Range:</span>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={fromFilter}
              onChange={(e) => { setFromFilter(e.target.value); setPage(1); }}
              className="bg-white border border-gray-300 text-gray-900 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={toFilter}
              onChange={(e) => { setToFilter(e.target.value); setPage(1); }}
              className="bg-white border border-gray-300 text-gray-900 rounded px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Table content */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-xs text-gray-500 shadow-sm">
          Loading sales transactions history...
        </div>
      ) : sales.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
          <div className="p-3 bg-gray-50 text-gray-400 rounded-full">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">No sales recorded</h3>
            <p className="text-xs text-gray-500 max-w-sm">No sales matched the active filters. Create a new sale or reset filters.</p>
          </div>
          <button
            onClick={handleClearFilters}
            className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium"
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
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold text-xs tracking-wider uppercase">
                    <th className="px-4 py-3.5">Sale No</th>
                    <th className="px-4 py-3.5">Customer Name</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Items Summary</th>
                    <th className="px-4 py-3.5 text-center">Channel</th>
                    <th className="px-4 py-3.5 text-right">Subtotal</th>
                    <th className="px-4 py-3.5 text-right">Discount</th>
                    <th className="px-4 py-3.5 text-right">Tax</th>
                    <th className="px-4 py-3.5 text-right">Invoice Total</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((s) => {
                    let itemsStr = '';
                    if (s.items.length === 1) {
                      itemsStr = `${s.items[0].productNameSnapshot} (${s.items[0].variantNameSnapshot})`;
                    } else {
                      itemsStr = `Multiple Items (${s.items.length})`;
                    }

                    return (
                      <tr key={s.id} className={`hover:bg-gray-50 text-gray-700 transition-colors ${s.status === 'Cancelled' ? 'opacity-60 line-through' : ''}`}>
                        <td className="px-4 py-3.5 font-mono font-bold text-brand-600">
                          <Link to={`/sales/${s.id}`} className="hover:underline">{s.saleNumber}</Link>
                        </td>
                        <td className="px-4 py-3.5">
                          {s.customerId ? (
                            <Link to={`/customers/${s.customerId}`} className="hover:underline font-semibold text-gray-800">
                              {s.customerNameSnapshot}
                            </Link>
                          ) : (
                            <span className="text-gray-500 italic">{s.customerNameSnapshot}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs">{formatDate(s.saleDate)}</td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-gray-700 max-w-[200px] truncate">
                          {itemsStr}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            s.saleChannel === 'Online' 
                              ? 'bg-blue-50 text-blue-700 border-blue-200' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {s.saleChannel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono">{formatCurrency(s.subtotal)}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-red-600">-{formatCurrency(s.totalDiscount)}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-brand-600">+{formatCurrency(s.totalTax)}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-900 font-mono">
                          {formatCurrency(s.total)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            s.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            to={`/sales/${s.id}`}
                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded inline-block transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simple Pagination Footer controls */}
          <div className="flex items-center justify-between text-sm text-gray-500 bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
            <span>Showing page {page}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={sales.length < limit}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 font-medium"
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
