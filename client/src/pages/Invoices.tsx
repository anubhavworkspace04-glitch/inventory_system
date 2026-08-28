import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Printer, Download, Receipt, X } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate } from '../utils';

export const Invoices: React.FC = () => {
  const { invoices, customers, fetchInvoices, fetchCustomers } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  // Fetch data on parameters change
  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchInvoices({
      search: searchTerm || undefined,
      customerId: selectedCustomerId !== 'All' ? selectedCustomerId : undefined,
      paymentStatus: paymentStatus !== 'All' ? paymentStatus : undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      page,
      limit: 50
    });
  }, [searchTerm, selectedCustomerId, paymentStatus, fromDate, toDate, page]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCustomerId('All');
    setPaymentStatus('All');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partially Paid':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-red-50 text-red-600 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tax Invoices</h2>
          <p className="text-xs text-gray-500">Generate, print, and track financial sales invoices for business and customer billing audits.</p>
        </div>
      </div>

      {/* Query Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices by number, sale, customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Filters Select row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Customer Dropdown */}
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Customers</option>
              <option value="Walk-in">Walk-in Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Payment Status Dropdown */}
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Unpaid / Pending</option>
            </select>

            {/* Date Filters */}
            <div className="flex items-center space-x-1">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <span className="text-gray-500 text-xs">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Clear Button */}
            {(searchTerm || selectedCustomerId !== 'All' || paymentStatus !== 'All' || fromDate || toDate) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1 px-3 py-2 text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors border border-gray-200"
              >
                <X className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoice List Table */}
      {invoices.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
          <div className="p-3 bg-gray-50 text-gray-500 rounded-full">
            <Receipt className="h-10 w-10 text-gray-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">No invoices generated</h3>
            <p className="text-xs text-gray-500 max-w-sm">No tax invoice records were found matching selected date periods, statuses, or keywords.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-xs tracking-wider uppercase">
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Sale No</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Invoice Date</th>
                  <th className="px-6 py-4 text-center">Items Count</th>
                  <th className="px-6 py-4 text-right">Grand Total</th>
                  <th className="px-6 py-4 text-right">Amount Paid</th>
                  <th className="px-6 py-4 text-right">Amount Pending</th>
                  <th className="px-6 py-4 text-center">Payment Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 text-gray-700 transition-colors bg-white">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                      {inv.saleNumber}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {inv.customerNameSnapshot}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500 font-mono text-xs">
                      {inv.items.length}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-700 font-mono font-medium">
                      {formatCurrency(inv.amountPaid)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 font-mono">
                      {formatCurrency(inv.amountPending)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyle(inv.paymentStatus)}`}>
                        {inv.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="p-1 text-gray-400 hover:text-brand-600 rounded hover:bg-gray-100 transition-colors"
                          title="View invoice details"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
