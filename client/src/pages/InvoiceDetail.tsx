import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Receipt, FileText, Edit3, Check, X } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate, getImageUrl } from '../utils';

const DEFAULT_TERMS = `1. Goods once sold will not be returned or exchanged.
2. Interest @18% p.a. will be charged for delayed payments.`;

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // invoiceId
  const { getInvoiceByIdStore, updateInvoiceStore, settings, fetchSettings, isLoading, showToast } = useInventoryStore();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Terms & Conditions Edit State
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [termsInput, setTermsInput] = useState('');
  const [savingTerms, setSavingTerms] = useState(false);

  useEffect(() => {
    fetchSettings();
    const loadInvoice = async () => {
      if (!id) return;
      setErrorMsg(null);
      try {
        const data = await getInvoiceByIdStore(id);
        setInvoice(data);
        setTermsInput(data.terms || DEFAULT_TERMS);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to fetch invoice details.');
      }
    };
    loadInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (!invoice) return;
    const oldTitle = document.title;
    document.title = `Invoice-${invoice.invoiceNumber}`;
    window.print();
    document.title = oldTitle;
  };

  const handleSaveTerms = async () => {
    if (!invoice) return;
    setSavingTerms(true);
    try {
      const updated = await updateInvoiceStore(invoice.id, { terms: termsInput.trim() });
      setInvoice(updated);
      setIsEditingTerms(false);
      showToast('Terms & Conditions updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to update Terms & Conditions.', 'error');
    } finally {
      setSavingTerms(false);
    }
  };

  if (errorMsg) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-red-600">Error Loading Invoice</h3>
        <p className="text-sm text-gray-500 max-w-sm">{errorMsg}</p>
        <Link to="/invoices" className="inline-flex items-center text-xs text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Invoices
        </Link>
      </div>
    );
  }

  if (isLoading || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  const currentTerms = invoice.terms !== undefined && invoice.terms !== null && invoice.terms !== ''
    ? invoice.terms
    : DEFAULT_TERMS;

  return (
    <div className="space-y-6 print:space-y-0">
      {/* Back and Action bar (Hidden in Print/PDF) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <Link to="/invoices" className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Invoices
          </Link>
          <span className="text-gray-200">|</span>
          <Link to={`/sales/${invoice.saleId}`} className="flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
            <FileText className="h-3.5 w-3.5 mr-1" />
            <span>View Source Sale ({invoice.saleNumber})</span>
          </Link>
          {invoice.quotationId && (
            <>
              <span className="text-gray-200">|</span>
              <Link to={`/quotations/${invoice.quotationId}`} className="flex items-center text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                <Receipt className="h-3.5 w-3.5 mr-1" />
                <span>View Source Quotation ({invoice.quotationNumber})</span>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => {
              setTermsInput(currentTerms);
              setIsEditingTerms(!isEditingTerms);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-sm"
          >
            <Edit3 className="h-3.5 w-3.5 text-brand-600" />
            <span>Edit Terms & Conditions</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-medium bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Invoice</span>
          </button>
          
          <button
            onClick={handleDownloadPdf}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold bg-brand-500 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Terms & Conditions Inline Editor Panel (Hidden in Print/PDF) */}
      {isEditingTerms && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 space-y-3 print:hidden shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center">
              <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit Terms & Conditions
            </h4>
            <button 
              onClick={() => setIsEditingTerms(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-600">
            Modify the Terms & Conditions below. Saved changes will immediately update the preview and the generated PDF invoice.
          </p>
          <textarea
            value={termsInput}
            onChange={(e) => setTermsInput(e.target.value)}
            rows={4}
            placeholder="Enter invoice terms and conditions..."
            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono leading-relaxed"
          />
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => setTermsInput(DEFAULT_TERMS)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSaveTerms}
              disabled={savingTerms}
              className="flex items-center space-x-1 px-3.5 py-1.5 text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-lg shadow-sm disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{savingTerms ? 'Saving...' : 'Save Terms'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Invoice Printable Document Container */}
      <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-4xl mx-auto shadow-sm space-y-6 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:mx-0 print:space-y-4">
        
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5 print:border-gray-300 print:pb-3">
          <div className="flex items-start space-x-3.5">
            {(settings?.logo || invoice.businessLogoSnapshot) ? (
              <img
                src={getImageUrl(settings?.logo || invoice.businessLogoSnapshot)}
                alt="Business Logo"
                className="h-12 w-12 object-contain rounded-lg border border-gray-200 print:border-gray-300"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="h-12 w-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center print:bg-gray-100 print:border-gray-300">
                <Receipt className="h-6 w-6 text-brand-600 print:text-gray-700" />
              </div>
            )}
            <div className="space-y-0.5">
              <h1 className="text-base font-bold tracking-wide text-gray-900 uppercase">
                {settings?.businessName || invoice.businessNameSnapshot || 'GG GLASSWARE CO.'}
              </h1>
              <p className="text-xs text-gray-600 max-w-xs leading-normal">
                {settings?.address || invoice.businessAddressSnapshot || 'Infront of Balveer Cold Araon Road Sirsaganj, Firozabad, UP, 283151'}
              </p>
              <p className="text-xs text-gray-600 font-mono">
                GSTIN: {settings?.gstin || invoice.businessGSTINSnapshot || '09CBNPG5284Q1ZP'}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h2 className="text-xl font-bold text-gray-900 tracking-wider uppercase">TAX INVOICE</h2>
            <p className="text-sm font-mono font-bold text-brand-600 print:text-gray-900 print:text-base">
              Invoice No: {invoice.invoiceNumber}
            </p>
            <p className="text-xs text-gray-600 font-mono print:text-sm font-semibold">
              Date: {formatDate(invoice.invoiceDate)}
            </p>
            <div className="pt-0.5">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                invoice.paymentStatus === 'Paid'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : invoice.paymentStatus === 'Partially Paid'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}>
                {invoice.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery details block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-700">
          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-1.5 print:bg-gray-50 print:border-gray-300">
            <p className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">Bill To (Customer):</p>
            <p className="text-sm font-bold text-gray-900">{invoice.customerNameSnapshot}</p>
            <p className="font-mono text-gray-600">Phone: {invoice.customerPhoneSnapshot || '—'}</p>
            <p className="font-mono font-semibold text-gray-700">
              GSTIN: {invoice.customerGSTINSnapshot && invoice.customerGSTINSnapshot !== 'Not Provided' ? invoice.customerGSTINSnapshot : 'Not Provided'}
            </p>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-1.5 print:bg-gray-50 print:border-gray-300">
            <p className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">Delivery Details:</p>
            <p className="text-xs leading-normal text-gray-800">{invoice.customerAddressSnapshot}</p>
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px] text-gray-600 border-t border-gray-200 mt-1">
              <div>
                <span>Source Sale:</span>
                <span className="font-bold ml-1 text-gray-900">{invoice.saleNumber}</span>
              </div>
              <div>
                <span>Generated At:</span>
                <span className="font-bold ml-1 text-gray-900">{formatDate(invoice.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Item Table — A4 Width Controlled Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden print:border-gray-300">
          <table className="w-full text-xs text-left border-collapse table-fixed invoice-table">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider print:bg-gray-100 print:border-gray-300 text-[11px] print:text-xs">
                <th className="px-2 py-2.5 text-center w-[5%]">Sr.</th>
                <th className="px-3 py-2.5 w-[24%]">Description</th>
                <th className="px-3 py-2.5 w-[22%]">Variant / SKU</th>
                <th className="px-3 py-2.5 text-right w-[11%]">Quantity</th>
                <th className="px-3 py-2.5 text-right w-[11%]">Rate</th>
                <th className="px-3 py-2.5 text-right w-[9%]">Discount</th>
                <th className="px-3 py-2.5 text-right w-[9%]">Tax (GST)</th>
                <th className="px-3 py-2.5 text-right w-[13%]">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white print:divide-gray-200 text-gray-700">
              {invoice.items.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-2 py-3 text-center font-mono text-gray-500 align-top">{idx + 1}</td>
                  <td className="px-3 py-3 font-semibold text-gray-900 align-top break-words">{item.productNameSnapshot}</td>
                  <td className="px-3 py-3 font-mono text-xs text-gray-600 align-top break-words">
                    <div>{item.variantNameSnapshot}</div>
                    <div className="text-[10px] text-gray-400">{item.skuSnapshot}</div>
                  </td>
                  <td className="px-3 py-3 text-right font-bold font-mono text-gray-900 align-top whitespace-nowrap text-xs print:text-sm">
                    {item.quantity} <span className="text-[10px] text-gray-500 font-normal uppercase font-sans">{(item.unit || 'PCS').toUpperCase()}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold align-top whitespace-nowrap text-xs print:text-sm">{formatCurrency(item.rate)}</td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-red-600 align-top whitespace-nowrap text-xs print:text-sm">-{formatCurrency(item.discount)}</td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-gray-600 align-top whitespace-nowrap text-xs print:text-sm">+{formatCurrency(item.tax)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-gray-900 align-top whitespace-nowrap text-sm print:text-base">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary & Terms & Conditions block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 items-start print:grid-cols-2">
          {/* Terms & Conditions Block */}
          <div className="text-xs text-gray-600 space-y-2">
            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 space-y-1 print:bg-gray-50 print:border-gray-300">
              <h5 className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">Terms & Conditions:</h5>
              <p className="text-xs text-gray-800 whitespace-pre-line leading-relaxed mt-1 font-medium break-words">
                {currentTerms}
              </p>
            </div>
            <p className="pt-2 font-mono text-[9px] text-gray-400">Invoice processed electronically. Signature not required.</p>
          </div>

          {/* Calculations Summary Table */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2.5 text-xs text-gray-700 print:bg-gray-50 print:border-gray-300">
            <div className="flex justify-between items-center text-xs print:text-sm">
              <span className="font-medium text-gray-600">Subtotal:</span>
              <span className="font-mono font-semibold text-gray-900">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs print:text-sm text-red-600">
              <span className="font-medium">Total Discount:</span>
              <span className="font-mono font-semibold">-{formatCurrency(invoice.totalDiscount)}</span>
            </div>
            <div className="flex justify-between items-center text-xs print:text-sm">
              <span className="font-medium text-gray-600">GST Tax Amount:</span>
              <span className="font-mono font-semibold text-gray-900">+{formatCurrency(invoice.totalTax)}</span>
            </div>
            <div className="h-px bg-gray-200 my-1" />
            <div className="flex justify-between items-center text-sm print:text-base font-bold text-gray-900">
              <span>Grand Total:</span>
              <span className="font-mono text-brand-600 text-base print:text-lg">{formatCurrency(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-xs print:text-sm text-emerald-700 pt-0.5">
              <span>Amount Received (Paid):</span>
              <span className="font-mono text-sm print:text-base">{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-800 font-bold border-t border-gray-200 pt-1.5 text-xs print:text-sm">
              <span>Pending Balance:</span>
              <span className="font-mono text-sm print:text-base">{formatCurrency(invoice.amountPending)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
