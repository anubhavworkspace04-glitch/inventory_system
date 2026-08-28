import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Eye, Edit2, Trash2, RotateCcw, User, Phone, Mail, FileText, 
  AlertTriangle, CheckCircle, ShieldAlert 
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { formatCurrency } from '../utils';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const Customers: React.FC = () => {
  const { 
    customers, sales, fetchCustomers, addCustomer, updateCustomer, deleteCustomer, restoreCustomer, fetchSales, showToast 
  } = useInventoryStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<string | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchSales();
  }, []);

  // Search logic
  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.gstNumber && c.gstNumber.toLowerCase().includes(term));
  });

  // Helper stats per customer
  const getCustomerStats = (customerId: string) => {
    const custSales = sales.filter(s => s.customerId === customerId && s.status === 'Active');
    const totalSalesValue = custSales.reduce((sum, s) => sum + s.total, 0);
    const totalPaid = custSales.reduce((sum, s) => sum + s.amountReceived, 0);
    const totalPending = custSales.reduce((sum, s) => sum + s.pendingAmount, 0);
    const salesCount = custSales.length;
    
    return { totalSalesValue, totalPaid, totalPending, salesCount };
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingId('');
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

  const handleOpenEditModal = (c: typeof customers[0]) => {
    setIsEditMode(true);
    setEditingId(c.id);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setGstNumber(c.gstNumber || '');
    setNotes(c.notes || '');
    setErrorMsg('');
    setSuccessMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Customer name is required.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Phone number is required.');
      return;
    }

    // Optional email check
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Invalid email address format.');
      return;
    }

    // Optional GSTIN check
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

      if (isEditMode && editingId) {
        await updateCustomer(editingId, payload);
        setSuccessMsg('Customer updated successfully!');
      } else {
        await addCustomer(payload);
        setSuccessMsg('Customer created successfully!');
      }

      setTimeout(() => {
        setModalOpen(false);
        fetchCustomers();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed. Verify unique phone number.');
    }
  };

  const handleDeactivate = (id: string) => {
    setDeactivateConfirmId(id);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateConfirmId) return;
    try {
      await deleteCustomer(deactivateConfirmId);
      fetchCustomers();
      showToast('Customer deactivated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate customer.', 'error');
    } finally {
      setDeactivateConfirmId(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreCustomer(id);
      fetchCustomers();
      showToast('Customer restored successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to restore customer.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customer Accounts</h2>
          <p className="text-xs text-gray-500">Manage client contact details, corporate GST registrations, and balance metrics.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-700 text-white rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Toolbar filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, phone, email, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Customers Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center flex flex-col items-center space-y-4 shadow-sm">
          <div className="p-3 bg-gray-100 text-gray-500 rounded-full">
            <User className="h-10 w-10" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No customers found</h3>
          <p className="text-xs text-gray-500 max-w-sm">Create client accounts to map POS sales invoices and manage ledgers.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Customer Name</th>
                  <th className="px-4 py-3.5">Phone / Email</th>
                  <th className="px-4 py-3.5">GSTIN</th>
                  <th className="px-4 py-3.5 text-center">Sales count</th>
                  <th className="px-4 py-3.5 text-right">Total Purchased</th>
                  <th className="px-4 py-3.5 text-right">Pending Amount</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((c) => {
                  const stats = getCustomerStats(c.id);
                  return (
                    <tr key={c.id} className={`bg-white hover:bg-gray-50 transition-colors ${!c.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3.5 text-sm text-gray-700">
                        <Link to={`/customers/${c.id}`} className="font-semibold text-gray-900 hover:underline">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-700 space-y-0.5">
                        <div className="font-mono text-gray-800">{c.phone}</div>
                        {c.email && <div className="text-gray-500">{c.email}</div>}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                        {c.gstNumber || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold text-gray-900">
                        {stats.salesCount}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
                        {formatCurrency(stats.totalSalesValue)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-sm font-semibold text-red-600">
                        {stats.totalPending > 0 ? formatCurrency(stats.totalPending) : '₹0.00'}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          c.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/customers/${c.id}`}
                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="View Profile Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {c.isActive ? (
                            <button
                              onClick={() => handleDeactivate(c.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Deactivate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(c.id)}
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

      {/* ADD / EDIT CUSTOMER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {isEditMode ? 'Edit Customer' : 'Add New Customer'}
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
                <label className="text-xs font-semibold text-gray-700">Customer Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
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
                  <label className="text-xs font-semibold text-gray-700">GSTIN / Tax code</label>
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
                  placeholder="e.g. rahul.sharma@gmail.com"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Billing Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street details, City, State, ZIP..."
                  rows={2}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Private Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional memo notes..."
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
                  {isEditMode ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={deactivateConfirmId !== null}
        title="Deactivate Customer?"
        message="Are you sure you want to deactivate this customer? They will not appear in new transactions."
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateConfirmId(null)}
        variant="warning"
      />
    </div>
  );
};
