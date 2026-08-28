import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ArrowLeft, Plus, Save, AlertCircle, AlertTriangle, UserPlus, PlusCircle, Trash2 
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency } from '../utils';

const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  variantId: z.string().min(1, 'Variant is required'),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  sellingPrice: z.number().min(0, 'Price cannot be negative'),
  discount: z.number().min(0, 'Discount cannot be negative').default(0),
  tax: z.number().min(0, 'Tax cannot be negative').default(0)
});

const saleFormSchema = z.object({
  customerId: z.string().optional(),
  isWalkIn: z.boolean().default(false),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  saleDate: z.string().min(1, 'Sale date is required'),
  saleChannel: z.enum(['Online', 'Offline']),
  items: z.array(saleItemSchema).min(1, 'At least one sale item is required'),
  paymentMethod: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other']),
  paymentStatus: z.enum(['Paid', 'Partially Paid', 'Pending']),
  amountReceived: z.number().min(0, 'Amount received cannot be negative'),
  notes: z.string().optional()
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

export const NewSale: React.FC = () => {
  const navigate = useNavigate();
  const { 
    products, customers, addSale, addCustomer, sales, fetchCustomers, fetchProducts, fetchSales, showToast 
  } = useInventoryStore();

  const [saving, setSaving] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  // Inline Quick Add Customer Form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustGst, setNewCustGst] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const activeCustomers = customers.filter(c => c.isActive);
  const activeProducts = products.filter(p => p.isActive);

  // Generate sequence preview
  const sequenceNumber = `SAL-2026-${String(sales.length + 1).padStart(4, '0')} (Auto)`;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerId: '',
      isWalkIn: false,
      customerName: '',
      customerPhone: '',
      saleDate: new Date().toISOString().split('T')[0],
      saleChannel: 'Offline',
      items: [{ productId: '', variantId: '', quantity: 0, sellingPrice: 0, discount: 0, tax: 0 }],
      paymentMethod: 'UPI',
      paymentStatus: 'Paid',
      amountReceived: 0,
      notes: ''
    }
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items') || [];
  const watchedIsWalkIn = watch('isWalkIn');
  const watchedPaymentStatus = watch('paymentStatus');
  const watchedAmountReceived = watch('amountReceived') || 0;

  // Compute subtotals and Grand Total
  const subtotal = watchedItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.sellingPrice) || 0;
    return sum + (qty * price);
  }, 0);

  const totalDiscount = watchedItems.reduce((sum, item) => sum + (Number(item.discount) || 0), 0);
  const totalTax = watchedItems.reduce((sum, item) => sum + (Number(item.tax) || 0), 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount + totalTax);

  // Sync Amount Received on Payment Status
  useEffect(() => {
    if (watchedPaymentStatus === 'Paid') {
      setValue('amountReceived', grandTotal);
    } else if (watchedPaymentStatus === 'Pending') {
      setValue('amountReceived', 0);
    }
  }, [watchedPaymentStatus, grandTotal, setValue]);

  const pendingBalance = Math.max(0, grandTotal - watchedAmountReceived);

  // Validate stock level availability for checkout
  let isStockSufficient = true;
  const stockErrors: string[] = [];

  watchedItems.forEach((item, index) => {
    if (!item.productId || !item.variantId) return;
    const product = activeProducts.find(p => p.id === item.productId);
    const variant = product?.variants.find(v => v.id === item.variantId);
    if (variant) {
      const stockAvailable = variant.cachedStock;
      const qtyRequested = Number(item.quantity) || 0;
      if (qtyRequested > stockAvailable) {
        isStockSufficient = false;
        stockErrors.push(
          `Line #${index + 1}: Spec "${variant.name}" has only ${stockAvailable} units available (Requested: ${qtyRequested}).`
        );
      }
    }
  });

  const handleSaveCustomerInline = async () => {
    setModalError('');
    if (!newCustName.trim() || !newCustPhone.trim()) {
      setModalError('Name and Phone are required.');
      return;
    }
    try {
      const saved = await addCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        email: newCustEmail.trim() || undefined,
        address: newCustAddress.trim() || undefined,
        gstNumber: newCustGst.trim().toUpperCase() || undefined
      });
      if (saved) {
        setValue('customerId', saved.id);
        setValue('isWalkIn', false);
        setCustomerModalOpen(false);
        // Clear quick add inputs
        setNewCustName('');
        setNewCustPhone('');
        setNewCustEmail('');
        setNewCustAddress('');
        setNewCustGst('');
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to create customer.');
    }
  };

  const onSubmit = async (values: SaleFormValues) => {
    if (!isStockSufficient) {
      showToast('Cannot complete checkout: Insufficient stock for some items.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId: values.isWalkIn ? undefined : values.customerId,
        customerName: values.isWalkIn ? (values.customerName || 'Walk-in Customer') : undefined,
        customerPhone: values.isWalkIn ? values.customerPhone : undefined,
        saleDate: values.saleDate,
        items: values.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
          discount: item.discount,
          tax: item.tax
        })),
        saleChannel: values.saleChannel,
        paymentMethod: values.paymentMethod,
        amountReceived: values.amountReceived,
        notes: values.notes?.trim()
      };

      const result = await addSale(payload);
      showToast('POS checkout completed successfully.', 'success');
      await fetchSales();
      navigate('/sales');
    } catch (err: any) {
      showToast(err.message || 'POS Checkout failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/sales" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Sales
        </Link>
        <h2 className="text-xl font-bold text-gray-900">POS Sales Checkout</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Info section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Customer Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale Number</label>
                <input
                  type="text"
                  disabled
                  value={sequenceNumber}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-lg px-3 py-2.5 text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Account *</label>
                    <label className="flex items-center text-xs text-gray-600 font-medium space-x-1.5 cursor-pointer bg-gray-50 px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        {...register('isWalkIn')}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
                      />
                      <span>Walk-in Customer</span>
                    </label>
                  </div>
                  {!watchedIsWalkIn && (
                    <button
                      type="button"
                      onClick={() => setCustomerModalOpen(true)}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center"
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1" /> Quick Add Profile
                    </button>
                  )}
                </div>

                {!watchedIsWalkIn ? (
                  <select
                    {...register('customerId')}
                    className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                      errors.customerId ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-brand-500'
                    }`}
                  >
                    <option value="">Select Registered Customer...</option>
                    {activeCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Walk-in Name (e.g. Counter Cash)"
                      {...register('customerName')}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="Walk-in Contact Phone"
                      {...register('customerPhone')}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sale Date *</label>
                <input
                  type="date"
                  {...register('saleDate')}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales Channel *</label>
                <select
                  {...register('saleChannel')}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="Offline">Offline Retail POS Counter</option>
                  <option value="Online">Online Delivery Dispatch</option>
                </select>
              </div>
            </div>
          </div>

          {/* Multi-Item details table */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                POS Billing Items ({itemFields.length})
              </h3>
              <button
                type="button"
                onClick={() => appendItem({ productId: '', variantId: '', quantity: 0, sellingPrice: 0, discount: 0, tax: 0 })}
                className="flex items-center space-x-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Specifications</span>
              </button>
            </div>

            {/* Render Stock Warnings */}
            {stockErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-sm text-red-700 space-y-2">
                <div className="flex items-center font-bold text-red-800">
                  <AlertTriangle className="h-5 w-5 mr-2 shrink-0" />
                  <span>CHECKOUT BLOCKED — Insufficient Stock Detected:</span>
                </div>
                <ul className="list-disc pl-6 space-y-1 font-medium">
                  {stockErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              {itemFields.map((field, index) => {
                const prodId = watchedItems[index]?.productId;
                const selectedProd = activeProducts.find(p => p.id === prodId);
                const availableVariants = selectedProd ? selectedProd.variants.filter(v => v.isActive) : [];
                
                const selectedVarId = watchedItems[index]?.variantId;
                const specVariant = availableVariants.find(v => v.id === selectedVarId);
                const liveStock = specVariant ? specVariant.cachedStock : 0;

                return (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {/* Product Selector */}
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</label>
                      <select
                        {...register(`items.${index}.productId` as const)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      >
                        <option value="">Choose...</option>
                        {activeProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Variant Selector */}
                    <div className="md:col-span-3 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Spec</label>
                        {specVariant && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${liveStock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            Stock: {liveStock}
                          </span>
                        )}
                      </div>
                      <select
                        {...register(`items.${index}.variantId` as const)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        disabled={!prodId}
                      >
                        <option value="">Choose...</option>
                        {availableVariants.map(v => (
                          <option key={v.id} value={v.id}>{v.name} ({v.sku})</option>
                        ))}
                      </select>
                    </div>                    
                    
                    {/* Quantity */}
                    <div className="md:col-span-1 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.0"
                        {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                      />
                    </div>

                    {/* Price */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</label>
                      <input
                        type="number"
                        placeholder="0"
                        {...register(`items.${index}.sellingPrice` as const, { valueAsNumber: true })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                      />
                    </div>

                    {/* Extra calculations row preview: discount & tax */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Disc / Tax</label>
                      <div className="flex space-x-1.5">
                        <input
                          type="number"
                          placeholder="Disc"
                          {...register(`items.${index}.discount` as const, { valueAsNumber: true })}
                          className="w-1/2 bg-white border border-gray-300 rounded-lg py-2 px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-mono text-center"
                          title="Flat item discount"
                        />
                        <input
                          type="number"
                          placeholder="Tax"
                          {...register(`items.${index}.tax` as const, { valueAsNumber: true })}
                          className="w-1/2 bg-white border border-gray-300 rounded-lg py-2 px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-mono text-center"
                          title="GST tax amount"
                        />
                      </div>
                    </div>

                    {/* Delete item row */}
                    <div className="md:col-span-1 flex items-center justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={itemFields.length === 1}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Summary & Checkout */}
        <div className="space-y-6 col-span-1">
          {/* Billing breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Billing Breakdown
            </h3>

            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Material Cost (Base Sum):</span>
                <span className="font-mono font-bold text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span className="font-medium">- Discounts total:</span>
                <span className="font-mono font-semibold">-{formatCurrency(totalDiscount)}</span>
              </div>
              <div className="flex justify-between items-center text-brand-600">
                <span className="font-medium">+ Taxes (GST):</span>
                <span className="font-mono font-semibold">+{formatCurrency(totalTax)}</span>
              </div>
              <div className="h-px bg-gray-200" />
              <div className="flex justify-between items-center text-base font-bold text-gray-900">
                <span>Grand Total:</span>
                <span className="font-mono text-brand-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment method settlement */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Settlement Checkout
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Method</label>
                <select
                  {...register('paymentMethod')}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Debit/Credit Card swipe</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Status</label>
                <select
                  {...register('paymentStatus')}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="Paid">Fully Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Pending">Pending Payment</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount Received (₹)</label>
                <input
                  type="number"
                  {...register('amountReceived', { valueAsNumber: true })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm font-medium">
                <span className="text-gray-600">Pending Receivables:</span>
                <span className={`font-mono font-bold ${pendingBalance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {formatCurrency(pendingBalance)}
                </span>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Memo Notes</label>
                <textarea
                  {...register('notes')}
                  placeholder="Transport references or client notes..."
                  rows={3}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-5 border-t border-gray-100 flex space-x-3">
              <Link
                to="/sales"
                className="flex-1 py-2.5 bg-white text-center border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Discard
              </Link>
              <button
                type="submit"
                disabled={saving || !isStockSufficient}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4.5 w-4.5" />
                <span>{saving ? 'Processing...' : 'Complete Checkout'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* QUICK ADD CUSTOMER MODAL */}
      {customerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Quick Add Customer</h3>
              <p className="text-sm text-gray-500 mt-1">Create a customer profile immediately without leaving the checkout window.</p>
            </div>

            <div className="p-6 space-y-4 text-sm">
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm font-medium">
                  {modalError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-gray-700 font-semibold">Customer Name *</label>
                  <input
                    type="text"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-700 font-semibold">Phone Number *</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="10 digit contact"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-700 font-semibold">Email (Optional)</label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-700 font-semibold">Billing Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Full office or residence details"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-700 font-semibold">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={newCustGst}
                  onChange={(e) => setNewCustGst(e.target.value)}
                  placeholder="e.g. 08AAAAA1111A1Z1"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 bg-gray-50 border-t border-gray-100 space-x-3">
              <button
                type="button"
                onClick={() => setCustomerModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomerInline}
                disabled={!newCustName.trim() || !newCustPhone.trim()}
                className="px-5 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Save & Select Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
