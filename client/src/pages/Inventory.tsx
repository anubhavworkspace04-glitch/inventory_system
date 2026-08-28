import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit2, 
  Trash2,
  AlertTriangle,
  Boxes
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { getImageUrl } from '../utils';

// Small component so each row manages its own img error state in React (avoids DOM mutation)
const ProductThumbnail: React.FC<{ src: string; name: string }> = ({ src, name }) => {
  const [imgError, setImgError] = useState(false);
  if (!src || imgError) {
    return (
      <div className="h-10 w-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">
        {name.substring(0, 2)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className="h-10 w-10 object-cover rounded-lg border border-gray-200"
      onError={() => setImgError(true)}
    />
  );
};

export const Inventory: React.FC = () => {
  const { products, softDeleteProduct, showToast } = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  // Deletion modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);

  // Extract unique categories for filters
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Helper to compute total stock for a product
  const getProductStock = (product: typeof products[0]) => {
    return product.variants.reduce((sum, v) => sum + v.cachedStock, 0);
  };

  // Check if any variant is low stock
  const isProductLowStock = (product: typeof products[0]) => {
    return product.variants.some(v => v.isActive && v.cachedStock <= product.minStockLevel);
  };

  // Filter products
  const filteredProducts = products
    .filter(p => !p.deletedAt) // exclude soft-deleted ones
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.variants.some(v => v.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      
      const productStock = getProductStock(p);
      let matchesStockStatus = true;
      if (selectedStockStatus === 'Low Stock') {
        matchesStockStatus = isProductLowStock(p);
      } else if (selectedStockStatus === 'Out of Stock') {
        matchesStockStatus = productStock === 0;
      } else if (selectedStockStatus === 'In Stock') {
        matchesStockStatus = productStock > 0 && !isProductLowStock(p);
      }

      const matchesStatus = selectedStatus === 'All' || 
        (selectedStatus === 'Active' && p.isActive) ||
        (selectedStatus === 'Inactive' && !p.isActive);

      return matchesSearch && matchesCategory && matchesStockStatus && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'stock') {
        return getProductStock(b) - getProductStock(a);
      } else if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const res = await softDeleteProduct(productToDelete.id);
      showToast(res.message || 'Product deleted successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete product.', 'error');
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory Items</h2>
          <p className="text-xs text-gray-500">View and manage your core products, variant models, and current stock totals.</p>
        </div>
        <Link 
          to="/inventory/new" 
          className="flex items-center justify-center space-x-1.5 px-4 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap gap-2.5">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Categories</option>
              {categories.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Stock Levels</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock Alert</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="name">Sort by Name</option>
              <option value="stock">Sort by Stock Level</option>
              <option value="recent">Sort by Newly Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product List Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-12 text-center flex flex-col items-center space-y-4">
          <div className="p-3 bg-gray-50 text-gray-400 rounded-full border border-gray-100">
            <Boxes className="h-10 w-10 text-gray-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-700">No products found</h3>
            <p className="text-xs text-gray-500 max-w-sm">No products matched the active search keywords, category tags, or status filters.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 w-16">Preview</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Variants Count</th>
                  <th className="px-6 py-4 text-right">Available Stock</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const stock = getProductStock(p);
                  const isLow = isProductLowStock(p);
                  
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 text-gray-700 transition-colors bg-white">
                      <td className="px-6 py-4">
                        <ProductThumbnail
                          src={getImageUrl(p.variants[0]?.image)}
                          name={p.name}
                        />
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <Link to={`/inventory/products/${p.id}`} className="hover:underline hover:text-brand-600">
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold">
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded border border-gray-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {p.variants.length} Variants
                      </td>
                      <td className="px-6 py-4 text-right font-bold">
                        <div className="flex items-center justify-end space-x-1.5">
                          {isLow && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                          <span className={isLow ? 'text-amber-600' : 'text-gray-900'}>
                            {stock}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 uppercase font-mono">
                        {p.unit}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          p.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/inventory/products/${p.id}`}
                            className="p-1 text-gray-400 hover:text-brand-600 rounded hover:bg-gray-100 transition-colors"
                            title="View product details"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </Link>
                          <Link
                            to={`/inventory/products/${p.id}/edit`}
                            className="p-1 text-gray-400 hover:text-brand-600 rounded hover:bg-gray-100 transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
                          </Link>
                          <button
                            onClick={() => {
                              setProductToDelete(p);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-full mt-0.5">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-base font-bold text-gray-900">Delete Product?</h3>
                <p className="text-xs text-gray-500">
                  Are you sure you want to delete:
                </p>
                <p className="text-xs font-semibold text-gray-800 font-mono bg-gray-50 px-2.5 py-2 rounded border border-gray-200 mt-1">
                  "{productToDelete.name}"
                </p>
                <p className="text-[10px] text-gray-500 leading-normal pt-1">
                  This action cannot be undone. Products with transactional or stock history will be deactivated instead of permanently deleted to preserve historical data integrity.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
