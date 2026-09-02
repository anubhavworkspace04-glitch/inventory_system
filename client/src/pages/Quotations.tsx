import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Clipboard, X, Calendar } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate } from '../utils';

export const Quotations: React.FC = () => {
  const { quotations, fetchQuotations, customers, fetchCustomers, isLoading } = useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
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
      status: statusFilter !== 'All' ? statusFilter : undefined,
      customerId: customerFilter !== 'All' ? customerFilter : undefined,
      from: fromFilter || undefined,
      to: toFilter || undefined
    };
    fetchQuotations(params);
  }, [searchTerm, statusFilter, customerFilter, fromFilter, toFilter, page]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCustomerFilter('All');
    setFromFilter('');
    setToFilter('');
    setPage(1);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'SENT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ACCEPTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'EXPIRED':
        return 'bg-gray-50 text-gray-500 border-gray-200';
      case 'CONVERTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Estimates & Quotations</h2>
          <p className="text-xs text-gray-500">Manage client inquiries, propose pricing estimates, and convert accepted proposals directly into sale bills.</p>
        </div>
        <Link
          to="/quotations/new"
          className="flex items-center justify-center space-x-1.5 px-4 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Quotation</span>
        </Link>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotations by quote no, customer, SKU, product name..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-auto text-xs">
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
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-white border border-gray-300 rounded-lg px-2 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
              <option value="CONVERTED">Converted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <button
              onClick={handleClearFilters}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-medium"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Date picking row */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-3 border-t border-gray-100">
          <span className="text-gray-500 font-semibold">Quotation Date:</span>
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

      {/* Table Listing */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-xs text-gray-500 shadow-sm">
          Loading quotations history...
        </div>
      ) : quotations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
          <div className="p-3 bg-gray-50 text-gray-400 rounded-full">
            <Clipboard className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">No quotations found</h3>
            <p className="text-xs text-gray-500 max-w-sm">No estimate quotation documents matched the filter parameters. Create one to begin.</p>
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium"
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
                    <th className="px-6 py-4">Quote Number</th>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Quote Date</th>
                    <th className="px-6 py-4">Valid Until</th>
                    <th className="px-6 py-4">Billing Items</th>
                    <th className="px-6 py-4 text-right">Proposed Total</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotations.map(q => {
                    let itemsSummary = '';
                    if (q.items.length === 1) {
                      itemsSummary = `${q.items[0].productNameSnapshot} (${q.items[0].variantNameSnapshot})`;
                    } else if (q.items.length > 1) {
                      itemsSummary = `Multiple items (${q.items.length} lines)`;
                    } else {
                      itemsSummary = '—';
                    }

                    return (
                      <tr key={q.id || q._id} className="hover:bg-gray-50 text-gray-700 transition-colors bg-white">
                        <td className="px-6 py-4 font-mono font-bold text-brand-600 hover:underline">
                          <Link to={`/quotations/${q.id || q._id}`}>{q.quotationNumber}</Link>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-800">
                          {q.customerId ? (
                            <Link to={`/customers/${q.customerId}`} className="hover:underline">
                              {q.customerNameSnapshot}
                            </Link>
                          ) : (
                            <span className="text-gray-500 italic">Walk-in Client</span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{formatDate(q.quotationDate)}</td>
                        <td className="px-6 py-4 font-mono text-xs text-red-600 font-semibold">{formatDate(q.expiryDate)}</td>
                        <td className="px-6 py-4 text-xs font-semibold">{itemsSummary}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">{formatCurrency(q.total)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(q.status)}`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-1">
                            <Link
                              to={`/quotations/${q.id || q._id}`}
                              className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded transition-colors"
                              title="View Quotation details"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg disabled:opacity-40 text-gray-700 font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={quotations.length < limit}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg disabled:opacity-40 text-gray-700 font-medium"
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
