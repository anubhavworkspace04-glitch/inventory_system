import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, ClipboardCheck, ShoppingCart, AlertTriangle, CheckCircle, Edit, Trash2, Copy 
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate, getImageUrl } from '../utils';
import { quotationApi } from '../api/services';

export const QuotationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { 
    products, fetchProducts, settings, fetchSettings, acceptQuotation, rejectQuotation, cancelQuotation, 
    duplicateQuotation, convertQuotationToSale 
  } = useInventoryStore();

  const [quotation, setQuotation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Conversion Modal states
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other'>('UPI');
  const [saleChannel, setSaleChannel] = useState<'Online' | 'Offline'>('Offline');
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Stock checks array
  const [stockStatus, setStockStatus] = useState<{
    productName: string;
    variantName: string;
    requested: number;
    available: number;
    isSufficient: boolean;
  }[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchSettings();
    loadQuotation();
  }, [id]);

  const loadQuotation = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await quotationApi.getById(id);
      setQuotation(res.data);
      evaluateStockAvailability(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to fetch quotation details.');
    } finally {
      setLoading(false);
    }
  };

  const evaluateStockAvailability = (quote: any) => {
    if (!quote) return;
    const checks = quote.items.map((item: any) => {
      const prod = products.find(p => p.id === item.productId);
      const variant = prod?.variants.find(v => v.id === item.variantId);
      const available = variant?.cachedStock || 0;
      return {
        productName: item.productNameSnapshot,
        variantName: item.variantNameSnapshot,
        requested: item.quantity,
        available,
        isSufficient: available >= item.quantity
      };
    });
    setStockStatus(checks);
  };

  // Run stock checks whenever catalog items list updates
  useEffect(() => {
    if (quotation) {
      evaluateStockAvailability(quotation);
    }
  }, [products]);

  const handleStatusChange = async (action: 'accept' | 'reject' | 'cancel') => {
    if (!id) return;
    setSubmitting(true);
    try {
      if (action === 'accept') await acceptQuotation(id);
      else if (action === 'reject') await rejectQuotation(id);
      else if (action === 'cancel') await cancelQuotation(id);
      await loadQuotation();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update quotation status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await duplicateQuotation(id);
      // Wait a brief moment and fetch quotations lists
      navigate('/quotations');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to duplicate quotation.');
      setSubmitting(false);
    }
  };

  const handleOpenConvert = () => {
    setConversionError(null);
    setConvertModalOpen(true);
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Verify stock checks pass
    const isAnyStockDeficit = stockStatus.some(c => !c.isSufficient);
    if (isAnyStockDeficit) {
      setConversionError('Cannot convert quotation. Some items have insufficient stock.');
      return;
    }

    setSubmitting(true);
    setConversionError(null);

    try {
      await convertQuotationToSale(id, {
        saleChannel,
        paymentMethod: payMethod
      });
      setConvertModalOpen(false);
      navigate('/sales');
    } catch (err: any) {
      setConversionError(err.response?.data?.message || err.message || 'Failed to convert quotation to sale.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-xs text-gray-500 shadow-sm">
        Loading quotation details...
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
        <h3 className="text-lg font-bold text-red-600">Quotation Not Found</h3>
        <p className="text-sm text-gray-500 mt-2">The quotation record you are looking for does not exist.</p>
        <Link to="/quotations" className="mt-4 inline-flex items-center text-xs font-semibold text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Quotations
        </Link>
      </div>
    );
  }

  const isDRAFT = quotation.status === 'DRAFT';
  const isSENT = quotation.status === 'SENT';
  const isACCEPTED = quotation.status === 'ACCEPTED';
  const isCONVERTED = quotation.status === 'CONVERTED';
  const isCANCELLED = quotation.status === 'CANCELLED';
  const isEXPIRED = quotation.status === 'EXPIRED';

  const isStockDeficit = stockStatus.some(c => !c.isSufficient);

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
      {/* Action Header controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden text-xs">
        <Link to="/quotations" className="flex items-center text-gray-500 hover:text-gray-900 font-medium">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Price Quotations
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Printable style toggle */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print Quotation</span>
          </button>

          {/* Edit button */}
          {(isDRAFT || isSENT || isACCEPTED) && (
            <Link
              to={`/quotations/${quotation.id}/edit`}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-medium transition-colors shadow-sm"
            >
              <Edit className="h-4 w-4 text-brand-600" />
              <span>Edit</span>
            </Link>
          )}

          {/* Duplicate button */}
          <button
            onClick={handleDuplicate}
            disabled={submitting}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Copy className="h-4 w-4 text-indigo-600" />
            <span>{submitting ? 'Duplicating...' : 'Duplicate'}</span>
          </button>

          {/* Accept / Reject */}
          {(isDRAFT || isSENT) && (
            <>
              <button
                onClick={() => handleStatusChange('accept')}
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Accept
              </button>
              <button
                onClick={() => handleStatusChange('reject')}
                disabled={submitting}
                className="px-4 py-2 bg-white hover:bg-red-50 border border-red-200 text-red-600 rounded-lg font-medium shadow-sm transition-colors"
              >
                Reject
              </button>
            </>
          )}

          {/* Cancel */}
          {(isDRAFT || isSENT || isACCEPTED) && (
            <button
              onClick={() => handleStatusChange('cancel')}
              disabled={submitting}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-medium shadow-sm transition-colors"
            >
              Cancel
            </button>
          )}

          {/* Convert to Sale */}
          {(isSENT || isACCEPTED) && (
            <button
              onClick={handleOpenConvert}
              disabled={submitting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Convert to Sale Bill</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold flex items-center space-x-2 text-sm print:hidden">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quotation printable sheet */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-4xl mx-auto shadow-sm space-y-6 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:mx-0 print:space-y-4 printable-document">
        
        {/* Document Header */}
        <div className="flex flex-row justify-between items-start gap-4 border-b border-gray-200 pb-6 print:border-gray-300 print:pb-4">
          <div className="flex items-start space-x-3.5">
            {settings?.logo ? (
              <img
                src={getImageUrl(settings.logo)}
                alt="Business Logo"
                className="h-12 w-12 object-contain rounded-lg border border-gray-200 print:border-gray-300"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="h-12 w-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center print:bg-gray-100 print:border-gray-300">
                <ClipboardCheck className="h-6 w-6 text-brand-600 print:text-gray-700" />
              </div>
            )}
            <div className="space-y-0.5">
              <h1 className="text-base font-bold tracking-wide text-gray-900 print:text-black print:text-lg uppercase">
                {settings?.businessName || 'GG GLASSWARE CO.'}
              </h1>
              <p className="text-xs text-gray-500 print:text-gray-700 print:text-xs max-w-xs leading-relaxed">
                {settings?.address || 'Infront of Balveer Cold Araon Road Sirsaganj, Firozabad, UP, 283151'}
              </p>
              <p className="text-xs text-gray-500 print:text-gray-700 print:text-xs font-mono">
                GSTIN: {settings?.gstin || '09CBNPG5284Q1ZP'}
              </p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <h2 className="text-2xl font-bold text-gray-800 print:text-black print:text-2xl uppercase tracking-wider">ESTIMATE QUOTATION</h2>
            <p className="text-xs font-mono text-brand-600 print:text-black print:text-sm font-bold">
              Quote No: {quotation.quotationNumber}
            </p>
            <p className="text-xs text-gray-500 print:text-gray-700 print:text-xs font-mono">Date: {formatDate(quotation.quotationDate)}</p>
            <p className="text-xs font-semibold text-red-600 print:text-black print:text-xs font-mono">Valid Until: {formatDate(quotation.expiryDate)}</p>
          </div>
        </div>

        {/* Banners */}
        {isCONVERTED && (
          <div className="p-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm flex items-center space-x-2 print:hidden">
            <CheckCircle className="h-4.5 w-4.5 shrink-0" />
            <div>
              This estimate proposal has been converted to an active Sale Bill invoice. 
              {quotation.convertedSaleId && (
                <Link to={`/sales/${quotation.convertedSaleId}`} className="underline font-bold ml-1.5 hover:text-emerald-800">
                  Open Converted Sale ({quotation.convertedSaleId.slice(-6).toUpperCase()}) →
                </Link>
              )}
            </div>
          </div>
        )}

        {isEXPIRED && (
          <div className="p-3.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm flex items-center space-x-2 print:hidden">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <div>
              This quotation estimate has expired and can no longer be converted to sale. Renew by editing or duplicating it.
            </div>
          </div>
        )}

        {/* Bill to section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-700 print:text-black">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 print:bg-gray-50 print:border-gray-300 print:p-4 print:text-sm">
            <p className="font-semibold text-[10px] print:text-xs text-gray-500 print:text-gray-700 uppercase tracking-wider">Bill To Client:</p>
            <p className="text-sm print:text-base font-bold text-gray-900 print:text-black">{quotation.customerNameSnapshot}</p>
            {quotation.customerPhoneSnapshot && <p className="font-mono text-xs print:text-sm">Contact: {quotation.customerPhoneSnapshot}</p>}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 print:hidden flex flex-col justify-between">
            <div>
              <p className="font-semibold text-[10px] text-gray-500 uppercase tracking-wider">Status & Availability:</p>
              <div className="flex items-center space-x-2 mt-1.5">
                <span>Quotation status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadgeClass(quotation.status)}`}>
                  {quotation.status}
                </span>
              </div>
            </div>
            {isStockDeficit && (
              <div className="text-[10px] text-amber-600 flex items-center space-x-1 pt-1.5 border-t border-gray-200">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>Caution: Some items have insufficient stock.</span>
              </div>
            )}
          </div>
        </div>

        {/* Lines table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden print:border-gray-300">
          <table className="w-full text-xs text-left border-collapse invoice-table">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider print:bg-gray-100 print:border-gray-300 print:text-gray-900 print:text-xs">
                <th className="px-3 py-3 print:py-2.5 print:px-2 w-[5%] text-center whitespace-nowrap">#</th>
                <th className="px-4 py-3 print:py-2.5 print:px-3 w-[39%]">Proposed Material Description</th>
                <th className="px-3 py-3 print:py-2.5 print:px-2 text-right w-[11%] whitespace-nowrap">Quantity</th>
                <th className="px-3 py-3 print:py-2.5 print:px-2 text-right w-[11%] whitespace-nowrap">Rate</th>
                <th className="px-3 py-3 print:py-2.5 print:px-2 text-right w-[11%] whitespace-nowrap">Discount</th>
                <th className="px-3 py-3 print:py-2.5 print:px-2 text-right w-[11%] whitespace-nowrap">GST Tax</th>
                <th className="px-3 py-3 print:py-2.5 print:px-2 text-right w-[12%] whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-gray-300">
              {quotation.items.map((item: any, idx: number) => (
                <tr key={idx} className="text-gray-800 print:text-black">
                  <td className="px-3 py-4 print:py-3 print:px-2 font-mono text-center print:text-xs">{idx + 1}</td>
                  <td className="px-4 py-4 print:py-3 print:px-3 font-semibold print:text-xs">
                    {item.productNameSnapshot}
                    <span className="block font-normal font-mono text-[10px] print:text-xs text-gray-500 print:text-gray-700">{item.variantNameSnapshot} ({item.skuSnapshot})</span>
                  </td>
                  <td className="px-3 py-4 print:py-3 print:px-2 text-right font-mono font-bold text-gray-900 print:text-black print:text-xs">{item.quantity}</td>
                  <td className="px-3 py-4 print:py-3 print:px-2 text-right font-mono print:text-xs">{formatCurrency(item.sellingPrice)}</td>
                  <td className="px-3 py-4 print:py-3 print:px-2 text-right font-mono text-red-600 print:text-black print:text-xs">-{formatCurrency(item.discount)}</td>
                  <td className="px-3 py-4 print:py-3 print:px-2 text-right font-mono text-gray-700 print:text-black print:text-xs">+{formatCurrency(item.tax)}</td>
                  <td className="px-3 py-4 print:py-3 print:px-2 text-right font-mono font-bold text-gray-900 print:text-black print:text-xs">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer summaries */}
        <div className="flex flex-row justify-between items-start gap-6 pt-4 print:pt-2">
          <div className="flex-1 text-xs print:text-xs text-gray-600 print:text-gray-800 space-y-2 max-w-md">
            {quotation.terms && (
              <div>
                <h5 className="font-semibold text-gray-800 print:text-black print:font-bold">Terms & Conditions:</h5>
                <p className="whitespace-pre-line leading-relaxed">{quotation.terms}</p>
              </div>
            )}
            {quotation.notes && (
              <div className="pt-2 border-t border-gray-100 print:border-gray-300">
                <h5 className="font-semibold text-gray-800 print:text-black print:font-bold">Quotation Notes:</h5>
                <p className="leading-relaxed italic">{quotation.notes}</p>
              </div>
            )}
          </div>

          <div className="w-72 md:w-80 shrink-0 bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-xs print:text-sm print:bg-white print:border-gray-300 print:w-80 print:text-black">
            <div className="flex justify-between">
              <span>Gross Subtotal:</span>
              <span className="font-mono font-bold">{formatCurrency(quotation.subtotal)}</span>
            </div>
            <div className="flex justify-between text-red-600 print:text-black">
              <span>Applied Discounts:</span>
              <span className="font-mono font-bold">-{formatCurrency(quotation.totalDiscount)}</span>
            </div>
            <div className="flex justify-between text-gray-700 print:text-black">
              <span>GST Tax Estimate:</span>
              <span className="font-mono font-bold">+{formatCurrency(quotation.totalTax)}</span>
            </div>
            <div className="h-px bg-gray-200 print:bg-gray-400 my-1" />
            <div className="flex justify-between text-sm print:text-base font-bold text-gray-900 print:text-black">
              <span>Grand Total Valuation:</span>
              <span className="font-mono text-emerald-700 print:text-black">{formatCurrency(quotation.total)}</span>
            </div>
          </div>
        </div>

        {/* Signature lines for printed document */}
        <div className="hidden print:flex justify-between items-end pt-14 text-xs print:text-xs">
          <div className="text-center w-44 border-t border-gray-400 pt-2 text-gray-700">
            Customer Acceptance
          </div>
          <div className="text-center w-44 border-t border-gray-400 pt-2 text-gray-900 font-bold">
            Authorized Signatory
          </div>
        </div>

      </div>

      {/* CONVERSION MODAL */}
      {convertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Convert Quotation to Sale Bill</h3>
              <p className="text-sm text-gray-500 mt-1">This will deduct inventory stock and generate a sale record.</p>
            </div>

            <form onSubmit={handleConvertSubmit}>
              <div className="p-5 space-y-4 text-sm">
                
                {/* Stock availability checklist */}
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-800">Stock Availability Checks:</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {stockStatus.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="truncate max-w-xs text-gray-600">{item.productName} ({item.variantName})</span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span>Req: {item.requested}</span>
                          <span>Avail: <strong className={item.isSufficient ? 'text-emerald-600' : 'text-red-600'}>{item.available}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {isStockDeficit && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg font-bold flex items-start space-x-2">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div>
                      Cannot convert quotation! Some variants have insufficient stock. Adjust stock or edit quotation quantities before converting.
                    </div>
                  </div>
                )}

                {conversionError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg font-bold flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{conversionError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-gray-700 font-semibold text-xs uppercase tracking-wide">Sales Channel</label>
                    <select
                      value={saleChannel}
                      onChange={(e) => setSaleChannel(e.target.value as 'Online' | 'Offline')}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="Offline">Offline Counter</option>
                      <option value="Online">Online Store</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-700 font-semibold text-xs uppercase tracking-wide">Payment Mode</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Card">Card</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-xs">
                  <span className="block font-semibold">Default Payment Policy:</span>
                  Amount received will be recorded as **₹0** (Pending balance: **{formatCurrency(quotation.total)}**). Use the Payment Receive tool in Sales history to log receipts.
                </div>
              </div>

              <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setConvertModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStockDeficit || submitting}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-sm transition-colors"
                >
                  {submitting ? 'Converting...' : 'Confirm Convert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
