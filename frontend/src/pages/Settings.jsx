import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EmployeeManagement from '../components/EmployeeManagement';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Safe extraction matching the API
  const displayName = user?.role === 'employee' 
      ? user?.ownerName 
      : String(user?.companyName || `${user?.firstName || ''} ${user?.lastName || ''}`).trim() || '-';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8f6f1] p-4 pt-20 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-600 mt-1">Manage account actions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-6xl">
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

        {/* Employee management injected here */}
        <EmployeeManagement />
      </div>
    </div>
  );
}

