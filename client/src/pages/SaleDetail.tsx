import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Printer, History, XSquare, AlertTriangle, Info, FileText, CheckCircle2, RefreshCw, DollarSign, CreditCard, ShieldAlert 
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate } from '../utils';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const SaleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    sales, cancelSale, stockMovements, fetchSales, fetchStockHistory, payments, fetchPayments, addPayment, isLoading,
    addInvoice, getInvoiceBySaleIdStore, showToast
  } = useInventoryStore();

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Associated Invoice states
  const [associatedInvoice, setAssociatedInvoice] = useState<any | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Receive Payment modal state for this specific sale
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other'>('UPI');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const checkInvoice = async () => {
    if (!id) return;
    try {
      const inv = await getInvoiceBySaleIdStore(id);
      setAssociatedInvoice(inv);
    } catch (err) {
      setAssociatedInvoice(null);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchStockHistory();
    if (id) {
      fetchPayments({ saleId: id });
      checkInvoice();
    }
  }, [id]);

  const sale = sales.find((s) => s.id === id);

  if (!sale) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-900">Sales Invoice Not Found</h3>
        <p className="text-sm text-gray-500 max-w-sm">The sales record you are looking for does not exist or has been deleted.</p>
        <Link to="/sales" className="inline-flex items-center text-sm font-medium text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sales
        </Link>
      </div>
    );
  }

  const isCancelled = sale.status === 'Cancelled';

  // Filter stock movements matching this sale's invoice
  const relatedMovements = stockMovements.filter(m => 
    String(m.referenceId) === String(sale.id) || m.referenceNumber === sale.saleNumber
  );

  // Filter payments matching this sale
  const salePayments = payments.filter(p => p.saleId === sale.id);

  const handleCancelClick = () => {
    setConfirmCancelOpen(true);
  };

  const handleCancelConfirm = async () => {
    setCancelling(true);
    try {
      await cancelSale(sale.id);
      await fetchStockHistory();
      await fetchSales();
      if (id) {
        await fetchPayments({ saleId: id });
      }
      showToast('Sale cancelled successfully. Stock levels restored.', 'success');
      setConfirmCancelOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel sale.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenPaymentModal = () => {
    setPayAmount(sale.pendingAmount.toString());
    setPayMethod('UPI');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayRef('');
    setPayNotes('');
    setPaymentError(null);
    setPaymentModalOpen(true);
  };

  const handleReceivePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
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
        saleId: sale.id,
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
        fetchPayments({ saleId: id });
      }
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || err.message || 'Failed to record payment.');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!id || loadingInvoice) return;
    setLoadingInvoice(true);
    try {
      const inv = await addInvoice(id);
      setAssociatedInvoice(inv);
      showToast('Invoice generated successfully.', 'success');
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.data) {
        setAssociatedInvoice(err.response.data.data);
      } else {
        showToast(err.response?.data?.message || err.message || 'Failed to generate invoice.', 'error');
      }
    } finally {
      setLoadingInvoice(false);
    }
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Back and Action bar (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <Link to="/sales" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Sales
        </Link>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </button>

          {!isCancelled && (
            <>
              {associatedInvoice ? (
                <Link
                  to={`/invoices/${associatedInvoice.id}`}
                  className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors shadow-sm"
                >
                  <FileText className="h-4 w-4" />
                  <span>View Tax Invoice</span>
                </Link>
              ) : (
                <button
                  onClick={handleGenerateInvoice}
                  disabled={loadingInvoice}
                  className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  <span>{loadingInvoice ? 'Generating...' : 'Generate Tax Invoice'}</span>
                </button>
              )}

              <button
                onClick={handleCancelClick}
                disabled={cancelling}
                className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <XSquare className="h-4 w-4" />
                <span>{cancelling ? 'Cancelling...' : 'Cancel Sale'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Printable Invoice Header */}
      <div className="hidden print:block border-b border-gray-200 pb-3 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-base font-bold text-gray-900 uppercase">Tax Invoice Order</h2>
            <p className="text-xs text-gray-600 font-mono mt-1">Voucher #: {sale.saleNumber}</p>
          </div>
          <div className="text-right text-xs text-gray-700">
            <p><strong>Date:</strong> {formatDate(sale.saleDate)}</p>
            <p><strong>Status:</strong> {sale.status}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-1">
        {/* Left Column: Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Header */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm print:bg-transparent print:border-none print:p-0">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 print:hidden">
              <div className="space-y-1">
                <span className="text-xs text-brand-600 font-bold uppercase tracking-wider">Sale Invoice Voucher</span>
                <h2 className="text-xl font-bold text-gray-900 font-mono">{sale.saleNumber}</h2>
              </div>
              <div className="flex flex-col items-end space-y-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${
                  isCancelled 
                    ? 'bg-red-50 text-red-600 border-red-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {sale.status}
                </span>
                <span className="text-sm text-gray-500 font-mono">{formatDate(sale.saleDate)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm print:grid-cols-3 print:text-xs print:text-gray-800">
              <div className="space-y-1">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-xs block print:text-gray-600">Customer</span>
                <span className="text-gray-900 font-medium print:text-black">{sale.customerNameSnapshot}</span>
                {sale.customerPhoneSnapshot && (
                  <span className="text-gray-500 block font-mono print:text-gray-700">{sale.customerPhoneSnapshot}</span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-xs block print:text-gray-600">Sales Channel</span>
                <span className="text-gray-900 font-medium print:text-black">{sale.saleChannel}</span>
              </div>

              <div className="space-y-1">
                <span className="text-gray-500 font-semibold uppercase tracking-wider text-xs block print:text-gray-600">Payment Status Cache</span>
                <span className="text-gray-900 font-medium print:text-black">{sale.paymentStatus}</span>
              </div>

              {sale.sourceQuotationId && (
                <div className="space-y-1">
                  <span className="text-gray-500 font-semibold uppercase tracking-wider text-xs block print:text-gray-600">Source Quotation</span>
                  <Link 
                    to={`/quotations/${sale.sourceQuotationId}`} 
                    className="text-brand-600 font-medium hover:underline print:text-brand-800"
                  >
                    {sale.sourceQuotationNumber || 'View Quotation'}
                  </Link>
                </div>
              )}
            </div>

            {sale.notes && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-700 italic print:text-gray-800 print:bg-transparent print:border-gray-300">
                Notes: {sale.notes}
              </div>
            )}
          </div>

          {/* Items breakdown list */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm print:bg-transparent print:border-none">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 print:bg-transparent print:p-0 print:border-b-2 print:border-gray-800 print:mb-2">
              <h3 className="text-sm font-semibold text-gray-900 print:text-lg">
                Billing Specification Items
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse print:text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 font-semibold text-xs tracking-wider uppercase bg-white print:border-gray-300 print:text-gray-800">
                    <th className="px-6 py-3.5 print:px-0">Product Detail</th>
                    <th className="px-6 py-3.5 font-mono text-center print:px-2">SKU</th>
                    <th className="px-6 py-3.5 text-right print:px-2">Qty</th>
                    <th className="px-6 py-3.5 text-right font-mono print:px-2">Unit Price</th>
                    <th className="px-6 py-3.5 text-right font-mono print:px-2">Discount</th>
                    <th className="px-6 py-3.5 text-right font-mono print:px-2">Tax (GST)</th>
                    <th className="px-6 py-3.5 text-right font-mono border-l border-gray-100 print:px-0 print:border-l-0">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 print:divide-gray-200 print:text-black">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 print:px-0 print:py-2">
                        <div className="font-medium text-gray-900 print:text-black">{item.productNameSnapshot}</div>
                        <div className="text-xs text-gray-500 print:text-gray-700">{item.variantNameSnapshot}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-center text-gray-500 print:px-2 print:py-2 print:text-gray-800">{item.skuSnapshot}</td>
                      <td className="px-6 py-4 text-right font-medium print:px-2 print:py-2">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-mono print:px-2 print:py-2">{formatCurrency(item.sellingPrice)}</td>
                      <td className="px-6 py-4 text-right font-mono text-red-600 print:px-2 print:py-2 print:text-red-700">-{formatCurrency(item.discount)}</td>
                      <td className="px-6 py-4 text-right font-mono text-brand-600 print:px-2 print:py-2 print:text-brand-700">+{formatCurrency(item.tax)}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono border-l border-gray-100 print:px-0 print:border-l-0 print:py-2 print:text-black">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Invoice Summaries & Stock Impact */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm print:bg-transparent print:border-none print:p-0 print:shadow-none">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 print:text-gray-900 print:border-gray-300">
              Invoice Summary
            </h3>

            <div className="space-y-4 text-sm text-gray-600 print:text-xs print:text-gray-900">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 print:text-gray-800">Material Cost Subtotal:</span>
                <span className="font-mono">{formatCurrency(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-red-600 print:text-red-700 font-medium">
                <span>Total discount:</span>
                <span className="font-mono">-{formatCurrency(sale.totalDiscount)}</span>
              </div>
              <div className="flex justify-between items-center text-brand-600 print:text-gray-900">
                <span>Total taxes (GST):</span>
                <span className="font-mono">+{formatCurrency(sale.totalTax)}</span>
              </div>
              <div className="h-px bg-gray-200 print:bg-gray-300" />
              <div className="flex justify-between items-center text-base font-bold text-gray-900 print:text-black print:text-sm">
                <span>Invoice Grand Total:</span>
                <span className="font-mono text-brand-600 print:text-black">{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-600 print:text-gray-800 pt-2 font-semibold">
                <span>Amount Received:</span>
                <span className="font-mono font-bold">{formatCurrency(sale.amountReceived)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-700 print:text-gray-900 font-semibold">
                <span>Remaining Pending Balance:</span>
                <span className={`font-mono font-bold ${sale.pendingAmount > 0 ? 'text-red-600 print:text-red-700' : 'text-gray-500'}`}>
                  {formatCurrency(sale.pendingAmount)}
                </span>
              </div>
            </div>

            {/* Receive Payment Modal trigger */}
            {sale.status === 'Active' && sale.pendingAmount > 0 && (
              <button
                onClick={handleOpenPaymentModal}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors print:hidden"
              >
                <DollarSign className="h-4.5 w-4.5" />
                <span>Receive Payment</span>
              </button>
            )}
          </div>

          {/* Payment Receipts History List */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm print:bg-transparent print:border-none print:p-0 print:shadow-none">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 print:text-gray-900 print:border-gray-300">
              Receipt Vouchers List
            </h3>

            {salePayments.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">
                No payments have been received against this invoice.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 print:divide-gray-200 space-y-3">
                {salePayments.map((p) => (
                  <div key={p.id} className={`pt-3 flex justify-between items-start text-sm ${p.status === 'Reversed' ? 'opacity-50 line-through' : ''}`}>
                    <div>
                      <Link to={`/payments/${p.id}`} className="font-mono font-bold text-brand-600 hover:underline block print:text-gray-900">
                        {p.paymentNumber}
                      </Link>
                      <span className="text-xs text-gray-500 block font-mono mt-0.5">{formatDate(p.paymentDate)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-semibold text-gray-900 block print:text-black">
                        {formatCurrency(p.amount)}
                      </span>
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1 font-medium print:hidden">
                        {p.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real Inventory stock impact ledger log */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm print:hidden">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-3 text-gray-900">
              <History className="h-5 w-5 text-gray-400" />
              <h3 className="text-sm font-semibold">Stock Ledger Impacts</h3>
            </div>

            {relatedMovements.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                No ledger movements recorded for this invoice yet.
              </div>
            ) : (
              <div className="space-y-4">
                {relatedMovements.map((move, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 font-mono text-xs">
                        {move.variantName || 'Spec Variant'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        move.transactionType === 'SALE' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {move.transactionType}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs text-center">
                      <div className="bg-white border border-gray-200 p-2 rounded-lg space-y-1 shadow-sm">
                        <span className="text-gray-500 block">Stock Before</span>
                        <span className="font-mono font-semibold text-gray-700">
                          {move.balanceAfter - move.quantityChange}
                        </span>
                      </div>
                      <div className="bg-white border border-gray-200 p-2 rounded-lg space-y-1 shadow-sm">
                        <span className="text-gray-500 block">Change Log</span>
                        <span className={`font-mono font-bold ${move.quantityChange < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {move.quantityChange > 0 ? `+${move.quantityChange}` : move.quantityChange}
                        </span>
                      </div>
                      <div className="bg-white border border-gray-200 p-2 rounded-lg space-y-1 shadow-sm">
                        <span className="text-gray-500 block">Stock After</span>
                        <span className="font-mono font-semibold text-gray-700">
                          {move.balanceAfter}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receive Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center space-x-2 text-brand-600">
                <DollarSign className="h-5 w-5" />
                <h3 className="text-lg font-bold text-gray-900">Receive Invoice Payment</h3>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReceivePaymentSubmit} className="space-y-5 text-sm text-gray-700">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Invoice Reference:</span>
                  <span className="font-mono font-bold text-gray-900">{sale.saleNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Outstanding Balance:</span>
                  <span className="font-mono font-bold text-red-600 text-base">{formatCurrency(sale.pendingAmount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-gray-700 font-semibold">Payment Amount (₹):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={sale.pendingAmount}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    required
                  />
                  <span className="text-xs text-gray-500">
                    * Maximum allowed: {formatCurrency(sale.pendingAmount)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-700 font-semibold">Payment Date:</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-gray-700 font-semibold">Payment Method:</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
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
                  <label className="block text-gray-700 font-semibold">UTR/Reference ID (Optional):</label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. UTR12345678"
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-700 font-semibold">Notes / Remarks:</label>
                <textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Payment remarks..."
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                  rows={3}
                />
              </div>

              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 font-semibold flex items-start space-x-2">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  disabled={savingPayment}
                  className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold shadow-sm transition-colors flex items-center"
                >
                  {savingPayment ? 'Processing...' : 'Record Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
