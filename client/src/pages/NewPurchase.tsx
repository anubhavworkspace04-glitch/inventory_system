import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle, PlusCircle } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency } from '../utils';

const additionalCostSchema = z.object({
  name: z.string().min(1, 'Cost name is required'),
  amount: z.number().min(0, 'Cost must be positive')
});

const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  variantId: z.string().min(1, 'Variant is required'),
  quantity: z.number().min(0.01, 'Quantity must be at least 0.01'),
  unitPurchasePrice: z.number().min(0, 'Unit price cannot be negative')
});

const purchaseFormSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  items: z.array(purchaseItemSchema).min(1, 'At least one purchase item is required'),
  additionalCosts: z.array(additionalCostSchema),
  paymentMode: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other']),
  paymentStatus: z.enum(['Paid', 'Partially Paid', 'Pending']),
  amountPaid: z.number().min(0, 'Amount paid cannot be negative'),
  notes: z.string().optional()
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export const NewPurchase: React.FC = () => {
  const navigate = useNavigate();
  const { products, suppliers, fetchSuppliers, addPurchase, purchases, fetchProducts, showToast } = useInventoryStore();

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
  }, []);

  const activeSuppliers = suppliers.filter(s => s.isActive);
  const activeProducts = products.filter(p => p.isActive);

  // Generate sequence number for preview
  const sequenceNumber = `PUR-2026-${String(purchases.length + 1).padStart(4, '0')} (Auto)`;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      supplierId: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      items: [{ productId: '', variantId: '', quantity: 0, unitPurchasePrice: 0 }],
      additionalCosts: [],
      paymentMode: 'UPI',
      paymentStatus: 'Paid',
      amountPaid: 0,
      notes: ''
    }
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items'
  });

  const { fields: costFields, append: appendCost, remove: removeCost } = useFieldArray({
    control,
    name: 'additionalCosts'
  });

  // Watch fields for reactive computations
  const watchedItems = watch('items') || [];
  const watchedAdditionalCosts = watch('additionalCosts') || [];
  const watchedPaymentStatus = watch('paymentStatus');
  const watchedAmountPaid = watch('amountPaid') || 0;

  // Compute values dynamically
  const baseAmount = watchedItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPurchasePrice) || 0;
    return sum + (qty * price);
  }, 0);

  const additionalCostsTotal = watchedAdditionalCosts.reduce(
    (sum, item) => sum + (Number(item.amount) || 0), 
    0
  );
  
  const totalPurchaseCost = baseAmount + additionalCostsTotal;

  // Sync Amount Paid based on payment status
  useEffect(() => {
    if (watchedPaymentStatus === 'Paid') {
      setValue('amountPaid', totalPurchaseCost);
    } else if (watchedPaymentStatus === 'Pending') {
      setValue('amountPaid', 0);
    }
  }, [watchedPaymentStatus, totalPurchaseCost, setValue]);

  const pendingAmount = Math.max(0, totalPurchaseCost - watchedAmountPaid);

  const onSubmit = async (values: PurchaseFormValues) => {
    setSaving(true);
    try {
      await addPurchase({
        supplierId: values.supplierId,
        purchaseDate: values.purchaseDate,
        items: values.items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPurchasePrice: item.unitPurchasePrice
        })),
        additionalCosts: values.additionalCosts.map(c => ({
          name: c.name.trim(),
          amount: c.amount
        })),
        paymentMode: values.paymentMode,
        amountPaid: values.amountPaid,
        notes: values.notes?.trim()
      });
      showToast('Purchase order saved successfully.', 'success');
      navigate('/purchases');
    } catch (err: any) {
      showToast(err.message || 'Failed to save purchase.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/purchases" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Purchases
        </Link>
        <h2 className="text-xl font-bold text-gray-900">Record New Purchase</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Order Core & Item Rows */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header metadata */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Purchase Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Purchase Number</label>
                <input
                  type="text"
                  disabled
                  value={sequenceNumber}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-lg px-3 py-2.5 text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Supplier *</label>
                  <Link to="/suppliers" className="text-[11px] font-medium text-brand-600 hover:underline flex items-center">
                    <Plus className="h-3.5 w-3.5 mr-0.5" /> Add Supplier Card
                  </Link>
                </div>
                <select
                  {...register('supplierId')}
                  className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                    errors.supplierId ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-brand-500'
                  }`}
                >
                  <option value="">Select Supplier...</option>
                  {activeSuppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                  ))}
                </select>
                {errors.supplierId && (
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" /> {errors.supplierId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Purchase Date *</label>
                <input
                  type="date"
                  {...register('purchaseDate')}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Line Item Inputs */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Purchase Items ({itemFields.length})
              </h3>
              <button
                type="button"
                onClick={() => appendItem({ productId: '', variantId: '', quantity: 0, unitPurchasePrice: 0 })}
                className="flex items-center space-x-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>

            {errors.items && (
              <p className="text-sm text-red-500 font-medium flex items-center bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertCircle className="h-4 w-4 mr-2" /> At least one item with valid quantity is required.
              </p>
            )}

            <div className="space-y-4">
              {itemFields.map((field, index) => {
                const prodId = watchedItems[index]?.productId;
                const selectedProdObj = activeProducts.find(p => p.id === prodId);
                const availableVariants = selectedProdObj ? selectedProdObj.variants.filter(v => v.isActive) : [];

                return (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {/* Product Selection */}
                    <div className="md:col-span-4 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product *</label>
                      <select
                        {...register(`items.${index}.productId` as const)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      >
                        <option value="">Select Product...</option>
                        {activeProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Variant Selection */}
                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Specification *</label>
                      <select
                        {...register(`items.${index}.variantId` as const)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        disabled={!prodId}
                      >
                        <option value="">Select Variant...</option>
                        {availableVariants.map(v => (
                          <option key={v.id} value={v.id}>{v.name} ({v.sku})</option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                      />
                    </div>

                    {/* Price */}
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Price</label>
                      <input
                        type="number"
                        placeholder="0"
                        {...register(`items.${index}.unitPurchasePrice` as const, { valueAsNumber: true })}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                      />
                    </div>

                    {/* Remove Action */}
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

        {/* Right Side: Cost Breakdown & Payment */}
        <div className="space-y-6 col-span-1">
          {/* Breakdown summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Purchase Cost Summary
            </h3>

            <div className="space-y-3.5 text-sm text-gray-600">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Base items sum:</span>
                <span className="font-mono font-semibold text-gray-900">{formatCurrency(baseAmount)}</span>
              </div>

              {/* Additional Costs List */}
              {costFields.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Additional Costs</p>
                  {costFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <input
                        type="text"
                        placeholder="e.g. Shipping"
                        {...register(`additionalCosts.${index}.name` as const)}
                        className="flex-1 bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                      <input
                        type="number"
                        placeholder="₹0"
                        {...register(`additionalCosts.${index}.amount` as const, { valueAsNumber: true })}
                        className="w-24 bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono text-right"
                      />
                      <button
                        type="button"
                        onClick={() => removeCost(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => appendCost({ name: '', amount: 0 })}
                className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Additional Cost
              </button>

              <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center text-base font-bold text-gray-900">
                <span>Total Purchase Cost:</span>
                <span className="font-mono text-brand-600">{formatCurrency(totalPurchaseCost)}</span>
              </div>
            </div>
          </div>

          {/* Payment metadata */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Payment & Checkout
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Mode</label>
                <select
                  {...register('paymentMode')}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Debit/Credit Card</option>
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
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount Paid (₹)</label>
                <input
                  type="number"
                  {...register('amountPaid', { valueAsNumber: true })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm font-medium">
                <span className="text-gray-600">Pending Balance:</span>
                <span className={`font-mono font-bold ${pendingAmount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {formatCurrency(pendingAmount)}
                </span>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes / Remarks</label>
                <textarea
                  {...register('notes')}
                  placeholder="Memo details e.g. GST reference ID or transit notes..."
                  rows={3}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                />
              </div>
            </div>

            {/* Save Buttons */}
            <div className="pt-5 border-t border-gray-100 flex space-x-3">
              <Link
                to="/purchases"
                className="flex-1 py-2.5 bg-white text-center border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Discard
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Save className="h-4.5 w-4.5" />
                <span>{saving ? 'Saving...' : 'Save Purchase'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
