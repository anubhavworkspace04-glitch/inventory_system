import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Calendar, History, ArrowLeft, AlertCircle } from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatDate, formatDateTime } from '../utils';

export const StockHistory: React.FC = () => {
  const { stockMovements, products, fetchStockHistory, fetchProducts } = useInventoryStore();
  const [searchParams] = useSearchParams();
  const queryVariantId = searchParams.get('variantId') || '';

  const [selectedProductId, setSelectedProductId] = useState('All');
  const [selectedVariantId, setSelectedVariantId] = useState(queryVariantId || 'All');
  const [transactionType, setTransactionType] = useState('All');

  useEffect(() => {
    fetchStockHistory();
    if (products.length === 0) fetchProducts();
  }, []);

  // Load product list for filter cascading
  const activeProducts = products.filter(p => p.isActive);
  const selectedProductObj = products.find(p => p.id === selectedProductId);

  // Sync variant query parameter
  useEffect(() => {
    if (queryVariantId) {
      // Find which product has this variant
      const parentProduct = products.find(p => p.variants.some(v => v.id === queryVariantId));
      if (parentProduct) {
        setSelectedProductId(parentProduct.id);
        setSelectedVariantId(queryVariantId);
      }
    }
  }, [queryVariantId, products]);

  // Handle cascading variant reset when product filter changes
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    setSelectedVariantId('All');
  };

  // Filter movements
  const filteredMovements = stockMovements
    .filter(m => {
      const matchesProduct = selectedProductId === 'All' || m.productId === selectedProductId;
      const matchesVariant = selectedVariantId === 'All' || m.variantId === selectedVariantId;
      const matchesTxType = transactionType === 'All' || m.transactionType === transactionType;
      
      return matchesProduct && matchesVariant && matchesTxType;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Stock Ledger History</h2>
          <p className="text-xs text-gray-500">Complete auditable log of inventory stock adjustments, sales deductions, and purchases additions.</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Product Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Product Catalog</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Products</option>
              {activeProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Variant Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Variant Specifications</label>
            <select
              disabled={selectedProductId === 'All'}
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="All">All Variants</option>
              {selectedProductObj?.variants.filter(v => v.isActive).map(v => (
                <option key={v.id} value={v.id}>{v.name} ({v.sku})</option>
              ))}
            </select>
          </div>

          {/* Tx Type Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Movement Cause</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Movements</option>
              <option value="OPENING_STOCK">Opening Stock</option>
              <option value="PURCHASE">Purchase</option>
              <option value="SALE">Sale</option>
              <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
              <option value="CANCELLATION_REVERSAL">Cancellation Reversal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit ledger list */}
      {filteredMovements.length === 0 ? (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-12 text-center flex flex-col items-center space-y-4">
          <div className="p-3 bg-gray-50 text-gray-400 rounded-full border border-gray-100">
            <History className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-700">No stock movements found</h3>
            <p className="text-xs text-gray-500 max-w-sm">No inventory change transactions matched your selected product and category criteria.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Date/Time</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Variant Specifications</th>
                  <th className="px-6 py-4">Cause/Action</th>
                  <th className="px-6 py-4 font-mono">Reference Voucher</th>
                  <th className="px-6 py-4 text-right">Adjustment Qty</th>
                  <th className="px-6 py-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMovements.map((m) => {
                  const isPositive = m.quantityChange > 0;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 text-gray-700 transition-colors bg-white">
                      <td className="px-6 py-4 text-xs font-mono">
                        {formatDateTime(m.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {m.productName}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {m.variantName}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          m.transactionType === 'SALE'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : m.transactionType === 'PURCHASE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : m.transactionType === 'STOCK_ADJUSTMENT'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {m.transactionType === 'OPENING_STOCK' ? 'Opening Stock' :
                           m.transactionType === 'PURCHASE' ? 'Purchase' :
                           m.transactionType === 'SALE' ? 'Sale' :
                           m.transactionType === 'STOCK_ADJUSTMENT' ? 'Stock Adjustment' :
                           m.transactionType === 'CANCELLATION_REVERSAL' ? 'Cancellation Reversal' :
                           m.transactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {m.referenceNumber}
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${
                        isPositive ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-semibold text-gray-900">
                        {m.balanceAfter}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
