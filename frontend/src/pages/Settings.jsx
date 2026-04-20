import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmployeeManagement from '../components/EmployeeManagement';
import apiClient from '../utils/api';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [expiryAlertSetting, setExpiryAlertSetting] = useState('no');
  const [expirySettingLoading, setExpirySettingLoading] = useState(false);

  const displayName = user?.role === 'employee'
    ? user?.ownerName
    : String(user?.companyName || `${user?.firstName || ''} ${user?.lastName || ''}`).trim() || '-';

  useEffect(() => {
    setExpiryAlertSetting(user?.userSettings?.expiryAlert ? 'yes' : 'no');
  }, [user?.userSettings?.expiryAlert]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPwLoading(true);
    try {
      if (user?.role === 'employee') {
        // Employee self-service endpoint
        await apiClient.post('/employees/me/change-password', {
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        });
      } else {
        // Owner endpoint
        await apiClient.post(`/users/${user.id}/change-password`, {
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        });
      }
      toast.success('✅ Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleExpiryAlertChange = async (event) => {
    const nextValue = event.target.value;
    setExpiryAlertSetting(nextValue);
    setExpirySettingLoading(true);

    try {
      await apiClient.put('/users/settings', {
        userSettings: {
          expiryAlert: nextValue === 'yes'
        }
      });
      await refreshUser?.();
      toast.success('Expiry alert setting updated');
    } catch (err) {
      setExpiryAlertSetting(user?.userSettings?.expiryAlert ? 'yes' : 'no');
      toast.error(err?.message || 'Failed to update expiry alert setting');
    } finally {
      setExpirySettingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f1] p-4 pt-20 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-600 mt-1">Manage account actions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl">
        {/* ── User Account Card ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">User Account</h2>
          <div className="space-y-2 text-sm text-slate-600">
            {user?.role === 'employee' ? (
              <>
                <p><span className="font-medium text-slate-700">Company (Owner):</span> {displayName}</p>
                <p><span className="font-medium text-slate-700">Staff Name:</span> {user?.name || '-'}</p>
                <p><span className="font-medium text-slate-700">Login Mobile:</span> {user?.mobile || '-'}</p>
                <p><span className="font-medium text-slate-700">Role:</span> Staff Member</p>
              </>
            ) : (
              <>
                <p><span className="font-medium text-slate-700">Company:</span> {displayName}</p>
                <p><span className="font-medium text-slate-700">Email:</span> {user?.email || '-'}</p>
                <p><span className="font-medium text-slate-700">Phone:</span> {user?.phone || '-'}</p>
                <p><span className="font-medium text-slate-700">State:</span> {user?.address?.state || '-'}</p>
                <p><span className="font-medium text-slate-700">Pincode:</span> {user?.address?.pincode || '-'}</p>
                <p><span className="font-medium text-slate-700">GST Number:</span> {user?.gstNumber || '-'}</p>
                <p><span className="font-medium text-slate-700">Bank:</span> {user?.bankDetails?.bankName || '-'}</p>
                <p><span className="font-medium text-slate-700">Account Number:</span> {user?.bankDetails?.accountNumber || '-'}</p>
                <p><span className="font-medium text-slate-700">IFSC:</span> {user?.bankDetails?.ifscCode || '-'}</p>
                <p><span className="font-medium text-slate-700">Account Holder:</span> {user?.bankDetails?.accountHolderName || '-'}</p>
                <p><span className="font-medium text-slate-700">UPI ID:</span> {user?.bankDetails?.upiId || '-'}</p>
              </>
            )}
          </div>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* ── Change Password Card ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-800">Stock Defaults</h2>
          <p className="mb-5 text-xs text-slate-500">
            Choose the default expiry tracking value for new stock items.
          </p>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Expiry Alert</label>
            <select
              value={expiryAlertSetting}
              onChange={handleExpiryAlertChange}
              disabled={expirySettingLoading}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
            <p className="mt-2 text-xs text-slate-500">
              If Yes is selected, new stock will keep Track Expiry as Yes by default.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" />
            Change Password
          </h2>
          <p className="text-xs text-slate-500 mb-5">Update your login password. You must enter your current password to confirm.</p>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  required
                  placeholder="Enter current password"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  required
                  placeholder="Repeat new password"
                  className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwForm.confirmPassword && pwForm.confirmPassword !== pwForm.newPassword && (
                <p className="text-xs text-rose-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pwLoading}
                className="w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pwLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {pwLoading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Employee management injected here */}
        <EmployeeManagement />
      </div>
    </div>
  );
}
