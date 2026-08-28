import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Edit2, Trash2, RotateCcw, Eye, ShieldAlert, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency } from '../utils';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const Suppliers: React.FC = () => {
  const { 
    suppliers, fetchSuppliers, addSupplier, updateSupplier, deleteSupplier, restoreSupplier, purchases, showToast 
  } = useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Compute stats per supplier
  const getSupplierStats = (supplierId: string) => {
    const supplierPurchases = purchases.filter(p => p.supplierId === supplierId && p.status === 'Active');
    const totalCount = supplierPurchases.length;
    const totalValue = supplierPurchases.reduce((sum, p) => sum + p.totalPurchaseCost, 0);
    const pendingAmount = supplierPurchases.reduce((sum, p) => sum + p.pendingAmount, 0);
    return { totalCount, totalValue, pendingAmount };
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedSupplierId(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setGstNumber('');
    setNotes('');
    setErrorMsg('');
    setSuccessMsg('');
    setModalOpen(true);
  };

  const handleOpenEdit = (sup: any) => {
    setIsEditMode(true);
    setSelectedSupplierId(sup.id);
    setName(sup.name);
    setPhone(sup.phone);
    setEmail(sup.email || '');
    setAddress(sup.address || '');
    setGstNumber(sup.gstNumber || '');
    setNotes(sup.notes || '');
    setErrorMsg('');
    setSuccessMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Supplier name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }

    // GSTIN format validation (Optional)
    if (gstNumber.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber.trim().toUpperCase())) {
      setErrorMsg('Invalid GSTIN format. Expected: 08AAAAA1111A1Z1');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        gstNumber: gstNumber.trim().toUpperCase() || undefined,
        notes: notes.trim() || undefined
      };

      if (isEditMode && selectedSupplierId) {
        await updateSupplier(selectedSupplierId, payload);
        setSuccessMsg('Supplier updated successfully!');
      } else {
        await addSupplier(payload);
        setSuccessMsg('Supplier added successfully!');
      }

      setTimeout(() => {
        setModalOpen(false);
        fetchSuppliers();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed. Verify unique name and valid inputs.');
    }
  };

  const handleDeactivate = (id: string) => {
    setDeactivateConfirmId(id);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateConfirmId) return;
    try {
      await deleteSupplier(deactivateConfirmId);
      fetchSuppliers();
      showToast('Supplier deactivated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate supplier.', 'error');
    } finally {
      setDeactivateConfirmId(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreSupplier(id);
      fetchSuppliers();
      showToast('Supplier restored successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to restore supplier.', 'error');
    }
  };

  // Filter suppliers in view
  const filteredSuppliers = suppliers.filter(s => {
    const term = searchTerm.toLowerCase();
    return s.name.toLowerCase().includes(term) ||
      s.phone.includes(term) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.gstNumber && s.gstNumber.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Supplier Ledger Cards</h2>
          <p className="text-xs text-gray-500">Manage supplier contacts, tax numbers, and view total purchases statistics.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-1 px-4 py-2 bg-brand-500 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, email, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Grid List */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
          <div className="p-3 bg-gray-100 text-gray-500 rounded-full">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No suppliers found</h3>
          <p className="text-xs text-gray-500 max-w-sm">Add suppliers to populate your inventory purchase lists.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Supplier Name</th>
                  <th className="px-4 py-3.5">Phone / Email</th>
                  <th className="px-4 py-3.5">GSTIN</th>
                  <th className="px-4 py-3.5 text-center">Purchases</th>
                  <th className="px-4 py-3.5 text-right">Total Purchased</th>
                  <th className="px-4 py-3.5 text-right">Pending Amount</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSuppliers.map((s) => {
                  const stats = getSupplierStats(s.id);
                  return (
                    <tr key={s.id} className={`bg-white hover:bg-gray-50 transition-colors ${!s.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3.5 text-sm text-gray-700">
                        <Link to={`/suppliers/${s.id}`} className="font-semibold text-gray-900 hover:underline">
                          {s.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-700 space-y-0.5">
                        <div className="font-mono text-gray-800">{s.phone}</div>
                        {s.email && <div className="text-gray-500">{s.email}</div>}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                        {s.gstNumber || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold text-gray-900">
                        {stats.totalCount}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(stats.totalValue)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-red-600">
                        {stats.pendingAmount > 0 ? formatCurrency(stats.pendingAmount) : '₹0.00'}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          s.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/suppliers/${s.id}`}
                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="View Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {s.isActive ? (
                            <button
                              onClick={() => handleDeactivate(s.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deactivate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(s.id)}
                              className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Restore"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
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

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {isEditMode ? 'Edit Supplier' : 'Add New Supplier'}
              </h3>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-xs flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Supplier Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ABC Glass Supplier Ltd."
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Phone *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">GST Number</label>
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g. 08AAAAA1111A1Z1"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. info@supplier.com"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street details, GIDC location, City, State..."
                  rows={2}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specific delivery preferences or terms..."
                  rows={2}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end border-t border-gray-100 pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {isEditMode ? 'Save Changes' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={deactivateConfirmId !== null}
        title="Deactivate Supplier?"
        message="Are you sure you want to deactivate this supplier? They will not appear in new transactions."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateConfirmId(null)}
        variant="warning"
      />
    </div>
  );
};
