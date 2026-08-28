import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency } from '../utils';
import { quotationApi } from '../api/services';

interface FormItem {
  productId: string;
  variantId: string;
  quantity: number;
  sellingPrice: number;
  discount: number;
  tax: number;
}

export const NewQuotation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { 
    products, customers, fetchProducts, fetchCustomers, addQuotation, updateQuotation 
  } = useInventoryStore();

  const isEditMode = !!id;

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // default 15 days validity
  
  const [items, setItems] = useState<FormItem[]>([
    { productId: '', variantId: '', quantity: 1, sellingPrice: 0, discount: 0, tax: 0 }
  ]);
  
  const [terms, setTerms] = useState('1. Price validity: 15 days from date of issue.\n2. Goods delivery subject to stock availability.\n3. Taxes: GST extra as quoted above.');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    if (isEditMode) {
      loadQuotationDetails();
    }
  }, [id]);

  const loadQuotationDetails = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await quotationApi.getById(id);
      const q = res.data;
      
      if (q.status === 'CONVERTED') {
        setErrorMsg('Converted quotations are finalized and cannot be modified.');
        return;
      }
      if (q.status === 'CANCELLED') {
        setErrorMsg('Cancelled quotations cannot be modified.');
        return;
      }

      setCustomerId(q.customerId || '');
      setIsWalkIn(!q.customerId);
      setCustomerName(q.customerNameSnapshot);
      setCustomerPhone(q.customerPhoneSnapshot || '');
      setQuotationDate(q.quotationDate.split('T')[0]);
      setExpiryDate(q.expiryDate.split('T')[0]);
      setTerms(q.terms || '');
      setNotes(q.notes || '');
      
      setItems(q.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        discount: item.discount,
        tax: item.tax
      })));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load quotation.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { productId: '', variantId: '', quantity: 1, sellingPrice: 0, discount: 0, tax: 0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value
    };

    // Cascade default catalog price when product or variant changes
    if (field === 'productId') {
      updated[index].variantId = '';
      updated[index].sellingPrice = 0;
      updated[index].discount = 0;
      updated[index].tax = 0;
    }

    if (field === 'variantId' && value) {
      const prod = products.find(p => p.id === updated[index].productId);
      const variant = prod?.variants.find(v => v.id === value);
      if (prod && variant) {
        // Suggest default rates
        let rate = 0;
        if (prod.name === 'Glass') {
          rate = variant.sku.includes('5CLR') ? 700 : variant.sku.includes('6CLR') ? 750 : 900;
        } else if (prod.name === 'Plywood') {
          rate = 1200;
        } else {
          rate = 100;
        }
        updated[index].sellingPrice = rate;
        
        // Auto estimate 18% GST tax
        const itemSub = updated[index].quantity * rate;
        updated[index].tax = Math.round(itemSub * 0.18);
      }
    }

    // Auto-calculate tax on quantity or rate changes
    if ((field === 'quantity' || field === 'sellingPrice' || field === 'discount') && updated[index].productId && updated[index].variantId) {
      const qty = field === 'quantity' ? Number(value) : updated[index].quantity;
      const rate = field === 'sellingPrice' ? Number(value) : updated[index].sellingPrice;
      const disc = field === 'discount' ? Number(value) : updated[index].discount;
      const itemSub = qty * rate;
      updated[index].tax = Math.round((itemSub - disc) * 0.18);
    }

    setItems(updated);
  };

  // Computations
  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0);
  };

  const getTotalDiscount = () => {
    return items.reduce((sum, item) => sum + item.discount, 0);
  };

  const getTotalTax = () => {
    return items.reduce((sum, item) => sum + item.tax, 0);
  };

  const getGrandTotal = () => {
    return getSubtotal() - getTotalDiscount() + getTotalTax();
  };

  const handleSave = async (status: 'DRAFT' | 'SENT') => {
    if (!isWalkIn && !customerId) {
      setErrorMsg('Please select a customer.');
      return;
    }
    if (isWalkIn && !customerName.trim()) {
      setErrorMsg('Please specify walk-in customer name.');
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productId || !item.variantId) {
        setErrorMsg(`Please specify product and variant specifications for item row ${i + 1}.`);
        return;
      }
      if (item.quantity <= 0) {
        setErrorMsg(`Quantity must be greater than zero in item row ${i + 1}.`);
        return;
      }
      if (item.sellingPrice < 0) {
        setErrorMsg(`Selling rate price cannot be negative in item row ${i + 1}.`);
        return;
      }
    }

    setSaving(true);
    setErrorMsg(null);

    const payload = {
      customerId: isWalkIn ? undefined : customerId,
      customerName: isWalkIn ? customerName.trim() : undefined,
      customerPhone: isWalkIn ? customerPhone.trim() || undefined : undefined,
      quotationDate,
      expiryDate,
      items: items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        discount: item.discount,
        tax: item.tax
      })),
      notes,
      terms,
      status
    };

    try {
      if (isEditMode && id) {
        await updateQuotation(id, payload);
        navigate(`/quotations/${id}`);
      } else {
        await addQuotation(payload);
        navigate('/quotations');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save quotation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-xs text-gray-500 shadow-sm">
        Loading quotation template...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link to="/quotations" className="inline-flex items-center text-xs text-gray-500 hover:text-gray-900 font-medium">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Price Quotations
        </Link>
      </div>

      {/* Main Form container */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Quotation details' : 'Create Estimate Quotation'}</h2>
          <p className="text-sm text-gray-500">Specify inquire requirements, set validity expirations and draft billing calculations.</p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-semibold flex items-start space-x-2 text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-700">
          {/* Customer allocation */}
          <div className="space-y-4 md:col-span-2 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-200">
              <span className="font-semibold text-gray-900">Customer Details</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <input
                type="checkbox"
                id="walkinCheck"
                checked={isWalkIn}
                onChange={(e) => {
                  setIsWalkIn(e.target.checked);
                  setCustomerId('');
                  setCustomerName('');
                  setCustomerPhone('');
                }}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 w-4 h-4"
              />
              <label htmlFor="walkinCheck" className="font-medium cursor-pointer">Walk-in Client (Anonymous/Unsaved)</label>
            </div>

            {!isWalkIn ? (
              <div className="space-y-2">
                <label className="block text-gray-700 font-semibold text-xs uppercase tracking-wide">Select Customer Profile:</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-gray-700 font-semibold text-xs uppercase tracking-wide">Client Name:</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter walk-in client name"
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-gray-700 font-semibold text-xs uppercase tracking-wide">Phone Number:</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dates controls */}
          <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-200">
              <span className="font-semibold text-gray-900">Validity Expiration Dates</span>
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-xs uppercase tracking-wide">Quotation Date:</label>
              <input
                type="date"
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-xs uppercase tracking-wide">Valid Until (Expiry):</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Multi-Item Specifications Builder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Items Selection Details</span>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center space-x-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 rounded-lg font-medium text-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Item Line</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => {
              const prod = products.find(p => p.id === item.productId);
              const variants = prod ? prod.variants.filter(v => v.isActive) : [];

              return (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 items-end text-sm">
                  {/* Select product */}
                  <div className="space-y-1.5 md:col-span-1.5">
                    <label className="text-gray-600 font-medium text-xs">Product:</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="">-- Product --</option>
                      {products.filter(p => p.isActive).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select variant */}
                  <div className="space-y-1.5 md:col-span-1.5">
                    <label className="text-gray-600 font-medium text-xs">Variant:</label>
                    <select
                      value={item.variantId}
                      onChange={(e) => handleItemChange(idx, 'variantId', e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      disabled={!item.productId}
                    >
                      <option value="">-- Variant Specification --</option>
                      {variants.map(v => (
                        <option key={v.id} value={v.id}>{v.name} ({v.sku})</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-gray-600 font-medium text-xs">Qty:</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 font-mono text-center focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  {/* Selling Price / Rate */}
                  <div className="space-y-1.5">
                    <label className="text-gray-600 font-medium text-xs">Rate (₹):</label>
                    <input
                      type="number"
                      value={item.sellingPrice}
                      onChange={(e) => handleItemChange(idx, 'sellingPrice', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 font-mono text-right focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  {/* Discount */}
                  <div className="space-y-1.5">
                    <label className="text-gray-600 font-medium text-xs">Discount (₹):</label>
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) => handleItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 font-mono text-right text-red-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  {/* Tax (GST) */}
                  <div className="space-y-1.5">
                    <label className="text-gray-600 font-medium text-xs">GST Tax (₹):</label>
                    <input
                      type="number"
                      value={item.tax}
                      onChange={(e) => handleItemChange(idx, 'tax', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 font-mono text-right text-emerald-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  {/* Line Total and delete */}
                  <div className="flex items-center justify-between space-x-2 pt-3 md:pt-0">
                    <div className="text-right font-mono font-bold text-gray-900 text-sm">
                      {formatCurrency((item.quantity * item.sellingPrice) - item.discount + item.tax)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                      title="Remove Row"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Summary Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
          {/* Notes and Terms */}
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-xs uppercase tracking-wide">Terms & Conditions:</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                placeholder="Specific billing terms..."
                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-gray-700 font-semibold text-xs uppercase tracking-wide">Notes / Inquiry Comments:</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Comments..."
                className="w-full bg-white border border-gray-300 rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Totals panel */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-3 text-sm text-gray-600">
            <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-3">Quotations Calculations</h3>
            <div className="flex justify-between pt-2">
              <span>Material cost subtotal:</span>
              <span className="font-mono text-gray-900">{formatCurrency(getSubtotal())}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Total discounts:</span>
              <span className="font-mono">-{formatCurrency(getTotalDiscount())}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Taxes (GST 18%):</span>
              <span className="font-mono">+{formatCurrency(getTotalTax())}</span>
            </div>
            <div className="h-px bg-gray-200 my-2" />
            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>Estimated Grand Total:</span>
              <span className="font-mono text-brand-600">{formatCurrency(getGrandTotal())}</span>
            </div>
          </div>
        </div>

        {/* Action button bar */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Link
            to={isEditMode ? `/quotations/${id}` : '/quotations'}
            className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave('SENT')}
            disabled={saving}
            className="flex items-center space-x-1.5 px-6 py-2 bg-brand-500 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Processing...' : isEditMode ? 'Update & Send' : 'Save & Send'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
