import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Phone, Mail, MapPin, FileText, ShoppingBag, TrendingUp, DollarSign, Clock, Eye, Printer, CreditCard, ShieldAlert 
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate } from '../utils';
import { customerLedgerApi } from '../api/services';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    customers, sales, fetchCustomers, fetchSales, payments, fetchPayments, addPayment, isLoading,
    quotations, fetchQuotations
  } = useInventoryStore();

  const [activeTab, setActiveTab] = useState<'sales' | 'payments' | 'ledger' | 'quotations'>('ledger');
  
  // Ledger statement state
  const [ledgerData, setLedgerData] = useState<any>({
    openingBalance: 0,
    closingBalance: 0,
    transactions: [],
    total: 0
  });
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');

  // Receive Payment Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other'>('UPI');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
    fetchSales();
    if (id) {
      fetchPayments({ customerId: id });
      fetchQuotations({ customerId: id });
      loadLedgerStatement();
    }
  }, [id, fromFilter, toFilter]);

  const customer = customers.find(c => c.id === id);

  const loadLedgerStatement = async () => {
    if (!id) return;
    setLedgerLoading(true);
    try {
      const res = await customerLedgerApi.getLedger(id, {
        from: fromFilter || undefined,
        to: toFilter || undefined
      });
      setLedgerData(res.data);
    } catch (err: any) {
      console.error('Failed to load ledger statement:', err);
    } finally {
      setLedgerLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-700">Customer Not Found</h3>
        <p className="text-sm text-gray-500 max-w-sm">The customer card you are looking for does not exist or has been deleted.</p>
        <Link to="/customers" className="inline-flex items-center text-xs text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
        </Link>
      </div>
    );
  }

  // Filter sales for this customer
  const customerSales = sales.filter(
    s => s.customerId === customer.id && s.status === 'Active'
  );

  const totalValue = customerSales.reduce((sum, s) => sum + s.total, 0);
  const totalReceived = customerSales.reduce((sum, s) => sum + s.amountReceived, 0);
  const pendingReceivables = Number(customerSales.reduce((sum, s) => sum + s.pendingAmount, 0).toFixed(2));

  // Find sales that are unpaid/partially paid for payment allocation
  const unpaidSales = customerSales.filter(s => s.pendingAmount > 0);

  const handleOpenPaymentModal = () => {
    if (unpaidSales.length > 0) {
      setSelectedSaleId(unpaidSales[0].id);
      setPayAmount(unpaidSales[0].pendingAmount.toString());
    } else {
      setSelectedSaleId('');
      setPayAmount('');
    }
    setPayMethod('UPI');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayRef('');
    setPayNotes('');
    setPaymentError(null);
    setPaymentModalOpen(true);
  };

  const handleSaleSelectChange = (saleId: string) => {
    setSelectedSaleId(saleId);
    const sale = unpaidSales.find(s => s.id === saleId);
    if (sale) {
      setPayAmount(sale.pendingAmount.toString());
    } else {
      setPayAmount('');
    }
  };

  const handleReceivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleId) {
      setPaymentError('Please select a sale to allocate the payment.');
      return;
    }
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }

    const sale = unpaidSales.find(s => s.id === selectedSaleId);
    if (!sale) {
      setPaymentError('Invalid sale selection.');
      return;
    }

    if (amt > sale.pendingAmount) {
      setPaymentError(`Amount exceeds outstanding balance. Maximum payment allowed is ₹${sale.pendingAmount}.`);
      return;
    }

    setSavingPayment(true);
    setPaymentError(null);
    try {
      await addPayment({
        saleId: selectedSaleId,
        amount: amt,
        paymentMethod: payMethod,
        paymentDate: payDate,
        referenceNumber: payRef || undefined,
        notes: payNotes || undefined
      });
      setPaymentModalOpen(false);
      // Reload lists
      fetchSales();
      if (id) {
        fetchPayments({ customerId: id });
        loadLedgerStatement();
      }
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || err.message || 'Failed to record payment.');
    } finally {
      setSavingPayment(false);
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  // Filter payments for this customer from store
  const customerPayments = payments.filter(p => p.customerId === customer.id);
  const customerQuotations = quotations.filter(q => q.customerId === customer.id);

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      {/* Back button (hide during printing) */}
      <div className="print:hidden">
        <Link to="/customers" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
        </Link>
      </div>

      {/* Profile Info Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm print:border-none print:shadow-none print:bg-transparent print:p-0">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900 print:text-gray-900">{customer.name}</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border print:hidden ${
              customer.isActive 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              {customer.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 print:text-gray-600">
            <div className="flex items-center space-x-1.5">
              <Phone className="h-4 w-4 text-gray-400 print:text-gray-500" />
              <span className="font-mono">{customer.phone}</span>
            </div>
            {customer.email && (
              <div className="flex items-center space-x-1.5">
                <Mail className="h-4 w-4 text-gray-400 print:text-gray-500" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.gstNumber && (
              <div className="flex items-center space-x-1.5">
                <FileText className="h-4 w-4 text-gray-400 print:text-gray-500" />
                <span className="font-mono">GSTIN: {customer.gstNumber}</span>
              </div>
            )}
          </div>

          {customer.address && (
            <div className="flex items-start space-x-1.5 text-sm text-gray-500 max-w-xl print:text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5 print:text-gray-500" />
              <span>{customer.address}</span>
            </div>
          )}
        </div>

        {/* Payment Receive actions (hide during printing) */}
        {customer.isActive && (
          <div className="flex items-center space-x-3 print:hidden">
            {pendingReceivables > 0 ? (
              <button
                onClick={handleOpenPaymentModal}
                className="flex items-center space-x-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                <span>Receive Payment</span>
              </button>
            ) : (
              <span className="text-sm text-gray-500 border border-gray-200 bg-gray-50 px-3 py-2 rounded-lg font-semibold">
                No Pending Receivables
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 shadow-sm print:bg-transparent print:border-gray-300 print:shadow-none">
          <div className="flex items-center justify-between text-gray-500 print:text-gray-500">
            <span className="text-xs font-medium">Sales Orders</span>
            <ShoppingBag className="h-4 w-4 text-blue-600 print:hidden" />
          </div>
          <p className="text-lg font-bold text-gray-900 print:text-gray-900">{customerSales.length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 shadow-sm print:bg-transparent print:border-gray-300 print:shadow-none">
          <div className="flex items-center justify-between text-gray-500 print:text-gray-500">
            <span className="text-xs font-medium">Sales Value</span>
            <DollarSign className="h-4 w-4 text-brand-600 print:hidden" />
          </div>
          <p className="text-lg font-bold text-gray-900 print:text-gray-900">{formatCurrency(totalValue)}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 shadow-sm print:bg-transparent print:border-gray-300 print:shadow-none">
          <div className="flex items-center justify-between text-gray-500 print:text-gray-500">
            <span className="text-xs font-medium">Amount Received</span>
            <TrendingUp className="h-4 w-4 text-emerald-600 print:hidden" />
          </div>
          <p className="text-lg font-bold text-gray-900 print:text-gray-900">{formatCurrency(totalReceived)}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 shadow-sm print:bg-transparent print:border-gray-300 print:shadow-none">
          <div className="flex items-center justify-between text-gray-500 print:text-gray-500">
            <span className="text-xs font-medium">Pending Receivables</span>
            <Clock className="h-4 w-4 text-red-600 print:hidden" />
          </div>
          <p className="text-lg font-bold text-red-600 print:text-red-600">{formatCurrency(pendingReceivables)}</p>
        </div>
      </div>

      {/* Tabs panels */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm print:bg-transparent print:border-none print:shadow-none">
        <div className="flex justify-between items-center border-b border-gray-200 print:hidden">
          <div className="flex">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'ledger' 
                  ? 'border-brand-500 text-brand-700 bg-brand-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Account Ledger Statement
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'sales' 
                  ? 'border-brand-500 text-brand-700 bg-brand-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Sales Vouchers ({customerSales.length})
            </button>
             <button
              onClick={() => setActiveTab('payments')}
              className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'payments' 
                  ? 'border-brand-500 text-brand-700 bg-brand-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Receipts History ({customerPayments.length})
            </button>
            <button
              onClick={() => setActiveTab('quotations')}
              className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'quotations' 
                  ? 'border-brand-500 text-brand-700 bg-brand-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Quotations ({customerQuotations.length})
            </button>
          </div>

          {activeTab === 'ledger' && (
            <button
              onClick={handlePrintStatement}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium mr-4 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Statement</span>
            </button>
          )}
        </div>

        <div className="p-0 print:p-0">
          {activeTab === 'ledger' && (
            <div className="space-y-0 p-4">
              {/* Filter controls (hide during printing) */}
              <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 print:hidden text-sm mb-4">
                <span className="text-gray-700 font-semibold">Statement Period:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={fromFilter}
                    onChange={(e) => setFromFilter(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <span className="text-gray-500 font-medium">to</span>
                  <input
                    type="date"
                    value={toFilter}
                    onChange={(e) => setToFilter(e.target.value)}
                    className="bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                {(fromFilter || toFilter) && (
                  <button
                    onClick={() => { setFromFilter(''); setToFilter(''); }}
                    className="text-brand-600 hover:text-brand-700 font-medium underline"
                  >
                    Clear Period
                  </button>
                )}
              </div>

              {ledgerLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">Compiling transaction ledger...</div>
              ) : (
                <div className="space-y-4">
                  {/* Ledger print header */}
                  <div className="hidden print:block border-b border-gray-300 pb-2 mb-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Customer Account Statement</h3>
                    <div className="grid grid-cols-2 text-[10px] text-gray-500 mt-2">
                      <div>
                        <p><strong>Customer:</strong> {customer.name}</p>
                        <p><strong>Phone:</strong> {customer.phone}</p>
                      </div>
                      <div className="text-right">
                        <p><strong>Date Range:</strong> {fromFilter && toFilter ? `${fromFilter} to ${toFilter}` : 'All Records'}</p>
                        <p><strong>Generated At:</strong> {new Date().toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary balances block */}
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 print:bg-transparent print:border-gray-300 print:py-2">
                    <div className="text-sm">
                      <span className="text-gray-500 print:text-gray-500 block">Opening Period Balance:</span>
                      <span className="font-semibold text-gray-900 print:text-gray-900 font-mono">{formatCurrency(ledgerData.openingBalance)}</span>
                    </div>
                    <div className="text-sm text-right">
                      <span className="text-gray-500 print:text-gray-500 block">Closing Period Balance:</span>
                      <span className="font-bold text-gray-900 print:text-gray-900 font-mono text-base">{formatCurrency(ledgerData.closingBalance)}</span>
                    </div>
                  </div>

                  {ledgerData.transactions.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-500">No account ledger entries found in this period.</div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-left border-collapse print:text-[10px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider print:border-gray-400 print:text-gray-600">
                            <th className="py-3 px-4">Transaction Date</th>
                            <th className="py-3 px-4">Reference No</th>
                            <th className="py-3 px-4">Description</th>
                            <th className="py-3 px-4 text-right">Debit (+)</th>
                            <th className="py-3 px-4 text-right">Credit (-)</th>
                            <th className="py-3 px-4 text-right">Running Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 print:divide-gray-300">
                          {ledgerData.transactions.map((t: any, index: number) => (
                            <tr key={index} className="bg-white hover:bg-gray-50 text-gray-700 print:text-gray-900 transition-colors">
                              <td className="py-3 px-4 font-mono text-sm">{formatDate(t.date)}</td>
                              <td className="py-3 px-4 font-mono text-sm font-semibold text-gray-800 print:text-gray-900">
                                {t.referenceNumber.startsWith('SAL-') ? (
                                  <Link to={`/sales/${t.referenceId}`} className="hover:underline text-brand-600 print:text-gray-900 font-bold">{t.referenceNumber}</Link>
                                ) : (
                                  <Link to={`/payments/${t.referenceId}`} className="hover:underline text-blue-600 print:text-gray-900 font-bold">{t.referenceNumber}</Link>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-700 print:text-gray-600">{t.description}</td>
                              <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-gray-900 print:text-gray-900">
                                {t.debit > 0 ? formatCurrency(t.debit) : '—'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-gray-900 print:text-gray-900">
                                {t.credit > 0 ? formatCurrency(t.credit) : '—'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-sm font-bold text-gray-900 print:text-gray-900">
                                {formatCurrency(t.balanceAfter)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            customerSales.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No sale vouchers found for this customer.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3.5">Sale No</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Items Description</th>
                      <th className="px-4 py-3.5 text-right">Invoice Total</th>
                      <th className="px-4 py-3.5 text-right">Amt Received</th>
                      <th className="px-4 py-3.5 text-right">Pending Balance</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customerSales.map(s => {
                      let itemsSummary = '';
                      if (s.items.length === 1) {
                        itemsSummary = `${s.items[0].productNameSnapshot} (${s.items[0].variantNameSnapshot})`;
                      } else {
                        itemsSummary = `Multiple Items (${s.items.length} specifications)`;
                      }

                      return (
                        <tr key={s.id} className="bg-white hover:bg-gray-50 text-gray-700 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-sm text-brand-600 hover:underline">
                            <Link to={`/sales/${s.id}`}>{s.saleNumber}</Link>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-sm">{formatDate(s.saleDate)}</td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-gray-800">{itemsSummary}</td>
                          <td className="px-4 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(s.total)}</td>
                          <td className="px-4 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(s.amountReceived)}</td>
                          <td className={`px-4 py-3.5 text-right font-mono font-semibold ${s.pendingAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {s.pendingAmount > 0 ? formatCurrency(s.pendingAmount) : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-center text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              s.paymentStatus === 'Paid' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : s.paymentStatus === 'Partially Paid'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-600 border-red-200'
                            }`}>
                              {s.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm">
                            <Link to={`/sales/${s.id}`} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg inline-block transition-colors">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === 'payments' && (
            customerPayments.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No payment receipts registered.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3.5">Receipt Voucher</th>
                      <th className="px-4 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Method</th>
                      <th className="px-4 py-3.5">Transaction Ref</th>
                      <th className="px-4 py-3.5 text-right">Amount Received</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customerPayments.map(p => (
                      <tr key={p.id} className={`bg-white hover:bg-gray-50 text-gray-700 transition-colors ${p.status === 'Reversed' ? 'opacity-65 line-through' : ''}`}>
                        <td className="px-4 py-3.5 font-mono text-sm text-brand-600 hover:underline">
                          <Link to={`/payments/${p.id}`}>{p.paymentNumber}</Link>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-sm">{formatDate(p.paymentDate)}</td>
                        <td className="px-4 py-3.5 text-sm">
                          <span className="bg-gray-100 border border-gray-200 px-2 py-1 rounded-md text-xs text-gray-700 font-medium">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-sm text-gray-500">
                          {p.referenceNumber || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-4 py-3.5 text-center text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            p.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm">
                          <Link to={`/payments/${p.id}`} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg inline-block transition-colors">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === 'quotations' && (
            customerQuotations.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No proposals or quotations generated.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-4 py-3.5">Quotation No</th>
                      <th className="px-4 py-3.5">Quote Date</th>
                      <th className="px-4 py-3.5">Valid Until</th>
                      <th className="px-4 py-3.5 text-right">Proposed Total</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customerQuotations.map(q => (
                      <tr key={q.id} className="bg-white hover:bg-gray-50 text-gray-700 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-sm text-brand-600 hover:underline">
                          <Link to={`/quotations/${q.id}`}>{q.quotationNumber}</Link>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-sm">{formatDate(q.quotationDate)}</td>
                        <td className="px-4 py-3.5 font-mono text-sm text-red-600 font-semibold">{formatDate(q.expiryDate)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-900">
                          {formatCurrency(q.total)}
                        </td>
                        <td className="px-4 py-3.5 text-center text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            q.status === 'CONVERTED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : q.status === 'EXPIRED'
                                ? 'bg-gray-100 text-gray-500 border-gray-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm">
                          <Link to={`/quotations/${q.id}`} className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg inline-block transition-colors">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {/* Receive Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-brand-600">
                <DollarSign className="h-5 w-5" />
                <h3 className="text-base font-bold text-gray-900">Receive Customer Payment</h3>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-semibold transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReceivePaymentSubmit} className="space-y-4 text-sm text-gray-700">
              <div className="space-y-1.5">
                <label className="block text-gray-700 font-medium">Allocate to Outstanding Invoice:</label>
                <select
                  value={selectedSaleId}
                  onChange={(e) => handleSaleSelectChange(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  required
                >
                  <option value="" disabled>-- Select Unpaid Sale Voucher --</option>
                  {unpaidSales.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.saleNumber} - Outstanding: {formatCurrency(s.pendingAmount)} (Total: {formatCurrency(s.total)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedSaleId && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-gray-700 font-medium">Payment Amount (₹):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={unpaidSales.find(s => s.id === selectedSaleId)?.pendingAmount}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      required
                    />
                    <span className="text-xs text-gray-500 block mt-1">
                      * Maximum allowed: {formatCurrency(unpaidSales.find(s => s.id === selectedSaleId)?.pendingAmount || 0)}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-700 font-medium">Payment Date:</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-gray-700 font-medium">Payment Method:</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    required
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-700 font-medium">UTR/Reference ID:</label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. UTR12345678"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-700 font-medium">Notes / Remarks:</label>
                <textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Payment allocation comments..."
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                  rows={2}
                />
              </div>

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 font-medium flex items-start space-x-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  disabled={savingPayment}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayment || !selectedSaleId}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-700 text-white rounded-lg font-semibold shadow-sm transition-colors disabled:opacity-40"
                >
                  {savingPayment ? 'Processing Payment...' : 'Record Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
