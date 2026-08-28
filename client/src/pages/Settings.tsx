import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Building, 
  FileSpreadsheet, 
  Layers, 
  Check, 
  Upload, 
  Trash2, 
  Loader2,
  User as UserIcon,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useInventoryStore } from '../store/useInventoryStore';
import { useAuthStore } from '../store/useAuthStore';
import { uploadApi } from '../api/services';
import { getImageUrl } from '../utils';

export const Settings: React.FC = () => {
  const { settings, fetchSettings, updateSettings, isLoading, showToast } = useInventoryStore();
  const { user, updateProfile, changePassword } = useAuthStore();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'user' | 'invoice' | 'inventory'>('profile');
  
  // Business Profile states
  const [businessName, setBusinessName] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  
  // Invoice & Quotation states
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [quotationPrefix, setQuotationPrefix] = useState('');
  const [defaultGstRate, setDefaultGstRate] = useState(18);
  
  // Inventory Settings states
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [enableLowStockAlerts, setEnableLowStockAlerts] = useState(true);

  // User Profile states
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Change Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Status feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || '');
      setGstin(settings.gstin || '');
      setAddress(settings.address || '');
      setLogo(settings.logo || null);
      setInvoicePrefix(settings.invoicePrefix || '');
      setQuotationPrefix(settings.quotationPrefix || '');
      setDefaultGstRate(settings.defaultGstRate ?? 18);
      setAllowNegativeStock(settings.allowNegativeStock ?? false);
      setEnableLowStockAlerts(settings.enableLowStockAlerts ?? true);
    }
  }, [settings]);

  useEffect(() => {
    if (user) {
      setUserName(user.name || '');
      setUserAvatar(user.avatarUrl || null);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await updateSettings({
        businessName,
        gstin,
        address,
        logo,
        invoicePrefix,
        quotationPrefix,
        defaultGstRate,
        allowNegativeStock,
        enableLowStockAlerts
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds the 5MB limit.', 'warning');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Only JPEG, PNG and WEBP image files are allowed.', 'warning');
      return;
    }

    setIsUploading(true);
    setSaveError(null);
    try {
      const res = await uploadApi.uploadImage(file, 'logo');
      if (res.success && res.data?.url) {
        setLogo(res.data.url);
        showToast('Logo uploaded successfully.', 'success');
      } else {
        throw new Error('Upload response did not contain image url');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload logo image.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogoRemove = () => {
    setLogo(null);
  };

  // Avatar Upload Handlers
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds 5MB limit.', 'warning');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Only JPEG, PNG, and WEBP images allowed.', 'warning');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadApi.uploadImage(file, 'products');
      if (res.success && res.data?.url) {
        setUserAvatar(res.data.url);
        await updateProfile({ avatarUrl: res.data.url });
        showToast('Profile photo updated successfully.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload profile photo.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    setUserAvatar(null);
    await updateProfile({ avatarUrl: '' });
    showToast('Profile photo removed.', 'info');
  };

  const handleUserProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      showToast('Name cannot be empty.', 'warning');
      return;
    }
    setIsSaving(true);
    const ok = await updateProfile({ name: userName.trim(), avatarUrl: userAvatar || '' });
    setIsSaving(false);
    if (ok) {
      showToast('User profile saved successfully.', 'success');
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill all password fields.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'warning');
      return;
    }

    setIsChangingPass(true);
    const res = await changePassword({ currentPassword, newPassword });
    setIsChangingPass(false);

    if (res.success) {
      showToast('Password changed successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      showToast(res.error || 'Failed to change password.', 'error');
    }
  };

  const handleCancelPassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <SettingsIcon className="h-5.5 w-5.5 text-brand-600" />
          <span>System Preferences</span>
        </h2>
        <p className="text-xs text-gray-500">Configure business master coordinates, user profiles, security credentials, and invoice formatting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar panel */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col space-y-1 h-fit shadow-sm">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={
              activeSubTab === 'profile'
                ? 'flex items-center px-3 py-2.5 text-sm font-medium bg-brand-100 text-brand-700 rounded-lg cursor-pointer'
                : 'flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer'
            }
          >
            <Building className="h-4 w-4 mr-2.5" />
            <span>Business Profile</span>
          </button>

          <button
            onClick={() => setActiveSubTab('user')}
            className={
              activeSubTab === 'user'
                ? 'flex items-center px-3 py-2.5 text-sm font-medium bg-brand-100 text-brand-700 rounded-lg cursor-pointer'
                : 'flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer'
            }
          >
            <UserIcon className="h-4 w-4 mr-2.5" />
            <span>User Profile & Security</span>
          </button>

          <button
            onClick={() => setActiveSubTab('invoice')}
            className={
              activeSubTab === 'invoice'
                ? 'flex items-center px-3 py-2.5 text-sm font-medium bg-brand-100 text-brand-700 rounded-lg cursor-pointer'
                : 'flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer'
            }
          >
            <FileSpreadsheet className="h-4 w-4 mr-2.5" />
            <span>Invoice & Quotation</span>
          </button>

          <button
            onClick={() => setActiveSubTab('inventory')}
            className={
              activeSubTab === 'inventory'
                ? 'flex items-center px-3 py-2.5 text-sm font-medium bg-brand-100 text-brand-700 rounded-lg cursor-pointer'
                : 'flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer'
            }
          >
            <Layers className="h-4 w-4 mr-2.5" />
            <span>Inventory Settings</span>
          </button>
        </div>

        {/* Configuration content card */}
        <div className="md:col-span-3 bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative min-h-[300px]">
          
          {/* Main loader */}
          {isLoading && !isSaving && !isUploading && (
            <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center z-10 backdrop-blur-[1px]">
              <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
            </div>
          )}

          {/* Feedback banners */}
          {saveSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm flex items-center space-x-1.5 animate-in fade-in duration-200">
              <Check className="h-4 w-4" />
              <span>Business profile saved successfully.</span>
            </div>
          )}

          {saveError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm flex items-center space-x-1.5 animate-in fade-in duration-200">
              <span>{saveError}</span>
            </div>
          )}

          {/* TAB 1: Business Profile */}
          {activeSubTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
                Business Organization Profile
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Business/Company Name *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">GSTIN / Tax Identification</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="e.g. 09CBNPG5284Q1ZP"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Corporate Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Logo section */}
              <div className="space-y-1.5 pt-2">
                <label className="text-sm font-medium text-gray-700">Company Logo (Printed on Invoices)</label>
                <div className="flex items-start space-x-4">
                  {logo ? (
                    <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 p-2 h-20 w-32 flex items-center justify-center">
                      <img src={getImageUrl(logo)} alt="Company Logo" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={handleLogoRemove}
                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="h-20 w-32 border-2 border-dashed border-gray-300 hover:border-brand-500 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-50 transition-colors">
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 text-brand-500 animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-gray-400 mb-1" />
                          <span className="text-[11px] text-gray-500 font-medium">Upload Logo</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={isUploading} />
                    </label>
                  )}
                  <p className="text-xs text-gray-400 max-w-xs pt-1">
                    Upload JPEG, PNG or WEBP (Max 5MB). Logo appears on Quotations and Invoices.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Business Profile</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: User Profile & Security */}
          {activeSubTab === 'user' && (
            <div className="space-y-8">
              {/* Profile Photo & Info */}
              <form onSubmit={handleUserProfileSave} className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-brand-600" />
                  <span>User Profile & Photo Management</span>
                </h3>

                <div className="flex items-center space-x-6">
                  {/* Photo Preview */}
                  <div className="relative">
                    {userAvatar ? (
                      <img
                        src={getImageUrl(userAvatar)}
                        alt="User Profile"
                        className="h-20 w-20 rounded-full object-cover border-2 border-brand-500 shadow-sm"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center text-brand-600 font-bold text-2xl">
                        <UserIcon className="h-10 w-10 text-brand-600" />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <label className="px-3 py-1.5 bg-brand-500 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm flex items-center space-x-1.5 transition-colors">
                        {isUploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        <span>Change Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                      </label>

                      {userAvatar && (
                        <button
                          type="button"
                          onClick={handleAvatarRemove}
                          className="px-3 py-1.5 bg-white border border-gray-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Avatar is displayed on the bottom-left sidebar card across the application.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Display Name</label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Email Address (Read-only)</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Save User Profile</span>
                  </button>
                </div>
              </form>

              {/* Password Change Form */}
              <form onSubmit={handleChangePasswordSubmit} className="space-y-4 border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2 flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Security & Password Credentials</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Current Password *</label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg pl-3 pr-9 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">New Password *</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg pl-3 pr-9 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        placeholder="Min 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Confirm New Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg pl-3 pr-9 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelPassword}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    {isChangingPass && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Change Password</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Invoice & Quotation */}
          {activeSubTab === 'invoice' && (
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
                Document Sequence & Tax Preferences
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Tax Invoice Prefix</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="e.g. INV-2026-"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Quotation Prefix</label>
                  <input
                    type="text"
                    value={quotationPrefix}
                    onChange={(e) => setQuotationPrefix(e.target.value)}
                    placeholder="e.g. QUO-2026-"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Default GST Standard Rate (%)</label>
                  <input
                    type="number"
                    value={defaultGstRate}
                    onChange={(e) => setDefaultGstRate(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Document Preferences</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: Inventory Settings */}
          {activeSubTab === 'inventory' && (
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
                Stock & Warehouse Control Rules
              </h3>

              <div className="space-y-4 pt-1">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="neg-stock"
                    checked={allowNegativeStock}
                    onChange={(e) => setAllowNegativeStock(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 bg-white text-brand-600 focus:ring-brand-500/30 mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <label htmlFor="neg-stock" className="text-sm font-medium text-gray-900 select-none cursor-pointer">
                      Allow Negative Stock Dispatches
                    </label>
                    <p className="text-xs text-gray-500">
                      If checked, checkout bills will allow saving even if requested stock exceeds warehouse levels. (NOT recommended).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 pt-2">
                  <input
                    type="checkbox"
                    id="low-alerts"
                    checked={enableLowStockAlerts}
                    onChange={(e) => setEnableLowStockAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 bg-white text-brand-600 focus:ring-brand-500/30 mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <label htmlFor="low-alerts" className="text-sm font-medium text-gray-900 select-none cursor-pointer">
                      Enable Low Stock Email Dashboard Alerts
                    </label>
                    <p className="text-xs text-gray-500">
                      Warns in the dashboard stats panel if variant stock levels fall below critical thresholds.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Inventory Settings</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
