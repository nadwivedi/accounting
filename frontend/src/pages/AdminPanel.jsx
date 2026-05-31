import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../utils/adminApi';
import { useAdminAuth } from '../context/AdminAuthContext';
import { toast } from 'react-toastify';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const { admin, adminLogout, refreshAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    state: '',
    pincode: '',
    gstNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    upiId: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get('/admin/users');
      setUsers(response.data || []);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const a = await refreshAdmin();
      if (!a) {
        navigate('/admlogin', { replace: true });
        return;
      }
      fetchUsers();
    };
    init();
  }, []);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',
      password: '',
      state: '',
      pincode: '',
      gstNumber: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      upiId: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (user) => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      companyName: user.companyName || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      state: user.address?.state || '',
      pincode: user.address?.pincode || '',
      gstNumber: user.gstNumber || '',
      bankName: user.bankDetails?.bankName || '',
      accountNumber: user.bankDetails?.accountNumber || '',
      ifscCode: user.bankDetails?.ifscCode || '',
      accountHolderName: user.bankDetails?.accountHolderName || '',
      upiId: user.bankDetails?.upiId || ''
    });
    setEditingId(user._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const payload = { ...formData };
        delete payload.password;
        delete payload.email;
        Object.keys(payload).forEach(k => { if (payload[k] === '') payload[k] = undefined; });
        if (payload.state || payload.pincode) {
          payload.address = {};
          if (payload.state) payload.address.state = payload.state;
          if (payload.pincode) payload.address.pincode = payload.pincode;
        }
        if (payload.bankName || payload.accountNumber || payload.ifscCode || payload.accountHolderName || payload.upiId) {
          payload.bankDetails = {};
          if (payload.bankName) payload.bankDetails.bankName = payload.bankName;
          if (payload.accountNumber) payload.bankDetails.accountNumber = payload.accountNumber;
          if (payload.ifscCode) payload.bankDetails.ifscCode = payload.ifscCode;
          if (payload.accountHolderName) payload.bankDetails.accountHolderName = payload.accountHolderName;
          if (payload.upiId) payload.bankDetails.upiId = payload.upiId;
        }
        delete payload.state;
        delete payload.pincode;
        delete payload.bankName;
        delete payload.accountNumber;
        delete payload.ifscCode;
        delete payload.accountHolderName;
        delete payload.upiId;
        await adminApi.put(`/admin/users/${editingId}`, payload);
        toast.success('User updated!');
      } else {
        await adminApi.post('/admin/users', formData);
        toast.success('User created!');
      }
      fetchUsers();
      resetForm();
    } catch (e) {
      toast.error(e?.message || 'Operation failed');
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    const action = currentActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await adminApi.patch(`/admin/users/${userId}/toggle-active`, { isActive: !currentActive });
      toast.success(`User ${action}d successfully`);
      fetchUsers();
    } catch (e) {
      toast.error(e?.message || 'Failed to toggle user status');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = window.prompt('Enter new password (min 6 chars):');
    if (!newPassword || newPassword.length < 6) {
      if (newPassword) toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await adminApi.patch(`/admin/users/${userId}/reset-password`, { password: newPassword });
      toast.success('Password reset successfully');
    } catch (e) {
      toast.error(e?.message || 'Failed to reset password');
    }
  };

  const handleAccess = async (user) => {
    if (!window.confirm(`Access ${user.companyName || user.email}'s account?`)) return;
    try {
      const response = await adminApi.post(`/admin/access-user/${user._id}`);
      if (response.token) {
        window.open(`https://accounting.softwarebytes.in/?admin_token=${response.token}`, '_blank');
        toast.success('Access window opened');
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to generate access token');
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admlogin');
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.companyName?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.phone?.includes(term) ||
      u.firstName?.toLowerCase().includes(term) ||
      u.lastName?.toLowerCase().includes(term)
    );
  });

  const inputClasses = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm";
  const labelClasses = "block text-xs font-medium text-gray-700 mb-1";

  const StatBadge = ({ active }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );

  const ActionButtons = ({ user }) => (
    <div className="flex items-center gap-1.5">
      <button onClick={() => handleAccess(user)} title="Access Account" className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </button>
      <button onClick={() => handleEdit(user)} title="Edit" className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button onClick={() => handleResetPassword(user._id)} title="Reset Password" className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </button>
      <button onClick={() => handleToggleActive(user._id, user.isActive)}
        title={user.isActive ? 'Deactivate' : 'Activate'}
        className={`p-1.5 rounded-lg transition ${user.isActive ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}
      >
        {user.isActive ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-gray-900 truncate">Admin Panel</h1>
                {admin && (
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate -mt-0.5">{admin.firstName} {admin.lastName}</p>
                )}
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden sm:flex items-center gap-3">
              <a href="/" className="text-xs text-gray-500 hover:text-gray-700 transition-colors">Back to App</a>
              <button onClick={handleLogout} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors font-medium">Logout</button>
            </div>

            {/* Mobile menu toggle */}
            <button onClick={() => setShowMenu(!showMenu)} className="sm:hidden p-1.5 text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile dropdown menu */}
          {showMenu && (
            <div className="sm:hidden pb-3 border-t border-gray-100 pt-2 flex flex-col gap-2">
              <a href="/" className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Back to App</a>
              <button onClick={handleLogout} className="text-sm text-left text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Logout</button>
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center justify-between sm:block">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-gray-900">All Users</h2>
              <p className="text-[10px] sm:text-xs text-gray-500">{users.length} total users</p>
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="sm:hidden flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full sm:w-64 pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="hidden sm:flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto sm:m-4">
              <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 z-10">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  {editingId ? 'Edit User' : 'Add New User'}
                </h3>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className={labelClasses}>First Name</label>
                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Last Name</label>
                    <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className={inputClasses} />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Company Name *</label>
                  <input type="text" value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} required className={inputClasses} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className={labelClasses}>Email *</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required={!editingId} disabled={!!editingId} className={`${inputClasses} ${editingId ? 'bg-gray-100 text-gray-500' : ''}`} />
                  </div>
                  <div>
                    <label className={labelClasses}>Phone *</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required className={inputClasses} />
                  </div>
                </div>
                {!editingId && (
                  <div>
                    <label className={labelClasses}>Password *</label>
                    <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required className={inputClasses} placeholder="Min 6 chars" />
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className={labelClasses}>State *</label>
                    <input type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} required={!editingId} className={inputClasses} />
                  </div>
                  <div>
                    <label className={labelClasses}>Pincode *</label>
                    <input type="text" value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} required={!editingId} className={inputClasses} maxLength="6" />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>GST Number</label>
                  <input type="text" value={formData.gstNumber} onChange={(e) => setFormData({...formData, gstNumber: e.target.value})} className={inputClasses} />
                </div>
                <div className="border-t border-gray-200 pt-3 sm:pt-4">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Bank Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className={labelClasses}>Bank Name</label>
                      <input type="text" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>Account No.</label>
                      <input type="text" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>IFSC Code</label>
                      <input type="text" value={formData.ifscCode} onChange={(e) => setFormData({...formData, ifscCode: e.target.value})} className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>A/C Holder</label>
                      <input type="text" value={formData.accountHolderName} onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})} className={inputClasses} />
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <label className={labelClasses}>UPI ID</label>
                    <input type="text" value={formData.upiId} onChange={(e) => setFormData({...formData, upiId: e.target.value})} className={inputClasses} />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-3 sm:pt-4 border-t border-gray-200">
                  <button type="button" onClick={resetForm} className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                  <button type="submit" className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition">
                    {editingId ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-gray-400 text-sm">Loading users...</div>
        )}

        {/* Empty */}
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            {searchTerm ? 'No users match your search' : 'No users found'}
          </div>
        )}

        {/* ===== MOBILE CARDS (below lg) ===== */}
        {!loading && filteredUsers.length > 0 && (
          <div className="lg:hidden space-y-3">
            {filteredUsers.map((user) => (
              <div key={user._id} className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 ${!user.isActive ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(user.companyName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.companyName || 'N/A'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.firstName} {user.lastName}</p>
                    </div>
                  </div>
                  <StatBadge active={user.isActive} />
                </div>

                <div className="space-y-1.5 mb-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>{user.phone}</span>
                  </div>
                  {user.address?.state && (
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{user.address.state}{user.address.pincode ? ` - ${user.address.pincode}` : ''}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400">Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                  <ActionButtons user={user} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== DESKTOP TABLE (lg and above) ===== */}
        {!loading && filteredUsers.length > 0 && (
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className={`hover:bg-gray-50 transition-colors ${!user.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            {(user.companyName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{user.companyName || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{user.firstName} {user.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{user.address?.state || '-'}</p>
                        <p className="text-xs text-gray-500">{user.address?.pincode || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatBadge active={user.isActive} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <ActionButtons user={user} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
