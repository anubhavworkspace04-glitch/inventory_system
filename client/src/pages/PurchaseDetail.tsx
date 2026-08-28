import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  History, 
  XSquare, 
  AlertTriangle,
  Info,
  Truck
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate } from '../utils';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const PurchaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { purchases, cancelPurchase, stockMovements, fetchPurchases, fetchStockHistory, showToast } = useInventoryStore();

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchPurchases();
    fetchStockHistory();
  }, []);

  const purchase = purchases.find((p) => p.id === id);

  if (!purchase) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
        <h3 className="text-lg font-bold text-red-600">Purchase Order Not Found</h3>
        <p className="text-sm text-gray-500 mt-2">The purchase record you are looking for does not exist.</p>
        <Link to="/purchases" className="mt-4 inline-flex items-center text-sm font-medium text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Purchases
        </Link>
      </div>
    );
  }

  const isCancelled = purchase.status === 'Cancelled';

  const handleCancelConfirm = async () => {
    setCancelling(true);
    try {
      await cancelPurchase(purchase.id);
      showToast('Purchase order cancelled successfully.', 'success');
      setConfirmCancelOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Operation aborted: Cancellation would result in negative stock levels.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <Link to="/purchases" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Purchases
        </Link>

        {/* Action Row */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print Voucher</span>
          </button>
          
          <Link
            to="/stock-history"
            className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-sm"
          >
            <History className="h-4 w-4" />
            <span>View Ledger History</span>
          </Link>

          {!isCancelled && (
            <button
              onClick={() => setConfirmCancelOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors shadow-sm"
            >
              <XSquare className="h-4 w-4" />
              <span>Cancel Purchase</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Costs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Metadata */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Purchase Voucher</p>
                <h3 className="text-xl font-bold font-mono text-brand-600 mt-1">{purchase.purchaseNumber}</h3>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                isCancelled
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {purchase.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Supplier</p>
                <Link to={`/suppliers/${purchase.supplierId}`} className="font-semibold text-gray-800 mt-1 hover:underline flex items-center">
                  <Truck className="h-4 w-4 mr-1.5 text-gray-400" />
                  <span>{purchase.supplierNameSnapshot}</span>
                </Link>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Transaction Date</p>
                <p className="font-semibold text-gray-800 mt-1">
                  {formatDate(purchase.purchaseDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Voucher Type</p>
                <p className="font-semibold text-gray-700 mt-1">Incoming Supplier Bill</p>
              </div>
            </div>

            {purchase.notes && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-start space-x-3 mt-4">
                <Info className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800 block mb-1">Notes:</span>
                  {purchase.notes}
                </div>
              </div>
            )}
          </div>

          {/* Items Summary Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Purchased Items ({purchase.items.length})</h3>
            </div>
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-semibold text-xs tracking-wider uppercase bg-white">
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">Variant Specification</th>
                  <th className="px-6 py-3.5 text-right">Quantity</th>
                  <th className="px-6 py-3.5 text-right">Unit Price</th>
                  <th className="px-6 py-3.5 text-right">Base Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchase.items.map((item, idx) => (
                  <tr key={idx} className="text-gray-700 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.productNameSnapshot}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      <span>{item.variantNameSnapshot}</span>
                      <span className="text-[10px] text-gray-400 block font-normal mt-0.5">SKU: {item.skuSnapshot}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium font-mono text-sm">{item.quantity}</td>
                    <td className="px-6 py-4 text-right font-mono text-sm">{formatCurrency(item.unitPurchasePrice)}</td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-gray-900">
                      {formatCurrency(item.baseAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cost Breakdown Details */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Invoice Cost Breakdown</h3>
              <span className="text-xs text-gray-500 font-mono">Dynamic Expenses Breakdown</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <span>Material Cost (Base Items Sum)</span>
                <span className="font-mono text-gray-800">{formatCurrency(purchase.baseAmount)}</span>
              </div>

              {purchase.additionalCosts.map((cost, idx) => (
                <div key={idx} className="flex justify-between text-sm text-gray-500">
                  <span>+ {cost.name}</span>
                  <span className="font-mono">{formatCurrency(cost.amount)}</span>
                </div>
              ))}

              <div className="h-px bg-gray-200 my-2" />
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Total Purchase Valuation</span>
                <span className="font-mono text-brand-600">{formatCurrency(purchase.totalPurchaseCost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Payment & Stock Impact Panels */}
        <div className="space-y-6">
          {/* Payment panel */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Payment Summary
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Status:</span>
                <span className={`font-semibold ${
                  purchase.paymentStatus === 'Paid'
                    ? 'text-emerald-600'
                    : purchase.paymentStatus === 'Partially Paid'
                      ? 'text-amber-600'
                      : 'text-red-600'
                }`}>
                  {purchase.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payment Mode:</span>
                <span className="font-medium text-gray-900">{purchase.paymentMode}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Paid:</span>
                <span className="font-mono text-gray-900 font-medium">{formatCurrency(purchase.amountPaid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Remaining Balance:</span>
                <span className={`font-mono font-semibold ${purchase.pendingAmount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatCurrency(purchase.pendingAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Stock impact panel */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Stock Ledger Impact
            </h3>

            <div className="space-y-4">
              {purchase.items.map((item, idx) => {
                const m = stockMovements.find(
                  (mov) => mov.referenceId === purchase.id && mov.variantId === item.variantId && mov.transactionType === 'PURCHASE'
                );
                
                const purchaseQty = item.quantity;
                const balanceAfter = m ? m.balanceAfter : 0;
                const balanceBefore = balanceAfter - purchaseQty;

                return (
                  <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {item.productNameSnapshot}
                    </div>
                    <div className="text-xs text-gray-500 font-mono -mt-1.5 truncate">
                      Spec: {item.variantNameSnapshot}
                    </div>
                    {isCancelled ? (
                      <div className="text-xs text-red-600 flex items-center font-medium bg-red-50 p-2 rounded border border-red-200">
                        <AlertTriangle className="h-4 w-4 mr-1.5" />
                        Stock Reversal Posted
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 text-xs font-mono text-center gap-2">
                        <div className="bg-white border border-gray-200 text-gray-500 p-1.5 rounded">
                          Before: {balanceBefore}
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-1.5 rounded font-semibold">
                          +{purchaseQty}
                        </div>
                        <div className="bg-white border border-gray-200 text-gray-900 p-1.5 rounded font-medium">
                          After: {balanceAfter}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel purchase confirmation */}
      <ConfirmDialog
        isOpen={confirmCancelOpen}
        title="Cancel Purchase Voucher?"
        message="Canceling this purchase order will write a negative stock ledger transaction to reverse the added stock. This operation is permanent and maintains an audit trail. Do you want to cancel?"
        confirmLabel={cancelling ? 'Cancelling...' : 'Yes, Cancel Purchase'}
        cancelLabel="Keep Active"
        onConfirm={handleCancelConfirm}
        onCancel={() => setConfirmCancelOpen(false)}
      />
    </div>
  );
};
