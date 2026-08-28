import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  History, 
  Plus, 
  Sliders,
  DollarSign,
  Maximize2,
  X
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency, formatDate, getImageUrl } from '../utils';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addStockAdjustment, stockMovements } = useInventoryStore();

  const product = products.find(p => p.id === id);

  // Stock Adjustment Modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [mainImgError, setMainImgError] = useState(false);
  
  // Image Lightbox Modal State
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Lock body scroll and attach Escape key listener when lightbox modal is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setImageModalOpen(false);
      }
    };
    if (imageModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [imageModalOpen]);

  if (!product) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
        <h3 className="text-lg font-bold text-red-600">Product Not Found</h3>
        <p className="text-sm text-gray-500 mt-2">The product you are trying to view does not exist or has been deleted.</p>
        <Link to="/inventory" className="mt-4 inline-flex items-center text-xs font-semibold text-brand-600 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Inventory
        </Link>
      </div>
    );
  }

  const handleOpenAdjustModal = (varId: string) => {
    setSelectedVariantId(varId);
    setAdjustmentQty(0);
    setAdjustmentNotes('');
    setAdjustModalOpen(true);
  };

  const handleSaveAdjustment = () => {
    if (adjustmentQty === 0) return;
    addStockAdjustment(product.id, selectedVariantId, adjustmentQty, adjustmentNotes);
    setAdjustModalOpen(false);
  };

  // Get active variants
  const activeVariants = product.variants.filter(v => v.isActive);

  // Find recent stock movements for this product
  const productMovements = stockMovements
    .filter(m => m.productId === product.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Back & Actions header */}
      <div className="flex items-center justify-between">
        <Link to="/inventory" className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Inventory
        </Link>
        <Link
          to={`/inventory/products/${product.id}/edit`}
          className="flex items-center space-x-1 px-3.5 py-2 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-200 transition-colors shadow-sm"
        >
          <Edit2 className="h-3.5 w-3.5" />
          <span>Edit Product</span>
        </Link>
      </div>

      {/* Main product profile card */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-6">
        {/* Top Section: Information on left, Image Thumbnail Box on right */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex items-center space-x-3 flex-wrap gap-y-1">
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                product.isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {product.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs font-semibold bg-gray-50 text-gray-500 w-max px-2.5 py-0.5 rounded border border-gray-200">
              {product.category}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">{product.description || 'No description provided.'}</p>
          </div>

          {/* Compact Contained Product Image Preview Box */}
          <div className="shrink-0 self-center md:self-start">
            <div 
              onClick={() => activeVariants[0]?.image && !mainImgError && setImageModalOpen(true)}
              className={`relative w-[200px] h-[200px] bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center p-3 overflow-hidden ${
                activeVariants[0]?.image && !mainImgError ? 'cursor-pointer group' : ''
              }`}
            >
              {activeVariants[0]?.image && !mainImgError ? (
                <>
                  <img
                    src={getImageUrl(activeVariants[0].image)}
                    alt={product.name}
                    className="w-full h-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
                    onError={() => setMainImgError(true)}
                  />
                  <div className="absolute inset-0 bg-gray-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                    <span className="bg-white/90 text-gray-900 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <Maximize2 className="h-3.5 w-3.5" /> Enlarge
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-2xl text-gray-400 font-bold uppercase">
                  {product.name.substring(0, 2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">UOM (Unit)</p>
            <p className="text-sm font-bold text-gray-700 uppercase">{product.unit}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">Alert Level</p>
            <p className="text-sm font-bold text-gray-700">{product.minStockLevel} {product.unit}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">Total Stock</p>
            <p className="text-sm font-bold text-emerald-600">
              {activeVariants.reduce((sum, v) => sum + v.cachedStock, 0)} {product.unit}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">Created On</p>
            <p className="text-sm font-bold text-gray-700">{formatDate(product.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Variants List Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">Available Variants</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-3 w-16">Preview</th>
                <th className="px-6 py-3">Variant Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3 text-right">Opening Stock</th>
                <th className="px-6 py-3 text-right">Current Stock</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {activeVariants.map((v) => {
                const isLow = v.cachedStock <= product.minStockLevel;
                return (
                  <tr key={v.id} className="hover:bg-gray-50 text-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      {v.image ? (
                        <img
                          src={getImageUrl(v.image)}
                          alt={v.name}
                          className="h-9 w-9 object-contain p-0.5 bg-gray-50 rounded border border-gray-200"
                        />
                      ) : (
                        <div className="h-9 w-9 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">
                          {v.name.substring(0, 2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{v.name}</td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">{v.sku}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-500">{v.openingStock}</td>
                    <td className="px-6 py-4 text-right font-bold">
                      <div className="flex items-center justify-end space-x-1">
                        {isLow && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        <span className={isLow ? 'text-amber-600' : 'text-gray-900'}>
                          {v.cachedStock}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isLow
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenAdjustModal(v.id)}
                          className="flex items-center space-x-1 px-2.5 py-1 text-xs bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-200 transition-colors font-medium"
                        >
                          <Sliders className="h-3 w-3" />
                          <span>Adjust Stock</span>
                        </button>
                        <Link
                          to={`/stock-history?variantId=${v.id}`}
                          className="p-1 text-gray-400 hover:text-brand-600 rounded hover:bg-gray-100 transition-colors"
                          title="View Stock Ledger"
                        >
                          <History className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Movements for this Product */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Recent Stock Ledger Entries</h3>
          <Link to="/stock-history" className="text-xs text-brand-600 hover:underline flex items-center font-medium">
            View full ledger
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-6 py-3">Date/Time</th>
                <th className="px-6 py-3">Variant</th>
                <th className="px-6 py-3">Transaction</th>
                <th className="px-6 py-3">Ref Code</th>
                <th className="px-6 py-3 text-right">Qty Impact</th>
                <th className="px-6 py-3 text-right">Stock Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {productMovements.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 text-gray-700">
                  <td className="px-6 py-3.5 font-mono text-xs">{formatDate(m.createdAt)}</td>
                  <td className="px-6 py-3.5 font-medium text-gray-900">{m.variantName}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
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
                  <td className="px-6 py-3.5 font-mono text-xs text-gray-500">{m.referenceNumber}</td>
                  <td className={`px-6 py-3.5 text-right font-bold ${
                    m.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                  </td>
                  <td className="px-6 py-3.5 text-right font-semibold text-gray-900">{m.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOCKS ADJUSTMENT MODAL */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-base font-bold text-gray-900">Stock Adjustment</h3>
              <p className="text-xs text-gray-500 mt-1">
                Variant: {product.variants.find(v => v.id === selectedVariantId)?.name}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Adjustment Quantity (Use negative for loss/reduction)</label>
                <input
                  type="number"
                  value={adjustmentQty || ''}
                  onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                  placeholder="e.g. 10 or -5"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Reason / Notes *</label>
                <textarea
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="Explain why this adjustment is necessary..."
                  rows={3}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end px-5 py-4 bg-gray-50 border-t border-gray-100 space-x-3">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAdjustment}
                disabled={adjustmentQty === 0 || !adjustmentNotes.trim()}
                className="px-4 py-2 text-sm font-medium bg-brand-500 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEWPORT-LEVEL IMAGE LIGHTBOX PORTAL */}
      {imageModalOpen && activeVariants[0]?.image && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 w-screen h-screen overflow-hidden animate-in fade-in duration-200"
          onClick={() => setImageModalOpen(false)}
        >
          {/* Viewport Fixed Top-Right Close Button */}
          <button
            type="button"
            onClick={() => setImageModalOpen(false)}
            className="fixed top-5 right-5 z-[100000] p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer shadow-lg"
            title="Close Preview (Esc)"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Centered Lightbox Image Container */}
          <div 
            className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center justify-center pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(activeVariants[0].image)}
              alt={product.name}
              className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-black/20 border border-white/10"
            />
            <div className="mt-3 text-center">
              <p className="text-base font-bold text-white tracking-wide">
                {product.name}
              </p>
              <p className="text-xs font-mono text-gray-300 mt-0.5">
                {activeVariants[0].name} ({activeVariants[0].sku})
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
